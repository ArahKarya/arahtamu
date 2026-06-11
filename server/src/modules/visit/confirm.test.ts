import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken } from '../../lib/jwt.js';

const app = createApp();
const TAG = Date.now().toString().slice(-9);

let adminToken = '';
let hostToken = '';
let otherHostToken = '';
let securityToken = '';
let departmentId = '';
let locationId = '';
let hostId = '';
let visitId = '';
const userIds: string[] = [];

async function makeUser(email: string, roleName: string): Promise<string> {
  const role = await prisma.role.findFirstOrThrow({ where: { name: roleName } });
  const u = await prisma.user.create({
    data: { name: email, email, passwordHash: 'x', isActive: true, roles: { create: { roleId: role.id } } },
  });
  userIds.push(u.id);
  return u.id;
}

beforeAll(async () => {
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@arahtamu.local' },
  });
  adminToken = signAccessToken({ sub: admin.id, email: admin.email, roles: ['SUPER_ADMIN'] });
  const a = (m: 'post', p: string) => request(app)[m](p).set('Authorization', `Bearer ${adminToken}`);

  departmentId = (await a('post', '/api/departments').send({ name: `Dept C ${TAG}` })).body.data.id;
  locationId = (await a('post', '/api/locations').send({ name: `Lokasi C ${TAG}` })).body.data.id;

  const hostUserId = await makeUser(`host${TAG}@arahtamu.local`, 'HOST');
  hostToken = signAccessToken({ sub: hostUserId, email: `host${TAG}@arahtamu.local`, roles: ['HOST'] });

  const otherHostUserId = await makeUser(`other${TAG}@arahtamu.local`, 'HOST');
  otherHostToken = signAccessToken({ sub: otherHostUserId, email: `other${TAG}@arahtamu.local`, roles: ['HOST'] });

  const securityUserId = await makeUser(`sec${TAG}@arahtamu.local`, 'SECURITY');
  securityToken = signAccessToken({ sub: securityUserId, email: `sec${TAG}@arahtamu.local`, roles: ['SECURITY'] });

  // host record TERTAUT ke hostUser
  hostId = (
    await a('post', '/api/hosts').send({
      name: 'Host C',
      email: `hc${TAG}@arahtamu.local`,
      departmentId,
      userId: hostUserId,
    })
  ).body.data.id;

  // check-in tamu untuk host ini
  visitId = (
    await a('post', '/api/visits/check-in').send({
      visitor: { fullName: 'Tamu Konfirmasi', phone: `0866${TAG}` },
      hostId,
      locationId,
    })
  ).body.data.id;
});

afterAll(async () => {
  await prisma.visit.deleteMany({ where: { location: { name: `Lokasi C ${TAG}` } } });
  await prisma.visitor.deleteMany({ where: { phone: `0866${TAG}` } });
  await prisma.host.deleteMany({ where: { id: hostId } });
  await prisma.location.deleteMany({ where: { id: locationId } });
  await prisma.department.deleteMany({ where: { id: departmentId } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

const confirm = (token: string, body: object) =>
  request(app).post(`/api/visits/${visitId}/confirm`).set('Authorization', `Bearer ${token}`).send(body);

describe('Host confirm terima/tolak', () => {
  it('host lain (bukan tujuan) → 403', async () => {
    const res = await confirm(otherHostToken, { decision: 'ACCEPT' });
    expect(res.status).toBe(403);
  });

  it('security (tanpa visit:confirm) → 403', async () => {
    const res = await confirm(securityToken, { decision: 'ACCEPT' });
    expect(res.status).toBe(403);
  });

  it('host tujuan menerima → 200, ACCEPTED', async () => {
    const res = await confirm(hostToken, { decision: 'ACCEPT' });
    expect(res.status).toBe(200);
    expect(res.body.data.hostConfirmation).toBe('ACCEPTED');
    expect(res.body.data.hostConfirmedAt).toBeTruthy();
  });

  it('host tujuan menolak (dengan catatan) → 200, REJECTED', async () => {
    const res = await confirm(hostToken, { decision: 'REJECT', note: 'Tidak ada janji' });
    expect(res.status).toBe(200);
    expect(res.body.data.hostConfirmation).toBe('REJECTED');
    expect(res.body.data.hostNote).toBe('Tidak ada janji');
  });

  it('validasi decision invalid → 422', async () => {
    const res = await confirm(hostToken, { decision: 'MAYBE' });
    expect(res.status).toBe(422);
  });
});
