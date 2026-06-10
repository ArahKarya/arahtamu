import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken } from '../../lib/jwt.js';

const app = createApp();
const TAG = Date.now().toString().slice(-9);
let token = '';

beforeAll(async () => {
  const admin = await prisma.user.findUnique({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@arahtamu.local' },
  });
  if (!admin) throw new Error('admin seed tidak ada');
  token = signAccessToken({ sub: admin.id, email: admin.email, roles: ['SUPER_ADMIN'] });
});

describe('Department CRUD (kontrak UI admin)', () => {
  it('create → update → delete', async () => {
    const auth = (m: 'post' | 'patch' | 'delete' | 'get', p: string) =>
      request(app)[m](p).set('Authorization', `Bearer ${token}`);

    const created = await auth('post', '/api/departments').send({ name: `CRUD ${TAG}`, description: 'awal' });
    expect(created.status).toBe(201);
    const id = created.body.data.id;

    const updated = await auth('patch', `/api/departments/${id}`).send({ description: 'diperbarui' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.description).toBe('diperbarui');

    const del = await auth('delete', `/api/departments/${id}`);
    expect(del.status).toBe(200);

    const after = await auth('get', `/api/departments/${id}`);
    expect(after.status).toBe(404);
  });

  it('create menolak tanpa permission write (viewer-less token = 403/empty roles)', async () => {
    const weak = signAccessToken({ sub: 'nobody', email: 'x@x.local', roles: [] });
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${weak}`)
      .send({ name: 'X' });
    expect([401, 403]).toContain(res.status);
  });
});
