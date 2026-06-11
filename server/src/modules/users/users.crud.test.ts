import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken } from '../../lib/jwt.js';

const app = createApp();
const TAG = Date.now().toString().slice(-9);
const EMAIL = `user${TAG}@arahtamu.local`;
let token = '';
let roleId = '';

beforeAll(async () => {
  const admin = await prisma.user.findUnique({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@arahtamu.local' },
  });
  if (!admin) throw new Error('admin seed tidak ada');
  token = signAccessToken({ sub: admin.id, email: admin.email, roles: ['SUPER_ADMIN'] });
  const role = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  roleId = role!.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.$disconnect();
});

describe('Users CRUD (kontrak UsersPage)', () => {
  const auth = (m: 'post' | 'patch' | 'delete', p: string) =>
    request(app)[m](p).set('Authorization', `Bearer ${token}`);

  it('create dengan roleIds + password → update → delete', async () => {
    const created = await auth('post', '/api/users').send({
      name: 'User Uji',
      email: EMAIL,
      password: 'Rahasia123',
      roleIds: [roleId],
      isActive: true,
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    // role tertaut di DB
    const link = await prisma.userRole.findFirst({ where: { userId: id, roleId } });
    expect(link).not.toBeNull();

    const updated = await auth('patch', `/api/users/${id}`).send({ name: 'User Uji Edit' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('User Uji Edit');

    const del = await auth('delete', `/api/users/${id}`);
    expect([200, 204]).toContain(del.status);
  });

  it('create menolak password lemah (422)', async () => {
    const res = await auth('post', '/api/users').send({
      name: 'Lemah',
      email: `weak${TAG}@arahtamu.local`,
      password: 'lemah',
      roleIds: [roleId],
    });
    expect(res.status).toBe(422);
  });
});
