import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken } from '../../lib/jwt.js';

const app = createApp();

// Integration test alur inti VMS: check-in → active → check-out.
// Token di-mint langsung dari admin seeded (hindari rate-limit login) + Postgres container
// (sesuai aturan: jangan mock DB).

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@arahtamu.local';
const UNIQUE_PHONE = `0899${Date.now().toString().slice(-9)}`;

let token = '';
let departmentId = '';
let locationId = '';
let hostId = '';
let visitId = '';

beforeAll(async () => {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error('admin seed tidak ada — jalankan db:seed');
  token = signAccessToken({ sub: admin.id, email: admin.email, roles: ['SUPER_ADMIN'] });

  const dep = await request(app)
    .post('/api/departments')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Dept Test ${UNIQUE_PHONE}` });
  departmentId = dep.body.data.id;

  const loc = await request(app)
    .post('/api/locations')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Lokasi Test ${UNIQUE_PHONE}`, capacity: 50 });
  locationId = loc.body.data.id;

  const host = await request(app)
    .post('/api/hosts')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Host Test', email: `host${UNIQUE_PHONE}@arahtamu.local`, departmentId });
  hostId = host.body.data.id;
});

afterAll(async () => {
  if (visitId) await prisma.visit.deleteMany({ where: { id: visitId } });
  await prisma.visitor.deleteMany({ where: { phone: UNIQUE_PHONE } });
  if (hostId) await prisma.host.deleteMany({ where: { id: hostId } });
  if (locationId) await prisma.location.deleteMany({ where: { id: locationId } });
  if (departmentId) await prisma.department.deleteMany({ where: { id: departmentId } });
  await prisma.$disconnect();
});

describe('VMS check-in flow', () => {
  it('walk-in check-in creates visitor + visit CHECKED_IN with badge', async () => {
    const res = await request(app)
      .post('/api/visits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        visitor: { fullName: 'Tamu Uji', company: 'PT Uji', phone: UNIQUE_PHONE },
        hostId,
        locationId,
        purpose: 'Meeting',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CHECKED_IN');
    expect(res.body.data.badgeCode).toBeTruthy();
    expect(res.body.data.checkInAt).toBeTruthy();
    expect(res.body.data.visitor.fullName).toBe('Tamu Uji');
    visitId = res.body.data.id;
  });

  it('check-in rejects invalid payload (Zod)', async () => {
    const res = await request(app)
      .post('/api/visits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ visitor: { fullName: '' }, hostId, locationId });
    expect(res.status).toBe(422);
  });

  it('active list includes the checked-in visit', async () => {
    const res = await request(app)
      .get('/api/visits/active')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((v: { id: string }) => v.id === visitId)).toBe(true);
  });

  it('check-out marks visit CHECKED_OUT', async () => {
    const res = await request(app)
      .post(`/api/visits/${visitId}/check-out`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CHECKED_OUT');
    expect(res.body.data.checkOutAt).toBeTruthy();
  });

  it('double check-out is rejected (409)', async () => {
    const res = await request(app)
      .post(`/api/visits/${visitId}/check-out`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  it('check-in rejects without token (401)', async () => {
    const res = await request(app)
      .post('/api/visits/check-in')
      .send({ visitor: { fullName: 'X', phone: '0800' }, hostId, locationId });
    expect(res.status).toBe(401);
  });
});
