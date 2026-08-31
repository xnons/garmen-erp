"use client";

import React, { useState, useEffect } from 'react';
import { X, FileText, Printer, CheckCircle2, DollarSign, Calculator, ArrowUpRight } from 'lucide-react';
import api from '@/services/api';

interface FormWIModalProps {
  isOpen: boolean;
  onClose: () => void;
  soId: string;
}

export default function FormWIModal({ isOpen, onClose, soId }: FormWIModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && soId) {
      fetchSettlement();
    }
  }, [isOpen, soId]);

  const fetchSettlement = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/shipping/form-wi/${soId}`);
      setData(res.data);
    } catch (err) {
      console.error("Gagal mengambil data Form WI Settlement:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:w-full print:bg-white">
        
        {/* Header (Hidden saat cetak) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Form WI — Rekapitulasi Tagihan CMT</h2>
              <p className="text-xs text-slate-400">Perhitungan Ongkos CMT, Potongan Bahan & Net Settlement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4" /> Cetak Form WI
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            Memuat kalkulasi Form WI...
          </div>
        ) : !data ? (
          <div className="py-16 text-center text-rose-400">
            Gagal memuat rincian tagihan.
          </div>
        ) : (
          <div className="p-8 text-slate-100 print:text-black print:p-4 space-y-6">
            
            {/* Header Form */}
            <div className="border-b-2 border-slate-800 print:border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-white print:text-black">PT. CHIKAL JAYA MAKMUR</h1>
                <p className="text-xs text-slate-400 print:text-slate-700 font-semibold uppercase">
                  FORM WI — REKAPITULASI BILLING & SETTLEMENT CMT
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 print:bg-slate-200 print:text-black font-mono font-bold text-xs rounded">
                  {data.so_number}
                </span>
                <p className="text-xs text-slate-400 print:text-slate-700 mt-1">Buyer: <strong className="text-white print:text-black">{data.buyer_name}</strong></p>
              </div>
            </div>

            {/* Grid Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Style Garmen:</span>
                <span className="font-bold text-white print:text-black text-sm">{data.style_name}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Target Order:</span>
                <span className="font-bold text-white print:text-black text-sm">{data.order_qty.toLocaleString('id-ID')} Pcs</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Total Terkirim (SJP):</span>
                <span className="font-bold text-emerald-400 print:text-black text-sm">{data.total_shipped.toLocaleString('id-ID')} Pcs</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-slate-600 block">Ongkos CMT / Pcs:</span>
                <span className="font-bold text-emerald-400 print:text-black text-sm">Rp {(data.unit_price_cmt || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Financial Calculations Table */}
            <table className="w-full border-collapse border border-slate-700 print:border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-300 print:bg-slate-200 print:text-black font-bold">
                  <th className="border border-slate-700 print:border-slate-400 px-3 py-2 text-left">KOMPONEN PERHITUNGAN BIAYA</th>
                  <th className="border border-slate-700 print:border-slate-400 px-3 py-2 text-right w-48">NOMINAL (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                <tr>
                  <td className="border border-slate-700 print:border-slate-400 px-3 py-2.5">
                    <strong>1. Total Pendapatan Kotor CMT (Gross CMT)</strong>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">{data.total_shipped} Pcs × Rp {(data.unit_price_cmt || 0).toLocaleString('id-ID')}</p>
                  </td>
                  <td className="border border-slate-700 print:border-slate-400 px-3 py-2.5 text-right font-bold text-emerald-400 print:text-black">
                    Rp {data.total_gross_cmt.toLocaleString('id-ID')}
                  </td>
                </tr>

                <tr>
                  <td className="border border-slate-700 print:border-slate-400 px-3 py-2.5">
                    <strong>2. Potongan Pemakaian Bahan Baku (Jika Sistem CMT/Potong Bahan)</strong>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">Total nilai kain yang dikeluarkan untuk SO</p>
                  </td>
                  <td className="border border-slate-700 print:border-slate-400 px-3 py-2.5 text-right font-bold text-rose-400 print:text-black">
                    - Rp {data.total_material_deduction.toLocaleString('id-ID')}
                  </td>
                </tr>

                <tr className="bg-emerald-950/20 print:bg-slate-100 font-black text-sm">
                  <td className="border border-slate-700 print:border-slate-400 px-3 py-3 uppercase">
                    TOTAL TAGIHAN BERSIH KE BUYER (NET RECEIVABLE)
                  </td>
                  <td className="border border-slate-700 print:border-slate-400 px-3 py-3 text-right text-emerald-400 print:text-black text-base">
                    Rp {data.net_billing_amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Riwayat Surat Jalan Pengiriman */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 print:text-black uppercase mb-2">
                Rincian Surat Jalan Pengiriman (SJP):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.shipment_list && data.shipment_list.map((s: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-lg text-xs flex justify-between">
                    <div>
                      <span className="font-bold text-white print:text-black">{s.sjp_number}</span>
                      <span className="text-slate-400 print:text-slate-600 block text-[11px]">Tgl: {s.date}</span>
                    </div>
                    <span className="font-black text-emerald-400 print:text-black">{s.qty} Pcs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolom Tanda Tangan */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs pt-8">
              <div>
                <p className="font-bold text-slate-400 print:text-slate-700">Dibuat Oleh (Finance / Admin)</p>
                <div className="h-16 flex items-end justify-center">
                  <p className="border-b border-slate-600 print:border-slate-900 pb-1 font-bold w-36 text-white print:text-black">
                    ( Bagian Keuangan )
                  </p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-400 print:text-slate-700">Disetujui Oleh (Direktur / Buyer)</p>
                <div className="h-16 flex items-end justify-center">
                  <p className="border-b border-slate-600 print:border-slate-900 pb-1 font-bold w-36 text-white print:text-black">
                    ( Pimpinan )
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
