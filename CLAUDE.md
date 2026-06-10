# CLAUDE.md — ArahKarya

Guidance untuk AI assistant (Claude Code) saat bekerja di codebase ini.

## Apa itu ArahKarya

Skeleton/framework TypeScript untuk membangun aplikasi ERP & internal tool. Diekstrak dari 3 aplikasi produksi: aplikasi-keuangan-pmd, ga-asset-document-monitor, App-Human-Resources.

## Arsitektur

- **Monorepo** pnpm workspaces: `client/`, `server/`, `packages/shared/`
- **Client**: Vite + React 19 + TS + Tailwind 4 + TanStack Query + RHF + Zod + Zustand
- **Server**: Express 5 + TS + Prisma + PostgreSQL + JWT + Zod
- **Queue**: BullMQ + Redis (worker proses terpisah)
- **Deploy**: Docker Compose multi-container atau Dockerfile.allinone

## Prinsip Ketat

1. **Zod schema share**: schema validasi selalu di `packages/shared/src/schemas/` — dipakai server (request body) DAN client (form). Jangan duplikat.
2. **API envelope konsisten**: semua response via `ok()` / `fail()` dari `@arahtamu/shared` → `{ success, data, error, meta? }`.
3. **Immutable data**: jangan mutate, return object baru.
4. **Small files**: module split by feature (service/routes/controller terpisah), target <400 LOC per file.
5. **Audit everything**: mutation endpoint (POST/PATCH/DELETE) WAJIB pakai `audit('ACTION', 'entity')` middleware.
6. **RBAC everywhere**: endpoint protected WAJIB `requirePermissions(...)` atau `requireRoles(...)`. `SUPER_ADMIN` bypass semua permission check. **Generator default-nya sudah pasang `requirePermissions('<entity>:read|write|delete')` per route — JANGAN dihapus.**
7. **JWT rotation**: refresh token selalu di-hash (SHA-256) sebelum disimpan. Revoke lama saat rotate. Rate limit per-endpoint untuk `/auth/login` (5/15min), `/auth/refresh` (30/min), `/auth/change-password` (10/jam) — sudah aktif di `auth.routes.ts`.
8. **Bcrypt rounds**: ambil dari `env.BCRYPT_ROUNDS` (default 12). JANGAN hard-code angka rounds.
9. **Password policy**: pakai `passwordSchema` dari `@arahtamu/shared` (min 8, harus ada huruf besar + kecil + angka). JANGAN bypass.
10. **Helmet + Google Sign-In**: kalau modul Google OAuth dipakai, set `ALLOW_GOOGLE_SIGNIN=true` di env supaya COOP `same-origin-allow-popups` + CSP `accounts.google.com` aktif. Default `same-origin` (lebih ketat).

## Progressive Layering (Module Tiers)

ArahKarya menyediakan 2 tier module yang dipilih per modul:

### Tier 1: Simple (default)
```bash
pnpm new:module customer
```
Generates: `routes.ts` + `service.ts` (service langsung akses Prisma).
Cocok untuk: CRUD master data, settings, lookup tables — modul tanpa business logic kompleks.

### Tier 2: Layered
```bash
pnpm new:module production --layered
```
Generates: `routes.ts` + `service.ts` + `repository.ts` + `types.ts`.
Service hanya panggil repository, tidak import Prisma langsung.
Cocok untuk: modul dengan business rules berat (accounting, inventory, production, billing).

### Kapan Pilih Tier?
- Cuma CRUD + filter + export? → **Simple**
- Ada kalkulasi / state machine / business rules? → **Layered**
- Dipanggil dari queue worker + HTTP? → **Layered**
- Ragu? → **Mulai Simple**, upgrade ke Layered nanti

### BaseRepository
`server/src/lib/base-repository.ts` — generic CRUD repository. Layered modules extend ini:
```ts
class ProductionRepository extends BaseRepository<ProductionEntity> {
  constructor() { super('production'); }
  // custom queries here
}
```

## Adding a New Module

```bash
pnpm new:module <name>              # Simple module
pnpm new:module <name> --layered    # Layered module
pnpm new:module <name> --entity=Pascal   # Custom Pascal name override
```

Naming: input `customer-order` → file `customer-order.routes.ts`, type `CustomerOrder`, route `/api/customer-orders`, permission `customer_order:read|write|delete`, table `@@map("customer_orders")`. Generator validasi name (regex + reserved words list).

**Auto-patch** (pakai marker `// ROUTES_GENERATOR_MARKER` di `server/src/routes/index.ts`, `{/* ROUTES_GENERATOR_MARKER */}` di `client/src/App.tsx`, `// NAV_GENERATOR_MARKER` di `client/src/layouts/AppLayout.tsx` — JANGAN dihapus marker tersebut):
- Mount router server
- Register route client + nav item (icon default `Box` — ganti manual setelah generate)
- Patch shared schemas barrel
- Generate `routes.test.ts` scaffold (auth/RBAC/validation pattern)

Manual sisa:
1. Add Prisma model di `server/prisma/schema.prisma` (template di output generator)
2. `pnpm --filter @arahtamu/server db:migrate:dev --name add-<name>`
3. Tambah permission keys di `packages/shared/src/constants/index.ts` PERMISSIONS
4. Re-seed: `pnpm --filter @arahtamu/server db:seed`
5. Run test scaffold: `pnpm --filter @arahtamu/server test <name>`

## Testing

- Server: Vitest + supertest (`pnpm --filter @arahtamu/server test`)
- Shared types: tsc noEmit
- Target coverage: 80%+ untuk logic modul bisnis (bukan boilerplate CRUD)

## Commit Style

`<type>: <description>`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

## PWA

Client sudah PWA-ready:
- `public/manifest.json` — app manifest (edit name, colors, icons per project)
- `public/sw.js` — service worker (cache shell, network-first untuk navigasi, skip `/api/`)
- `src/lib/register-sw.ts` — auto-register + update prompt
- Icons placeholder di `public/icons/` — ganti dengan icon app sebenarnya

Untuk disable PWA, hapus `registerServiceWorker()` dari `main.tsx`.

## Branding & Trademark

Setiap aplikasi yang dibangun dari skeleton ini WAJIB menampilkan branding ArahKarya:

- **Nama Legal**: PT Arah Karya Sinergi
- **Copyright**: © ArahKarya — PT Arah Karya Sinergi
- **Logo**: 2 varian — hitam (light mode) & putih (dark mode), ada di `client/public/icons/`

### Tempat Wajib Tampil

1. **Login page** — logo + copyright di header card
2. **Sidebar header** — logo + nama app
3. **Sidebar footer** — copyright text (saat expanded)
4. **PWA manifest** — icons (192, 512, maskable)
5. **Favicon** — `client/public/favicon.ico`

### Cara Pakai

Semua branding diambil dari shared constants, JANGAN hard-code:

```ts
import { BRANDING } from '@arahtamu/shared';

BRANDING.APP_NAME      // 'ArahKarya'
BRANDING.LEGAL_NAME    // 'PT Arah Karya Sinergi'
BRANDING.COPYRIGHT     // '© ArahKarya — PT Arah Karya Sinergi'
BRANDING.LOGO_LIGHT    // '/icons/icon-arah-bk.png'
BRANDING.LOGO_DARK     // '/icons/icon-arah-wh.png'
```

Saat membuat aplikasi baru dari skeleton: edit `BRANDING` di `packages/shared/src/constants/index.ts` dan ganti file icon di `client/public/icons/`.

## Jangan Lakukan

- ❌ Mutate existing data
- ❌ Skip audit log di endpoint mutasi
- ❌ Skip RBAC check ("cuma admin yang akses" bukan alasan)
- ❌ Duplikat Zod schema antara FE dan BE
- ❌ Hard-code secrets / credential
- ❌ Mock database di integration test (pakai Postgres container)

## File Referensi Wajib Dibaca

Sebelum coding besar, baca:
- `packages/shared/src/constants/index.ts` — permission keys, role names, queue names
- `server/src/middleware/` — error, auth, rbac, audit, validate
- `server/src/lib/errors.ts` — standard error constructors
- `server/src/services/queue.ts` — cara enqueue job
- `docs/DEPLOY-RPI5.md` — pola deploy on-prem RPi5 via Cloudflare Tunnel `arahkarya`

## Deployment

Default deploy: **Docker Compose** (multi-container) atau `Dockerfile.allinone` (single-container).

- **VPS**: `docker compose up -d --build` setelah edit `.env`
- **RPi5 / on-prem**: lihat `docs/DEPLOY-RPI5.md` — pakai Cloudflare Tunnel `arahkarya` + hostname `<app>.arahkarya.com`. JANGAN nginx port-forward, JANGAN buka port di router.
- **`.npmrc`** sudah pin `registry.npmjs.org` + retry 5x — jangan generate `pnpm-lock.yaml` di mesin yang punya `mirrors.tencentyun.com` di `.npmrc` user, akan ENOTFOUND di RPi5.
- **Seed timeout** dikontrol `SEED_TIMEOUT_MS` (default 120000) di entrypoint — RPi5 cold start sering > 60s.

## Optional Integrations (env-driven)

Aktifkan dengan set env, framework auto-wire (no code change needed):
- `SENTRY_DSN` (server) + `VITE_SENTRY_DSN` (client) — Sentry init di `server/src/index.ts` (BEFORE app import) dan `client/src/main.tsx`. ErrorBoundary forward React error context.
- `RESEND_API_KEY` + `EMAIL_FROM` — `server/src/services/email.ts::sendEmail()` pakai Resend. Tanpa key, fallback ke logger only (dev). Templates di `server/src/services/email-templates.ts`: welcome, password-reset, verify-email, invite, invoice.
- `ALLOW_GOOGLE_SIGNIN=true` + `GOOGLE_CLIENT_ID` — Helmet COOP/CSP relax untuk Google Sign-In popup.

## Refresh Token Reuse Detection

Schema `RefreshToken` punya `familyId` + `revokedReason` + `replacedById`. Saat refresh:
1. Kalau token tidak ditemukan → `UNAUTHORIZED`
2. Kalau token sudah `revokedAt` (replay) → revoke seluruh family + audit `TOKEN_REUSE_DETECTED` + force logout user
3. Normal: revoke old (`revokedReason='rotated'`) + issue new dengan `familyId` sama

Logout: `revokedReason='logout'`. Change-password: revoke semua active tokens per user dengan `revokedReason='password_changed'`.

## Build & Typecheck

`pnpm typecheck` dan `pnpm build` di root WAJIB hijau sebelum commit. Server pakai `pretypecheck`/`prebuild` script yang auto-build shared package dulu (karena server resolve `@arahtamu/shared` lewat `dist/*.d.ts`, bukan source). Kalau Anda edit file di `packages/shared/`, server typecheck akan trigger rebuild otomatis.
