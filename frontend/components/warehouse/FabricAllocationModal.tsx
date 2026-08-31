"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, PackageCheck, Scissors } from 'lucide-react';
import api from '@/services/api';

interface FabricAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items: any[];
}

export default function FabricAllocationModal({
  isOpen,
  onClose,
  onSuccess,
  items
}: FabricAllocationModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    so_id: "",
    item_id: items.length > 0 ? items[0].id : "",
    dispatch_date: new Date().toISOString().split('T')[0],
    qty_issued: 100,
    surat_jalan_no: `CJM-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}.101`
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/ppic/orders');
      setOrders(res.data || []);
      if (res.data && res.data.length > 0 && !formData.so_id) {
        setFormData(prev => ({ ...prev, so_id: res.data[0].id }));
      }
    } catch (err) {
      console.error("Gagal mengambil Sales Orders:", err);
    }
  };

  if (!isOpen) return null;

  const selectedItem = items.find(i => i.id === formData.item_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.so_id) {
      setErrorMsg("Pilih Sales Order tujuan alokasi.");
      return;
    }
    if (!formData.item_id) {
      setErrorMsg("Pilih item kain yang akan diserahkan.");
      return;
    }
    if (formData.qty_issued <= 0) {
      setErrorMsg("Jumlah yard kain harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/warehouse/allocations', {
        so_id: formData.so_id,
        item_id: formData.item_id,
        dispatch_date: formData.dispatch_date,
        qty_issued: Number(formData.qty_issued),
        surat_jalan_no: formData.surat_jalan_no.toUpperCase()
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal mengalokasikan kain.");
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
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alokasi Bahan ke Meja Potong</h2>
              <p className="text-xs text-slate-400">Surat Jalan Penyerahan Kain Mentah (Sheet25)</p>
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
          
          {/* Pilih Sales Order */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sales Order (SO Target) <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.so_id}
              onChange={(e) => setFormData({ ...formData, so_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {orders.map((so) => (
                <option key={so.id} value={so.id}>
                  {so.so_number} - {so.style_name} ({so.order_qty} Pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Item Kain */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Item Kain / Puring <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.item_code} - {i.description} (Stok Live: {i.current_stock} {i.unit})
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="text-[11px] text-slate-400 mt-1">
                Stok Tersedia: <span className="font-bold text-amber-400">{selectedItem.current_stock} {selectedItem.unit}</span>
              </p>
            )}
          </div>

          {/* Qty & Surat Jalan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Jumlah Dikeluarkan (Yard) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.qty_issued}
                onChange={(e) => setFormData({ ...formData, qty_issued: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nomor Surat Jalan (Sheet25)
              </label>
              <input
                type="text"
                value={formData.surat_jalan_no}
                onChange={(e) => setFormData({ ...formData, surat_jalan_no: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 uppercase font-mono"
              />
            </div>
          </div>

          {/* Tgl Pengeluaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Serah Terima</label>
            <input
              type="date"
              value={formData.dispatch_date}
              onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              {submitting ? "Memproses..." : "Keluarkan Bahan"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
