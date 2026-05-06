cd /var/www/atskolla
git pull origin main
npm install --legacy-peer-deps
npm run build
rm -rf /www/wwwroot/atskolla.com/*
cp -r dist/* /www/wwwroot/atskolla.com/
chown -R www:www /www/wwwroot/atskolla.com
nginx -s reload