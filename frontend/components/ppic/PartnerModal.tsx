"use client";

import React, { useState, useEffect } from 'react';
import { X, Users, AlertCircle } from 'lucide-react';
import api from '@/services/api';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function PartnerModal({ isOpen, onClose, onSuccess, initialData }: PartnerModalProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    name: "",
    category: "BUYER",
    code: "",
    phone: "",
    address: ""
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          category: initialData.category || "BUYER",
          code: initialData.code || "",
          phone: initialData.phone || "",
          address: initialData.address || ""
        });
      } else {
        setFormData({
          name: "",
          category: "BUYER",
          code: "",
          phone: "",
          address: ""
        });
      }
      setErrorMsg("");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Nama Rekanan / Partner wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim().toUpperCase(),
        category: formData.category,
        code: formData.code.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined
      };

      if (isEditing) {
        await api.put(`/api/ppic/partners/${initialData.id}`, payload);
      } else {
        await api.post('/api/ppic/partners', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal menyimpan data partner.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? `Edit Rekanan: ${formData.name}` : 'Tambah Master Rekanan Baru'}
              </h2>
              <p className="text-xs text-slate-400">Database Buyer, Supplier Kain & Subcon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Rekanan / Perusahaan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: WILMER STUDIOS / CV. JAHIT JAYA"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kategori Partner <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="BUYER">BUYER (BRAND)</option>
                <option value="SUPPLIER_FABRIC">SUPPLIER KAIN</option>
                <option value="MAKLUN_SEWING">MAKLUN SEWING</option>
                <option value="SUBCON_WASHING">SUBCON WASHING</option>
                <option value="SUBCON_PRINT">SUBCON PRINT</option>
                <option value="SUBCON_EMBROIDERY">SUBCON BORDIR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kode / ID Unik
              </label>
              <input
                type="text"
                placeholder="Auto jika kosong"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              placeholder="0812-xxxx-xxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alamat Operasional
            </label>
            <textarea
              rows={2}
              placeholder="Alamat workshop / kantor rekanan..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Rekanan"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
