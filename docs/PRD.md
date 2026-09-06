# Product Requirements Document (PRD) — FDM

> **Produk:** FDM — Visitor Management System (Buku Tamu Digital)
> **Tipe:** Aplikasi internal **single-instance** (1 organisasi, self-host) — seperti HRIS/ERP, **bukan** SaaS publik
> **Versi dokumen:** 1.1 (Draft)
> **Tanggal:** 2026-06-11
> **Basis teknis:** kerangka monorepo internal (pnpm monorepo — Vite/React 19 + Tailwind 4 + shadcn/ui · Express 5 + Prisma + PostgreSQL + BullMQ · packages/shared Zod)
> **Dokumen induk:** [BRD.md](./BRD.md)

---

## 1. Visi Produk

> "Resepsionis tanpa antre — tamu check-in mandiri dalam 60 detik, host langsung tahu, manajemen
> punya datanya, dan privasi tamu terjaga."

FDM adalah aplikasi internal satu organisasi (di-deploy sendiri, seperti HRIS/ERP), yang
menjadikan resepsionis kantor sebagai pengalaman digital yang cepat, aman, dan patuh regulasi —
tanpa langganan, tanpa multi-tenant, tanpa pendaftaran publik.

---

## 2. Persona Pengguna

| Persona | Tujuan | Kebutuhan utama |
|---|---|---|
| **Rina — Resepsionis** | Layani tamu walk-in cepat | Form cepat, cetak badge, lihat tamu aktif |
| **Budi — Host/Karyawan** | Tahu tamunya datang; undang tamu | Notif real-time, pra-registrasi, riwayat tamu |
| **Sari — Admin (IT/HR/GA)** | Kelola pengguna, lokasi, host, setting, laporan | CRUD master data, dashboard, RBAC, branding |
| **Agus — Security** | Pantau gedung, blacklist | Daftar tamu aktif, watchlist, alert |
| **Tamu (eksternal)** | Masuk cepat, privasi aman | Kiosk/HP sederhana, consent jelas |

---

## 3. Cakupan Rilis (MVP vs Lanjutan)

**MVP (Fase 1):** Auth/RBAC, manajemen pengguna & lokasi & host, walk-in check-in/out, foto +
TTD + consent, notif host (in-app + email), daftar tamu aktif, badge PDF, audit log.

**Fase 2:** Pra-registrasi + QR undangan, notif WhatsApp, watchlist/blacklist.

**Fase 3:** Dashboard analitik, laporan ekspor (Excel/PDF), retensi data UU PDP, PWA kiosk offline.

> **Tidak ada Fase SaaS** (multi-tenant, billing, self-serve onboarding) — di luar lingkup produk.

---

## 4. Epik & User Stories

### EPIK A — Pengguna, Peran & Pengaturan Organisasi
- **A1** Sebagai Admin, saya mengelola pengguna internal (resepsionis/host/security) + peran (RBAC).
- **A2** Sebagai Admin, saya mengatur branding & identitas organisasi (logo, warna, nama) lewat Settings.
- **A3** Sebagai Admin, saya mengatur kebijakan (jam operasional, masa retensi data, foto wajib/opsional).
- **A4** Sebagai pengguna, saya login aman (JWT rotation) sesuai peran saya.

### EPIK B — Manajemen Master Data
- **B1** Sebagai Admin, saya CRUD lokasi/cabang (alamat, kapasitas, jam operasional).
- **B2** Sebagai Admin, saya CRUD host & departemen (nama, email, no. WA, foto).
- **B3** Sebagai Admin, saya atur jenis kunjungan & form field kustom.
- **B4** Sebagai Admin, saya atur dokumen persetujuan (NDA/tata tertib) yang harus ditandatangani.

### EPIK C — Check-in / Check-out (inti)
- **C1** Sebagai Tamu, saya check-in di kiosk: isi nama, instansi, HP, host, keperluan.
- **C2** Sebagai sistem, saya ambil foto tamu via webcam saat check-in.
- **C3** Sebagai Tamu, saya tanda tangan digital & menyetujui consent + dokumen.
- **C4** Sebagai sistem, saya cek blacklist/watchlist & beri alert ke security bila cocok.
- **C5** Sebagai Resepsionis, saya cetak badge tamu (nama, foto, host, QR, waktu).
- **C6** Sebagai Tamu/Resepsionis, saya check-out (scan QR badge) saat tamu pulang.
- **C7** Sebagai Resepsionis/Security, saya lihat daftar tamu yang sedang di dalam gedung (real-time).

### EPIK D — Pra-registrasi & Notifikasi
- **D1** Sebagai Host, saya pra-registrasi tamu (data + jadwal + lokasi).
- **D2** Sebagai sistem, saya kirim email/WA berisi QR + petunjuk ke tamu.
- **D3** Sebagai Tamu, saya scan QR undangan di kiosk → check-in instan.
- **D4** Sebagai sistem, saya notifikasi host real-time (in-app/email/WA) saat tamunya check-in.
- **D5** Sebagai Host, saya konfirmasi terima/tolak kedatangan tamu.

### EPIK E — Dashboard & Laporan
- **E1** Sebagai Admin, saya lihat dashboard (kunjungan hari ini, tamu aktif, tren, no-show).
- **E2** Sebagai Admin, saya filter & cari riwayat kunjungan (tanggal/lokasi/host/status).
- **E3** Sebagai Admin, saya ekspor laporan ke Excel/PDF.
- **E4** Sebagai Admin/Security, saya lihat audit log aktivitas.

### EPIK F — Privasi & Kepatuhan (UU PDP)
- **F1** Sebagai Tamu, saya melihat tujuan pemrosesan data & memberi consent eksplisit.
- **F2** Sebagai sistem, saya hapus otomatis data tamu setelah masa retensi (kecuali blacklist).
- **F3** Sebagai Admin/DPO, saya proses permintaan hapus data tamu (right to be forgotten).
- **F4** Sebagai sistem, saya simpan foto/TTD terenkripsi at-rest.

---

## 5. Kebutuhan Fungsional (Functional Requirements)

| ID | Deskripsi | Prioritas | Epik |
|---|---|---|---|
| FR-01 | Login JWT + refresh rotation + RBAC per peran | Must | A |
| FR-02 | Manajemen pengguna internal & peran (dibuat oleh Admin, bukan self-register) | Must | A |
| FR-03 | Pengaturan organisasi (branding, jam operasional, retensi, foto wajib/opsional) via Settings | Should | A |
| FR-04 | CRUD lokasi, host, departemen, jenis kunjungan, dokumen consent | Must | B |
| FR-05 | Form field kustom (schema-driven) | Could | B |
| FR-06 | Self check-in kiosk: form + validasi (Zod shared) | Must | C |
| FR-07 | Capture foto via `getUserMedia` (webcam) → simpan ke Uploads | Must | C |
| FR-08 | Tanda tangan digital (canvas) → simpan sebagai gambar | Must | C |
| FR-09 | Persetujuan consent + dokumen (versi & timestamp tercatat) | Must | C/F |
| FR-10 | Cek blacklist/watchlist saat check-in → alert security | Should | C |
| FR-11 | Generate QR badge unik per kunjungan | Must | C |
| FR-12 | Cetak badge PDF (nama, foto, host, lokasi, QR, waktu) | Should | C |
| FR-13 | Check-out via scan QR / manual oleh resepsionis | Must | C |
| FR-14 | Daftar tamu aktif (di dalam gedung) real-time | Must | C |
| FR-15 | Pra-registrasi tamu oleh host + jadwal | Should | D |
| FR-16 | Kirim undangan QR via email (Resend) / WA (opsional) | Should | D |
| FR-17 | Check-in instan via scan QR undangan | Should | D |
| FR-18 | Notifikasi host real-time: in-app (WebSocket/SSE) + email + WA | Must | D |
| FR-19 | Host konfirmasi terima/tolak kedatangan | Should | D |
| FR-20 | Dashboard metrik (kunjungan, tamu aktif, durasi, no-show, tren) | Must | E |
| FR-21 | Filter & pencarian riwayat kunjungan (paginated) | Must | E |
| FR-22 | Ekspor laporan Excel (xlsx) & PDF | Should | E |
| FR-23 | Audit log seluruh aksi (pakai modul framework) | Must | E/F |
| FR-24 | Consent UU PDP eksplisit + pencatatan versi kebijakan | Must | F |
| FR-25 | Job retensi: auto-hapus data tamu kedaluwarsa (BullMQ cron) | Must | F |
| FR-26 | Hapus data tamu atas permintaan (right to erasure) | Should | F |
| FR-27 | Enkripsi foto/TTD at-rest | Should | F |

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kategori | Kebutuhan |
|---|---|
| **Performa** | Check-in submit < 2 dtk; notif host terkirim < 10 dtk; dashboard load < 3 dtk |
| **Skalabilitas** | Satu organisasi, multi-lokasi; kiosk concurrent per lokasi; worker queue terpisah |
| **Ketersediaan** | Target uptime 99% (self-host); health check `/api/health`; auto-restart |
| **Keamanan** | Helmet, HTTPS (Cloudflare Tunnel), JWT rotation + reuse detection, bcrypt(12), rate-limit per endpoint, RBAC, input validation Zod, no secret hardcode |
| **Privasi** | UU PDP: consent, retensi, enkripsi at-rest |
| **Usability** | Kiosk mode 1-tangan, font besar, bahasa Indonesia, alur < 5 langkah, mode kontras tinggi |
| **Aksesibilitas** | WCAG AA dasar, navigasi keyboard, label ARIA |
| **Observability** | Sentry (env-gated), audit log, structured logging (pino) |
| **Offline** | PWA: antre check-in saat internet putus, sinkron saat online (Fase 3) |
| **i18n** | Default Bahasa Indonesia; arsitektur siap multi-bahasa |
| **Kompatibilitas** | Chrome/Safari terbaru di tablet; responsive HP & desktop |

---

## 7. Arsitektur & Pemetaan ke kerangka monorepo internal

### 7.1 Reuse modul bawaan framework
| Kebutuhan FDM | Modul framework yang dipakai |
|---|---|
| Login, JWT rotation, RBAC | Auth + RBAC bawaan |
| Manajemen pengguna internal | Users bawaan |
| Audit aktivitas | Audit log bawaan |
| Notifikasi in-app | Notifications bawaan |
| Upload foto/TTD/badge | Uploads (MIME whitelist + size limit + sanitize) |
| Job async (notif, retensi, ekspor) | BullMQ workers |
| Email undangan/verifikasi | services/email (Resend) + email-templates |
| Pengaturan organisasi & branding | Settings bawaan |
| Error tracking | Sentry env-gated |

### 7.2 Modul baru (generate via `pnpm new:module`)
- `locations` — lokasi/cabang.
- `hosts` — host & departemen.
- `visitors` — master data tamu (dedup by HP/email).
- `visits` (layered) — transaksi check-in/out (inti, ada state machine).
- `preregistrations` (layered) — undangan + QR.
- `watchlist` — blacklist/watchlist.
- `reports` — dashboard & ekspor.
- `consent` — dokumen & log persetujuan.

> **Tanpa modul `tenants`** — aplikasi single-instance, tidak ada `tenantId` / isolasi tenant.

### 7.3 Realtime notifikasi host
- Opsi: Server-Sent Events (SSE) atau WebSocket untuk in-app; BullMQ untuk email/WA async.
- Channel: `host:{hostId}`.

### 7.4 Model Data (ringkas, Prisma)
```
User(id, name, email, passwordHash, role, hostProfileId?)   // role: SUPER_ADMIN|ADMIN|RECEPTIONIST|HOST|SECURITY
Setting(key, value(json))                                    // branding, jam operasional, retentionDays, photoRequired
Location(id, name, address, capacity, openHours)
Department(id, name)
Host(id, userId?, name, email, phone, departmentId, photoUrl)
Visitor(id, fullName, company, phone, email, idNumber?, photoUrl?)            // master, dedup by phone/email
Visit(id, visitorId, hostId, locationId, purpose, status,                    // status: PREREGISTERED|CHECKED_IN|CHECKED_OUT|DENIED|NO_SHOW
       checkInAt?, checkOutAt?, photoUrl, signatureUrl, badgeCode(QR), formData(json), createdBy)
Preregistration(id, hostId, visitorData(json), scheduledAt, locationId, qrToken, status)
ConsentDocument(id, type, version, contentMd, active)                        // type: NDA|TATA_TERTIB|PDP
ConsentLog(id, visitId, documentId, documentVersion, signedAt, ip)
WatchlistEntry(id, fullName, phone?, idNumber?, reason, level)               // level: WATCH|BLOCK
Notification(...)  AuditLog(...)  RefreshToken(...)   // dari framework
```

---

## 8. Alur Layar Utama (UX Flows)

### 8.1 Kiosk (per lokasi, dalam jaringan organisasi)
`Layar awal (logo org) → [Walk-in] / [Scan QR Undangan] → Form data → Foto → Tanda tangan + Consent → Sukses + cetak badge`

### 8.2 Dashboard Resepsionis
`Tamu aktif (kartu) | Tombol check-in cepat | Tombol check-out (scan) | Notif security`

### 8.3 Portal Host
`Tamu hari ini | Pra-registrasi baru | Riwayat tamu | Notif kedatangan (terima/tolak)`

### 8.4 Admin
`Dashboard analitik | Lokasi | Host/Departemen | Jenis kunjungan & consent | Watchlist | Laporan | Pengguna & RBAC | Pengaturan/Branding`

---

## 9. Spesifikasi API (ringkas, REST — envelope standar framework)

> Format respons: `{ success, data, error, meta }`. Endpoint internal butuh JWT + RBAC.
> Endpoint kiosk publik-terbatas memakai **token lokasi** (bukan tanpa proteksi).

| Method & Path | Fungsi | Peran |
|---|---|---|
| `POST /api/auth/login` | Login pengguna internal | publik |
| `GET /api/users` / `POST` `PATCH` `DELETE` | Kelola pengguna & peran | Admin |
| `GET /api/locations` / `POST` `PATCH` `DELETE` | Kelola lokasi | Admin |
| `GET /api/hosts` / `POST` `PATCH` `DELETE` | Kelola host | Admin |
| `POST /api/kiosk/:locationToken/checkin` | Check-in walk-in | token lokasi |
| `POST /api/kiosk/scan` | Check-in via QR undangan | qrToken |
| `POST /api/visits/:id/checkout` | Check-out | Resepsionis |
| `GET /api/visits/active` | Tamu aktif di gedung | Resepsionis/Security |
| `GET /api/visits` (filter, paginated) | Riwayat kunjungan | Admin/Host |
| `POST /api/preregistrations` | Pra-registrasi + kirim QR | Host |
| `GET /api/watchlist` / `POST` | Kelola watchlist | Admin/Security |
| `GET /api/reports/summary` | Metrik dashboard | Admin |
| `GET /api/reports/export?format=xlsx\|pdf` | Ekspor laporan | Admin |
| `GET /api/notifications/stream` (SSE) | Notif real-time | Host/Security |
| `GET /api/settings` / `PATCH` | Pengaturan organisasi & branding | Admin |
| `GET /api/audit` | Audit log | Admin |
| `POST /api/visitors/:id/erase` | Hapus data (UU PDP) | Admin/DPO |
| `GET /api/health` | Health check | publik |

---

## 10. Kriteria Penerimaan (Acceptance Criteria — contoh kunci)

**FR-06/07/08 — Check-in walk-in**
- [ ] Diberikan kiosk lokasi valid, tamu mengisi field wajib → submit sukses < 2 dtk.
- [ ] Foto terambil dari webcam & tersimpan; jika webcam ditolak → bisa lanjut tanpa foto bila setting `photoRequired=false`.
- [ ] Tanda tangan kosong → tombol simpan disable; consent belum dicentang → tidak bisa submit.
- [ ] Setelah sukses, badge dengan QR ter-generate & dapat dicetak PDF.

**FR-18 — Notif host real-time**
- [ ] Saat tamu check-in, host terkait menerima notif in-app < 10 dtk + email terkirim (job BullMQ).
- [ ] Jika host punya no. WA & gateway aktif → WA terkirim; jika tidak → fallback email tanpa error.

**FR-02 — Manajemen pengguna**
- [ ] Hanya Admin/Super Admin yang bisa membuat/menonaktifkan pengguna & mengubah peran.
- [ ] Tidak ada jalur pendaftaran mandiri (self-register) yang terekspos.

**FR-25 — Retensi UU PDP**
- [ ] Job harian menghapus `Visit` + foto/TTD lebih tua dari `retentionDays`, kecuali terkait watchlist `BLOCK`.
- [ ] Penghapusan tercatat di audit log.

---

## 11. Dependensi & Integrasi

| Dependensi | Keperluan | Status |
|---|---|---|
| kerangka monorepo internal | Base skeleton | Wajib, tersedia |
| PostgreSQL | Database | Wajib |
| Redis + BullMQ | Job queue (notif, retensi, ekspor) | Wajib |
| Resend | Email undangan/verifikasi | Opsional (fallback log) |
| WhatsApp Gateway | Notif WA | Opsional (Fase 2) |
| Cloudflare Tunnel | Akses internal/remote `*.<domain-internal>` | Wajib deploy |
| Library QR & PDF | Generate QR & badge/laporan | Wajib |
| Sentry | Error tracking | Opsional (env-gated) |

---

## 12. Metrik Produk (Analytics)

- Jumlah check-in / hari per lokasi.
- Rata-rata durasi proses check-in.
- Rasio walk-in vs pra-registrasi.
- No-show rate (pra-reg tidak datang).
- Waktu host konfirmasi.
- Tamu aktif puncak (peak occupancy) per lokasi.

---

## 13. Pertanyaan Terbuka (Open Questions)

1. Foto tamu: **wajib** atau opsional? (default: konfigurable via Settings, MVP = opsional).
2. WhatsApp gateway mana yang dipakai (resmi WA Business API vs unofficial)? Biaya?
3. Cetak badge: butuh printer label khusus, atau cukup PDF/tampilan QR di HP host?
4. Retensi default berapa hari (mis. 90 hari)?
5. Apakah perlu integrasi access control (pintu) di roadmap dekat?

---

## 14. Rencana Pengujian (selaras aturan: target coverage 80%+, TDD)

- **Unit:** validasi Zod, util QR/badge, logika retensi, state machine `visits`.
- **Integration:** endpoint check-in/out, pra-reg, notif job, ekspor — uji RBAC tiap endpoint.
- **E2E:** alur kiosk walk-in lengkap (foto+TTD+consent→badge), pra-reg→scan→notif host, dashboard ekspor.
- **Security:** uji RBAC negatif (peran tanpa izin ditolak), rate-limit, consent enforcement.

---

> **Langkah berikutnya (setelah BRD/PRD disetujui):** lanjut dari scaffold FDM (sudah ada di
> `/home/yay/apps/buku-tamu`) — generate modul Fase 0–1 dengan `pnpm new:module` (locations, hosts,
> visitors, visits, ...) memakai pendekatan TDD.
