/**
 * Formatter angka & tanggal terpusat — dipakai di seluruh modul agar konsisten.
 * Locale id-ID: ribuan pakai titik, desimal pakai koma.
 */

const RP = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/** "Rp 1.500.000" — nilai kosong/NaN → "Rp 0" */
export const formatRp = (v: unknown): string => RP.format(toNumber(v));

/** "1.234,5" — tanpa simbol mata uang. `suffix` mis. " yd" */
export const formatQty = (v: unknown, suffix = ""): string =>
  `${NUM.format(toNumber(v))}${suffix}`;

/** "1,2 jt" / "3,4 rb" untuk kartu ringkas / sumbu chart */
export const formatCompact = (v: unknown): string => {
  const n = toNumber(v);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${NUM.format(n / 1e9)} M`;
  if (abs >= 1e6) return `${NUM.format(n / 1e6)} jt`;
  if (abs >= 1e3) return `${NUM.format(n / 1e3)} rb`;
  return NUM.format(n);
};

/** "08 Jul 2026" — terima Date | ISO string | null. Kosong → "-" */
export const formatDate = (v: string | Date | null | undefined): string => {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

/** "08 Jul 2026, 14:30" */
export const formatDateTime = (v: string | Date | null | undefined): string => {
  if (!v) return "-";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

/** Ekstrak pesan error dari AxiosError / Error / apa pun → string aman untuk toast. */
export const errMsg = (e: unknown, fallback = "Terjadi kesalahan. Coba lagi."): string => {
  if (typeof e === "string") return e;
  const anyE = e as { response?: { data?: { detail?: unknown } }; message?: string };
  const detail = anyE?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  if (anyE?.message) return anyE.message;
  return fallback;
};
