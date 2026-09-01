"use client";

import React, { useRef, useState } from "react";
import {
  FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, Loader2, Database,
  ArrowRight, X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { errMsg } from "@/utils/format";

type PreviewResp = {
  summary: Record<string, number>;
  samples: Record<string, Record<string, unknown>[]>;
  warnings: string[];
};
type CommitResp = {
  ok: boolean;
  parsed: Record<string, number>;
  deltas: Record<string, { before: number; after: number; delta: number }>;
  warnings: string[];
};

const LABELS: Record<string, string> = {
  inventory_items: "Bahan / kain (inventory_items)",
  material_receipts: "Barang masuk (material_receipts)",
  material_allocations: "Barang keluar (material_allocations)",
  sales_orders: "Sales Order",
  sales_orders_from_codeso: "SO dari sheet Code So",
  wip_movements: "Pergerakan WIP (wip_movements)",
  cutting_records: "Data potong (cutting_records)",
  reject_logs: "Cacat / reject (reject_logs)",
  partners: "Rekanan (partners)",
};

function FilePicker({
  label, hint, file, onPick, onClear,
}: {
  label: string; hint: string; file: File | null; onPick: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-5 transition-colors ${
        file ? "border-emerald-500/40 bg-emerald-500/[0.04]" : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onPick(f);
      }}
    >
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
      <div className="flex items-start gap-3">
        <FileSpreadsheet className={`w-8 h-8 shrink-0 ${file ? "text-emerald-400" : "text-slate-500"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
          {file ? (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="font-mono text-emerald-300 truncate">{file.name}</span>
              <span className="text-slate-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              <button onClick={onClear} className="text-slate-500 hover:text-rose-400" aria-label="Hapus file">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => ref.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Pilih file / seret ke sini
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImportModule() {
  const confirm = useConfirm();
  const [bahan, setBahan] = useState<File | null>(null);
  const [monitoring, setMonitoring] = useState<File | null>(null);
  const [busy, setBusy] = useState<"" | "preview" | "commit">("");
  const [preview, setPreview] = useState<PreviewResp | null>(null);
  const [result, setResult] = useState<CommitResp | null>(null);

  const doPreview = async () => {
    if (!bahan && !monitoring) {
      toast.warning("Pilih minimal satu file Excel dulu.");
      return;
    }
    setBusy("preview");
    setResult(null);
    try {
      const fd = new FormData();
      if (bahan) fd.append("bahan", bahan);
      if (monitoring) fd.append("monitoring", monitoring);
      const res = await api.post("/api/import/blueprint/preview", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setPreview(res.data);
      toast.success("Pratinjau siap. Periksa ringkasan & peringatan di bawah.");
    } catch (err) {
      toast.error(errMsg(err, "Gagal memproses pratinjau."));
    } finally {
      setBusy("");
    }
  };

  const doCommit = async () => {
    if (!bahan || !monitoring) {
      toast.warning("Commit butuh KEDUA file: DATA BAHAN dan MONITORING.");
      return;
    }
    const ok = await confirm({
      title: "Jalankan impor ke database?",
      message: "Data master (bahan, SO, rekanan) akan di-UPSERT; mutasi/WIP/reject impor sebelumnya diganti. Aman diulang.",
      confirmText: "Ya, impor sekarang",
    });
    if (!ok) return;

    setBusy("commit");
    try {
      const fd = new FormData();
      fd.append("bahan", bahan);
      fd.append("monitoring", monitoring);
      const res = await api.post("/api/import/blueprint/commit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });
      setResult(res.data);
      toast.success("Impor selesai & tersimpan ke database.");
    } catch (err) {
      toast.error(errMsg(err, "Impor gagal — tidak ada perubahan yang disimpan."));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Database className="w-3.5 h-3.5" /> Impor Data Excel
        </div>
        <h1 className="text-2xl font-black text-white tracking-wide">Impor Data dari Excel</h1>
        <p className="text-slate-400 text-sm mt-0.5 max-w-2xl">
          Unggah <strong>DATA BAHAN NEW 2026.xlsx</strong> dan <strong>Monitoring EX PRODUKSI 2026.xlsx</strong>.
          Sistem membersihkan otomatis (<code>#REF!</code>, nama brand tak konsisten, baris sampah) lalu
          UPSERT ke database. Aman dijalankan berkali-kali.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FilePicker
          label="File 1 — DATA BAHAN"
          hint="Sheet: Stok Bahan, Barang Masuk, Barang Keluar, Code So"
          file={bahan}
          onPick={setBahan}
          onClear={() => setBahan(null)}
        />
        <FilePicker
          label="File 2 — MONITORING EX PRODUKSI"
          hint="Sheet: Monitoring, GUDANG BAHAN, FORM RIJEK BORDIR, DATA"
          file={monitoring}
          onPick={setMonitoring}
          onClear={() => setMonitoring(null)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={doPreview}
          disabled={!!busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 disabled:opacity-50"
        >
          {busy === "preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          Pratinjau
        </button>
        <button
          onClick={doCommit}
          disabled={!!busy || !bahan || !monitoring}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 shadow-lg shadow-indigo-600/20"
        >
          {busy === "commit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Impor ke Database
        </button>
      </div>

      {preview && !result && (
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> Pratinjau
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(preview.summary).map(([k, v]) => (
              <div key={k} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                <p className="text-lg font-black text-white">{v.toLocaleString("id-ID")}</p>
                <p className="text-[11px] text-slate-400">{LABELS[k] || k}</p>
              </div>
            ))}
          </div>
          {preview.warnings.length > 0 && (
            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Catatan pembersihan
              </p>
              <ul className="text-[11px] text-slate-400 space-y-0.5 max-h-48 overflow-y-auto">
                {preview.warnings.map((w, i) => (
                  <li key={i} className="font-mono">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="glass-panel rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.03] p-5 space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Impor selesai
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 pr-4">Tabel</th>
                  <th className="py-2 px-3 text-right">Sebelum</th>
                  <th className="py-2 px-3 text-right">Sesudah</th>
                  <th className="py-2 pl-3 text-right">Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.entries(result.deltas).map(([t, d]) => (
                  <tr key={t}>
                    <td className="py-2 pr-4 font-mono text-slate-300">{t}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{d.before.toLocaleString("id-ID")}</td>
                    <td className="py-2 px-3 text-right font-semibold text-white">{d.after.toLocaleString("id-ID")}</td>
                    <td className={`py-2 pl-3 text-right font-bold ${d.delta > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                      {d.delta > 0 ? `+${d.delta}` : d.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
