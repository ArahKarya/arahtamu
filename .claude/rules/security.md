# Security Rules

## RBAC (WAJIB)

Setiap endpoint protected WAJIB pakai middleware:
```ts
router.get('/', authenticate, requirePermissions('entity:read'), handler);
router.post('/', authenticate, requirePermissions('entity:write'), handler);
router.delete('/:id', authenticate, requirePermissions('entity:delete'), handler);
```

`SUPER_ADMIN` bypass semua permission check secara otomatis.
JANGAN skip RBAC dengan alasan "cuma admin yang akses".

**Generator default-nya sudah pasang `requirePermissions(...)` per route — JANGAN dihapus.** Kalau modul perlu public endpoint (mis. `/api/health`), buat sub-router terpisah yang TIDAK pakai `authenticate`.

## Audit Log (WAJIB)

Setiap mutation endpoint (POST/PATCH/DELETE) WAJIB pakai audit middleware:
```ts
router.post('/', validate(schema), audit('CREATE', 'entity'), handler);
router.patch('/:id', validate(schema), audit('UPDATE', 'entity'), handler);
router.delete('/:id', audit('DELETE', 'entity'), handler);
```

JANGAN skip audit log di endpoint mutasi.

## JWT & Auth

- Refresh token di-hash SHA-256 sebelum disimpan
- Revoke token lama saat rotate
- Access token: short-lived (15m default)
- Refresh token: longer-lived (7d default)
- **Bcrypt rounds**: env `BCRYPT_ROUNDS` (default 12, range 10–15). JANGAN hard-code rounds.
- **Password policy**: pakai `passwordSchema` dari shared (min 8 + huruf besar + huruf kecil + angka). JANGAN bypass.
- **Per-endpoint rate limit**: `/auth/login` 5/15min email+IP, `/auth/refresh` 30/min, `/auth/change-password` 10/jam. Aktif di `auth.routes.ts`.

## Helmet & Google Sign-In

Default Helmet pakai COOP `same-origin` + CSP ketat. Kalau modul OAuth Google dipakai:

- Set env `ALLOW_GOOGLE_SIGNIN=true` + `GOOGLE_CLIENT_ID=<your-client-id>`
- Helmet otomatis relax COOP ke `same-origin-allow-popups` + izinkan `accounts.google.com` di script/connect/frame-src
- Tambah GET handler untuk callback OAuth (Google redirect = GET, bukan POST)

JANGAN disable CSP global di production sebagai shortcut — pasti bocor XSS.

## Secrets

- JANGAN hard-code secrets, API keys, passwords di source code
- Selalu pakai environment variables via `server/src/config/`
- Validasi env vars saat startup (Zod schema)
- File `.env` TIDAK boleh masuk git (sudah di `.gitignore`)

## Input Validation

- Validasi di boundary: semua request body via `validate()` middleware + Zod schema
- JANGAN trust data dari client tanpa validasi
- Prisma parameterized queries — SQL injection safe by default

## Rate Limiting

Rate limit sudah aktif global via middleware.
Endpoint sensitif (login, password reset) bisa ditambah rate limit lebih ketat.
