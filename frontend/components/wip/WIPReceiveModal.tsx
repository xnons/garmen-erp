"use client";

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowDownLeft, ShieldAlert } from 'lucide-react';
import api from '@/services/api';

interface WIPReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  movement: any;
}

export default function WIPReceiveModal({
  isOpen,
  onClose,
  onSuccess,
  movement
}: WIPReceiveModalProps) {
  if (!isOpen || !movement) return null;

  const [formData, setFormData] = useState({
    received_date: new Date().toISOString().split('T')[0],
    qty_received: movement.qty_dispatched || 0,
    qty_reject: 0,
    defect_reason: "",
    remarks: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const qtyDispatched = movement.qty_dispatched || 0;
  const discrepancy = qtyDispatched - (Number(formData.qty_received) + Number(formData.qty_reject));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.qty_received < 0) {
      setErrorMsg("Kuantitas terima tidak boleh negatif.");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/api/wip/movements/${movement.id}/receive`, {
        received_date: formData.received_date,
        qty_received: Number(formData.qty_received),
        qty_reject: Number(formData.qty_reject) || 0,
        defect_reason: formData.defect_reason || null,
        remarks: formData.remarks || null
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal mencatat penerimaan setoran.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Terima Setoran & Rekonsiliasi</h2>
              <p className="text-xs text-slate-400">{movement.stage_name} (SJ: {movement.surat_jalan_no || "-"})</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Sales Order & Style:</span>
              <span className="font-bold text-white">{movement.so_number} - {movement.style_name}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Qty Dikirim Awal:</span>
              <span className="text-base font-black text-purple-400">{qtyDispatched} Pcs</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kuantitas Bagus Diterima (Pcs) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.qty_received}
                onChange={(e) => setFormData({ ...formData, qty_received: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kuantitas Rijek / Cacat (Pcs)
              </label>
              <input
                type="number"
                min="0"
                value={formData.qty_reject}
                onChange={(e) => setFormData({ ...formData, qty_reject: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-bold"
              />
            </div>
          </div>

          {Number(formData.qty_reject) > 0 && (
            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1.5">
                Alasan / Jenis Kerusakan Rijek
              </label>
              <input
                type="text"
                placeholder="JARUM PATAH, BELANG WARNA, SOBEK, CACAT SABLON"
                value={formData.defect_reason}
                onChange={(e) => setFormData({ ...formData, defect_reason: e.target.value })}
                className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 uppercase"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Penerimaan</label>
            <input
              type="date"
              value={formData.received_date}
              onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Discrepancy Math Result Card */}
          <div className={`p-4 rounded-2xl border ${discrepancy === 0 ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-amber-950/30 border-amber-500/40'} flex items-center justify-between`}>
            <div>
              <p className="text-[11px] uppercase font-semibold text-slate-400">Rekonsiliasi Kirim vs Terima:</p>
              <p className="text-xs text-slate-300 mt-0.5">
                {qtyDispatched} - ({formData.qty_received} + {formData.qty_reject}) = <span className="font-bold text-white">{discrepancy} Pcs Selisih</span>
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${discrepancy === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {discrepancy === 0 ? "Kuantitas Cocok" : `⚠️ Selisih ${discrepancy} Pcs`}
            </span>
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
              {submitting ? "Menyimpan..." : "Konfirmasi Terima Setoran"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
