"use client";

import React, { useRef } from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface PrintSuratJalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  suratJalanNo: string;
  dateStr: string;
  senderName?: string;
  senderRole?: string;
  recipientName?: string;
  recipientCategory?: string;
  driverName?: string;
  soNumber: string;
  styleName: string;
  itemCategory?: string;
  totalQty: number;
  unit?: string;
  sizeBreakdown?: Record<string, number>;
  remarks?: string;
  customDetails?: { label: string; value: string | number }[];
}

export default function PrintSuratJalanModal({
  isOpen,
  onClose,
  title,
  suratJalanNo,
  dateStr,
  senderName = "Gudang / PPIC",
  senderRole = "Pengirim",
  recipientName = "Subcon / Buyer",
  recipientCategory = "Penerima",
  driverName = "Sandi (Driver Logistik)",
  soNumber,
  styleName,
  itemCategory = "Pakaian Jadi / Pola",
  totalQty,
  unit = "PCS",
  sizeBreakdown = {},
  remarks = "-",
  customDetails = []
}: PrintSuratJalanModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const hasSizeBreakdown = sizeBreakdown && Object.keys(sizeBreakdown).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white">
        
        {/* Header Bar Modal (Hidden saat print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pratinjau Dokumen Fisik</h2>
              <p className="text-xs text-slate-400">Standar Surat Jalan Resmi PT. Chikal Jaya Makmur</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen (Print / PDF)
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Area (A4 / 2-Ply Style) */}
        <div ref={printAreaRef} className="p-8 bg-white text-slate-900 font-sans print:p-4 print:text-black">
          
          {/* Header Kop Surat */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-wider text-slate-950">PT. CHIKAL JAYA MAKMUR</h1>
                <p className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  GARMENT MANUFACTURER & APPAREL PRODUCTION
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Kutawaringin Industrial Estate, Bandung, Jawa Barat | Telp: (022) 589-XXXX
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-sm tracking-wider uppercase rounded">
                  {title}
                </div>
                <p className="text-xs font-mono font-bold text-slate-800 mt-2">NO: {suratJalanNo}</p>
                <p className="text-xs text-slate-600">Tgl: {dateStr}</p>
              </div>
            </div>
          </div>

          {/* Grid Informasi Pihak Terlibat */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-300 rounded-lg mb-6 text-xs print:bg-transparent">
            <div>
              <p className="font-bold text-slate-700 uppercase mb-1">DARI (PENGIRIM):</p>
              <p className="text-sm font-black text-slate-900">{senderName}</p>
              <p className="text-slate-600">Bagian: {senderRole}</p>
              <p className="text-slate-600">Ekspedisi / Supir: <span className="font-semibold text-slate-800">{driverName}</span></p>
            </div>
            <div>
              <p className="font-bold text-slate-700 uppercase mb-1">KEPADA (PENERIMA):</p>
              <p className="text-sm font-black text-slate-900">{recipientName}</p>
              <p className="text-slate-600">Kategori / Unit: {recipientCategory}</p>
              <p className="text-slate-600">Tujuan: Lini Produksi / Gudang Vendor</p>
            </div>
          </div>

          {/* Tabel Detail Barang / Produksi */}
          <table className="w-full border-collapse border border-slate-400 text-xs mb-6">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold print:bg-slate-100">
                <th className="border border-slate-400 px-3 py-2 text-left w-12">NO</th>
                <th className="border border-slate-400 px-3 py-2 text-left">DESKRIPSI BARANG / SALES ORDER</th>
                <th className="border border-slate-400 px-3 py-2 text-left w-36">STYLE & KATEGORI</th>
                <th className="border border-slate-400 px-3 py-2 text-right w-24">QTY</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-20">SATUAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 px-3 py-3 text-center font-bold">1</td>
                <td className="border border-slate-400 px-3 py-3">
                  <p className="font-bold text-sm text-slate-950">{soNumber}</p>
                  <p className="text-slate-600">Keterangan: {remarks}</p>
                  {customDetails.map((cd, idx) => (
                    <p key={idx} className="text-slate-600 mt-0.5">• {cd.label}: <span className="font-medium text-slate-800">{cd.value}</span></p>
                  ))}
                </td>
                <td className="border border-slate-400 px-3 py-3">
                  <p className="font-bold text-slate-900">{styleName}</p>
                  <p className="text-slate-600">{itemCategory}</p>
                </td>
                <td className="border border-slate-400 px-3 py-3 text-right font-black text-sm text-slate-950">
                  {totalQty.toLocaleString('id-ID')}
                </td>
                <td className="border border-slate-400 px-3 py-3 text-center font-bold uppercase text-slate-700">
                  {unit}
                </td>
              </tr>

              {/* Rincian Matriks Ukuran (Size Breakdown) */}
              {hasSizeBreakdown && (
                <tr className="bg-slate-50 print:bg-transparent">
                  <td colSpan={5} className="border border-slate-400 px-4 py-3">
                    <p className="font-bold text-slate-800 mb-2 uppercase text-[11px]">
                      RINCIAN BREAKDOWN UKURAN (SIZE MATRIX):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sizeBreakdown).map(([sz, qty]) => (
                        <div key={sz} className="border border-slate-300 rounded px-2.5 py-1 text-center bg-white">
                          <span className="block font-bold text-slate-900 text-xs">{sz}</span>
                          <span className="block font-black text-blue-700 text-xs">{qty} {unit}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-black text-slate-950">
                <td colSpan={3} className="border border-slate-400 px-3 py-2 text-right uppercase">
                  TOTAL KUANTITAS:
                </td>
                <td className="border border-slate-400 px-3 py-2 text-right text-sm">
                  {totalQty.toLocaleString('id-ID')}
                </td>
                <td className="border border-slate-400 px-3 py-2 text-center uppercase">
                  {unit}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Catatan Syarat & Ketentuan */}
          <div className="text-[10px] text-slate-600 mb-8 p-2 border-l-2 border-slate-400 bg-slate-50 print:bg-transparent">
            <p className="font-bold text-slate-800">PERHATIAN / SYARAT PENERIMAAN:</p>
            <p>1. Barang wajib dihitung dan diperiksa kualitas fisiknya saat serah terima berlangsung.</p>
            <p>2. Komplain selisih kuantitas atau kerusakan material tanpa bukti surat jalan sah maksimal 1x24 jam.</p>
            <p>3. Lembar 1: Kantor Pusat / Keuangan | Lembar 2: Vendor Subcon / Penerima | Lembar 3: Ekspedisi / Supir.</p>
          </div>

          {/* Kolom 3 Tanda Tangan Resmi */}
          <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4">
            <div>
              <p className="font-bold text-slate-700">Dibuat Oleh (Pengirim)</p>
              <div className="h-20 flex items-end justify-center">
                <p className="border-b border-slate-900 pb-1 font-bold text-slate-900 w-40">
                  ( {senderName} )
                </p>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{senderRole}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Petugas Ekspedisi / Supir</p>
              <div className="h-20 flex items-end justify-center">
                <p className="border-b border-slate-900 pb-1 font-bold text-slate-900 w-40">
                  ( {driverName} )
                </p>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Driver Distribusi</p>
            </div>

            <div>
              <p className="font-bold text-slate-700">Diterima Oleh (Penerima)</p>
              <div className="h-20 flex items-end justify-center">
                <p className="border-b border-slate-900 pb-1 font-bold text-slate-900 w-40">
                  ( {recipientName} )
                </p>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Nama Jelas & Cap Stempel</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
