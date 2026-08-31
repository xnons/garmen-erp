"use client";

import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Sparkles } from 'lucide-react';
import api from '@/services/api';

interface PrepWagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orders: any[];
}

export default function PrepWagesModal({
  isOpen,
  onClose,
  onSuccess,
  orders
}: PrepWagesModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    so_id: orders.length > 0 ? orders[0].id : "",
    operator_id: "",
    task_type: "PRESS_INTERLINING",
    task_date: new Date().toISOString().split('T')[0],
    qty_done: 300,
    piece_rate: 250
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
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

  if (!isOpen) return null;

  const handleTaskTypeChange = (type: string) => {
    const rate = type === "NUMBERING" ? 150 : 250;
    setFormData(prev => ({ ...prev, task_type: type, piece_rate: rate }));
  };

  const totalCalculatedWage = formData.qty_done * formData.piece_rate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.operator_id) {
      setErrorMsg("Pilih nama pekerja.");
      return;
    }
    if (!formData.so_id) {
      setErrorMsg("Pilih Sales Order target.");
      return;
    }
    if (formData.qty_done <= 0) {
      setErrorMsg("Jumlah pengerjaan harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/cutting/prep-tasks', {
        so_id: formData.so_id,
        operator_id: formData.operator_id,
        task_type: formData.task_type,
        task_date: formData.task_date,
        qty_done: Number(formData.qty_done),
        piece_rate: Number(formData.piece_rate)
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal mencatat upah borongan persiapan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upah Borongan Persiapan</h2>
              <p className="text-xs text-slate-400">Pencatatan Numbering & Press Kain Keras (Silma)</p>
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
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Nama Pekerja / Operator <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={formData.operator_id}
              onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Pilih Pekerja Pabrik --</option>
              {employees.map(emp => (
                <option key={emp.id_karyawan} value={emp.id_karyawan}>
                  {emp.nama} ({emp.jabatan || 'Operator'})
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
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {orders.map(so => (
                <option key={so.id} value={so.id}>
                  {so.so_number} - {so.style_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jenis Pekerjaan</label>
            <select
              value={formData.task_type}
              onChange={(e) => handleTaskTypeChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="PRESS_INTERLINING">PRESS KAIN KERAS (INTERLINING)</option>
              <option value="NUMBERING">NUMBERING LEMBARAN POLA</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kuantitas (Pcs)</label>
              <input
                type="number"
                min="1"
                value={formData.qty_done}
                onChange={(e) => setFormData({ ...formData, qty_done: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tarif Borongan (Rp/Pcs)</label>
              <input
                type="number"
                value={formData.piece_rate}
                onChange={(e) => setFormData({ ...formData, piece_rate: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Pengerjaan</label>
            <input
              type="date"
              value={formData.task_date}
              onChange={(e) => setFormData({ ...formData, task_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Wage Preview */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-300">Total Upah Diterima:</span>
            <span className="text-base font-black text-indigo-400">
              Rp {totalCalculatedWage.toLocaleString('id-ID')}
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
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Menyimpan..." : "Simpan Borongan"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
