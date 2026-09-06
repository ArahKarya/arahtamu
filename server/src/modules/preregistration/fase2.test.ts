import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken } from '../../lib/jwt.js';

const app = createApp();

// Integration test Fase 2: watchlist (BLOCK/WATCH) saat check-in + pra-registrasi → scan.

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@fdm.local';
const TAG = Date.now().toString().slice(-9);
const PHONE_BLOCK = `0811${TAG}`;
const PHONE_OK = `0822${TAG}`;

let token = '';
let departmentId = '';
let locationId = '';
let hostId = '';
const createdVisitorPhones = [PHONE_BLOCK, PHONE_OK];

async function authPost(path: string, body: object) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

beforeAll(async () => {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error('admin seed tidak ada');
  token = signAccessToken({ sub: admin.id, email: admin.email, roles: ['SUPER_ADMIN'] });

  departmentId = (await authPost('/api/departments', { name: `Dept F2 ${TAG}` })).body.data.id;
  locationId = (await authPost('/api/locations', { name: `Lokasi F2 ${TAG}`, capacity: 30 })).body.data.id;
  hostId = (
    await authPost('/api/hosts', { name: 'Host F2', email: `hostf2${TAG}@fdm.local`, departmentId })
  ).body.data.id;

  // entri blacklist by phone
  await authPost('/api/watchlists', {
    fullName: 'Orang Blokir',
    phone: PHONE_BLOCK,
    reason: 'Pernah bermasalah',
    level: 'BLOCK',
  });
});

afterAll(async () => {
  await prisma.preregistration.deleteMany({ where: { location: { name: `Lokasi F2 ${TAG}` } } });
  await prisma.visit.deleteMany({ where: { location: { name: `Lokasi F2 ${TAG}` } } });
  await prisma.visitor.deleteMany({ where: { phone: { in: createdVisitorPhones } } });
  await prisma.watchlist.deleteMany({ where: { phone: PHONE_BLOCK } });
  await prisma.host.deleteMany({ where: { id: hostId } });
  await prisma.location.deleteMany({ where: { id: locationId } });
  await prisma.department.deleteMany({ where: { id: departmentId } });
  await prisma.$disconnect();
});

describe('Fase 2 — watchlist saat check-in', () => {
  it('BLOCK menolak check-in (403)', async () => {
    const res = await authPost('/api/visits/check-in', {
      visitor: { fullName: 'Orang Blokir', phone: PHONE_BLOCK },
      hostId,
      locationId,
      purpose: 'Coba masuk',
    });
    expect(res.status).toBe(403);
  });

  it('tamu biasa boleh check-in (201, tanpa flag)', async () => {
    const res = await authPost('/api/visits/check-in', {
      visitor: { fullName: 'Tamu Biasa', phone: PHONE_OK },
      hostId,
      locationId,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CHECKED_IN');
    expect(res.body.data.watchlistFlag).toBeNull();
  });
});

describe('Fase 2 — pra-registrasi → scan', () => {
  let qrToken = '';

  it('host membuat pra-registrasi + dapat qrToken', async () => {
    const res = await authPost('/api/preregistrations', {
      visitor: { fullName: 'Tamu Undangan', phone: `0833${TAG}` },
      hostId,
      locationId,
      scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      purpose: 'Rapat',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.qrToken).toBeTruthy();
    qrToken = res.body.data.qrToken;
    createdVisitorPhones.push(`0833${TAG}`);
  });

  it('scan QR → check-in instan (201, CHECKED_IN)', async () => {
    const res = await authPost('/api/preregistrations/scan', { qrToken });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CHECKED_IN');
  });

  it('scan ulang ditolak (409)', async () => {
    const res = await authPost('/api/preregistrations/scan', { qrToken });
    expect(res.status).toBe(409);
  });

  it('scan token tidak dikenal → 404', async () => {
    const res = await authPost('/api/preregistrations/scan', {
      qrToken: '00000000-0000-0000-0000-000000000000',
    });
    expect(res.status).toBe(404);
  });
});
