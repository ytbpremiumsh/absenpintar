#!/usr/bin/env bash
# ATSkolla — VPS Auto Update Script
# Pull latest code from GitHub, install deps, build, and restart service.
# Usage:  ./update.sh           (run once)
#         crontab -e  → */10 * * * * cd /var/www/atskolla && ./update.sh >> update.log 2>&1
#
# Safe to run repeatedly. Skips work if repo is already up-to-date.

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
APP_NAME="atskolla"
BRANCH="${BRANCH:-main}"
LOCK_FILE="/tmp/${APP_NAME}-update.lock"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "${LOG_PREFIX} $*"; }
die() { log "ERROR: $*"; exit 1; }

# ─── Lock (prevent concurrent runs) ──────────────────────────────────────────
if [ -e "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    log "Another update is running (PID $PID). Exiting."
    exit 0
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# ─── Move to script directory ────────────────────────────────────────────────
cd "$(dirname "$(readlink -f "$0")")"
log "Working dir: $(pwd)"

# ─── Verify git repo ─────────────────────────────────────────────────────────
[ -d .git ] || die "Not a git repository. Clone the repo first."

# ─── Check for updates ───────────────────────────────────────────────────────
log "Fetching from origin/${BRANCH}..."
git fetch origin "$BRANCH" --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/${BRANCH}")

if [ "$LOCAL" = "$REMOTE" ]; then
  log "Already up-to-date (${LOCAL:0:7}). Nothing to do."
  exit 0
fi

log "New commits detected: ${LOCAL:0:7} → ${REMOTE:0:7}"

# ─── Detect dependency changes BEFORE pull ───────────────────────────────────
DEPS_CHANGED=false
if git diff --name-only "$LOCAL" "$REMOTE" | grep -qE '^(package\.json|package-lock\.json|bun\.lockb|pnpm-lock\.yaml|yarn\.lock)$'; then
  DEPS_CHANGED=true
fi

# ─── Pull ────────────────────────────────────────────────────────────────────
log "Pulling latest code..."
git pull --ff-only origin "$BRANCH"

# ─── Detect package manager ──────────────────────────────────────────────────
PM=""
if command -v bun >/dev/null 2>&1 && [ -f bun.lockb ]; then
  PM="bun"
elif command -v pnpm >/dev/null 2>&1 && [ -f pnpm-lock.yaml ]; then
  PM="pnpm"
elif command -v npm >/dev/null 2>&1; then
  PM="npm"
else
  die "No package manager found (bun/pnpm/npm)."
fi
log "Package manager: $PM"

# ─── Install deps if changed (or node_modules missing) ───────────────────────
if [ "$DEPS_CHANGED" = true ] || [ ! -d node_modules ]; then
  log "Installing dependencies..."
  case "$PM" in
    bun)  bun install ;;
    pnpm) pnpm install --frozen-lockfile ;;
    npm)  npm ci ;;
  esac
else
  log "Dependencies unchanged. Skipping install."
fi

# ─── Build ───────────────────────────────────────────────────────────────────
log "Building production bundle..."
case "$PM" in
  bun)  bun run build ;;
  pnpm) pnpm build ;;
  npm)  npm run build ;;
esac
log "Build complete → dist/"

# ─── Restart / Reload service (auto-detect) ──────────────────────────────────
RESTARTED=false

# 1) PM2
if command -v pm2 >/dev/null 2>&1 && pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "Reloading PM2 process: $APP_NAME"
  pm2 reload "$APP_NAME" --update-env
  RESTARTED=true
fi

# 2) systemd
if [ "$RESTARTED" = false ] && systemctl list-unit-files 2>/dev/null | grep -q "^${APP_NAME}.service"; then
  log "Restarting systemd service: ${APP_NAME}.service"
  sudo systemctl restart "${APP_NAME}.service"
  RESTARTED=true
fi

# 3) Docker Compose
if [ "$RESTARTED" = false ] && [ -f docker-compose.yml ] && command -v docker >/dev/null 2>&1; then
  log "Rebuilding Docker container..."
  docker compose up -d --build
  RESTARTED=true
fi

# 4) Nginx reload (static files served directly from dist/)
if [ "$RESTARTED" = false ] && command -v nginx >/dev/null 2>&1; then
  log "Reloading Nginx (static dist/ served)..."
  sudo nginx -t && sudo systemctl reload nginx
  RESTARTED=true
fi

if [ "$RESTARTED" = false ]; then
  log "WARNING: No service restart method detected. Build is in dist/ — restart your server manually."
fi

log "Update complete: now at ${REMOTE:0:7}"
