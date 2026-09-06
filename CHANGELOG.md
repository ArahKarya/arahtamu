# Changelog

## [0.5.0] — 2026-05-08

### Build & typecheck
- **Full monorepo `pnpm build` + `pnpm typecheck` PASS** (sebelumnya server fail di banyak tempat).
- Migrasi `packages/shared` ke pattern `main: ./dist/index.js` + `types: ./dist/index.d.ts` — server `tsc` resolve ke `.d.ts` (tidak trigger rootDir error). `pretypecheck`/`prebuild` auto-build shared dulu.
- Server `tsconfig.json`: hapus `prisma/**/*` dari include (split ke `tsconfig.scripts.json`), tambah `declaration: false` (server tidak emit .d.ts → cegah TS2742 dari dependency types yang non-portable).
- Fix: `pino-http` + `ioredis` CJS interop di NodeNext (`Redis` named import + cast helper untuk pinoHttp).
- Fix: `base-repository.ts` model getter typing.
- ErrorBoundary: `override` modifier untuk `noImplicitOverride`.

### Refresh token rotation hardening
- `RefreshToken.familyId` (UUID) — track lineage rotasi token.
- **Reuse detection**: kalau token revoked dipresentasikan lagi (replay attack), seluruh family di-revoke + audit `TOKEN_REUSE_DETECTED` + log warn. User force logout.
- `revokedReason` enum: `rotated | logout | reuse_detected | password_changed | admin_revoked`.
- `replacedById` untuk forensik chain.
- `ip` + `userAgent` direkam per token issuance.

### Multi-arch CI
- `.github/workflows/docker.yml`: `linux/amd64 + linux/arm64` via QEMU + buildx.
- Push ke GHCR pada main/tags (PR cuma build single-arch untuk speed).
- Metadata-action: tag otomatis (semver, branch, latest).
- Dockerfile: `pnpm install --frozen-lockfile` (hilangkan fallback yang masking lock contamination), HEALTHCHECK on `/api/health`, `curl` ditambah ke runtime image.

### Sentry observability (env-gated)
- `server/src/lib/sentry.ts` + init di `server/src/index.ts` BEFORE app import (auto-instrumentation).
- `errorHandler` middleware forward ke `Sentry.captureException` kalau `SENTRY_DSN` set.
- `client/src/lib/sentry.ts` + init di `main.tsx` via `VITE_SENTRY_DSN`.
- `ErrorBoundary` kirim React error context ke Sentry (componentStack).
- `client/.env.example` tambah `VITE_SENTRY_DSN`.

### Resend email provider
- `server/src/services/email.ts` — abstraksi `sendEmail()` dengan log fallback kalau `RESEND_API_KEY` kosong (dev-friendly).
- `server/src/services/email-templates.ts` — 5 template HTML siap pakai: welcome, password-reset, verify-email, invite, invoice (semua bahasa Indonesia).
- BullMQ email worker upgrade: support `{html}` direct OR `{template, params}` discriminated union.
- Env baru: `EMAIL_FROM` (`"FDM <noreply@..."`), `EMAIL_REPLY_TO` (optional).

## [0.4.0] — 2026-05-07

### Security hardening

- **Helmet**: full CSP directives di production + COOP `same-origin` default. Set `ALLOW_GOOGLE_SIGNIN=true` untuk relax ke `same-origin-allow-popups` + izinkan `accounts.google.com` di script/connect/frame-src (fix incident HRIS & Panggon Mikir GSI blocked).
- **Per-endpoint rate limit**: `/auth/login` 5 attempts / 15 min keyed by email+IP, `/auth/refresh` 30/min, `/auth/change-password` 10/jam (di samping global 300/min).
- **Bcrypt rounds**: env-configurable `BCRYPT_ROUNDS` (default 12, range 10–15). Auth service, users service, dan seed semua pakai env.
- **Password policy**: `passwordSchema` di `@fdm/shared` enforce min 8 chars + huruf besar + huruf kecil + angka.
- **CORS_ORIGIN**: validate `min(1)` di env Zod schema — fail-fast kalau kosong.

### Generator overhaul

- **Auto-patch**: mount router server, route client, nav item layout (pakai marker `ROUTES_GENERATOR_MARKER` & `NAV_GENERATOR_MARKER`)
- **Naming**: kebab-case input → file kebab + Pascal type + camel var + snake permission/table + plural-kebab route
- **Validation**: regex name pattern + reserved words list (auth, users, roles, dll)
- **Test scaffold**: generate `<name>.routes.test.ts` dengan supertest + auth/RBAC pattern
- **Default RBAC**: route generator pasang `requirePermissions('<entity>:read|write|delete')` otomatis

### Deployment

- `.npmrc` pin `registry.npmjs.org` + `fetch-retries=5` + `network-timeout=120000` (cegah Tencent mirror contamination + RPi5 ENOTFOUND)
- `docker-entrypoint.sh` — seed dibungkus `timeout` SEED_TIMEOUT_MS (default 120s)
- `docs/DEPLOY-RPI5.md` — runbook lengkap Cloudflare Tunnel `fdm` + DNS routing
- `.env.docker.example` — tambah `BCRYPT_ROUNDS`, `SEED_TIMEOUT_MS`, `SENTRY_DSN`, `RESEND_API_KEY`, `ALLOW_GOOGLE_SIGNIN`, `GOOGLE_CLIENT_ID`, `CLOUDFLARE_TUNNEL_TOKEN`

### Frontend

- `ErrorBoundary` di root `App.tsx` (fallback Indonesian + retry/reload + Sentry forward kalau available)
- `EmptyState` default text Indonesian (`Tidak ada data` / `Belum ada data yang tersedia.`)
- `LoginPage` redirect ke dashboard kalau user sudah authenticated
- `vite.config.ts` sourcemap default `false` di build, `hidden` kalau `SOURCEMAP=true` (untuk upload Sentry)

### DX

- `.vscode/settings.json` + `extensions.json` — Prettier, ESLint, Prisma, Tailwind, Vitest, Pretty TS Errors

## [0.3.0] — 2026-04-22

### Progressive Layering

- Module generator (`pnpm new:module`) sekarang support `--layered` flag
- **Simple tier** (default): routes + service (Prisma langsung) — untuk CRUD master data
- **Layered tier**: routes + service + repository + types — untuk modul dengan business rules
- `BaseRepository<T>` generic di `server/src/lib/base-repository.ts` — extend untuk custom queries
- Client page template diupgrade: pakai shadcn/ui components (Card, Table, Skeleton, EmptyState)
- Prisma model template pakai `@map("snake_case")` by default

### PWA Support

- `public/manifest.json` — app manifest (standalone, installable)
- `public/sw.js` — service worker (cache shell, network-first navigasi, skip `/api/`)
- `src/lib/register-sw.ts` — auto-register + update notification prompt
- `index.html` — ditambah `<meta name="theme-color">`, `<link rel="manifest">`, `<link rel="apple-touch-icon">`
- Placeholder icons di `public/icons/`

### Docs

- README: tambah section Design System, Cara Pakai, Progressive Layering, PWA Support
- CLAUDE.md: tambah panduan Progressive Layering + PWA

## [0.2.0] — 2026-04-16

### Design system dari HRIS

**UI/UX overhaul:**
- Port design system dari App-Human-Resources (WCAG 2.2 AA compliant)
- OKLCH color space dengan tokens: primary (steel blue), success, warning, info, destructive
- Light + dark mode via custom ThemeProvider (SPA-compatible, tidak butuh next-themes)
- Font stack: Inter Variable (sans) + Plus Jakarta Sans Variable (heading) via @fontsource
- `tw-animate-css` untuk animasi shadcn

**shadcn/ui components (17 core):**
- button, card, input, label, badge, separator, skeleton, avatar
- dropdown-menu, table, dialog, sheet, select, tabs, tooltip, scroll-area, sonner

**Layout improvement:**
- Sidebar collapsible (60px ↔ 240px) dengan smooth transition
- Mobile sidebar pakai Sheet drawer
- Header: theme toggle + notification + user menu dropdown
- Sidebar-specific color tokens (`--sidebar`, `--sidebar-primary`, etc)

**Pages refactored:**
- LoginPage — Card layout dengan logo bubble
- DashboardPage — StatCard dengan icon + semantic colors
- UsersPage — shadcn Table + Badge + Skeleton loading
- AuditLogPage — action-colored badges (CREATE=success, DELETE=destructive, etc)
- SettingsPage — Card wrapper + Table

**New deps:**
- `@base-ui/react`, `cmdk`, `react-day-picker`, `next-themes`
- `@fontsource-variable/{inter,plus-jakarta-sans}`
- Radix primitives: avatar, popover, scroll-area, select, separator, tabs, tooltip

## [0.1.0] — 2026-04-16

### Initial release

**Foundation:**
- pnpm monorepo (client + server + packages/shared)
- TypeScript + strict mode across all packages
- Prettier + EditorConfig + Husky ready

**Server:**
- Express 5 + TypeScript + Prisma (PostgreSQL 16)
- JWT access + refresh token with rotation & revocation
- RBAC: 5 default roles, 17 permission keys
- Audit log middleware (auto-capture mutations)
- Zod validation at boundary, shared schemas with client
- Pino structured logging
- Security: Helmet, CORS, rate limit, bcrypt
- BullMQ + Redis (5 queues: email, export, report, notification, cleanup)
- Bull Board admin UI at /admin/queues
- Multer file upload
- Excel export utility (ExcelJS)
- Health check endpoint

**Client:**
- Vite 6 + React 19 + Tailwind CSS 4
- TanStack Query v5 + React Hook Form + Zod
- Zustand auth store with persist
- React Router v7 with ProtectedRoute
- Login, Dashboard, Users, AuditLog, Settings pages
- Axios with refresh token interceptor
- Sonner toast notifications
- Lucide icons

**DevOps:**
- Docker Compose (4 services: postgres, redis, app, worker)
- Dockerfile.allinone for single-container production
- GitHub Actions CI (typecheck + test)
- Module generator: `pnpm new:module <name>`

**Docs:**
- README, ARCHITECTURE, GETTING-STARTED, CLAUDE.md
