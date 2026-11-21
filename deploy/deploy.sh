#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/fotodesk}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/fotodesk}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
cd "$APP_DIR"

PREV_REV="$(git rev-parse HEAD)"
echo "==> 0. Recording rollback revision ($PREV_REV) & pre-deploy DB snapshot"
mkdir -p "$BACKUP_ROOT"
printf '%s\n' "$PREV_REV" > "$BACKUP_ROOT/last_revision"
if command -v pg_dump >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" -Fc -f "$BACKUP_ROOT/predeploy-$TIMESTAMP.dump"
fi

echo "==> 1. Pulling latest main"
git pull origin main

echo "==> 2. Installing backend dependencies & running migrations"
cd "$APP_DIR/backend"
npm ci --omit=dev
npm run migrate

echo "==> 3. Installing frontend dependencies & building production bundle"
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "==> 4. Reloading PM2 backend process"
cd "$APP_DIR/backend"
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "==> 5. Verifying backend healthcheck"
for i in $(seq 1 15); do
  if curl -fsS http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
    echo "==> Deployment completed successfully (rev $(git rev-parse --short HEAD))."
    exit 0
  fi
  sleep 2
done

echo "!! Healthcheck failed. Rollback with: git checkout $PREV_REV && pm2 reload ecosystem.config.js"
exit 1

