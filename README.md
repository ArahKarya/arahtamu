# ArahKarya

**Skeleton / framework untuk membangun aplikasi ERP & internal tool.**

Diekstrak dari 3 aplikasi produksi ([aplikasi-keuangan-pmd](https://github.com/Logia-ysn/aplikasi-keuangan-pmd), [ga-asset-document-monitor](https://github.com/Logia-ysn/ga-asset-document-monitor), [App-Human-Resources](https://github.com/Logia-ysn/App-Human-Resources)), ArahKarya menyediakan fondasi siap pakai sehingga ERP berikutnya bisa dibangun dalam hitungan hari, bukan bulan.

## Cara Pakai

Repo ini adalah **base skeleton** — setiap kali membuat aplikasi baru, clone/fork repo ini sebagai titik awal:

```bash
# 1. Clone sebagai project baru
gh repo create MyOrg/nama-app --private --clone --template ArahKarya/arahkarya
# atau manual:
git clone https://github.com/ArahKarya/arahkarya.git nama-app
cd nama-app && rm -rf .git && git init

# 2. Rename package identifiers
# - Edit package.json (root, client, server, packages/shared): ganti @arahkarya → @nama-app
# - Edit docker-compose.yml, Dockerfile.allinone: sesuaikan service name & image name

# 3. Setup environment & database
cp server/.env.example server/.env   # edit DB credentials, JWT secrets
cp client/.env.example client/.env
pnpm install
pnpm db:migrate && pnpm db:seed

# 4. Tambah modul bisnis
pnpm new:module <nama-modul>         # generate CRUD scaffold
```

Semua built-in module (Auth, RBAC, Audit, Settings, Notifications, Queue) sudah siap pakai tanpa modifikasi.

## Design System

ArahKarya menggunakan design system bernuansa **industrial profesional**, diekstrak dari aplikasi HRIS produksi:

- **OKLCH color space** — warna presisi tinggi, konsisten di semua display
- **Primary: Steel Blue** — kesan profesional, tenang, cocok untuk lingkungan pabrik & operasional
- **Semantic color tokens** — success (hijau), warning (kuning), destructive (merah), info (biru) untuk status yang jelas di dashboard operasional
- **WCAG 2.2 AA compliant** — kontras tinggi, mudah dibaca di layar monitor pabrik maupun mobile
- **Light + Dark mode** — ThemeProvider SPA-compatible, toggle via UI
- **Font stack** — Inter Variable (body) + Plus Jakarta Sans Variable (heading), bersih dan mudah dibaca
- **shadcn/ui primitives** — 17 core components (button, card, table, dialog, dll) dengan styling konsisten
- **Sidebar collapsible** — 60px ↔ 240px, mobile-friendly via Sheet drawer

## Tech Stack

| Layer | Choice |
|---|---|
| **Monorepo** | pnpm workspaces |
| **Frontend** | React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + TanStack Query + React Hook Form + Zod + Zustand + shadcn/ui primitives |
| **Backend** | Node 20 + Express 5 + TypeScript + Prisma + PostgreSQL 16 |
| **Queue** | BullMQ + Redis 7 (Bull Board admin UI) |
| **Auth** | JWT access + refresh token (rotation) + bcrypt |
| **Logging** | Pino (structured) |
| **Validation** | Zod (shared antara client & server via `@arahtamu/shared`) |
| **Deploy** | Docker Compose + Dockerfile.allinone (1-container prod) |

## Built-in Modules

Semua modul ini **sudah jadi** dan siap dipakai:

- **Auth** — login, logout, refresh token rotation, change password
- **User Management** — CRUD user + assign role (paginated)
- **RBAC** — role & permission (17 permission keys pre-seeded)
- **Audit Log** — auto-log semua mutasi via middleware + viewer page
- **Settings** — key-value config (company profile, app settings)
- **Notifications** — in-app notification system
- **File Upload** — multer-based, local storage (S3-ready adapter pattern)
- **Job Queue** — BullMQ dengan 5 queue default (email, export, report, notification, cleanup)
- **Bull Board** — admin UI di `/admin/queues` (restricted)
- **Health Check** — `/api/health` (DB + Redis)

## Project Structure

```
arahkarya/
├── client/                    # React SPA (Vite)
│   ├── src/
│   │   ├── pages/             # Route pages
│   │   ├── layouts/           # App layout + sidebar
│   │   ├── components/        # Shared UI components
│   │   ├── stores/            # Zustand stores (auth)
│   │   ├── lib/               # api client, utils
│   │   └── styles/            # Tailwind entry
│   └── vite.config.ts
├── server/                    # Express API
│   ├── src/
│   │   ├── modules/           # Feature modules (auth, users, audit, ...)
│   │   ├── middleware/        # auth, rbac, audit, validate, error
│   │   ├── services/          # queue, bullBoard
│   │   ├── jobs/              # BullMQ workers
│   │   ├── lib/               # prisma, redis, logger, jwt, errors
│   │   ├── config/            # env parsing (Zod)
│   │   ├── routes/            # router aggregation
│   │   ├── utils/             # excel exporter, etc
│   │   ├── app.ts
│   │   ├── index.ts           # HTTP server entry
│   │   └── worker.ts          # BullMQ worker entry
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── packages/shared/           # Shared types + Zod schemas + utils
│   └── src/{schemas,types,utils,constants}
├── scripts/
│   ├── new-module.mjs         # Generator: pnpm new:module <name>
│   └── backup-db.sh
├── docker-compose.yml         # postgres + redis + app + worker
├── Dockerfile.allinone        # single-image production build
└── docs/                      # PRD, ARCHITECTURE, CONTRIBUTING
```

## Quick Start (Development)

**Prasyarat:** Node 20+, pnpm 10+, PostgreSQL 16, Redis 7.

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Buat DB & run migrations
pnpm --filter @arahtamu/server prisma:generate
pnpm --filter @arahtamu/server db:migrate:dev
pnpm --filter @arahtamu/server db:seed

# 4. Run dev (client + server)
pnpm dev
```

Akses:
- Frontend: http://localhost:5173
- API: http://localhost:3001/api
- Bull Board: http://localhost:3001/admin/queues (login dulu sebagai admin)

**Default admin**: `admin@arahkarya.local` / `admin123` (ubah di `SEED_ADMIN_PASSWORD`).

## Quick Start (Docker, production-like)

```bash
cp .env.docker.example .env
# EDIT .env — ganti JWT_ACCESS_SECRET & JWT_REFRESH_SECRET
# generate: openssl rand -base64 48

docker compose up -d --build
```

Akses di http://localhost:3001.

## Module Generator (Progressive Layering)

Bangun modul bisnis baru dalam detik, pilih tier sesuai kompleksitas:

```bash
# Simple — CRUD master data, settings, lookup (70% kasus)
pnpm new:module customer

# Layered — modul dengan business rules berat (accounting, production, inventory)
pnpm new:module production --layered
```

**Simple** generates: `routes.ts` + `service.ts` (Prisma langsung)
**Layered** generates: `routes.ts` + `service.ts` + `repository.ts` + `types.ts` (service → repository → Prisma)

Generator juga membuat:
- `packages/shared/src/schemas/<name>.ts` (Zod schemas)
- `client/src/pages/<Name>Page.tsx` (list view dengan shadcn/ui)
- Auto-patch `packages/shared/src/schemas/index.ts`

Mulai Simple, upgrade ke Layered nanti kalau modul makin kompleks. Output generator menuntun langkah manual selanjutnya.

## PWA Support

Client sudah **PWA-ready** — installable di HP/tablet, offline shell cache, auto-update prompt:

- `public/manifest.json` — app manifest (sesuaikan name, colors, icons per project)
- `public/sw.js` — service worker (cache shell, network-first navigasi, skip API calls)
- `public/icons/` — placeholder icons (ganti dengan icon app asli, lihat `icons/README.md`)

Installable langsung dari browser tanpa app store — cocok untuk tablet di lantai produksi.

## Background Jobs (BullMQ)

Kapan pakai queue?
- Export Excel/PDF besar → jangan blokir HTTP request
- Kirim email bulk → retry otomatis kalau gagal
- Scheduled cleanup → cron job (audit log purge, expired token)
- Notifikasi async → fan-out ke banyak user

Enqueue dari mana saja:

```ts
import { enqueue } from '@/services/queue';
await enqueue('email', 'invoice-overdue', { to, subject, html });
```

Worker jalan di proses terpisah (`pnpm dev:worker` atau Docker service `worker`).

## Scripts

```bash
pnpm dev                # Run client + server paralel
pnpm dev:client         # Client only
pnpm dev:server         # Server only
pnpm dev:worker         # BullMQ worker
pnpm build              # Build semua package
pnpm typecheck          # Typecheck monorepo
pnpm lint               # Lint
pnpm test               # Run tests

pnpm db:migrate         # Prisma migrate deploy
pnpm db:seed            # Seed admin + roles + permissions
pnpm db:reset           # Drop + migrate + seed (DEV only)

pnpm new:module <name>            # Generate modul simple
pnpm new:module <name> --layered  # Generate modul layered
```

## Permission Keys

Lihat `packages/shared/src/constants/index.ts` → `PERMISSIONS`. Default:

```
user:read, user:write, user:delete
role:read, role:write
audit:read
settings:read, settings:write
file:upload, file:delete
backup:create, backup:restore
report:read, report:export
job:read, job:manage
```

Tambah permission baru: edit constants → update seed → migrate.

## Out of Scope

ArahKarya **sengaja tidak menyediakan**:
- Multi-tenancy / subscription billing (desain untuk internal tool)
- i18n (UI Indonesian-first, gampang ditambah kalau perlu)
- GraphQL (REST + Prisma sudah typed)
- Microservices (monolith + worker cukup)

## License

MIT © Logia-ysn

---

**Terbangun dari pengalaman nyata 3 aplikasi produksi.**
