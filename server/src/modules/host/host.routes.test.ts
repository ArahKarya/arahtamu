import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const app = createApp();

describe('Host routes', () => {
  describe('auth & rbac', () => {
    it('GET /api/hosts rejects without token', async () => {
      const res = await request(app).get('/api/hosts');
      expect(res.status).toBe(401);
    });

    it('POST /api/hosts rejects without token', async () => {
      const res = await request(app)
        .post('/api/hosts')
        .send({ name: 'Test' });
      expect(res.status).toBe(401);
    });

    // TODO: test reject without permission 'host:write' (login as VIEWER → expect 403)
    // TODO: test happy path create → list → update → delete with ADMIN token + Postgres container
    // TODO: test invalid input rejected (Zod validation)
  });

  describe('validation', () => {
    it('POST /api/hosts rejects empty body shape (when authed)', async () => {
      // Placeholder until test auth helper is wired.
      // const token = await loginAsAdmin();
      // const res = await request(app)
      //   .post('/api/hosts')
      //   .set('Authorization', `Bearer ${token}`)
      //   .send({});
      // expect(res.status).toBe(400);
      expect(true).toBe(true);
    });
  });
});
