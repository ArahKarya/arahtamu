import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken } from '../../lib/jwt.js';

const app = createApp();
const TAG = Date.now().toString().slice(-9);

let adminToken = '';
let recToken = '';
let recUserId = '';
let departmentId = '';
let locationId = '';
let hostId = '';

const authAs = (token: string) => ({
  post: (p: string) => request(app).post(p).set('Authorization', `Bearer ${token}`),
  get: (p: string) => request(app).get(p).set('Authorization', `Bearer ${token}`),
  delete: (p: string) => request(app).delete(p).set('Authorization', `Bearer ${token}`),
});

beforeAll(async () => {
  const admin = await prisma.user.findUnique({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@fdm.local' },
  });
  if (!admin) throw new Error('admin seed tidak ada — jalankan db:seed');
  adminToken = signAccessToken({ sub: admin.id, email: admin.email, roles: ['SUPER_ADMIN'] });

  // master data via admin
  const a = authAs(adminToken);
  departmentId = (await a.post('/api/departments').send({ name: `Dept RBAC ${TAG}` })).body.data.id;
  locationId = (await a.post('/api/locations').send({ name: `Lokasi RBAC ${TAG}` })).body.data.id;
  hostId = (
    await a.post('/api/hosts').send({ name: 'Host RBAC', email: `hrbac${TAG}@fdm.local`, departmentId })
  ).body.data.id;

  // buat user RESEPSIONIS sungguhan (role di DB → permission dihitung dari sini)
  const recRole = await prisma.role.findFirst({ where: { name: 'RECEPTIONIST' } });
  if (!recRole) throw new Error('role RECEPTIONIST belum ada — reseed');
  const recUser = await prisma.user.create({
    data: {
      name: 'Resepsionis Uji',
      email: `rec${TAG}@fdm.local`,
      passwordHash: 'x',
      isActive: true,
      roles: { create: { roleId: recRole.id } },
    },
  });
  recUserId = recUser.id;
  recToken = signAccessToken({ sub: recUser.id, email: recUser.email, roles: ['RECEPTIONIST'] });
});

afterAll(async () => {
  await prisma.visit.deleteMany({ where: { location: { name: `Lokasi RBAC ${TAG}` } } });
  await prisma.visitor.deleteMany({ where: { phone: `0877${TAG}` } });
  await prisma.user.deleteMany({ where: { id: recUserId } });
  await prisma.host.deleteMany({ where: { id: hostId } });
  await prisma.location.deleteMany({ where: { id: locationId } });
  await prisma.department.deleteMany({ where: { id: departmentId } });
  await prisma.$disconnect();
});

describe('RBAC per-peran — RESEPSIONIS', () => {
  it('BISA check-in (punya visit:write)', async () => {
    const res = await authAs(recToken)
      .post('/api/visits/check-in')
      .send({ visitor: { fullName: 'Tamu RBAC', phone: `0877${TAG}` }, hostId, locationId });
    expect(res.status).toBe(201);
  });

  it('BISA lihat watchlist (punya watchlist:read)', async () => {
    const res = await authAs(recToken).get('/api/watchlists');
    expect(res.status).toBe(200);
  });

  it('TIDAK BISA hapus user (tak punya user:delete) → 403', async () => {
    const res = await authAs(recToken).delete(`/api/users/${recUserId}`);
    expect(res.status).toBe(403);
  });

  it('TIDAK BISA hapus watchlist (tak punya watchlist:delete) → 403', async () => {
    const res = await authAs(recToken).delete('/api/watchlists/clxxxxxxxxxxxxxxxxxxxxxxxx');
    expect(res.status).toBe(403);
  });

  it('TIDAK BISA buat lokasi (tak punya location:write) → 403', async () => {
    const res = await authAs(recToken).post('/api/locations').send({ name: 'X' });
    expect(res.status).toBe(403);
  });
});
