"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import api from '@/services/api';

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalesOrderModal({ isOpen, onClose, onSuccess }: SalesOrderModalProps) {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    so_number: "",
    buyer_id: "",
    style_name: "",
    item_category: "LONG JEANS",
    color: "BLACK",
    order_qty: 0,
    unit_price: 35000,
    order_date: new Date().toISOString().split('T')[0],
    deadline: ""
  });

  // Size type: Numeric (28..40) or Alpha (S..3XL)
  const [sizeType, setSizeType] = useState<'NUMERIC' | 'ALPHA'>('NUMERIC');
  const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
    "28": 100,
    "30": 150,
    "32": 150,
    "34": 100
  });

  // BOM Accessories
  const [bomList, setBomList] = useState<{ item: string; qty_per_pcs: number }[]>([
    { item: "Kancing Utama Logam", qty_per_pcs: 1 },
    { item: "Resleting Kuningan YKK 5-inch", qty_per_pcs: 1 },
    { item: "Label Woven Merk", qty_per_pcs: 1 }
  ]);

  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBuyers();
    }
  }, [isOpen]);

  const fetchBuyers = async () => {
    setLoadingBuyers(true);
    try {
      const res = await api.get('/api/ppic/partners?category=BUYER');
      setBuyers(res.data || []);
      if (res.data && res.data.length > 0 && !formData.buyer_id) {
        setFormData(prev => ({ ...prev, buyer_id: res.data[0].id }));
      }
    } catch (err) {
      console.error("Gagal mengambil daftar buyer:", err);
    } finally {
      setLoadingBuyers(false);
    }
  };

  const handleSizeTypeSwitch = (type: 'NUMERIC' | 'ALPHA') => {
    setSizeType(type);
    if (type === 'NUMERIC') {
      setSizeMatrix({ "28": 100, "30": 150, "32": 150, "34": 100 });
    } else {
      setSizeMatrix({ "S": 50, "M": 150, "L": 200, "XL": 100 });
    }
  };

  const handleSizeQtyChange = (sizeKey: string, val: number) => {
    setSizeMatrix(prev => ({
      ...prev,
      [sizeKey]: Math.max(0, val)
    }));
  };

  const handleAddSizeKey = () => {
    const newKey = prompt("Masukkan nama ukuran baru (contoh: 36 atau XXL):");
    if (newKey && newKey.trim()) {
      setSizeMatrix(prev => ({ ...prev, [newKey.trim().toUpperCase()]: 0 }));
    }
  };

  const handleRemoveSizeKey = (key: string) => {
    const copy = { ...sizeMatrix };
    delete copy[key];
    setSizeMatrix(copy);
  };

  const totalCalculatedQty = Object.values(sizeMatrix).reduce((acc, q) => acc + (Number(q) || 0), 0);

  const handleAddBomItem = () => {
    setBomList(prev => [...prev, { item: "", qty_per_pcs: 1 }]);
  };

  const handleRemoveBomItem = (idx: number) => {
    setBomList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBomChange = (idx: number, field: string, val: any) => {
    setBomList(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.so_number.trim()) {
      setErrorMsg("Nomor Sales Order wajib diisi.");
      return;
    }
    if (!formData.style_name.trim()) {
      setErrorMsg("Nama Style garmen wajib diisi.");
      return;
    }
    if (totalCalculatedQty <= 0) {
      setErrorMsg("Total kuantitas breakdown ukuran harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/ppic/orders', {
        so_number: formData.so_number.toUpperCase(),
        buyer_id: formData.buyer_id || null,
        style_name: formData.style_name.toUpperCase(),
        item_category: formData.item_category,
        color: formData.color.toUpperCase(),
        order_qty: totalCalculatedQty,
        unit_price: Number(formData.unit_price) || 0,
        size_breakdown_target: sizeMatrix,
        bom_accessories: bomList.filter(b => b.item.trim().length > 0),
        order_date: formData.order_date,
        deadline: formData.deadline || null
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal menyimpan Sales Order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registrasi Sales Order Baru (PPIC)</h2>
              <p className="text-xs text-slate-400">Master Order, BOM Aksesoris & Matriks Ukuran</p>
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
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Baris 1: SO Number, Buyer, Style Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nomor SO (Code SO) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="SO-MG260004"
                value={formData.so_number}
                onChange={(e) => setFormData({ ...formData, so_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Buyer / Brand Pemesan <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.buyer_id}
                onChange={(e) => setFormData({ ...formData, buyer_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {buyers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Style / Model <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="WIND MILD BLACK"
                value={formData.style_name}
                onChange={(e) => setFormData({ ...formData, style_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase"
              />
            </div>
          </div>

          {/* Baris 2: Kategori, Warna, Ongkos CMT, Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategori Item</label>
              <select
                value={formData.item_category}
                onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="LONG JEANS">LONG JEANS</option>
                <option value="SHORT JEANS">SHORT JEANS</option>
                <option value="CARGO PANTS">CARGO PANTS</option>
                <option value="CHINO PANTS">CHINO PANTS</option>
                <option value="SS KEMEJA">SS KEMEJA</option>
                <option value="LS KEMEJA">LS KEMEJA</option>
                <option value="JACKET / OUTER">JACKET / OUTER</option>
                <option value="HOODIE">HOODIE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Warna</label>
              <input
                type="text"
                placeholder="BLACK / BLUE"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Harga CMT (Rp/Pcs)</label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Deadline Target</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 3: Dynamic Size Breakdown */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Rincian Matriks Ukuran (Size Breakdown)</h3>
                <p className="text-xs text-slate-400">Total Order: <span className="font-bold text-indigo-400">{totalCalculatedQty} Pcs</span></p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 border border-slate-700 p-0.5 rounded-lg flex text-xs">
                  <button
                    type="button"
                    onClick={() => handleSizeTypeSwitch('NUMERIC')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${sizeType === 'NUMERIC' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Celana (28-40)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSizeTypeSwitch('ALPHA')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${sizeType === 'ALPHA' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Atasan (S-3XL)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddSizeKey}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs rounded-lg flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Ukuran
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Object.entries(sizeMatrix).map(([sizeKey, qty]) => (
                <div key={sizeKey} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center relative group">
                  <span className="block text-xs font-bold text-slate-300 mb-1">{sizeKey}</span>
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => handleSizeQtyChange(sizeKey, parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1 px-2 text-center text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSizeKey(sizeKey)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: BOM Accessories */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Bill of Materials (BOM Trims & Aksesoris)</h3>
                <p className="text-xs text-slate-400">Kebutuhan aksesoris per 1 pcs garmen</p>
              </div>
              <button
                type="button"
                onClick={handleAddBomItem}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs rounded-lg flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                + Aksesoris
              </button>
            </div>

            <div className="space-y-2">
              {bomList.map((bom, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nama aksesoris (contoh: Kancing Logam 24L)"
                    value={bom.item}
                    onChange={(e) => handleBomChange(idx, 'item', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="w-32 flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={bom.qty_per_pcs}
                      onChange={(e) => handleBomChange(idx, 'qty_per_pcs', Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">pcs/baju</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBomItem(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
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
              {submitting ? "Menyimpan SO..." : "Daftarkan Sales Order"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
