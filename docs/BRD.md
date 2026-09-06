# Business Requirements Document (BRD) — FDM

> **Produk:** FDM — Visitor Management System (VMS) / Buku Tamu Digital Canggih
> **Tipe:** Aplikasi internal **single-instance** (1 organisasi, self-host) — seperti HRIS/ERP, **bukan** SaaS publik
> **Versi dokumen:** 1.1 (Draft)
> **Tanggal:** 2026-06-11
> **Penyusun:** Yayang Setya Nugroho
> **Status:** Draft untuk review
> **Basis teknis:** kerangka monorepo internal (monorepo pnpm — React 19 + Express 5 + Prisma + BullMQ)

---

## 1. Ringkasan Eksekutif

FDM adalah aplikasi **buku tamu digital (Visitor Management System)** berbasis web untuk
**satu organisasi** yang menggantikan buku tamu kertas di resepsionis kantor. Aplikasi dipasang
sebagai **instans tunggal** (di-deploy internal oleh organisasi, mis. di RPi5/VPS + Cloudflare
Tunnel) — sama seperti aplikasi HRIS/ERP keluarga FDM. **Tidak ada langganan, billing,
multi-tenant, atau pendaftaran mandiri** — seluruh pengguna (resepsionis, host, security, admin)
dibuat oleh admin internal.

Tamu melakukan **self check-in** lewat kiosk/HP dengan QR code, sistem **memotret tamu**, meminta
**tanda tangan digital** (persetujuan tata tertib/NDA), lalu **memberi notifikasi real-time ke
host** (karyawan yang dituju) via in-app/email/WhatsApp. Manajemen mendapat **dashboard analitik**
dan **laporan kunjungan** yang dapat diekspor. Organisasi dapat memiliki **beberapa lokasi/cabang**
dalam satu instans yang sama.

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
VMS digital adalah kebutuhan standar gedung perkantoran modern. Sebagai aplikasi internal
single-instance, FDM dapat dipasang murah di infrastruktur sendiri (RPi5/VPS + Cloudflare
Tunnel) tanpa ketergantungan layanan berlangganan pihak ketiga, dengan kedaulatan data penuh.

---

## 3. Tujuan Bisnis & Kriteria Sukses

### 3.1 Tujuan (Goals)
- **G1** — Mempercepat proses penerimaan tamu (target: dari ~5 menit jadi < 60 detik).
- **G2** — Mendigitalkan 100% catatan kunjungan, dapat diaudit kapan saja.
- **G3** — Memberi notifikasi host otomatis < 10 detik setelah tamu check-in.
- **G4** — Menyediakan laporan & analitik kunjungan mandiri untuk manajemen.
- **G5** — Mematuhi UU Perlindungan Data Pribadi (UU PDP No. 27/2022) untuk data tamu.
- **G6** — Mudah dipasang & dirawat sebagai aplikasi internal (deploy < 1 jam, low-maintenance).

### 3.2 Metrik Sukses (KPI)
| KPI | Baseline | Target |
|---|---|---|
| Waktu rata-rata check-in tamu | ~5 menit | < 60 detik |
| Waktu host menerima notifikasi | manual/menit | < 10 detik |
| Tingkat adopsi self-service kiosk | 0% | > 80% kunjungan |
| Catatan kunjungan terdigitalisasi | 0% | 100% |
| Kepuasan resepsionis/host (survei internal) | — | > 4/5 |
| Uptime aplikasi | — | > 99% |

### 3.3 Definisi Selesai (Definition of Done bisnis)
Tamu dapat check-in mandiri via QR, terfoto, tanda tangan, host ternotifikasi otomatis, data
tersimpan & teraudit, manajemen bisa lihat dashboard + ekspor laporan, dan admin internal dapat
mengelola pengguna/lokasi/host.

---

## 4. Ruang Lingkup (Scope)

### 4.1 In-Scope (MVP + fase berikut)
- Aplikasi **single-instance** untuk satu organisasi (boleh banyak lokasi/cabang).
- Manajemen pengguna internal & peran (RBAC): Admin, Resepsionis, Host, Security.
- Manajemen lokasi/cabang, departemen, dan host (karyawan yang dapat dituju tamu).
- Self check-in/out tamu (kiosk tablet + link HP) dengan QR.
- Pra-registrasi tamu oleh host (undangan + QR sebelum datang).
- Pengambilan foto tamu (webcam) + tanda tangan digital + persetujuan tata tertib/NDA.
- Notifikasi host real-time: in-app, email (Resend), WhatsApp (opsional via gateway).
- Cetak badge tamu (PDF/printer label).
- Dashboard analitik + laporan kunjungan (export Excel/PDF).
- Daftar blokir (blacklist) tamu & watchlist.
- Audit log seluruh aktivitas (sudah disediakan framework).
- Pengaturan organisasi (branding, jam operasional, retensi data) via modul Settings.
- Kepatuhan UU PDP: consent, retensi data, hak hapus.

### 4.2 Out-of-Scope
- **Multi-tenancy / SaaS** — aplikasi melayani satu organisasi per instans.
- **Langganan / billing / pembayaran** — tidak ada model berbayar/subscription.
- **Pendaftaran mandiri (self-serve onboarding)** — pengguna dibuat oleh admin internal.
- Integrasi access control hardware (turnstile/pintu otomatis) — fase lanjutan.
- Pengenalan wajah (face recognition) otomatis — fase lanjutan.
- Aplikasi mobile native (cukup PWA/responsive web).
- Integrasi HRIS pihak ketiga untuk sinkronisasi karyawan — fase lanjutan (API disiapkan).

### 4.3 Asumsi
- Organisasi menyediakan tablet/kiosk di resepsionis (Android/iPad) + koneksi internet.
- Host memiliki email; WhatsApp opsional bergantung ketersediaan gateway.
- Deployment di RPi5/VPS internal + Cloudflare Tunnel (`<app>.<domain-internal>` atau domain sendiri).

### 4.4 Batasan (Constraints)
- Stack wajib mengikuti kerangka monorepo internal (tidak scaffold dari nol).
- Anggaran infrastruktur rendah (self-host), hindari layanan berbayar.
- Mengikuti pola keamanan framework (Helmet, JWT rotation, RBAC, rate-limit).

---

## 5. Pemangku Kepentingan (Stakeholders)

| Peran | Kepentingan | Keterlibatan |
|---|---|---|
| Pemilik produk (Anda) | Kualitas, roadmap, maintainability | Sponsor & PO |
| Admin internal (IT/HR/GA) | Kelola pengguna, lokasi, host, laporan, setting | Pengguna utama |
| Resepsionis | Kelola tamu walk-in, cetak badge | Pengguna harian |
| Host (karyawan) | Diberi tahu saat tamu datang, undang tamu | Pengguna harian |
| Security | Pantau siapa di gedung, blacklist | Pengguna |
| Tamu/Visitor | Check-in cepat, privasi terjaga | Pengguna eksternal |
| Manajemen | Lihat laporan & analitik kunjungan | Pengguna |

---

## 6. Kebutuhan Bisnis Tingkat Tinggi (Business Requirements)

| ID | Kebutuhan Bisnis | Prioritas |
|---|---|---|
| BR-01 | Aplikasi berjalan sebagai instans tunggal untuk satu organisasi (boleh multi-lokasi) | Must |
| BR-02 | Tamu dapat check-in mandiri < 60 detik via QR/kiosk | Must |
| BR-03 | Host menerima notifikasi otomatis < 10 detik | Must |
| BR-04 | Setiap check-in menyimpan foto + tanda tangan + persetujuan | Must |
| BR-05 | Host dapat pra-registrasi tamu & mengirim QR undangan | Should |
| BR-06 | Manajemen dapat melihat dashboard & ekspor laporan | Must |
| BR-07 | Sistem mendukung daftar blokir & watchlist tamu | Should |
| BR-08 | Seluruh aktivitas teraudit (immutable audit log) | Must |
| BR-09 | Sistem mematuhi UU PDP (consent, retensi, hak hapus) | Must |
| BR-10 | Admin internal dapat mengelola pengguna & peran (RBAC) | Must |
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
- **Biaya rendah & kedaulatan data:** self-host tanpa langganan, data di infrastruktur sendiri.

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Privasi foto/TTD tamu | Tinggi | Enkripsi at-rest, retensi otomatis, consent eksplisit (UU PDP) |
| Akses tidak sah ke data tamu | Tinggi | RBAC ketat, audit log, JWT rotation + reuse detection |
| Gateway WhatsApp tidak tersedia/mahal | Sedang | Jadikan opsional; fallback email/in-app |
| Kiosk offline (internet putus) | Sedang | Mode offline-queue (PWA) + sinkronisasi saat online |
| Adopsi rendah oleh resepsionis | Sedang | UI sangat sederhana, pelatihan singkat, mode walk-in cepat |
| Beban RPi5 (OOM saat build) | Sedang | Multi-arch image, batasi worker, opsi VPS bila perlu |

---

## 10. Tahapan Rilis (High-Level Roadmap)

| Fase | Cakupan | Estimasi |
|---|---|---|
| **Fase 0 — Fondasi** | Scaffold AKF, RBAC peran VMS, pengaturan organisasi, lokasi | 1 minggu |
| **Fase 1 — MVP VMS** | Walk-in check-in/out, foto, TTD, notif host, badge, daftar tamu aktif | 2–3 minggu |
| **Fase 2 — Pra-reg & Notif** | Pra-registrasi + QR undangan, email/WA, watchlist | 1–2 minggu |
| **Fase 3 — Analitik & Compliance** | Dashboard, laporan ekspor, retensi UU PDP, audit lengkap, PWA offline | 1–2 minggu |

---

## 11. Kepatuhan & Regulasi

- **UU PDP No. 27/2022:** consent eksplisit sebelum ambil foto/TTD/data; tujuan pemrosesan jelas;
  retensi terbatas (mis. auto-hapus data tamu > N hari kecuali blacklist); hak akses & hapus.
- **Keamanan:** mengikuti standar framework (Helmet, rate-limit, JWT rotation, bcrypt, audit).
- **Lokasi data:** self-host (kedaulatan data di infrastruktur organisasi sendiri).

---

## 12. Lampiran — Glosarium

| Istilah | Arti |
|---|---|
| VMS | Visitor Management System |
| Single-instance | Satu pemasangan aplikasi untuk satu organisasi (bukan SaaS multi-tenant) |
| Host | Karyawan yang dituju/mengundang tamu |
| Walk-in | Tamu datang tanpa undangan sebelumnya |
| Pra-registrasi | Tamu didaftarkan host sebelum datang |
| Badge | Kartu/label identitas tamu sementara |
| Watchlist/Blacklist | Daftar tamu yang perlu diawasi/ditolak |
| UU PDP | UU Perlindungan Data Pribadi No. 27/2022 |

---

> Dokumen turunan: lihat **PRD.md** untuk spesifikasi produk, user stories, dan kebutuhan fungsional/non-fungsional detail.
