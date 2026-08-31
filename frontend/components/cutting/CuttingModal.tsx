"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Scissors, Calculator } from 'lucide-react';
import api from '@/services/api';

interface CuttingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orders: any[];
}

export default function CuttingModal({ isOpen, onClose, onSuccess, orders }: CuttingModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    so_id: orders.length > 0 ? orders[0].id : "",
    operator_id: "",
    cutting_date: new Date().toISOString().split('T')[0],
    qty_cut: 500,
    main_fabric_used: 650,
    puring_used: 120,
    puring_jala_used: 0,
    marker_length_yard: 12.5,
    marker_efficiency_pct: 86.5,
    gelaran_layers: 40,
    fabric_waste_yards: 8.0
  });

  const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
    "28": 100,
    "30": 150,
    "32": 150,
    "34": 100
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/karyawan/list');
      const list = res.data?.data || res.data || [];
      setEmployees(list);
      if (list.length > 0 && !formData.operator_id) {
        setFormData(prev => ({ ...prev, operator_id: list[0].id_karyawan }));
      }
    } catch (err) {
      console.error("Gagal mengambil daftar karyawan:", err);
    }
  };

  const totalMatrixQty = Object.values(sizeMatrix).reduce((acc, q) => acc + (Number(q) || 0), 0);

  const mainConsumption = formData.qty_cut > 0 ? (formData.main_fabric_used / formData.qty_cut).toFixed(4) : "0.0000";
  const puringConsumption = formData.qty_cut > 0 ? ((formData.puring_used || 0) / formData.qty_cut).toFixed(4) : "0.0000";

  const handleSizeChange = (key: string, val: number) => {
    const updated = { ...sizeMatrix, [key]: Math.max(0, val) };
    setSizeMatrix(updated);
    const sum = Object.values(updated).reduce((acc, q) => acc + (Number(q) || 0), 0);
    setFormData(prev => ({ ...prev, qty_cut: sum }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.so_id) {
      setErrorMsg("Pilih Sales Order target.");
      return;
    }
    if (formData.qty_cut <= 0) {
      setErrorMsg("Jumlah lembaran potong harus lebih dari 0.");
      return;
    }
    if (formData.main_fabric_used <= 0) {
      setErrorMsg("Yard kain utama terpakai harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/cutting/records', {
        so_id: formData.so_id,
        operator_id: formData.operator_id || null,
        cutting_date: formData.cutting_date,
        qty_cut: formData.qty_cut,
        size_breakdown_cut: sizeMatrix,
        main_fabric_used: Number(formData.main_fabric_used),
        puring_used: Number(formData.puring_used) || 0,
        puring_jala_used: Number(formData.puring_jala_used) || 0,
        marker_length_yard: Number(formData.marker_length_yard) || 0,
        marker_efficiency_pct: Number(formData.marker_efficiency_pct) || 0,
        gelaran_layers: Number(formData.gelaran_layers) || 1,
        fabric_waste_yards: Number(formData.fabric_waste_yards) || 0
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal menyimpan log potong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Log Meja Potong & Consumption</h2>
              <p className="text-xs text-slate-400">Pencatatan Lembaran Pola Meja Bu Nani & Yield Kain</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Operator Potong / Meja Pola <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.operator_id}
                onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Pilih Pekerja / Bu Nani --</option>
                {employees.map(emp => (
                  <option key={emp.id_karyawan} value={emp.id_karyawan}>
                    {emp.nama} ({emp.jabatan || 'Cutting'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sales Order Target <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.so_id}
                onChange={(e) => setFormData({ ...formData, so_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {orders.map(so => (
                  <option key={so.id} value={so.id}>
                    {so.so_number} - {so.style_name} ({so.order_qty} Pcs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Potong</label>
              <input
                type="date"
                value={formData.cutting_date}
                onChange={(e) => setFormData({ ...formData, cutting_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Grid Pemakaian Bahan */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kain Utama (Yard) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.main_fabric_used}
                onChange={(e) => setFormData({ ...formData, main_fabric_used: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Puring Saku (Yard)</label>
              <input
                type="number"
                step="0.1"
                value={formData.puring_used}
                onChange={(e) => setFormData({ ...formData, puring_used: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Puring Jala (Yard)</label>
              <input
                type="number"
                step="0.1"
                value={formData.puring_jala_used}
                onChange={(e) => setFormData({ ...formData, puring_jala_used: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>
          </div>

          {/* Marker & Efisiensi Meja Potong */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Panjang Marker (Yd)</label>
              <input
                type="number"
                step="0.1"
                value={formData.marker_length_yard}
                onChange={(e) => setFormData({ ...formData, marker_length_yard: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Efisiensi Pola (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.marker_efficiency_pct}
                onChange={(e) => setFormData({ ...formData, marker_efficiency_pct: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Jml Gelaran (Ply)</label>
              <input
                type="number"
                value={formData.gelaran_layers}
                onChange={(e) => setFormData({ ...formData, gelaran_layers: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sisa Afval (Yd)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fabric_waste_yards}
                onChange={(e) => setFormData({ ...formData, fabric_waste_yards: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-bold"
              />
            </div>
          </div>

          {/* Breakdown Ukuran Hasil Potong */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300">HASIL POTONG PER UKURAN (PCS):</h4>
              <span className="text-xs font-black text-amber-400">Total Potong: {formData.qty_cut} Pcs</span>
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

          {/* Consumption Yield Card */}
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Kalkulasi Otomatis Konsumsi:</p>
                <div className="flex items-center gap-4 mt-0.5">
                  <span className="text-xs text-slate-200">
                    Kain Utama: <span className="font-black text-amber-400 text-sm">{mainConsumption}</span> Yd/Pcs
                  </span>
                  <span className="text-xs text-slate-200">
                    Puring: <span className="font-black text-amber-400 text-sm">{puringConsumption}</span> Yd/Pcs
                  </span>
                </div>
              </div>
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
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Menyimpan..." : "Simpan Hasil Potong"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
