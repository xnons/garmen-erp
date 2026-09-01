import React from "react";

/**
 * Badge status seragam untuk semua modul (SO, WIP, receipt, alokasi, dll).
 * Warna dipetakan dari satu tempat agar konsisten.
 */

type Tone = "green" | "blue" | "amber" | "red" | "slate" | "violet" | "cyan";

const TONE: Record<Tone, string> = {
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

// Kata kunci → tone. Dicek sebagai substring (uppercase) agar toleran varian.
const RULES: [RegExp, Tone][] = [
  [/SHIP|KIRIM|CLOSED|SELESAI|DONE|LUNAS|PASSED|APPROVED|COMPLETED|AKTIF|ACTIVE/, "green"],
  [/DISCREPANCY|REJECT|RUSAK|GAGAL|CANCEL|BATAL|OVERDUE|TELAT|ALPA|DENIED|FAILED/, "red"],
  [/PENDING|MENUNGGU|DRAFT|PARTIAL|PROSES|PROGRESS|WIP|ON_PROGRESS|BELUM|DICICIL|HOLD/, "amber"],
  [/CUTTING|POTONG|SEWING|JAHIT|WASHING|FINISHING|PRINT|EMBRO|BORDIR/, "blue"],
  [/REGISTERED|BARU|NEW|REGIST/, "violet"],
];

function toneFor(status: string): Tone {
  const s = status.toUpperCase();
  for (const [re, tone] of RULES) if (re.test(s)) return tone;
  return "slate";
}

export default function StatusBadge({
  status,
  tone,
  className = "",
}: {
  status: string | null | undefined;
  tone?: Tone;
  className?: string;
}) {
  const label = (status || "-").toString().replace(/_/g, " ");
  const t = tone ?? toneFor(label);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${TONE[t]} ${className}`}
    >
      {label}
    </span>
  );
}
