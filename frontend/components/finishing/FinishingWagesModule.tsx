"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Search, RefreshCw, DollarSign, CheckCircle2, 
  Layers, UserCheck, Calendar, FileText
} from 'lucide-react';
import api from '@/services/api';

export default function FinishingWagesModule() {
  const [wages, setWages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    so_id: "",
    operation_type: "STIM",
    work_date: new Date().toISOString().split('T')[0],
    qty_completed: 250,
    wage_per_piece: 550
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shipping/wages');
      setWages(res.data || []);
      const oRes = await api.get('/api/ppic/orders');
      setOrders(oRes.data || []);
      if (oRes.data && oRes.data.length > 0 && !formData.so_id) {
        setFormData(prev => ({ ...prev, so_id: oRes.data[0].id }));
      }
    } catch (err) {
      console.error("Gagal mengambil data upah finishing:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpChange = (op: string) => {
    let rate = 550;
    if (op === "STIM") rate = 550;
    else if (op === "PASANG_KANCING") rate = 200;
    else if (op === "LUBANG_KANCING") rate = 150;
    else if (op === "LIPAT") rate = 250;
    else if (op === "PACKING") rate = 300;
    setFormData(prev => ({ ...prev, operation_type: op, wage_per_piece: rate }));
  };

  const handleCreateWage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/shipping/wages', {
        so_id: formData.so_id,
        operation_type: formData.operation_type,
        work_date: formData.work_date,
        qty_completed: Number(formData.qty_completed),
        wage_per_piece: Number(formData.wage_per_piece)
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal mencatat upah finishing.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalFinishingPaid = wages.reduce((acc, w) => acc + (w.total_wage || 0), 0);
  const totalPcsFinished = wages.reduce((acc, w) => acc + (w.qty_completed || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fase 5: Finishing Area & Upah Satuan
          </div>
          <h1 className="text-2xl font-black text-white">Finishing & Upah Borongan Satuan</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Log pekerjaan finishing (Steam Johan Rp500–600, Pasang Kancing, Lipat, Packing) dan rekapitulasi upah harian.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            + Catat Borongan Finishing
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Kuantitas Selesai</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{totalPcsFinished.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pcs Garmen Siap Kirim</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Akumulasi Upah Finishing</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            Rp {totalFinishingPaid.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">Borongan Operator</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Operator Aktif</p>
          <p className="text-2xl font-black text-white mt-1">Johan, Ica, Erika, Desti</p>
          <p className="text-[11px] text-slate-500 mt-1">Tim Finishing</p>
        </div>
      </div>

      {/* Table Log */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Tgl Kerja</th>
              <th className="py-3 px-3">Operator</th>
              <th className="py-3 px-3">Jenis Pekerjaan</th>
              <th className="py-3 px-3 text-right">Kuantitas</th>
              <th className="py-3 px-3 text-right">Tarif / Pcs</th>
              <th className="py-3 px-4 text-right">Total Upah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                  Memuat log upah finishing...
                </td>
              </tr>
            ) : wages.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Belum ada catatan upah borongan finishing.
                </td>
              </tr>
            ) : (
              wages.map((w) => (
                <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono">{w.work_date}</td>
                  <td className="py-3 px-3 font-semibold text-white">{w.operator_name || "Johan"}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {w.operation_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-white">
                    {w.qty_completed.toLocaleString('id-ID')} Pcs
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">Rp {w.wage_per_piece}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-400">
                    Rp {w.total_wage.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add Wage */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateWage} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Catat Upah Borongan Finishing</h3>
            
            <div>
              <label className="block text-xs text-slate-300 mb-1">Pilih Sales Order</label>
              <select
                required
                value={formData.so_id}
                onChange={(e) => setFormData({ ...formData, so_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {orders.map(so => (
                  <option key={so.id} value={so.id}>{so.so_number} - {so.style_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Jenis Pekerjaan Finishing</label>
              <select
                value={formData.operation_type}
                onChange={(e) => handleOpChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold"
              >
                <option value="STIM">STIM UAP (Rp 550/pcs)</option>
                <option value="PASANG_KANCING">PASANG KANCING (Rp 200/pcs)</option>
                <option value="LUBANG_KANCING">LUBANG KANCING (Rp 150/pcs)</option>
                <option value="LIPAT">LIPAT BAJU (Rp 250/pcs)</option>
                <option value="PACKING">PACKING & PLASTIK (Rp 300/pcs)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Kuantitas (Pcs)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.qty_completed}
                  onChange={(e) => setFormData({ ...formData, qty_completed: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Tarif (Rp/Pcs)</label>
                <input
                  type="number"
                  value={formData.wage_per_piece}
                  onChange={(e) => setFormData({ ...formData, wage_per_piece: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-300">Total Upah:</span>
              <span className="text-sm font-black text-cyan-400">
                Rp {(formData.qty_completed * formData.wage_per_piece).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl"
              >
                {submitting ? "Menyimpan..." : "Simpan Borongan"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
