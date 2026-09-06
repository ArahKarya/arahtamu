# Branding Rules

## Identitas

FDM adalah produk netral — **tidak terikat vendor, agensi, atau PT mana pun**.
Jangan menambahkan nama perusahaan pembuat ke dalam UI, email, atau badge.

- **Nama Aplikasi**: FDM
- **Nama Panjang**: Front Desk Management System
- **Tagline**: Buku Tamu Digital
- **Copyright**: © Front Desk Management System

Identitas **organisasi pemakai** (nama & alamat kantor) bukan konstanta —
diisi lewat Settings (`company.name`, `company.address`) dan boleh berbeda per instalasi.

## Logo

Tiga berkas vektor di `client/public/icons/`:

- `icon.svg` — app icon berlatar (favicon + PWA manifest)
- `logo-light.svg` — mark gelap untuk latar terang
- `logo-dark.svg` — mark putih untuk latar gelap

Mark-nya generik (lonceng resepsionis di atas meja depan) supaya aman dipakai
organisasi mana pun tanpa terlihat meminjam identitas orang lain.

## Single Source of Truth

Semua branding WAJIB dari `BRANDING` constant, JANGAN hard-code:

```ts
import { BRANDING } from '@fdm/shared';

BRANDING.APP_NAME      // 'FDM'
BRANDING.LONG_NAME     // 'Front Desk Management System'
BRANDING.TAGLINE       // 'Buku Tamu Digital'
BRANDING.COPYRIGHT     // teks copyright
BRANDING.LOGO_LIGHT    // path logo untuk latar terang
BRANDING.LOGO_DARK     // path logo untuk latar gelap
```

## Tempat Tampil

1. Login page — logo + copyright
2. Sidebar header — logo + nama app
3. Sidebar footer — copyright (saat expanded)
4. Badge tamu — nama app kecil di kepala badge
5. PWA manifest + favicon — `icon.svg`

## Mengganti dengan Identitas Organisasi

1. Timpa ketiga berkas di `client/public/icons/` (pertahankan nama berkasnya), atau
   ubah nilai `BRANDING.LOGO_*` kalau nama berkasnya berbeda.
2. Edit `BRANDING` di `packages/shared/src/constants/index.ts` bila nama app ikut berganti.
3. Sesuaikan `name`, `short_name`, dan `theme_color` di `client/public/manifest.json`.
