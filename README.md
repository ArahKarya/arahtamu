# FDM — Front Desk Management System

**Buku tamu digital untuk satu organisasi, di-self-host.** Tamu check-in mandiri di kiosk,
host langsung tahu, manajemen punya laporannya, dan data pribadi tamu punya masa retensi.

Bukan SaaS multi-tenant: satu instalasi melayani satu organisasi, berjalan di server sendiri
(VPS, Raspberry Pi 5, atau mesin kantor) tanpa langganan.

## Fitur

**Meja depan**
- Kiosk self check-in: form, foto webcam, tanda tangan di layar, persetujuan consent
- Badge tamu dengan QR, siap cetak
- Daftar tamu yang sedang berada di dalam gedung, real-time
- Check-out manual oleh resepsionis

**Undangan & host**
- Pra-registrasi tamu oleh host, lengkap dengan jadwal dan token QR
- Notifikasi in-app + email saat tamu tiba
- Host mengonfirmasi terima atau tolak kedatangan

**Keamanan & kepatuhan**
- Watchlist bertingkat: `WATCH` memberi tanda ke security, `BLOCK` menolak check-in
- Consent UU PDP dengan pencatatan versi kebijakan dan timestamp
- Job retensi harian menghapus data tamu kedaluwarsa
- Hak untuk dihapus (right to erasure) per tamu
- Audit log seluruh mutasi

**Manajemen**
- Master data: departemen, lokasi, host
- Dashboard ringkasan + laporan kunjungan dengan filter, ekspor CSV
- RBAC 5 peran bawaan: `SUPER_ADMIN`, `ADMIN`, `RECEPTIONIST`, `HOST`, `SECURITY`

## Tech Stack

| Layer | Pilihan |
|---|---|
| **Monorepo** | pnpm workspaces (`client`, `server`, `packages/shared`) |
| **Frontend** | React 19 + Vite 6 + TypeScript + Tailwind CSS 4 + TanStack Query + React Hook Form + Zod + Zustand + shadcn/ui |
| **Backend** | Node 20 + Express 5 + TypeScript + Prisma + PostgreSQL 16 |
| **Queue** | BullMQ + Redis 7 (Bull Board di `/admin/queues`) |
| **Auth** | JWT access + refresh token rotation (dengan reuse detection) + bcrypt |
| **Validasi** | Zod, dipakai bersama client & server lewat `@fdm/shared` |
| **Deploy** | Docker Compose, atau `Dockerfile.allinone` (satu container) |

## Menjalankan Secara Lokal

**Prasyarat:** Node 20+, pnpm 10+, PostgreSQL 16, Redis 7.

```bash
# 1. Dependencies
pnpm install

# 2. Environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env — minimal DATABASE_URL + kedua JWT secret
# generate secret: openssl rand -base64 48

# 3. Database
createuser fdm --pwprompt        # password: samakan dengan DATABASE_URL
createdb -O fdm fdm
pnpm --filter @fdm/server prisma:generate
pnpm --filter @fdm/server db:migrate:dev
pnpm --filter @fdm/server db:seed

# 4. Jalankan
pnpm dev              # client + server
pnpm dev:worker       # worker BullMQ (terminal terpisah, untuk email & job retensi)
```

Akses:
- Aplikasi: http://localhost:5173
- API: http://localhost:3001/api
- Bull Board: http://localhost:3001/admin/queues (login sebagai admin dulu)

**Admin awal:** `admin@fdm.local` / `admin123` — ganti lewat `SEED_ADMIN_EMAIL` dan
`SEED_ADMIN_PASSWORD` sebelum seed, atau ubah passwordnya setelah login pertama.

## Menjalankan dengan Docker

```bash
cp .env.docker.example .env
# WAJIB ganti JWT_ACCESS_SECRET & JWT_REFRESH_SECRET
docker compose up -d --build
```

Aplikasi tersedia di http://localhost:3001. Untuk deploy on-prem di balik Cloudflare Tunnel,
lihat [docs/DEPLOY-RPI5.md](docs/DEPLOY-RPI5.md).

## Perintah yang Sering Dipakai

```bash
pnpm dev                  # client + server mode watch
pnpm build                # build seluruh workspace
pnpm typecheck            # tsc --noEmit di semua workspace
pnpm test                 # seluruh test
pnpm new:module <nama>    # generate modul CRUD baru (routes + service + halaman + schema)
```

## Struktur

```
client/                 React SPA (Vite)
  src/pages/            Halaman per rute — Kiosk, Visit, Preregistration, Reports, ...
  src/components/       UI bersama + primitives shadcn/ui
server/                 Express API
  src/modules/          Modul fitur: visit, visitor, host, watchlist, consent, reports, ...
  src/middleware/       auth, rbac, audit, validate, error
  src/jobs/             Worker BullMQ (email, cleanup, retensi)
  prisma/               Schema + migrasi + seed
packages/shared/        Zod schema, tipe, konstanta — dipakai client DAN server
docs/                   BRD, PRD, arsitektur, panduan deploy
```

## Dokumentasi

- [docs/PRD.md](docs/PRD.md) — kebutuhan produk, persona, 27 kebutuhan fungsional
- [docs/BRD.md](docs/BRD.md) — konteks bisnis dan ruang lingkup
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — keputusan teknis
- [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md) — panduan setup rinci
- [docs/DEPLOY-RPI5.md](docs/DEPLOY-RPI5.md) — deploy on-prem via Cloudflare Tunnel
- [CLAUDE.md](CLAUDE.md) — konvensi codebase untuk kontributor (dan AI assistant)

## Lisensi

MIT — lihat [LICENSE](LICENSE).
