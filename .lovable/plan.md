## Masalah

Pada `MobileFooterNav` (dipakai di seluruh halaman role Admin/Operator/Wali Kelas/Guru), tombol tengah "Scan" terlihat sedikit bergeser ke kanan, tidak lurus dengan center layar.

Penyebab: layout pakai `justify-around` dengan lebar tiap item berbeda — tombol non-center punya `min-w-[52px]` + `px-2`, sedangkan tombol center cuma selebar 56px tanpa wrapper flex yang sama. Akibatnya jarak antar item tidak simetris dan center button tidak benar-benar di tengah.

## Perubahan

File: `src/components/layout/MobileFooterNav.tsx`

1. Bungkus setiap item (termasuk center) dalam wrapper `flex-1 flex justify-center` dengan `basis-0` supaya semua slot lebarnya identik.
2. Hapus `min-w-[52px]` pada tombol biasa — biarkan slot wrapper yang menentukan lebar.
3. Pastikan tombol center tetap pakai `-mt-6` untuk efek mengambang, tapi posisi horizontalnya mengikuti slot tengah (otomatis center karena 5 slot sama lebar → slot ke-3 = tengah layar).
4. Ganti `justify-around` → `justify-between` (atau biarkan, tapi dengan slot equal-width hasilnya sama lurus).

Tidak ada perubahan di `BendaharaFloatingNav` karena layout-nya berbeda (floating pill, bukan footer full-width) — kecuali kalau user juga mau itu disesuaikan.

## Hasil

Tombol Scan akan tepat di tengah layar di semua halaman yang memakai footer nav ini (Dashboard, Monitoring, Siswa, Jadwal, Teacher Dashboard, Wali Kelas, dll).
