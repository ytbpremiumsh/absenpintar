import jsPDF from "jspdf";

const fmtIDR = (n: number) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

const STATUS_LABEL: Record<string, string> = {
  paid: "LUNAS",
  pending: "MENUNGGU PEMBAYARAN",
  unpaid: "BELUM DIBAYAR",
  expired: "KADALUARSA",
  failed: "GAGAL",
};

export interface SppInvoicePDFData {
  invoice: {
    invoice_number: string;
    student_name: string;
    class_name: string;
    period_label: string;
    amount: number;
    denda?: number;
    total_amount: number;
    due_date?: string | null;
    paid_at?: string | null;
    payment_method?: string | null;
    status: string;
    created_at?: string;
  };
  student: {
    student_id?: string | null;
    nisn?: string | null;
    parent_name?: string | null;
  };
  school: {
    name: string;
    address?: string | null;
    npsn?: string | null;
    logo?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  bendahara_name?: string | null;
}

export async function generateSppInvoicePDF(data: SppInvoicePDFData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  let y = 14;

  // ─── HEADER / KOP SURAT (Format Resmi Nasional) ───
  // Logo kiri
  if (data.school.logo) {
    try {
      const img = await loadImageAsDataURL(data.school.logo);
      doc.addImage(img, "PNG", M, y, 24, 24);
    } catch {/* skip */}
  }

  // Garuda placeholder kanan (jika tidak ada, kosongkan; banyak sekolah hanya pakai logo sekolah)
  // Kop teks tengah
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("PEMERINTAH REPUBLIK INDONESIA", W / 2, y + 4, { align: "center" });
  doc.text("KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI", W / 2, y + 9, { align: "center" });

  doc.setFontSize(14);
  doc.text(data.school.name.toUpperCase(), W / 2, y + 15, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  if (data.school.address) {
    doc.text(data.school.address, W / 2, y + 20, { align: "center", maxWidth: 150 });
  }
  const meta: string[] = [];
  if (data.school.npsn) meta.push(`NPSN: ${data.school.npsn}`);
  if (data.school.phone) meta.push(`Telp: ${data.school.phone}`);
  if (data.school.email) meta.push(`Email: ${data.school.email}`);
  if (meta.length) doc.text(meta.join("  •  "), W / 2, y + 25, { align: "center" });

  // Garis kop (double line — formal Indonesian standard)
  y = 42;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  doc.setLineWidth(0.3);
  doc.line(M, y + 1.5, W - M, y + 1.5);

  // ─── TITLE ───
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(91, 108, 249);
  doc.text("INVOICE PEMBAYARAN SPP", W / 2, y, { align: "center" });

  // status badge
  y += 8;
  const statusText = STATUS_LABEL[data.invoice.status] || data.invoice.status.toUpperCase();
  const isPaid = data.invoice.status === "paid";
  doc.setFillColor(isPaid ? 16 : 245, isPaid ? 185 : 158, isPaid ? 129 : 11);
  const sw = doc.getTextWidth(statusText) + 8;
  doc.roundedRect((W - sw) / 2, y - 4, sw, 6, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, W / 2, y, { align: "center" });

  // ─── INVOICE META BOX ───
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(M, y, W - 2 * M, 28, 2, 2, "FD");

  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("NO. INVOICE", M + 4, y + 6);
  doc.text("TANGGAL TERBIT", M + 4, y + 16);
  doc.text("JATUH TEMPO", W / 2 + 4, y + 6);
  doc.text("BULAN PEMBAYARAN", W / 2 + 4, y + 16);

  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.invoice.invoice_number, M + 4, y + 11);
  doc.text(fmtDate(data.invoice.created_at), M + 4, y + 21);
  doc.text(fmtDate(data.invoice.due_date), W / 2 + 4, y + 11);
  doc.text(data.invoice.period_label, W / 2 + 4, y + 21);

  // ─── DITUJUKAN KEPADA ───
  y += 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(91, 108, 249);
  doc.text("DITAGIHKAN KEPADA", M, y);

  y += 5;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.text(data.invoice.student_name, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  y += 4.5;
  const lines = [
    `NIS: ${data.student.student_id || "-"}${data.student.nisn ? `   |   NISN: ${data.student.nisn}` : ""}`,
    `Kelas: ${data.invoice.class_name}`,
  ];
  if (data.student.parent_name) lines.push(`Wali Murid: ${data.student.parent_name}`);
  lines.forEach((l) => { doc.text(l, M, y); y += 4.5; });

  // ─── DETAIL TAGIHAN TABLE ───
  y += 4;
  // header
  doc.setFillColor(91, 108, 249);
  doc.rect(M, y, W - 2 * M, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("DESKRIPSI", M + 3, y + 5.4);
  doc.text("PERIODE", M + 95, y + 5.4);
  doc.text("JUMLAH", W - M - 3, y + 5.4, { align: "right" });

  y += 8;
  // row 1: SPP
  doc.setFillColor(255, 255, 255);
  doc.rect(M, y, W - 2 * M, 9, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`SPP - ${data.invoice.student_name} (${data.invoice.class_name})`, M + 3, y + 5.8);
  doc.text(data.invoice.period_label, M + 95, y + 5.8);
  doc.text(fmtIDR(data.invoice.amount), W - M - 3, y + 5.8, { align: "right" });
  y += 9;
  doc.setDrawColor(230, 230, 230);
  doc.line(M, y, W - M, y);

  if (data.invoice.denda && data.invoice.denda > 0) {
    doc.text("Denda Keterlambatan", M + 3, y + 5.8);
    doc.text("-", M + 95, y + 5.8);
    doc.text(fmtIDR(data.invoice.denda), W - M - 3, y + 5.8, { align: "right" });
    y += 9;
    doc.line(M, y, W - M, y);
  }

  // total
  y += 1;
  doc.setFillColor(243, 245, 252);
  doc.rect(M, y, W - 2 * M, 11, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(91, 108, 249);
  doc.text("TOTAL PEMBAYARAN", M + 3, y + 7);
  doc.text(fmtIDR(data.invoice.total_amount), W - M - 3, y + 7, { align: "right" });
  y += 11;

  // ─── PAYMENT INFO (if paid) ───
  if (isPaid) {
    y += 6;
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(M, y, W - 2 * M, 18, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(5, 122, 85);
    doc.text("LUNAS / PEMBAYARAN DITERIMA", M + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 90, 70);
    doc.text(`Tanggal Pembayaran : ${fmtDate(data.invoice.paid_at)}`, M + 4, y + 11.5);
    const rawMethod = (data.invoice.payment_method || "").toLowerCase();
    const methodLabel = rawMethod.includes("transfer") || rawMethod.includes("bank") ? "Transfer Bank"
      : rawMethod.includes("qris") ? "QRIS"
      : rawMethod.includes("ewallet") || rawMethod.includes("wallet") ? "E-Wallet"
      : rawMethod === "spp" || rawMethod === "" || rawMethod === "mayar" ? "QRIS / Transfer Bank"
      : data.invoice.payment_method!.toUpperCase();
    doc.text(`Metode Pembayaran  : ${methodLabel}`, M + 4, y + 15.5);
    y += 18;
  }

  // ─── FOOTER / SIGNATURE ───
  y = 250;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Invoice ini sah dan diproses oleh sistem ATSkolla. Tidak memerlukan tanda tangan basah.",
    W / 2, y, { align: "center", maxWidth: 170 }
  );

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`${data.school.name},`, W - M - 50, y);
  doc.text(`${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, W - M - 50, y + 4);
  doc.text("Bendahara Sekolah", W - M - 50, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.bendahara_name || "(_______________)", W - M - 50, y + 25);

  // page footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Dicetak ${new Date().toLocaleString("id-ID")} • Powered by ATSkolla (Ayo Pintar)`,
    W / 2, 290, { align: "center" }
  );

  return doc;
}

export async function downloadSppInvoicePDF(data: SppInvoicePDFData) {
  const doc = await generateSppInvoicePDF(data);
  const filename = `Invoice-${data.invoice.invoice_number.replace(/[\/\\]/g, "-")}-${data.invoice.student_name.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

async function loadImageAsDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
