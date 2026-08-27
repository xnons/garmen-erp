'use client';

import React, { useState, useEffect } from 'react';
import { ItemBahanBaku, LogTransaksiStok } from './types';
import { X, ArrowUpRight, ArrowDownLeft, RefreshCw, RotateCcw, Calendar, FileText, Hash, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StokMutasiModalProps {
    item: ItemBahanBaku | null;
    isOpen: boolean;
    onClose: () => void;
    onSaveMutasi: (itemId: string, transaction: LogTransaksiStok) => void;
}

export const StokMutasiModal: React.FC<StokMutasiModalProps> = ({
    item,
    isOpen,
    onClose,
    onSaveMutasi,
}) => {
    const [tipe, setTipe] = useState<'MASUK' | 'KELUAR_PRODUKSI' | 'PENYESUAIAN' | 'RETUR'>('MASUK');
    const [jumlah, setJumlah] = useState<number>(0);
    const [referensi, setReferensi] = useState<string>('');
    const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
    const [catatan, setCatatan] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        if (item) {
            setTipe('MASUK');
            setJumlah(0);
            setReferensi('');
            setTanggal(new Date().toISOString().split('T')[0]);
            setCatatan('');
            setErrorMsg('');
        }
    }, [item, isOpen]);

    if (!isOpen || !item) return null;

    // Hitung Estimasi Stok Sesudah Transaksi
    const isPenambahan = tipe === 'MASUK' || tipe === 'RETUR';
    const isPengurangan = tipe === 'KELUAR_PRODUKSI';

    let stokSesudah = item.stok_saat_ini;
    if (isPenambahan) {
        stokSesudah = item.stok_saat_ini + (jumlah || 0);
    } else if (isPengurangan) {
        stokSesudah = Math.max(0, item.stok_saat_ini - (jumlah || 0));
    } else if (tipe === 'PENYESUAIAN') {
        // Pada penyesuaian/stock opname, input 'jumlah' dijadikan stok fisik baru
        stokSesudah = jumlah || 0;
    }

    const isStokInsufficient = isPengurangan && (jumlah || 0) > item.stok_saat_ini;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (jumlah <= 0 && tipe !== 'PENYESUAIAN') {
            setErrorMsg('Jumlah mutasi harus lebih besar dari 0.');
            return;
        }

        if (isStokInsufficient) {
            setErrorMsg(`Stok tidak mencukupi! Stok saat ini hanya ${item.stok_saat_ini} ${item.satuan}.`);
            return;
        }

        const newTransaction: LogTransaksiStok = {
            id: `TRX-${Date.now()}`,
            tanggal,
            tipe,
            jumlah: Number(jumlah),
            stok_sebelum: item.stok_saat_ini,
            stok_sesudah: stokSesudah,
            referensi_po_spk: referensi || '-',
            catatan: catatan || (tipe === 'MASUK' ? 'Bahan masuk dari supplier' : 'Pengambilan produksi'),
            petugas: 'Admin Gudang'
        };

        onSaveMutasi(item.id, newTransaction);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all">
            <div className="w-full max-w-lg bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative animate-modal-pop backdrop-blur-xl space-y-5">

                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 font-mono">
                            MUTASI STOK GUDANG
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                            <span>{item.nama_item}</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">{item.kode_sku} • Rak: {item.lokasi_gudang}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status Ringkasan Stok Saat Ini */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                    <div>
                        <p className="text-[11px] text-slate-400 font-medium">Stok Awal</p>
                        <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                            {item.stok_saat_ini} <span className="text-xs text-slate-400">{item.satuan}</span>
                        </p>
                    </div>
                    <div className="border-x border-slate-800">
                        <p className="text-[11px] text-slate-400 font-medium">Perubahan</p>
                        <p className={`text-sm font-bold font-mono mt-0.5 ${isPenambahan ? 'text-emerald-400' : isPengurangan ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                            {isPenambahan ? '+' : isPengurangan ? '-' : ''}{jumlah || 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400 font-medium">Stok Akhir</p>
                        <p className={`text-sm font-bold font-mono mt-0.5 ${stokSesudah <= item.stok_minimum ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                            {stokSesudah} <span className="text-xs text-slate-400">{item.satuan}</span>
                        </p>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Form Input */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Select Tipe Mutasi (Pill Selector) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                            Jenis Transaksi
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setTipe('MASUK')}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${tipe === 'MASUK'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <ArrowDownLeft className="w-4 h-4" />
                                <span>Stok Masuk (PO)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTipe('KELUAR_PRODUKSI')}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${tipe === 'KELUAR_PRODUKSI'
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-500/10'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <ArrowUpRight className="w-4 h-4" />
                                <span>Keluar SPK Produksi</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTipe('PENYESUAIAN')}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${tipe === 'PENYESUAIAN'
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Stock Opname</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTipe('RETUR')}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${tipe === 'RETUR'
                                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-lg shadow-sky-500/10'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Retur Sisa</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Jumlah Input */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                                {tipe === 'PENYESUAIAN' ? 'Hasil Opname Fisik' : 'Jumlah Quantity'}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={jumlah || ''}
                                    onChange={(e) => setJumlah(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all pr-12"
                                />
                                <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-500">
                                    {item.satuan}
                                </span>
                            </div>
                        </div>

                        {/* Tanggal */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                Tanggal Transaksi
                            </label>
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Referensi Document PO/SPK */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            No. Referensi PO / SPK (Opsional)
                        </label>
                        <input
                            type="text"
                            value={referensi}
                            onChange={(e) => setReferensi(e.target.value)}
                            placeholder={tipe === 'MASUK' ? 'Contoh: PO-2026-088' : 'Contoh: SPK-2026-012'}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        />
                    </div>

                    {/* Catatan / Keterangan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Catatan Transaksi
                        </label>
                        <textarea
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            rows={2}
                            placeholder="Keterangan tambahan mutasi..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isStokInsufficient}
                            className={`w-1/2 py-3 font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${isStokInsufficient
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                                }`}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Simpan Mutasi</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default StokMutasiModal;