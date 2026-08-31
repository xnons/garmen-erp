"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Truck, Sparkles } from 'lucide-react';
import api from '@/services/api';

interface SubconDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orders: any[];
  partners: any[];
}

export default function SubconDispatcherModal({
  isOpen,
  onClose,
  onSuccess,
  orders,
  partners
}: SubconDispatcherModalProps) {
  const [formData, setFormData] = useState({
    so_id: orders.length > 0 ? orders[0].id : "",
    stage_name: "PRINT_MENTAH",
    partner_id: "",
    surat_jalan_no: "",
    dispatch_date: new Date().toISOString().split('T')[0],
    qty_dispatched: 300,
    remarks: "Pengiriman potongan pola mentah"
  });

  const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
    "28": 60,
    "30": 90,
    "32": 90,
    "34": 60
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && orders.length > 0 && !formData.so_id) {
      setFormData(prev => ({ ...prev, so_id: orders[0].id }));
    }
  }, [isOpen, orders]);

  if (!isOpen) return null;

  const handleStageChange = (stage: string) => {
    setFormData(prev => ({
      ...prev,
      stage_name: stage,
      surat_jalan_no: `SJ-${stage.slice(0, 3).toUpperCase()}-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}.${Math.floor(100 + Math.random() * 900)}`
    }));
  };

  const handleSizeChange = (key: string, val: number) => {
    const updated = { ...sizeMatrix, [key]: Math.max(0, val) };
    setSizeMatrix(updated);
    const sum = Object.values(updated).reduce((acc, q) => acc + (Number(q) || 0), 0);
    setFormData(prev => ({ ...prev, qty_dispatched: sum }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.so_id) {
      setErrorMsg("Pilih Sales Order target.");
      return;
    }
    if (formData.qty_dispatched <= 0) {
      setErrorMsg("Kuantitas kirim harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/wip/dispatch', {
        so_id: formData.so_id,
        stage_name: formData.stage_name,
        partner_id: formData.partner_id || null,
        surat_jalan_no: formData.surat_jalan_no.toUpperCase() || null,
        dispatch_date: formData.dispatch_date,
        qty_dispatched: formData.qty_dispatched,
        size_breakdown_dispatched: sizeMatrix,
        remarks: formData.remarks
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal membuat surat jalan kirim.");
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
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Kirim Surat Jalan Subkon / Lini</h2>
              <p className="text-xs text-slate-400">Pengiriman Pola ke Print, Bordir, Sewing Jahit, atau Washing</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sales Order Target <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.so_id}
                onChange={(e) => setFormData({ ...formData, so_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {orders.map(so => (
                  <option key={so.id} value={so.id}>
                    {so.so_number} - {so.style_name} ({so.order_qty} Pcs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tahapan Lini Produksi <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.stage_name}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
              >
                <option value="PRINT_MENTAH">1. PRINT MENTAH (Mas Kirno)</option>
                <option value="EMBROIDERY_MENTAH">2. BORDIR MENTAH (CJM / Ko Dede)</option>
                <option value="SEWING_INTERNAL">3. SEWING INTERNAL (Lini Anis)</option>
                <option value="SEWING_MAKLUN">3. SEWING MAKLUN (Pa Ato / Al-Itihad)</option>
                <option value="WASHING">4. WASHING (Anugrah / Rite Clean / Blessindo)</option>
                <option value="EMBROIDERY_JADI">5. BORDIR JADI (Pedro)</option>
                <option value="FINISHING">6. FINISHING AREA</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vendor Rekanan / Subcon</label>
              <select
                value={formData.partner_id}
                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">-- Internal / Tanpa Vendor Luar --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category.replace('_', ' ')})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nomor Surat Jalan</label>
              <input
                type="text"
                placeholder="SJ-PRT-2608.01"
                value={formData.surat_jalan_no}
                onChange={(e) => setFormData({ ...formData, surat_jalan_no: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono uppercase"
              />
            </div>
          </div>

          {/* Breakdown Ukuran Kirim */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300">BREAKDOWN UKURAN DIKIRIM (PCS):</h4>
              <span className="text-xs font-black text-purple-400">Total Kirim: {formData.qty_dispatched} Pcs</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Object.entries(sizeMatrix).map(([sz, qty]) => (
                <div key={sz} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">{sz}</span>
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => handleSizeChange(sz, Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded py-0.5 text-center text-xs font-bold text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Keterangan / Catatan Tambahan</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
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
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Mengirim..." : "Terbitkan Surat Jalan Kirim"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
