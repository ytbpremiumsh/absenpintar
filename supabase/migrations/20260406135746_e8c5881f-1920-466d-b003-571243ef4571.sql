
UPDATE subscription_plans SET features = '["Scan QR Barcode", "Maks 2 Kelas", "Maks 20 Siswa", "Monitoring Realtime", "Live Monitor Publik"]'::jsonb WHERE name = 'Free';

UPDATE subscription_plans SET features = '["Scan QR Barcode", "Monitoring Realtime", "Live Monitor Publik", "Import/Export Data Siswa", "Upload Foto Siswa", "Rekap & Export Laporan (PDF/Excel)", "Maks 10 Kelas", "Maks 200 Siswa"]'::jsonb WHERE name = 'Basic';

UPDATE subscription_plans SET features = '["Scan QR Barcode", "Monitoring Realtime", "Live Monitor Publik", "Import/Export Data Siswa", "Upload Foto Siswa", "Rekap & Export Laporan (PDF/Excel)", "Custom Logo Sekolah", "Notifikasi WhatsApp Otomatis", "Multi Staff / Operator", "Kelas & Siswa Unlimited", "Prioritas Bantuan"]'::jsonb WHERE name = 'School';

UPDATE subscription_plans SET features = '["Scan QR Barcode", "Monitoring Realtime", "Live Monitor Publik", "Import/Export Data Siswa", "Upload Foto Siswa", "Rekap & Export Laporan (PDF/Excel)", "Custom Logo Sekolah", "Notifikasi WhatsApp Otomatis", "Multi Staff / Operator", "Kelas & Siswa Unlimited", "Face Recognition / Scan Wajah", "Multi Cabang Sekolah", "Dedicated Support", "Fitur Terbaru Lebih Awal"]'::jsonb WHERE name = 'Premium';
