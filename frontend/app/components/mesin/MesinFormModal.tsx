'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Pencil,
    Plus,
    Building2,
    Wallet,
    Calculator,
    CreditCard
} from 'lucide-react';
import { MesinAsset, PaymentStatus } from './types';

interface MesinFormModalProps {
    isOpen: boolean;
    initialData?: MesinAsset | null;
    onClose: () => void;
    onSave: (data: Partial<MesinAsset>) => void;
}

export default function MesinFormModal({ isOpen, initialData, onClose, onSave }: MesinFormModalProps) {
    const [formData, setFormData] = useState<Partial<MesinAsset>>({
        kode_mesin: '',
        nama_mesin: '',
        kategori: 'Sewing',
        merk_model: '',
        no_seri: '',
        vendor_supplier: '',
        lokasi_line: 'Line 01',
        status: 'AKTIF',
        harga_beli: 10000000,
        nilai_sisa: 1000000,
        umur_ekonomis_tahun: 5,
        tanggal_pembelian: new Date().toISOString().split('T')[0],
        garansi_hingga: '',
        status_pembayaran: 'LUNAS',
        jumlah_terbayar: 10000000,
    });

    useEffect(() => {
        if (initialData) {
            // 🟢 Fallback safe values untuk mencegah controlled input warning
            setFormData({
                ...initialData,
                kode_mesin: initialData.kode_mesin || '',
                nama_mesin: initialData.nama_mesin || '',
                kategori: initialData.kategori || 'Sewing',
                merk_model: initialData.merk_model || '',
                no_seri: initialData.no_seri || '',
                vendor_supplier: initialData.vendor_supplier || '',
                lokasi_line: initialData.lokasi_line || 'Line 01',
                status: initialData.status || 'AKTIF',
                harga_beli: initialData.harga_beli ?? 0,
                nilai_sisa: initialData.nilai_sisa ?? 0,
                umur_ekonomis_tahun: initialData.umur_ekonomis_tahun ?? 5,
                tanggal_pembelian: initialData.tanggal_pembelian || new Date().toISOString().split('T')[0],
                garansi_hingga: initialData.garansi_hingga || '',
                status_pembayaran: initialData.status_pembayaran || 'LUNAS',
                jumlah_terbayar: initialData.jumlah_terbayar ?? 0,
            });
        } else {
            setFormData({
                kode_mesin: `MSN-${Math.floor(100 + Math.random() * 900)}`,
                nama_mesin: '',
                kategori: 'Sewing',
                merk_model: '',
                no_seri: '',
                vendor_supplier: '',
                lokasi_line: 'Line 01',
                status: 'AKTIF',
                harga_beli: 12000000,
                nilai_sisa: 2000000,
                umur_ekonomis_tahun: 5,
                tanggal_pembelian: new Date().toISOString().split('T')[0],
                garansi_hingga: '',
                status_pembayaran: 'LUNAS',
                jumlah_terbayar: 12000000,
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    // 🟢 Safe Calculation Parsing
    const hargaBeli = Number(formData.harga_beli) || 0;
    const nilaiSisa = Number(formData.nilai_sisa) || 0;
    const umurTahun = Number(formData.umur_ekonomis_tahun) || 1;
    const jumlahTerbayar = Number(formData.jumlah_terbayar) || 0;

    const sisaPembayaran = Math.max(0, hargaBeli - jumlahTerbayar);
    const depresiasiBulan = Math.max(0, (hargaBeli - nilaiSisa) / (umurTahun * 12));

    // 🟢 Safe IDR Formatter
    const formatIDR = (val: any) => {
        const num = Number(val);
        if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const handleStatusBayarChange = (status: PaymentStatus) => {
        let terbayar = jumlahTerbayar;
        if (status === 'LUNAS') terbayar = hargaBeli;
        if (status === 'BELUM_BAYAR') terbayar = 0;
        setFormData(prev => ({
            ...prev,
            status_pembayaran: status,
            jumlah_terbayar: terbayar
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            jumlah_terbayar: jumlahTerbayar,
            sisa_pembayaran: sisaPembayaran,
            depresiasi_per_bulan: Math.round(depresiasiBulan),
            nilai_buku_saat_ini: formData.nilai_buku_saat_ini ?? hargaBeli,
            riwayat_pembayaran: formData.riwayat_pembayaran || [
                {
                    id: Date.now().toString(),
                    tanggal: formData.tanggal_pembelian || new Date().toISOString().split('T')[0],
                    jumlah: jumlahTerbayar,
                    catatan: 'DP / Pembayaran Awal Mesin',
                }
            ]
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            {initialData ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {initialData ? 'Edit Spesifikasi Mesin' : 'Registrasi Mesin Baru'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Lengkapi identitas mesin, info vendor, dan status skema pembayaran.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Identitas & Garansi */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                            <Building2 className="w-4 h-4" />
                            <span>1. Identitas Mesin & Vendor</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Kode Mesin *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.kode_mesin || ''}
                                    onChange={e => setFormData({ ...formData, kode_mesin: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all font-mono"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nama Mesin / Perangkat *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="misal: Juki High Speed Auto Trimmer"
                                    value={formData.nama_mesin || ''}
                                    onChange={e => setFormData({ ...formData, nama_mesin: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Kategori</label>
                                <select
                                    value={formData.kategori || 'Sewing'}
                                    onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none cursor-pointer"
                                >
                                    <option value="Sewing">Sewing (Jahit)</option>
                                    <option value="Cutting">Cutting (Potong)</option>
                                    <option value="Finishing">Finishing & Pressing</option>
                                    <option value="Obras">Obras / Overlock</option>
                                    <option value="Bordir">Bordir Komputer</option>
                                    <option value="Utility">Utility / Generator</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Merk & Tipe Model</label>
                                <input
                                    type="text"
                                    placeholder="Juki DDL-9000C"
                                    value={formData.merk_model || ''}
                                    onChange={e => setFormData({ ...formData, merk_model: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nomor Seri (Serial No)</label>
                                <input
                                    type="text"
                                    placeholder="SN-9823102391"
                                    value={formData.no_seri || ''}
                                    onChange={e => setFormData({ ...formData, no_seri: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 outline-none transition-all font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Vendor / Toko Supplier</label>
                                <input
                                    type="text"
                                    placeholder="PT. Sinar Mesin Garment"
                                    value={formData.vendor_supplier || ''}
                                    onChange={e => setFormData({ ...formData, vendor_supplier: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Lokasi Line Produksi</label>
                                <input
                                    type="text"
                                    value={formData.lokasi_line || ''}
                                    onChange={e => setFormData({ ...formData, lokasi_line: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Masa Garansi Hingga</label>
                                <input
                                    type="date"
                                    value={formData.garansi_hingga || ''}
                                    onChange={e => setFormData({ ...formData, garansi_hingga: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Skema Finansial & Pembayaran */}
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <Wallet className="w-4 h-4" />
                            <span>2. Finansial & Skema Pembayaran</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Harga Beli Total (IDR)</label>
                                <input
                                    type="number"
                                    value={formData.harga_beli ?? 0}
                                    onChange={e => setFormData({ ...formData, harga_beli: Number(e.target.value) })}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none transition-all font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Status Pembayaran</label>
                                <select
                                    value={formData.status_pembayaran || 'LUNAS'}
                                    onChange={e => handleStatusBayarChange(e.target.value as PaymentStatus)}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none cursor-pointer"
                                >
                                    <option value="LUNAS">Lunas (100%)</option>
                                    <option value="DICICIL">Dicicil / Angsuran</option>
                                    <option value="BELUM_BAYAR">Belum Dibayar</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nominal Terbayar (IDR)</label>
                                <input
                                    type="number"
                                    value={formData.jumlah_terbayar ?? 0}
                                    onChange={e => setFormData({ ...formData, jumlah_terbayar: Number(e.target.value) })}
                                    disabled={formData.status_pembayaran === 'LUNAS'}
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50 transition-all font-mono"
                                />
                            </div>
                        </div>

                        {/* Live Calculation Banner */}
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                            <div className="flex items-start gap-2.5">
                                <CreditCard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-slate-400">Sisa Utang Pembelian:</span>
                                    <p className={`text-base font-bold font-mono mt-0.5 ${sisaPembayaran > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {formatIDR(sisaPembayaran)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Calculator className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-slate-400">Estimasi Penyusutan / Bulan:</span>
                                    <p className="text-base font-bold font-mono text-rose-400 mt-0.5">
                                        {formatIDR(Math.round(depresiasiBulan))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                        >
                            Simpan Data Mesin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}