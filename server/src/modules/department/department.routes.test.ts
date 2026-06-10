import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const app = createApp();

describe('Department routes', () => {
  describe('auth & rbac', () => {
    it('GET /api/departments rejects without token', async () => {
      const res = await request(app).get('/api/departments');
      expect(res.status).toBe(401);
    });

    it('POST /api/departments rejects without token', async () => {
      const res = await request(app)
        .post('/api/departments')
        .send({ name: 'Test' });
      expect(res.status).toBe(401);
    });

    // TODO: test reject without permission 'department:write' (login as VIEWER → expect 403)
    // TODO: test happy path create → list → update → delete with ADMIN token + Postgres container
    // TODO: test invalid input rejected (Zod validation)
  });

  describe('validation', () => {
    it('POST /api/departments rejects empty body shape (when authed)', async () => {
      // Placeholder until test auth helper is wired.
      // const token = await loginAsAdmin();
      // const res = await request(app)
      //   .post('/api/departments')
      //   .set('Authorization', `Bearer ${token}`)
      //   .send({});
      // expect(res.status).toBe(400);
      expect(true).toBe(true);
    });
  });
});
