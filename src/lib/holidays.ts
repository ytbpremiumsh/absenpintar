// Hari libur nasional Indonesia 2025-2026 (hardcoded)
// Format: YYYY-MM-DD
export const INDONESIAN_HOLIDAYS = new Set<string>([
  // 2025
  "2025-01-01", // Tahun Baru Masehi
  "2025-01-27", // Isra Mikraj
  "2025-01-29", // Tahun Baru Imlek
  "2025-03-29", // Hari Suci Nyepi
  "2025-03-31", // Idul Fitri
  "2025-04-01", // Idul Fitri
  "2025-04-18", // Wafat Isa Almasih
  "2025-04-20", // Paskah
  "2025-05-01", // Hari Buruh
  "2025-05-12", // Hari Raya Waisak
  "2025-05-29", // Kenaikan Isa Almasih
  "2025-06-01", // Hari Lahir Pancasila
  "2025-06-06", // Idul Adha
  "2025-06-27", // Tahun Baru Islam
  "2025-08-17", // Kemerdekaan RI
  "2025-09-05", // Maulid Nabi
  "2025-12-25", // Natal
  // 2026
  "2026-01-01",
  "2026-01-16", // Isra Mikraj
  "2026-02-17", // Tahun Baru Imlek
  "2026-03-19", // Nyepi
  "2026-03-20", // Idul Fitri
  "2026-03-21",
  "2026-04-03", // Wafat Isa Almasih
  "2026-04-05", // Paskah
  "2026-05-01",
  "2026-05-14", // Kenaikan Isa Almasih
  "2026-05-31", // Waisak
  "2026-05-27", // Idul Adha
  "2026-06-01",
  "2026-06-16", // Tahun Baru Islam
  "2026-08-17",
  "2026-08-25", // Maulid Nabi
  "2026-12-25",
]);

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWorkingDay(d: Date): boolean {
  const day = d.getDay();
  if (day === 0 || day === 6) return false; // weekend
  if (INDONESIAN_HOLIDAYS.has(toDateKey(d))) return false;
  return true;
}

/**
 * Tambah N hari kerja (skip weekend & tanggal merah).
 * Mulai dihitung dari hari berikutnya setelah `start`.
 */
export function addWorkingDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isWorkingDay(result)) added++;
  }
  return result;
}

export function getEstimatedPayoutDate(requestedAt: Date = new Date()): Date {
  // Maks 3x24 jam hari kerja
  return addWorkingDays(requestedAt, 3);
}
