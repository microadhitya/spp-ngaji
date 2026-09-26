// Data awal default untuk guru ngaji baru

export const defaultTeacherProfile = {
  name: "Ibu Guru Ngaji",
  tpaName: "TPA / Majelis Ta'lim",
  phone: "081234567890",
  monthlyDefault: 50000,
};

export const defaultStudents = [];

export const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const MONTH_NAMES = {
  "01": "Januari",
  "02": "Februari",
  "03": "Maret",
  "04": "April",
  "05": "Mei",
  "06": "Juni",
  "07": "Juli",
  "08": "Agustus",
  "09": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Desember",
};

export const formatMonthLabel = (monthKey) => {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-");
  return `${MONTH_NAMES[month] || month} ${year}`;
};

export const getInitialPayments = (currentMonth) => {
  return [];
};

// Helper Format Rupiah
export const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// Helper Format Nomor WhatsApp (pastikan format 62...)
export const formatWhatsAppNumber = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
};

// Generator Link WhatsApp untuk Kuitansi Pembayaran
export const getWhatsAppReceiptUrl = (student, amount, monthKey, teacherName) => {
  const phone = formatWhatsAppNumber(student.phone);
  const monthLabel = formatMonthLabel(monthKey);
  const message = `Assalamu'alaikum Wr. Wb.
Bapak/Ibu wali dari *${student.name}*,

Alhamdulillah pembayaran SPP Ngaji untuk bulan *${monthLabel}* sebesar *${formatRupiah(amount)}* telah diterima dan dicatat LUNAS.

Jazakumullahu khairan katsiran atas kedisiupannya. Semoga berkah dan ilmunya bermanfaat.

Salam,
*${teacherName || "Ibu Guru Ngaji"}*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

// Generator Link WhatsApp untuk Pengingat Iuran
export const getWhatsAppReminderUrl = (student, monthKey, teacherName) => {
  const phone = formatWhatsAppNumber(student.phone);
  const monthLabel = formatMonthLabel(monthKey);
  const message = `Assalamu'alaikum Wr. Wb.
Bapak/Ibu wali dari *${student.name}*,

Semoga sekeluarga selalu sehat dan dalam lindungan Allah SWT. 

Kami ingin menginformasikan bahwa iuran SPP Ngaji an. *${student.name}* untuk bulan *${monthLabel}* sebesar *${formatRupiah(student.nominal)}* belum tercatat lunas. 

Apabila sudah melakukan pembayaran, mohon abaikan pesan ini ya Bu/Pak. Terima kasih banyak.

Salam,
*${teacherName || "Ibu Guru Ngaji"}*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
