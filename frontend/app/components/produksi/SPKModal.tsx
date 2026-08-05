"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import {
    X,
    Save,
    AlertCircle,
    Loader2,
    Calculator,
    User,
    ShoppingBag,
    Sparkles,
    DollarSign,
    Layers,
    Package,
    FolderSymlink,
    FileCheck,
    Coins
} from 'lucide-react';
import { produksiService, TahapanProses, PrioritasSPK } from '../services/produksiService';

interface SPKModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface TarifInput {
    tahapan_proses: TahapanProses;
    tarif_per_pcs: number;
}

const TAHAPAN_LABELS: Record<TahapanProses, string> = {
    CUTTING: '1. Cutting',
    PERSIAPAN_PRESS: '2. Persiapan Press',
    SEWING: '3. Sewing Utama',
    BUANG_BENANG: '4. Buang Benang',
    FINISHING_PRESS: '5. Finishing Press',
    PACKING: '6. Packing & Lipat',
};

export default function SPKModal({ isOpen, onClose, onSuccess }: SPKModalProps) {
    // 1. Identitas SPK & Artikel
    const [idSpk, setIdSpk] = useState('');
    const [namaArtikel, setNamaArtikel] = useState('');
    const [kategoriProduk, setKategoriProduk] = useState('Kemeja');
    const [prioritas, setPrioritas] = useState<PrioritasSPK>('NORMAL');

    // 2. Customer & Buyer Info
    const [namaPemesan, setNamaPemesan] = useState('');
    const [kontakPemesan, setKontakPemesan] = useState('');
    const [noPoBuyer, setNoPoBuyer] = useState('');
    const [dpNominal, setDpNominal] = useState<number | ''>('');

    // 3. Skema Material & Order Type
    const [tipeOrder, setTipeOrder] = useState<'CMT' | 'FOB' | 'HYBRID'>('CMT');
    const [penyediaKain, setPenyediaKain] = useState<'CUSTOMER' | 'PABRIK'>('CUSTOMER');
    const [penyediaAksesoris, setPenyediaAksesoris] = useState<'CUSTOMER' | 'PABRIK'>('CUSTOMER');
    const [jenisKain, setJenisKain] = useState('');
    const [warnaKain, setWarnaKain] = useState('');
    const [konsumsiKainPerPcs, setKonsumsiKainPerPcs] = useState<number | ''>(1.2);

    // 4. Modal Material & Maklon Luar (Sablon/Bordir)
    const [biayaKainPerPcs, setBiayaKainPerPcs] = useState<number | ''>('');
    const [biayaAksesorisPerPcs, setBiayaAksesorisPerPcs] = useState<number | ''>('');
    const [biayaMaklonLuarPerPcs, setBiayaMaklonLuarPerPcs] = useState<number | ''>('');

    // 5. Size Matrix Breakdown
    const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0,
    });

    // 6. Assets & Schedule
    const [linkGoogleDrive, setLinkGoogleDrive] = useState('');
    const [statusAccSampel, setStatusAccSampel] = useState<'APPROVED' | 'PENDING' | 'REVISION'>('APPROVED');
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [deadline, setDeadline] = useState('');
    const [deskripsi, setDeskripsi] = useState('');

    // 7. Commercial Pricing
    const [hargaJualPerPcs, setHargaJualPerPcs] = useState<number | ''>('');

    // Submitting States
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Default master tarif borongan awal per sub-proses
    const [tarifList, setTarifList] = useState<TarifInput[]>([
        { tahapan_proses: 'CUTTING', tarif_per_pcs: 500 },
        { tahapan_proses: 'PERSIAPAN_PRESS', tarif_per_pcs: 300 },
        { tahapan_proses: 'SEWING', tarif_per_pcs: 3500 },
        { tahapan_proses: 'BUANG_BENANG', tarif_per_pcs: 400 },
        { tahapan_proses: 'FINISHING_PRESS', tarif_per_pcs: 600 },
        { tahapan_proses: 'PACKING', tarif_per_pcs: 300 },
    ]);

    // 🔄 Auto-Generate Kode SPK: Format `383-[NAMA_ARTIKEL]-[TAHUN]`
    useEffect(() => {
        if (isOpen) {
            const year = new Date().getFullYear();
            const prefix = '383';
            if (namaArtikel.trim()) {
                const cleanArtikel = namaArtikel
                    .trim()
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '-');
                setIdSpk(`${prefix}-${cleanArtikel}-${year}`);
            } else {
                setIdSpk(`${prefix}-ARTIKEL-${year}`);
            }
        }
    }, [namaArtikel, isOpen]);

    // Sinkronkan penyedia bahan otomatis berdasarkan Tipe Order
    useEffect(() => {
        if (tipeOrder === 'CMT') {
            setPenyediaKain('CUSTOMER');
            setPenyediaAksesoris('CUSTOMER');
            setBiayaKainPerPcs('');
            setBiayaAksesorisPerPcs('');
        } else if (tipeOrder === 'FOB') {
            setPenyediaKain('PABRIK');
            setPenyediaAksesoris('PABRIK');
        }
    }, [tipeOrder]);

    // Reset Form Modal Saat Dibuka
    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setTanggalMulai(today);

            const nextTwoWeeks = new Date();
            nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
            setDeadline(nextTwoWeeks.toISOString().split('T')[0]);

            setNamaArtikel('');
            setNamaPemesan('');
            setKontakPemesan('');
            setNoPoBuyer('');
            setDpNominal('');
            setJenisKain('');
            setWarnaKain('');
            setLinkGoogleDrive('');
            setDeskripsi('');
            setHargaJualPerPcs('');
            setBiayaKainPerPcs('');
            setBiayaAksesorisPerPcs('');
            setBiayaMaklonLuarPerPcs('');
            setKonsumsiKainPerPcs(1.2);
            setTipeOrder('CMT');
            setStatusAccSampel('APPROVED');
            setSizeMatrix({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
            setErrorMsg('');
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // 🧮 Hitung Metrics Finansial & HPP Gabungan
    const totalTargetQty = Object.values(sizeMatrix).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    const totalTarifBoronganPcs = tarifList.reduce((acc, curr) => acc + (curr.tarif_per_pcs || 0), 0);

    const biayaKainVal = tipeOrder !== 'CMT' ? (Number(biayaKainPerPcs) || 0) : 0;
    const biayaAksesorisVal = tipeOrder !== 'CMT' ? (Number(biayaAksesorisPerPcs) || 0) : 0;
    const biayaMaklonLuarVal = Number(biayaMaklonLuarPerPcs) || 0;

    // HPP Total = Borongan + Kain + Aksesoris + Maklon Luar (Sablon/Bordir)
    const totalHppPerPcs = totalTarifBoronganPcs + biayaKainVal + biayaAksesorisVal + biayaMaklonLuarVal;
    const hargaJualVal = Number(hargaJualPerPcs) || 0;

    const grossOmsetTotal = totalTargetQty * hargaJualVal;
    const totalHppProjectTotal = totalTargetQty * totalHppPerPcs;
    const marginPerPcs = hargaJualVal - totalHppPerPcs;
    const marginPercentage = hargaJualVal > 0 ? ((marginPerPcs / hargaJualVal) * 100).toFixed(1) : '0';
    const estKebutuhanKainMeter = totalTargetQty * (Number(konsumsiKainPerPcs) || 0);

    const handleSizeChange = (sizeKey: string, val: string) => {
        const numVal = Math.max(0, parseInt(val, 10) || 0);
        setSizeMatrix((prev) => ({ ...prev, [sizeKey]: numVal }));
    };

    const handleTarifChange = (index: number, val: string) => {
        const updated = [...tarifList];
        const numVal = parseInt(val, 10);
        updated[index].tarif_per_pcs = isNaN(numVal) ? 0 : Math.max(0, numVal);
        setTarifList(updated);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!namaArtikel.trim() || !deadline) {
            setErrorMsg('Mohon lengkapi seluruh kolom wajib bertanda bintang (*).');
            return;
        }

        if (totalTargetQty <= 0) {
            setErrorMsg('Target Qty wajib lebih dari 0 Pcs. Silakan isi rincian Size Matrix!');
            return;
        }

        if (!hargaJualVal || hargaJualVal <= 0) {
            setErrorMsg('Harga Jual ke Client wajib diisi untuk menghitung estimasi omset & margin!');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                id: idSpk.trim().toUpperCase(),
                nama_artikel: namaArtikel.trim(),
                kategori_produk: kategoriProduk,
                prioritas: prioritas,

                // Customer & Commercials
                nama_pemesan: namaPemesan.trim() || undefined,
                kontak_pemesan: kontakPemesan.trim() || undefined,
                no_po_buyer: noPoBuyer.trim() || undefined,
                dp_nominal: Number(dpNominal) || 0,
                harga_jual_per_pcs: hargaJualVal,

                // Order Scheme & Material Costs
                tipe_order: tipeOrder,
                penyedia_kain: penyediaKain,
                penyedia_aksesoris: penyediaAksesoris,
                jenis_kain: jenisKain.trim() || undefined,
                warna_kain: warnaKain.trim() || undefined,
                deskripsi: deskripsi.trim() || undefined,
                biaya_kain_per_pcs: biayaKainVal,
                biaya_aksesoris_per_pcs: biayaAksesorisVal,
                biaya_maklon_luar_per_pcs: biayaMaklonLuarVal,
                konsumsi_kain_per_pcs: Number(konsumsiKainPerPcs) || 0,

                // Assets & Verification
                link_google_drive: linkGoogleDrive.trim() || undefined,
                status_acc_sampel: statusAccSampel,

                // Quantities & Matrix
                size_matrix: sizeMatrix,
                target_qty: totalTargetQty,

                // Dates & Status
                tanggal_mulai: tanggalMulai,
                deadline,
                status: 'ON_PROGRESS' as const,

                // Sub-Proses Tariffs
                tarif_initial: tarifList,
            };

            await produksiService.createSPK(payload);
            onSuccess();
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.detail;
            setErrorMsg(
                typeof backendError === 'string'
                    ? backendError
                    : 'Gagal merilis SPK baru. Pastikan Kode SPK belum pernah terdaftar.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto text-slate-100 my-auto">

                {/* HEADER MODAL */}
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            Rilis SPK & Penetapan Komersial Baru
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Surat Perintah Kerja, skema pengadaan bahan, HPP total & analisis margin
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {errorMsg && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="font-medium">{errorMsg}</span>
                        </div>
                    )}

                    {/* SECTION 1: IDENTITAS SPK & ARTIKEL */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> 1. Identitas SPK & Model Baju
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Nama Artikel / Model Baju <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Kemeja PDL Drill Lengan Panjang"
                                    value={namaArtikel}
                                    onChange={(e) => setNamaArtikel(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Kode SPK (Otomatis)
                                </label>
                                <input
                                    type="text"
                                    value={idSpk}
                                    readOnly
                                    className="w-full bg-slate-950/60 border border-slate-800 text-emerald-400 font-mono font-bold rounded-xl p-2.5 text-xs outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Kategori Produk
                                </label>
                                <select
                                    value={kategoriProduk}
                                    onChange={(e) => setKategoriProduk(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="Kemeja">Kemeja</option>
                                    <option value="Kaos Polo">Kaos Polo</option>
                                    <option value="T-Shirt">T-Shirt / Kaos Polos</option>
                                    <option value="Jaket / Hoodie">Jaket / Hoodie</option>
                                    <option value="Celana Chino">Celana Chino</option>
                                    <option value="Uniform / Seragam">Uniform / Seragam</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: DATA CUSTOMER & PRICING PENJUALAN */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                            <User className="w-4 h-4" /> 2. Information Client & Financial Contract
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Nama Client
                                </label>
                                <input
                                    type="text"
                                    placeholder="PT Sinar Jaya"
                                    value={namaPemesan}
                                    onChange={(e) => setNamaPemesan(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    No. HP Client
                                </label>
                                <input
                                    type="text"
                                    placeholder="081234567890"
                                    value={kontakPemesan}
                                    onChange={(e) => setKontakPemesan(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    No. PO Buyer
                                </label>
                                <input
                                    type="text"
                                    placeholder="PO-2026/08/001"
                                    value={noPoBuyer}
                                    onChange={(e) => setNoPoBuyer(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                                    <Coins className="w-3 h-3" /> Down Payment / DP (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="5000000"
                                    value={dpNominal}
                                    onChange={(e) => setDpNominal(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                                    className="w-full bg-slate-950 border border-amber-500/40 text-amber-300 font-bold placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-emerald-400 mb-1.5">
                                    Harga Jual / Pcs (Rp) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="75000"
                                    value={hargaJualPerPcs}
                                    onChange={(e) => setHargaJualPerPcs(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                                    className="w-full bg-slate-950 border border-emerald-500/50 text-emerald-300 font-bold placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: SKEMA PENGADAAN MATERIAL & BIAYA MODAL */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                <Package className="w-4 h-4" /> 3. Skema Pengadaan Material & Modal Bahan
                            </h4>
                            <span className="text-xs text-slate-400">
                                Est. Kebutuhan Kain: <span className="text-emerald-400 font-bold">{estKebutuhanKainMeter.toFixed(1)} Meter</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Tipe Skema Order
                                </label>
                                <select
                                    value={tipeOrder}
                                    onChange={(e) => setTipeOrder(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-bold rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="CMT">CMT (Bahan dari Customer)</option>
                                    <option value="FOB">FOB (Full Package / Pabrik Modal)</option>
                                    <option value="HYBRID">HYBRID (Bahan Campuran)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Jenis Kain Utama
                                </label>
                                <input
                                    type="text"
                                    placeholder="Katun Toyobo / Drill"
                                    value={jenisKain}
                                    onChange={(e) => setJenisKain(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Warna Kain
                                </label>
                                <input
                                    type="text"
                                    placeholder="Navy Blue / Black"
                                    value={warnaKain}
                                    onChange={(e) => setWarnaKain(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Konsumsi Kain (Meter / Pcs)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={konsumsiKainPerPcs}
                                    onChange={(e) => setKonsumsiKainPerPcs(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Input Biaya Modal Tambahan (Ditampilkan Jika FOB/HYBRID atau Ada Sablon/Bordir) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Modal Kain / Pcs (Rp) {tipeOrder === 'CMT' && <span className="text-slate-600">(N/A - CMT)</span>}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    disabled={tipeOrder === 'CMT'}
                                    placeholder={tipeOrder === 'CMT' ? '0' : '35000'}
                                    value={biayaKainPerPcs}
                                    onChange={(e) => setBiayaKainPerPcs(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                                    className="w-full bg-slate-900 border border-slate-800 text-amber-300 font-bold rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-40"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Modal Aksesoris / Pcs (Rp) {tipeOrder === 'CMT' && <span className="text-slate-600">(N/A - CMT)</span>}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    disabled={tipeOrder === 'CMT'}
                                    placeholder={tipeOrder === 'CMT' ? '0' : '5000'}
                                    value={biayaAksesorisPerPcs}
                                    onChange={(e) => setBiayaAksesorisPerPcs(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                                    className="w-full bg-slate-900 border border-slate-800 text-amber-300 font-bold rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-40"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Maklon Luar / Pcs (Sablon/Bordir)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="4000"
                                    value={biayaMaklonLuarPerPcs}
                                    onChange={(e) => setBiayaMaklonLuarPerPcs(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                                    className="w-full bg-slate-900 border border-slate-800 text-purple-300 font-bold rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: SIZE MATRIX & ASSETS GOOGLE DRIVE */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> 4. Size Matrix Breakdown & Media Assets
                            </h4>
                            <span className="text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full">
                                Total Target Qty: <span className="text-white text-sm font-black">{totalTargetQty} Pcs</span>
                            </span>
                        </div>

                        {/* Size Inputs Grid */}
                        <div className="grid grid-cols-5 gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                            {['S', 'M', 'L', 'XL', 'XXL'].map((sizeKey) => (
                                <div key={sizeKey} className="text-center">
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                                        Size {sizeKey}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={sizeMatrix[sizeKey] || ''}
                                        onChange={(e) => handleSizeChange(sizeKey, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 text-center text-slate-100 font-bold rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <FolderSymlink className="w-3.5 h-3.5 text-blue-400" /> Link Google Drive (Folder Pola / Mockup)
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    value={linkGoogleDrive}
                                    onChange={(e) => setLinkGoogleDrive(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Status ACC Sampel
                                </label>
                                <select
                                    value={statusAccSampel}
                                    onChange={(e) => setStatusAccSampel(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="APPROVED">APPROVED (Langsung Masuk Potong)</option>
                                    <option value="PENDING">PENDING (Menunggu ACC Client)</option>
                                    <option value="REVISION">REVISION (Revisi Sampel Fisik)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    value={tanggalMulai}
                                    onChange={(e) => setTanggalMulai(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                    Deadline Selesai <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                Deskripsi / Catatan Khusus
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Kancing Hitam 18L, Label Brand di Kerah, Resleting YKK Silver"
                                value={deskripsi}
                                onChange={(e) => setDeskripsi(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* SECTION 5: TARIF BORONGAN PER SUB-PROSES */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-emerald-400" />
                                Penetapan Tarif Borongan Pekerja (Rp / Pcs)
                            </h4>
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold">
                                <span>Subtotal Borongan: Rp {totalTarifBoronganPcs.toLocaleString('id-ID')} / Pcs</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {tarifList.map((item, idx) => (
                                <div
                                    key={item.tahapan_proses}
                                    className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors"
                                >
                                    <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider truncate">
                                        {TAHAPAN_LABELS[item.tahapan_proses] || item.tahapan_proses}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <span className="text-xs text-slate-500 font-semibold">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.tarif_per_pcs}
                                            onChange={(e) => handleTarifChange(idx, e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-1.5 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 6: FINANCIAL SUMMARY & MARGIN PREVIEW CARD */}
                    <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400">Estimasi Gross Omset Project</p>
                                <p className="text-lg font-black text-white font-mono">
                                    Rp {grossOmsetTotal.toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-between sm:justify-end">
                            <div>
                                <p className="text-[11px] text-slate-400">Total HPP / Pcs (Borongan + Bahan)</p>
                                <p className="text-xs font-bold text-rose-400 font-mono">
                                    Rp {totalHppPerPcs.toLocaleString('id-ID')} / Pcs
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400">Profit Margin / Pcs</p>
                                <p className={`text-xs font-bold font-mono ${marginPerPcs >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    Rp {marginPerPcs.toLocaleString('id-ID')} ({marginPercentage}%)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-800 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2.5 border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyimpan SPK...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 stroke-[2.5]" />
                                    <span>Rilis SPK Baru</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}