#!/usr/bin/env bash
# Restore FDM DB dari file dump custom-format (hasil backup-db.sh).
# PAKAI HATI-HATI: --clean menghapus objek lama sebelum restore.
#
# Usage: scripts/restore-db.sh /home/yay/backups/fdm/db-YYYYMMDD-HHMMSS.dump
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

DUMP_FILE="${1:-}"
PG_CONTAINER="${FDM_PG_CONTAINER:-buku-tamu-postgres-1}"
DB_USER="${POSTGRES_USER:-fdm}"
DB_NAME="${POSTGRES_DB:-fdm}"

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "Usage: $0 <path-ke-file.dump>" >&2
  echo "Daftar backup tersedia:" >&2
  ls -1t "${FDM_BACKUP_DIR:-/home/yay/backups/fdm}"/db-*.dump 2>/dev/null | head >&2 || true
  exit 1
fi

echo "⚠️  Akan me-restore '$DUMP_FILE' ke DB '$DB_NAME' (objek lama dihapus). Ctrl-C dalam 5 detik untuk batal."
sleep 5

docker exec -i "$PG_CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner <"$DUMP_FILE"
echo "[restore] selesai dari $DUMP_FILE"
echo "Catatan: restart app agar bersih → docker compose restart app worker"
