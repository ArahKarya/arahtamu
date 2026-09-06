#!/usr/bin/env bash
# Backup FDM: dump Postgres (custom format) + arsip uploads, dengan rotasi.
# Dipanggil cron harian. Backup disimpan DI LUAR repo (default /home/yay/backups/fdm).
#
# Restore: lihat scripts/restore-db.sh
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH" # cron PATH minim — pastikan docker ketemu

BACKUP_DIR="${FDM_BACKUP_DIR:-/home/yay/backups/fdm}"
KEEP_DAYS="${FDM_BACKUP_KEEP:-14}"
PG_CONTAINER="${FDM_PG_CONTAINER:-buku-tamu-postgres-1}"
APP_CONTAINER="${FDM_APP_CONTAINER:-buku-tamu-app-1}"
DB_USER="${POSTGRES_USER:-fdm}"
DB_NAME="${POSTGRES_DB:-fdm}"
TS="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
log() { echo "$(date -Iseconds) $*" >>"$BACKUP_DIR/backup.log"; }

# --- 1. Dump DB (custom format = terkompresi, cocok untuk pg_restore) ---
DUMP_TMP="$BACKUP_DIR/db-$TS.dump.tmp"
if docker exec "$PG_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc >"$DUMP_TMP" 2>>"$BACKUP_DIR/backup.log"; then
  mv "$DUMP_TMP" "$BACKUP_DIR/db-$TS.dump"
  log "OK db-$TS.dump ($(du -h "$BACKUP_DIR/db-$TS.dump" | cut -f1))"
else
  rm -f "$DUMP_TMP"
  log "GAGAL pg_dump"
  exit 1
fi

# --- 2. Arsip uploads (foto/TTD tamu) — best-effort ---
if docker exec "$APP_CONTAINER" tar czf - -C /app uploads >"$BACKUP_DIR/uploads-$TS.tar.gz" 2>/dev/null; then
  log "OK uploads-$TS.tar.gz ($(du -h "$BACKUP_DIR/uploads-$TS.tar.gz" | cut -f1))"
else
  rm -f "$BACKUP_DIR/uploads-$TS.tar.gz"
  log "WARN uploads gagal/diabaikan"
fi

# --- 3. Rotasi: hapus lebih tua dari KEEP_DAYS ---
find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.dump' -mtime +"$KEEP_DAYS" -delete 2>/dev/null || true
find "$BACKUP_DIR" -maxdepth 1 -name 'uploads-*.tar.gz' -mtime +"$KEEP_DAYS" -delete 2>/dev/null || true

log "selesai (retensi ${KEEP_DAYS} hari)"
