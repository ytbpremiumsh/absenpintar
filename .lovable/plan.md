
# Plan: Script `update.sh` untuk Self-Host VPS

Script ini akan ditambahkan ke root project (akan ikut tersinkron ke GitHub repo Anda), lalu Anda jalankan di VPS untuk pull update terbaru → install dependency → build → restart server.

## Yang Akan Dibuat

### 1. `update.sh` (root project)

Script bash idempotent dengan fitur:
- `git fetch` + cek apakah ada commit baru (skip kalau sudah up-to-date)
- `git pull` dari branch `main`
- Auto-detect package manager (`bun` / `npm` / `pnpm`) — default `bun` karena project pakai bun
- Install dependency hanya jika `package.json` / lockfile berubah (cepat)
- `bun run build` → output `dist/`
- Restart service via salah satu metode (auto-detect):
  - **PM2**: `pm2 reload atskolla` (kalau `pm2` ada di PATH)
  - **systemd**: `sudo systemctl restart atskolla` (kalau service file ada)
  - **Docker**: `docker compose up -d --build` (kalau `docker-compose.yml` ada)
  - Fallback: cuma rebuild, kasih pesan supaya user restart manual
- Logging timestamped ke `update.log`
- `set -euo pipefail` untuk fail-fast
- Lock file (`/tmp/atskolla-update.lock`) supaya tidak double-run

### 2. `DEPLOY.md` (root project)

Dokumentasi singkat:
- Cara clone repo pertama kali ke VPS
- Set environment variables (`.env` — VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID)
- Cara `chmod +x update.sh` lalu `./update.sh`
- Contoh setup cron untuk auto-update (misal tiap 10 menit cek commit baru):
  ```
  */10 * * * * cd /var/www/atskolla && ./update.sh >> update.log 2>&1
  ```
- Contoh konfigurasi PM2 + Nginx reverse proxy
- Catatan: edge function & database **tidak** di-handle script ini (sudah dikelola Lovable Cloud)

## Catatan Penting

1. **Script ini hanya untuk frontend (Vite SPA build).** Backend (edge functions, DB, cron `auto-mark-alfa`) tetap berjalan di Lovable Cloud dan tidak perlu di-deploy ulang.

2. **`.env` jangan di-commit ke GitHub.** Anda harus buat manual `.env` di VPS sekali saja. Script tidak akan menimpa.

3. **Karena Lovable auto-push ke GitHub setiap ada perubahan**, begitu Anda edit di Lovable → 1-2 menit kemudian commit muncul di GitHub → cron `update.sh` di VPS akan tarik & rebuild otomatis. Full hands-off.

4. **Repo harus sudah connected ke GitHub.** Kalau belum, lewat **Connectors → GitHub → Connect project** dulu.

## File yang Diubah/Dibuat

- `update.sh` (baru)
- `DEPLOY.md` (baru)

Tidak ada perubahan kode aplikasi, database, atau edge function.
