'use client';

import React, { useState, useEffect } from 'react';
import { ItemBahanBaku, KategoriBahan, SatuanBahan } from './types';
import {
    X, Package, Tag, Layers, MapPin, DollarSign,
    Truck, Hash, CheckCircle2, AlertTriangle, Palette
} from 'lucide-react';

interface BahanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<ItemBahanBaku>) => void;
    initialData?: ItemBahanBaku | null;
}

export const BahanFormModal: React.FC<BahanFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const isEditMode = Boolean(initialData);

    const [namaItem, setNamaItem] = useState('');
    const [kodeSku, setKodeSku] = useState('');
    const [kategori, setKategori] = useState<KategoriBahan>('KAIN');
    const [satuan, setSatuan] = useState<SatuanBahan>('KG');
    const [stokAwal, setStokAwal] = useState<number>(0);
    const [stokMinimum, setStokMinimum] = useState<number>(10);
    const [hargaPerSatuan, setHargaPerSatuan] = useState<number>(0);
    const [lokasiGudang, setLokasiGudang] = useState('');
    const [supplierUtama, setSupplierUtama] = useState('');
    const [warnaKode, setWarnaKode] = useState('#3b82f6');
    const [errorMsg, setErrorMsg] = useState('');

    // Generate SKU Otomatis berdasarkan Kategori jika Tambah Baru
    const generateAutoSku = (cat: KategoriBahan) => {
        const prefixMap: Record<KategoriBahan, string> = {
            KAIN: 'MAT-FAB',
            AKSESORIS: 'MAT-ACC',
            BENANG: 'MAT-THR',
            PACKAGING: 'MAT-PKG',
            LAINNYA: 'MAT-OTH' // 👈 Tambahkan baris ini
        };
        const randomNum = Math.floor(100 + Math.random() * 900);
        return `${prefixMap[cat] || 'MAT'}-${randomNum}`;
    };

    useEffect(() => {
        if (initialData) {
            setNamaItem(initialData.nama_item);
            setKodeSku(initialData.kode_sku);
            setKategori(initialData.kategori);
            setSatuan(initialData.satuan);
            setStokAwal(initialData.stok_saat_ini);
            setStokMinimum(initialData.stok_minimum);
            setHargaPerSatuan(initialData.harga_per_satuan);
            setLokasiGudang(initialData.lokasi_gudang);
            setSupplierUtama(initialData.supplier_utama || '');
            setWarnaKode(initialData.warna_kode || '#3b82f6');
        } else {
            setNamaItem('');
            setKategori('KAIN');
            setSatuan('KG');
            setKodeSku(generateAutoSku('KAIN'));
            setStokAwal(0);
            setStokMinimum(10);
            setHargaPerSatuan(0);
            setLokasiGudang('Gudang Utama');
            setSupplierUtama('');
            setWarnaKode('#3b82f6');
        }
        setErrorMsg('');
    }, [initialData, isOpen]);

    const handleKategoriChange = (cat: KategoriBahan) => {
        setKategori(cat);
        if (!isEditMode) {
            setKodeSku(generateAutoSku(cat));
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!namaItem.trim()) {
            setErrorMsg('Nama item bahan baku wajib diisi.');
            return;
        }

        if (!kodeSku.trim()) {
            setErrorMsg('Kode SKU wajib diisi.');
            return;
        }

        if (hargaPerSatuan < 0) {
            setErrorMsg('Harga satuan (HPP) tidak boleh kurang dari 0.');
            return;
        }

        const formData: Partial<ItemBahanBaku> = {
            id: initialData ? initialData.id : `ITEM-${Date.now()}`,
            nama_item: namaItem,
            kode_sku: kodeSku,
            kategori,
            satuan,
            stok_saat_ini: isEditMode ? initialData!.stok_saat_ini : Number(stokAwal),
            stok_minimum: Number(stokMinimum),
            harga_per_satuan: Number(hargaPerSatuan),
            lokasi_gudang: lokasiGudang || 'Gudang Utama',
            supplier_utama: supplierUtama || '-',
            warna_kode: warnaKode,
            status_stok: (isEditMode ? initialData!.stok_saat_ini : Number(stokAwal)) === 0
                ? 'HABIS'
                : (isEditMode ? initialData!.stok_saat_ini : Number(stokAwal)) <= Number(stokMinimum)
                    ? 'MENIPIS'
                    : 'AMAN',
            terakhir_diperbarui: new Date().toISOString().split('T')[0],
            riwayat_transaksi: initialData ? initialData.riwayat_transaksi : []
        };

        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all">
            <div className="w-full max-w-2xl bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative animate-modal-pop backdrop-blur-xl space-y-5 max-h-[90vh] overflow-y-auto">

                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {isEditMode ? 'Edit Master Bahan Baku' : 'Tambah Bahan Baku Baru'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {isEditMode ? `Mengubah spesifikasi untuk ${kodeSku}` : 'Daftarkan item material baru ke dalam inventaris gudang.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Banner Error */}
                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Form Input */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Grid Kategori & SKU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                Kategori Material
                            </label>
                            <select
                                value={kategori}
                                onChange={(e) => handleKategoriChange(e.target.value as KategoriBahan)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="KAIN">Kain (Fabric)</option>
                                <option value="AKSESORIS">Aksesoris (Zipper, Kancing, Label)</option>
                                <option value="BENANG">Benang Jahit</option>
                                <option value="PACKAGING">Packaging & Plastik</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                Kode SKU
                            </label>
                            <input
                                type="text"
                                value={kodeSku}
                                onChange={(e) => setKodeSku(e.target.value.toUpperCase())}
                                placeholder="Contoh: MAT-FAB-001"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Nama Item & Identifikasi Warna */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-indigo-400" />
                                Nama Item Bahan Baku
                            </label>
                            <input
                                type="text"
                                value={namaItem}
                                onChange={(e) => setNamaItem(e.target.value)}
                                placeholder="Contoh: Kain Combed 30s Black"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                                Kode Warna Visil
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={warnaKode}
                                    onChange={(e) => setWarnaKode(e.target.value)}
                                    className="w-10 h-9 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer p-1"
                                />
                                <input
                                    type="text"
                                    value={warnaKode}
                                    onChange={(e) => setWarnaKode(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grid Satuan, Stok & Reorder Minimum */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Satuan Ukur
                            </label>
                            <select
                                value={satuan}
                                onChange={(e) => setSatuan(e.target.value as SatuanBahan)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="KG">KG (Kilogram)</option>
                                <option value="YARD">YARD</option>
                                <option value="METER">METER</option>
                                <option value="PCS">PCS (Pieces)</option>
                                <option value="ROLL">ROLL</option>
                                <option value="CONE">CONE</option>
                                <option value="PACK">PACK</option>
                            </select>
                        </div>

                        {!isEditMode && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                                    <Hash className="w-3 h-3 text-indigo-400" />
                                    Stok Awal
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={stokAwal || ''}
                                    onChange={(e) => setStokAwal(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                        )}

                        <div className={isEditMode ? 'sm:col-span-2' : ''}>
                            <label className="block text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                Stok Minimum (Reorder Alert)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={stokMinimum || ''}
                                onChange={(e) => setStokMinimum(parseFloat(e.target.value) || 0)}
                                placeholder="10"
                                required
                                className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Harga HPP & Supplier */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                Harga Per Satuan (HPP Nominal)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">Rp</span>
                                <input
                                    type="number"
                                    value={hargaPerSatuan || ''}
                                    onChange={(e) => setHargaPerSatuan(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                                Supplier Utama
                            </label>
                            <input
                                type="text"
                                value={supplierUtama}
                                onChange={(e) => setSupplierUtama(e.target.value)}
                                placeholder="Contoh: PT Tekstil Nusantara"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Lokasi Rak Gudang */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            Lokasi Rak / Penyimpanan Gudang
                        </label>
                        <input
                            type="text"
                            value={lokasiGudang}
                            onChange={(e) => setLokasiGudang(e.target.value)}
                            placeholder="Contoh: Gudang Utama - Rak A1"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isEditMode ? 'Simpan Perubahan' : 'Tambah Bahan Baku'}</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default BahanFormModal;