# Deploy ke Raspberry Pi 5 via Cloudflare Tunnel

Pola deploy on-prem / RPi5: **Docker Compose** + **Cloudflare Tunnel**, BUKAN nginx port-forward. Tidak buka port di router, tidak butuh static IP.

> Satu tunnel bisa melayani banyak hostname sekaligus. Ganti `<tunnel-name>` di bawah dengan nama tunnel Anda.

## Prasyarat

- RPi5 8GB (4GB ketat untuk worker BullMQ + Postgres + app)
- Docker + Docker Compose v2 terinstall (`apt install docker.io docker-compose-plugin`)
- Akun Cloudflare + domain yang sudah diarahkan ke Cloudflare
- `cloudflared` CLI di RPi5 (`apt install cloudflared` atau dari Cloudflare Zero Trust dashboard)

## Step 1 — Build Docker (tanpa OOM)

RPi5 mudah OOM saat `pnpm install` + tsc + Vite build sekaligus. Mitigasi:

1. **Aktifkan swap** sebelum build pertama:
   ```bash
   sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
   sudo mkswap /swapfile && sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

2. **`.npmrc` sudah pin** `registry.npmjs.org` + retry 5x (lihat root `.npmrc`). Jangan re-generate `pnpm-lock.yaml` di VPS Tencent — `mirrors.tencentyun.com` akan ENOTFOUND di RPi5. Kalau lock sudah ter-contaminate, regen di RPi5 atau di mesin dev:
   ```bash
   rm pnpm-lock.yaml && pnpm install
   ```

3. **Build di luar jam sibuk** (background `up -d --build`), pantau `docker stats`.

## Step 2 — Setup env + compose up

```bash
cp .env.docker.example .env
# WAJIB ganti:
#   JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (openssl rand -base64 48)
#   POSTGRES_PASSWORD, SEED_ADMIN_PASSWORD
#   CORS_ORIGIN=https://<app>.<your-domain>
#   APP_URL=https://<app>.<your-domain>

docker compose up -d --build
docker compose logs -f app
```

Tunggu sampai log: `[entrypoint] running seed (timeout: 120s)` selesai dan `Server listening on 3001`. App container bind ke `127.0.0.1:3001` di host (lihat `docker-compose.yml` `ports:`).

## Step 3 — Wire Cloudflare Tunnel

### 3a. Login + buat tunnel (sekali per RPi5)

```bash
cloudflared tunnel login              # browser-based auth
cloudflared tunnel create <tunnel-name>
# output: Created tunnel <tunnel-name> with id <UUID>
# credentials saved: ~/.cloudflared/<UUID>.json
```

### 3b. Konfigurasi `~/.cloudflared/config.yml`

```yaml
tunnel: <UUID-dari-step-3a>
credentials-file: /home/<user>/.cloudflared/<UUID>.json

ingress:
  # Tambah satu entry per app yang Anda host di RPi5 ini.
  # NEW APP — sesuaikan port:
  - hostname: <app>.<your-domain>
    service: http://localhost:3001

  - service: http_status:404
```

### 3c. Route DNS

```bash
cloudflared tunnel route dns <tunnel-name> <app>.<your-domain>
```

### 3d. Jalankan sebagai service

```bash
sudo cloudflared service install
sudo systemctl status cloudflared
```

Akses: `https://<app>.<your-domain>` → harus muat login page.

## Step 4 — Backup harian (cron)

```bash
# /etc/cron.d/fdm-backup
0 2 * * * <user> cd /home/<user>/<app> && ./scripts/backup-db.sh >> /var/log/fdm-backup.log 2>&1
```

Backup disimpan di `./backups/<app>-YYYY-MM-DD.sql.gz`. Snapshot ke external storage (rclone ke OneDrive / Google Drive) untuk DR.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ENOTFOUND mirrors.tencentyun.com` saat install | `pnpm-lock.yaml` ter-contaminate dari VPS Tencent. Hapus lock + `pnpm install` ulang di RPi5. |
| Build hang / OOM-kill | Aktifkan swap (Step 1.1), tutup browser/IDE, build malam. |
| Seed timeout 120s tidak cukup | Naikkan `SEED_TIMEOUT_MS=300000` di `.env`. |
| Login Google "popup blocked" | Set `ALLOW_GOOGLE_SIGNIN=true` + `GOOGLE_CLIENT_ID=...` (rilis Helmet COOP/CSP). |
| `502 Bad Gateway` di `<app>.<your-domain>` | App container tidak listen di port yang ada di `config.yml`. Cek `docker ps`, samakan `service:` di config. |
| Tunnel down | `sudo systemctl restart cloudflared`. Status: `cloudflared tunnel info <tunnel-name>`. |
| Postgres slow di cold start | RPi5 SD card / SSD IO. Pakai SSD via USB3 untuk volume `postgres_data`. |

## Catatan

- **Jangan buka port 3001 di router**. Cloudflare Tunnel = outbound-only, lebih aman.
- **Multi-app di satu RPi5**: tiap app pakai port host berbeda (3001, 3002, 3008, ...) — tunnel hostname-based routing.
- **Update**: `docker compose pull && docker compose up -d` (kalau image dari registry) atau `git pull && docker compose up -d --build` (build lokal).
- **Health check**: `curl https://<app>.<your-domain>/api/health` — harus return `{ status: 'ok', db: 'up', redis: 'up' }`.
