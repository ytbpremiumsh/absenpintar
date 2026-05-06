#!/bin/bash

# --- KONFIGURASI ---
DOMAIN_NAME="atskolla.com"
REPO_URL="https://github.com/ytbpremiumsh/absenpintar.git"
STAGING_DIR="/var/www/atskolla"
WEB_ROOT="/www/wwwroot/$DOMAIN_NAME"

echo "--- Memulai Update ATSkolla ---"

# 1. Masuk ke direktori staging
cd $STAGING_DIR || exit

# 2. Ambil kode terbaru dari GitHub
git remote set-url origin $REPO_URL
git fetch --all
git reset --hard origin/main

# 3. Clean sampah kecuali script ini sendiri (agar update.sh tidak hilang)
git clean -fd -e update.sh -e .env

# 4. Install dependencies & Build
npm install --legacy-peer-deps
npm run build

# 5. Deployment ke folder utama aaPanel
if [ -d "dist" ]; then
    echo "Menyalin file ke $WEB_ROOT..."
    rm -rf $WEB_ROOT/*
    cp -r dist/* $WEB_ROOT/
    
    # Set Permission
    chown -R www:www $WEB_ROOT
    chmod -R 755 $WEB_ROOT
    
    # Reload Web Server
    nginx -s reload
    echo "---------------------------------------------------"
    echo "   BERHASIL: Website sudah menggunakan versi terbaru!   "
    echo "---------------------------------------------------"
else
    echo "---------------------------------------------------"
    echo "   ERROR: Build Gagal! Folder 'dist' tidak ditemukan.   "
    echo "---------------------------------------------------"
    exit 1
fi