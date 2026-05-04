// Helper untuk mendapatkan tanggal lokal (timezone sekolah) dalam format YYYY-MM-DD.
// Menghindari bug `new Date().toISOString().slice(0, 10)` yang memakai UTC,
// sehingga sebelum jam 07:00 WIB tanggal masih milik hari kemarin.

export function getLocalDateString(timezone: string = "Asia/Jakarta", date: Date = new Date()): string {
  // en-CA menghasilkan format YYYY-MM-DD
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    // Fallback Asia/Jakarta jika timezone invalid
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

export function getLocalTimeString(timezone: string = "Asia/Jakarta", date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }
}
