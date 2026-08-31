"use client";

import React, { useState } from 'react';
import { X, CheckCircle2, AlertOctagon, ShieldCheck, Calculator } from 'lucide-react';
import api from '@/services/api';

interface FabricInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  receipts: any[];
}

export default function FabricInspectionModal({
  isOpen,
  onClose,
  onSuccess,
  receipts
}: FabricInspectionModalProps) {
  const [formData, setFormData] = useState({
    receipt_id: receipts.length > 0 ? receipts[0].id : "",
    inspection_date: new Date().toISOString().split('T')[0],
    lot_number: "LOT-01",
    length_before: 100,
    length_after: 98,
    width_inch: 58,
    total_defect_points: 4,
    defect_remarks: "*Missing yard, *Slub benang"
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // Live ASTM 4-Point Formula Calculation:
  // Summary Point = (Defect Points * 3600) / (Width inch * Length After yard)
  const calcSummaryPoint = () => {
    if (formData.width_inch > 0 && formData.length_after > 0) {
      const val = (formData.total_defect_points * 3600.0) / (formData.width_inch * formData.length_after);
      return Number(val.toFixed(2));
    }
    return 0;
  };

  const summaryPoint = calcSummaryPoint();

  let grade = "GRADE_A";
  let isPassed = true;
  if (summaryPoint <= 20.0) {
    grade = "GRADE_A (Sangat Bagus)";
    isPassed = true;
  } else if (summaryPoint <= 30.0) {
    grade = "GRADE_B (Standar Pabrik)";
    isPassed = true;
  } else {
    grade = "GRADE_C (GAGAL / REJEK)";
    isPassed = false;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.receipt_id) {
      setErrorMsg("Pilih roll kain yang akan diuji.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/warehouse/inspections', {
        receipt_id: formData.receipt_id,
        inspection_date: formData.inspection_date,
        lot_number: formData.lot_number,
        length_before: Number(formData.length_before),
        length_after: Number(formData.length_after),
        width_inch: Number(formData.width_inch),
        total_defect_points: Number(formData.total_defect_points),
        defect_remarks: formData.defect_remarks
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal menyimpan hasil uji kain.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Fabric Inspection (QC 4-Point ASTM)</h2>
              <p className="text-xs text-slate-400">Standar Uji Mutu Kelayakan Roll Kain Sebelum Cutting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Pilih Roll Kain */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Roll Barang Masuk <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.receipt_id}
              onChange={(e) => setFormData({ ...formData, receipt_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {receipts.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.item_description} | Roll: {r.roll_number || r.id.substring(0, 8)} ({r.qty_received} {r.unit}) - Status: {r.inspection_status}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Parameter Uji */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Panjang Surat Jalan (Yd)</label>
              <input
                type="number"
                step="0.1"
                value={formData.length_before}
                onChange={(e) => setFormData({ ...formData, length_before: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Panjang Aktual Ukur (Yd)</label>
              <input
                type="number"
                step="0.1"
                value={formData.length_after}
                onChange={(e) => setFormData({ ...formData, length_after: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lebar Kain (Inches)</label>
              <input
                type="number"
                step="0.5"
                value={formData.width_inch}
                onChange={(e) => setFormData({ ...formData, width_inch: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Poin Cacat</label>
              <input
                type="number"
                value={formData.total_defect_points}
                onChange={(e) => setFormData({ ...formData, total_defect_points: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* Catatan Cacat Kain */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jenis Cacat / Defect Remarks</label>
            <input
              type="text"
              placeholder="*Missing yard, *Slub, *Hole, *Stain, *Barre"
              value={formData.defect_remarks}
              onChange={(e) => setFormData({ ...formData, defect_remarks: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Live ASTM Calculation Preview Card */}
          <div className={`p-4 rounded-2xl border ${isPassed ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/30'} flex flex-col md:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {isPassed ? <CheckCircle2 className="w-6 h-6" /> : <AlertOctagon className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Hasil Uji Mutu (ASTM 4-Point):</p>
                <h4 className={`text-lg font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {grade}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Rumus: ({formData.total_defect_points} × 3600) / ({formData.width_inch} × {formData.length_after}) = <span className="font-bold text-white">{summaryPoint} Point</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${isPassed ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                {isPassed ? "Lolos QC (Siap Cutting)" : "Safety Gate: Ditolak"}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Menyimpan Uji..." : "Simpan Hasil Uji Mutu"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
