# Business Requirements Document (BRD) — ArahTamu

> **Produk:** ArahTamu — Visitor Management System (VMS) / Buku Tamu Digital Canggih
> **Versi dokumen:** 1.0 (Draft)
> **Tanggal:** 2026-06-11
> **Penyusun:** Yayang Setya Nugroho
> **Status:** Draft untuk review
> **Basis teknis:** ArahKarya-Frameworks (monorepo pnpm — React 19 + Express 5 + Prisma + BullMQ)

---

## 1. Ringkasan Eksekutif

ArahTamu adalah aplikasi **buku tamu digital (Visitor Management System)** berbasis web
multi-tenant SaaS yang menggantikan buku tamu kertas di resepsionis kantor. Tamu melakukan
**self check-in** lewat kiosk/HP dengan QR code, sistem **memotret tamu**, meminta **tanda
tangan digital** (persetujuan NDA/tata tertib), lalu **memberi notifikasi real-time ke host**
(karyawan yang dituju) via in-app/email/WhatsApp. Manajemen mendapat **dashboard analitik**
dan **laporan kunjungan** yang dapat diekspor.

Karena dibangun multi-tenant, satu instans ArahTamu melayani banyak organisasi (tenant) dengan
data terisolasi, masing-masing punya cabang/lokasi, daftar karyawan (host), dan branding sendiri.

---

## 2. Latar Belakang & Masalah Bisnis

### 2.1 Kondisi saat ini (As-Is)
- Buku tamu kertas: tidak terbaca, mudah hilang, tidak bisa dianalisis, rawan data tamu bocor.
- Resepsionis menelepon/chat manual untuk memberi tahu karyawan bahwa tamunya datang → lambat.
- Tidak ada rekam jejak siapa di dalam gedung saat keadaan darurat (evakuasi/audit keamanan).
- Tidak ada kontrol kapasitas, daftar blokir (blacklist), atau verifikasi identitas.
- Sulit membuat laporan kunjungan bulanan untuk manajemen/keamanan.

### 2.2 Dampak masalah
| Masalah | Dampak Bisnis |
|---|---|
| Notifikasi host manual | Tamu menunggu lama, citra perusahaan turun, resepsionis sibuk |
| Tidak ada rekam digital | Risiko keamanan & kepatuhan; tidak bisa audit "siapa di gedung" |
| Data tamu di kertas | Pelanggaran privasi (UU PDP), data mudah disalahgunakan |
| Tidak ada analitik | Manajemen tidak tahu pola kunjungan, beban resepsionis, no-show |

### 2.3 Peluang
VMS digital adalah kebutuhan standar gedung perkantoran modern. Sebagai SaaS multi-tenant,
satu deployment bisa dijual berlangganan ke banyak perusahaan (UMKM s/d korporat), dengan biaya
infrastruktur rendah (self-host RPi5 / VPS + Cloudflare Tunnel).

---

## 3. Tujuan Bisnis & Kriteria Sukses

### 3.1 Tujuan (Goals)
- **G1** — Mempercepat proses penerimaan tamu (target: dari ~5 menit jadi < 60 detik).
- **G2** — Mendigitalkan 100% catatan kunjungan, dapat diaudit kapan saja.
- **G3** — Memberi notifikasi host otomatis < 10 detik setelah tamu check-in.
- **G4** — Menyediakan laporan & analitik kunjungan mandiri untuk manajemen.
- **G5** — Mematuhi UU Perlindungan Data Pribadi (UU PDP No. 27/2022) untuk data tamu.
- **G6** — Sebagai produk SaaS: onboarding mandiri tenant baru < 30 menit.

### 3.2 Metrik Sukses (KPI)
| KPI | Baseline | Target |
|---|---|---|
| Waktu rata-rata check-in tamu | ~5 menit | < 60 detik |
| Waktu host menerima notifikasi | manual/menit | < 10 detik |
| Tingkat adopsi self-service kiosk | 0% | > 80% kunjungan |
| Catatan kunjungan terdigitalisasi | 0% | 100% |
| NPS tenant (kepuasan) | — | > 40 |
| Churn bulanan tenant | — | < 5% |

### 3.3 Definisi Selesai (Definition of Done bisnis)
Tamu dapat check-in mandiri via QR, terfoto, tanda tangan, host ternotifikasi otomatis, data
tersimpan & teraudit per tenant, manajemen bisa lihat dashboard + ekspor laporan, dan tenant baru
bisa daftar mandiri.

---

## 4. Ruang Lingkup (Scope)

### 4.1 In-Scope (MVP + fase berikut)
- Manajemen tenant (multi-tenant), lokasi/cabang, dan branding per tenant.
- Manajemen host (karyawan yang bisa dituju tamu) + departemen.
- Self check-in/out tamu (kiosk tablet + link HP) dengan QR.
- Pra-registrasi tamu oleh host (undangan + QR sebelum datang).
- Pengambilan foto tamu (webcam) + tanda tangan digital + persetujuan tata tertib/NDA.
- Notifikasi host real-time: in-app, email (Resend), WhatsApp (opsional via gateway).
- Cetak badge tamu (PDF/printer label).
- Dashboard analitik + laporan kunjungan (export Excel/PDF).
- Daftar blokir (blacklist) tamu & watchlist.
- Audit log seluruh aktivitas (sudah disediakan framework).
- RBAC: Super Admin (platform), Admin Tenant, Resepsionis, Host, Security.
- Kepatuhan UU PDP: consent, retensi data, hak hapus.

### 4.2 Out-of-Scope (versi awal)
- Integrasi access control hardware (turnstile/pintu otomatis) — fase lanjutan.
- Pengenalan wajah (face recognition) otomatis — fase lanjutan.
- Aplikasi mobile native (cukup PWA/responsive web dulu).
- Integrasi HRIS pihak ketiga untuk sinkronisasi karyawan — fase lanjutan (API disiapkan).
- Modul billing/pembayaran langganan otomatis (fase 2 — manual invoice dulu).

### 4.3 Asumsi
- Setiap tenant menyediakan tablet/kiosk di resepsionis (Android/iPad) + koneksi internet.
- Host memiliki email; WhatsApp opsional bergantung ketersediaan gateway.
- Deployment awal di RPi5/VPS + Cloudflare Tunnel (`*.arahkarya.com`).

### 4.4 Batasan (Constraints)
- Stack wajib mengikuti ArahKarya-Frameworks (tidak scaffold dari nol).
- Anggaran infrastruktur rendah (self-host), hindari layanan berbayar mahal.
- Mengikuti pola keamanan framework (Helmet, JWT rotation, RBAC, rate-limit).

---

## 5. Pemangku Kepentingan (Stakeholders)

| Peran | Kepentingan | Keterlibatan |
|---|---|---|
| Pemilik produk (Anda) | ROI, roadmap, kualitas | Sponsor & PO |
| Admin Tenant (perusahaan klien) | Setup org, lihat laporan | Pengguna utama |
| Resepsionis | Kelola tamu walk-in, cetak badge | Pengguna harian |
| Host (karyawan) | Diberi tahu saat tamu datang, undang tamu | Pengguna harian |
| Security | Pantau siapa di gedung, blacklist | Pengguna |
| Tamu/Visitor | Check-in cepat, privasi terjaga | Pengguna eksternal |
| Super Admin platform | Kelola tenant, kesehatan sistem | Operator SaaS |
| DPO/Legal | Kepatuhan UU PDP | Reviewer |

---

## 6. Kebutuhan Bisnis Tingkat Tinggi (Business Requirements)

| ID | Kebutuhan Bisnis | Prioritas |
|---|---|---|
| BR-01 | Sistem harus mengisolasi data antar tenant secara penuh | Must |
| BR-02 | Tamu dapat check-in mandiri < 60 detik via QR/kiosk | Must |
| BR-03 | Host menerima notifikasi otomatis < 10 detik | Must |
| BR-04 | Setiap check-in menyimpan foto + tanda tangan + persetujuan | Must |
| BR-05 | Host dapat pra-registrasi tamu & mengirim QR undangan | Should |
| BR-06 | Manajemen dapat melihat dashboard & ekspor laporan | Must |
| BR-07 | Sistem mendukung daftar blokir & watchlist tamu | Should |
| BR-08 | Seluruh aktivitas teraudit (immutable audit log) | Must |
| BR-09 | Sistem mematuhi UU PDP (consent, retensi, hak hapus) | Must |
| BR-10 | Tenant baru dapat onboarding mandiri | Should |
| BR-11 | Badge tamu dapat dicetak (PDF/label) | Should |
| BR-12 | Resepsionis dapat melihat daftar tamu aktif (di dalam gedung) | Must |

---

## 7. Proses Bisnis (To-Be)

### 7.1 Alur Walk-in (tamu datang tanpa undangan)
1. Tamu tiba di resepsionis → buka kiosk/scan QR lokasi.
2. Isi data singkat (nama, instansi, no. HP, host yang dituju, keperluan).
3. Sistem ambil foto + minta tanda tangan + setujui tata tertib.
4. Sistem cek blacklist/watchlist → jika cocok, beri tahu security.
5. Host ternotifikasi (in-app/email/WA) → konfirmasi terima/tolak.
6. Badge tamu dicetak; tamu masuk.
7. Saat pulang → check-out (scan QR badge / oleh resepsionis).

### 7.2 Alur Pra-registrasi (host mengundang tamu)
1. Host buat undangan: data tamu + tanggal/jam + lokasi.
2. Sistem kirim email/WA berisi QR + petunjuk ke tamu.
3. Tamu datang → scan QR di kiosk → check-in instan (data sudah ada).
4. Lanjut seperti 7.1 langkah 3–7.

### 7.3 Alur Laporan
1. Admin/Manajemen buka dashboard → filter (tanggal, lokasi, host, status).
2. Lihat metrik (jumlah kunjungan, durasi, no-show, tamu aktif).
3. Ekspor Excel/PDF untuk audit/keamanan.

---

## 8. Manfaat Bisnis (Business Value)

- **Efisiensi:** resepsionis tidak lagi telepon manual; tamu check-in mandiri.
- **Keamanan:** rekam jejak digital siapa di gedung, blacklist, audit.
- **Kepatuhan:** memenuhi UU PDP, mengurangi risiko hukum data tamu.
- **Citra profesional:** pengalaman tamu modern & cepat.
- **Pendapatan:** model SaaS berlangganan multi-tenant, biaya infra rendah.

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kebocoran data tamu antar tenant | Tinggi | Tenant isolation ketat (tenantId + Prisma middleware), uji penetrasi |
| Privasi foto/TTD tamu | Tinggi | Enkripsi at-rest, retensi otomatis, consent eksplisit (UU PDP) |
| Gateway WhatsApp tidak tersedia/mahal | Sedang | Jadikan opsional; fallback email/in-app |
| Kiosk offline (internet putus) | Sedang | Mode offline-queue (PWA) + sinkronisasi saat online |
| Adopsi rendah oleh resepsionis | Sedang | UI sangat sederhana, pelatihan singkat, mode walk-in cepat |
| Beban RPi5 (OOM saat build/scale) | Sedang | Multi-arch image, batasi worker, opsi VPS untuk tenant besar |

---

## 10. Tahapan Rilis (High-Level Roadmap)

| Fase | Cakupan | Estimasi |
|---|---|---|
| **Fase 0 — Fondasi** | Clone AKF, multi-tenant, RBAC, branding | 1 minggu |
| **Fase 1 — MVP VMS** | Walk-in check-in/out, foto, TTD, notif host, badge, daftar tamu aktif | 2–3 minggu |
| **Fase 2 — Pra-reg & Notif** | Pra-registrasi + QR undangan, email/WA, watchlist | 1–2 minggu |
| **Fase 3 — Analitik & Compliance** | Dashboard, laporan ekspor, retensi UU PDP, audit lengkap | 1–2 minggu |
| **Fase 4 — SaaS & Polish** | Self-serve onboarding tenant, billing manual, PWA offline | 2 minggu |

---

## 11. Kepatuhan & Regulasi

- **UU PDP No. 27/2022:** consent eksplisit sebelum ambil foto/TTD/data; tujuan pemrosesan jelas;
  retensi terbatas (mis. auto-hapus data tamu > N hari kecuali blacklist); hak akses & hapus.
- **Keamanan:** mengikuti standar framework (Helmet, rate-limit, JWT rotation, bcrypt, audit).
- **Lokasi data:** self-host (kedaulatan data di infrastruktur sendiri).

---

## 12. Lampiran — Glosarium

| Istilah | Arti |
|---|---|
| VMS | Visitor Management System |
| Tenant | Organisasi/perusahaan pelanggan SaaS |
| Host | Karyawan tenant yang dituju/mengundang tamu |
| Walk-in | Tamu datang tanpa undangan sebelumnya |
| Pra-registrasi | Tamu didaftarkan host sebelum datang |
| Badge | Kartu/label identitas tamu sementara |
| Watchlist/Blacklist | Daftar tamu yang perlu diawasi/ditolak |
| UU PDP | UU Perlindungan Data Pribadi No. 27/2022 |

---

> Dokumen turunan: lihat **PRD.md** untuk spesifikasi produk, user stories, dan kebutuhan fungsional/non-fungsional detail.
