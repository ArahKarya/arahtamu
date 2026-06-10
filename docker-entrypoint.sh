#!/bin/sh
set -e

SEED_TIMEOUT_S=$((${SEED_TIMEOUT_MS:-120000} / 1000))

echo "[entrypoint] running prisma migrate deploy"
cd /app/server
npx prisma migrate deploy || echo "[entrypoint] migrate failed, continuing"

echo "[entrypoint] checking if DB needs seed"
if [ "$AUTO_SEED" = "true" ]; then
  echo "[entrypoint] running seed (timeout: ${SEED_TIMEOUT_S}s)"
  timeout "${SEED_TIMEOUT_S}" \
    node --experimental-specifier-resolution=node ../node_modules/.pnpm/tsx*/node_modules/tsx/dist/cli.mjs prisma/seed.ts 2>/dev/null || \
    timeout "${SEED_TIMEOUT_S}" npx tsx prisma/seed.ts || \
    echo "[entrypoint] seed timeout/skipped"
fi

cd /app
exec "$@"
