App icons — FDM (Front Desk Management System).

Sumber tunggal, semuanya vektor netral (lonceng resepsionis di atas meja depan):

- `icon.svg` — app icon berlatar (favicon, PWA manifest, apple-touch fallback)
- `logo-light.svg` — mark gelap, untuk latar terang
- `logo-dark.svg` — mark putih, untuk latar gelap

Path-nya dirujuk lewat `BRANDING` di `packages/shared/src/constants/index.ts` — jangan hard-code di komponen.

Mengganti dengan identitas organisasi: timpa ketiga file di atas (pertahankan nama file), atau ubah nilai `BRANDING.LOGO_*`.

Catatan: iOS mengabaikan SVG untuk `apple-touch-icon`. Kalau butuh ikon home-screen tajam di iPhone/iPad, generate PNG 180x180 dan 512x512 dari `icon.svg`:
`magick -background none icon.svg -resize 180x180 apple-touch-icon.png`
