#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/fotodesk}"
cd "$APP_DIR"

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

echo "==> Deployment completed successfully."
