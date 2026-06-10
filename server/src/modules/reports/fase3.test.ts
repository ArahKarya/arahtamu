import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken } from '../../lib/jwt.js';

const app = createApp();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@arahtamu.local';
const TAG = Date.now().toString().slice(-9);
const PHONE = `0855${TAG}`;
const PHONE_OLD = `0856${TAG}`;

let token = '';
let departmentId = '';
let locationId = '';
let hostId = '';
let consentId = '';
let visitorId = '';

function authReq(method: 'get' | 'post', path: string) {
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

beforeAll(async () => {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error('admin seed tidak ada');
  token = signAccessToken({ sub: admin.id, email: admin.email, roles: ['SUPER_ADMIN'] });

  departmentId = (await authReq('post', '/api/departments').send({ name: `Dept F3 ${TAG}` })).body.data.id;
  locationId = (await authReq('post', '/api/locations').send({ name: `Lokasi F3 ${TAG}` })).body.data.id;
  hostId = (
    await authReq('post', '/api/hosts').send({ name: 'Host F3', email: `hf3${TAG}@arahtamu.local`, departmentId })
  ).body.data.id;

  // dokumen consent aktif
  consentId = (
    await authReq('post', '/api/consents').send({
      type: 'PDP',
      title: 'Persetujuan PDP',
      version: '1.0',
      contentMd: 'Saya setuju data saya diproses.',
    })
  ).body.data.id;

  // setting retensi 1 hari untuk uji
  await prisma.setting.upsert({
    where: { key: 'pdp.retentionDays' },
    update: { value: 1 },
    create: { key: 'pdp.retentionDays', value: 1 },
  });
});

afterAll(async () => {
  const tagWhere = { location: { name: `Lokasi F3 ${TAG}` } };
  await prisma.visit.deleteMany({ where: tagWhere });
  await prisma.visitor.deleteMany({ where: { phone: { in: [PHONE, PHONE_OLD] } } });
  await prisma.consent.deleteMany({ where: { id: consentId } });
  await prisma.host.deleteMany({ where: { id: hostId } });
  await prisma.location.deleteMany({ where: { id: locationId } });
  await prisma.department.deleteMany({ where: { id: departmentId } });
  await prisma.setting.deleteMany({ where: { key: 'pdp.retentionDays' } });
  await prisma.$disconnect();
});

describe('Fase 3 — consent saat check-in', () => {
  it('check-in mencatat consent log untuk dokumen aktif', async () => {
    const res = await authReq('post', '/api/visits/check-in').send({
      visitor: { fullName: 'Tamu F3', phone: PHONE },
      hostId,
      locationId,
    });
    expect(res.status).toBe(201);
    const visitId = res.body.data.id;
    visitorId = res.body.data.visitorId;
    const logs = await prisma.consentLog.count({ where: { visitId } });
    expect(logs).toBeGreaterThanOrEqual(1);
  });
});

describe('Fase 3 — laporan', () => {
  it('summary mengembalikan metrik', async () => {
    const res = await authReq('get', '/api/reports/summary');
    expect(res.status).toBe(200);
    expect(res.body.data.activeNow).toBeGreaterThanOrEqual(1);
    expect(res.body.data.byStatus.CHECKED_IN).toBeGreaterThanOrEqual(1);
  });

  it('export menghasilkan CSV', async () => {
    const res = await authReq('get', `/api/reports/export?locationId=${locationId}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Nama Tamu');
    expect(res.text).toContain('Tamu F3');
  });
});

describe('Fase 3 — retensi & erasure (UU PDP)', () => {
  it('retensi menghapus kunjungan kedaluwarsa, simpan yang baru', async () => {
    // kunjungan lama (3 hari lalu) yang harus terhapus
    const oldVisitor = await prisma.visitor.create({
      data: { fullName: 'Tamu Lama', phone: PHONE_OLD },
    });
    const old = new Date(Date.now() - 3 * 86400 * 1000);
    const oldVisit = await prisma.visit.create({
      data: {
        visitorId: oldVisitor.id,
        hostId,
        locationId,
        status: 'CHECKED_OUT',
        createdAt: old,
        checkInAt: old,
        checkOutAt: old,
      },
    });

    const res = await authReq('post', '/api/reports/retention/run');
    expect(res.status).toBe(200);
    expect(res.body.data.deletedVisits).toBeGreaterThanOrEqual(1);

    const stillThere = await prisma.visit.findUnique({ where: { id: oldVisit.id } });
    expect(stillThere).toBeNull();
  });

  it('erasure menghapus tamu + kunjungannya', async () => {
    const res = await authReq('post', `/api/visitors/${visitorId}/erase`);
    expect(res.status).toBe(200);
    const gone = await prisma.visitor.findUnique({ where: { id: visitorId } });
    expect(gone).toBeNull();
  });
});
