"use client";

import React, { ChangeEvent, FormEvent, useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Camera,
    UserCheck,
    FileText,
    Wrench,
    Zap,
    MessageSquare,
    CheckCircle,
    Ticket,
    RotateCcw,
    Trash2,
    Cpu,
    Package,
    Coins,
    Calculator,
    Boxes,
    Info
} from 'lucide-react';
import { SPK, TahapanProses } from '@/services/produksiService';
import { Karyawan } from '@/services/karyawanService';

export interface FormInputState {
    tanggal: string;
    karyawan_id: string;
    spk_id: string;
    tahapan_proses: TahapanProses;
    nomor_tiket?: string;
    kode_mesin?: string;
    bahan_id?: string;
    jumlah_bahan_digunakan?: string;
    qty_disetor: string;
    qty_pass: string;
    qty_rework?: string;
    qty_scrap?: string;
    qty_reject?: string;
    catatan: string;
    foto_bukti_setoran?: string;
}

interface FormInputOutputProps {
    formInput: FormInputState;
    setFormInput: React.Dispatch<React.SetStateAction<FormInputState>>;
    karyawanList: Karyawan[];
    spkList: SPK[];
    mesinList?: any[];
    bahanList?: any[];
    handleQtyDisetorChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmitOutput: (e: FormEvent) => Promise<void> | void;
    isSubmitting?: boolean;
}

export default function FormInputOutput({
    formInput,
    setFormInput,
    karyawanList,
    spkList,
    mesinList = [],
    bahanList = [],
    handleQtyDisetorChange,
    handleSubmitOutput,
    isSubmitting = false
}: FormInputOutputProps) {
    const [cooldown, setCooldown] = useState<number>(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleFormSubmitWithCooldown = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting || cooldown > 0) return;

        setCooldown(3);
        await handleSubmitOutput(e);
    };

    // 🧮 Kalkulasi Rework & Scrap
    const qtyDisetorNum = parseInt(formInput.qty_disetor, 10) || 0;
    const qtyPassNum = parseInt(formInput.qty_pass, 10) || 0;
    const qtyReworkNum = parseInt(formInput.qty_rework || '0', 10);
    const qtyScrapNum = parseInt(formInput.qty_scrap || '0', 10);

    const totalInputted = qtyPassNum + qtyReworkNum + qtyScrapNum;
    const isMathValid = qtyDisetorNum > 0 && totalInputted === qtyDisetorNum;
    const isMathMismatch = qtyDisetorNum > 0 && totalInputted !== qtyDisetorNum;

    // Helper Auto-Calculate QTY Pass saat Rework/Scrap diubah
    const handleDefectChange = (field: 'qty_rework' | 'qty_scrap', val: string) => {
        const newVal = parseInt(val, 10) || 0;
        const otherDefect = field === 'qty_rework' ? qtyScrapNum : qtyReworkNum;
        const disetor = parseInt(formInput.qty_disetor, 10) || 0;
        const passVal = Math.max(0, disetor - newVal - otherDefect);

        setFormInput(prev => ({
            ...prev,
            [field]: val,
            qty_pass: String(passVal),
            qty_reject: String(newVal + otherDefect)
        }));
    };

    const handleLocalQtyDisetorChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const disetorVal = parseInt(val, 10) || 0;
        const passVal = Math.max(0, disetorVal - qtyReworkNum - qtyScrapNum);

        setFormInput((prev) => ({
            ...prev,
            qty_disetor: val,
            qty_pass: String(passVal)
        }));
    };

    const filteredKaryawan = useMemo(() => {
        return karyawanList.filter(
            (k) => k.is_active !== false && (k.role === 'PRODUKSI' || k.role === 'PEKERJA' || !k.role)
        );
    }, [karyawanList]);

    const activeSPKList = useMemo(() => {
        return spkList.filter((s) => s.status === 'ON_PROGRESS' || !s.status);
    }, [spkList]);

    const selectedSPK = useMemo(() => {
        return spkList.find((s) => s.id === formInput.spk_id);
    }, [spkList, formInput.spk_id]);

    const selectedKaryawan = useMemo(() => {
        return karyawanList.find((k) => k.id_karyawan === formInput.karyawan_id);
    }, [karyawanList, formInput.karyawan_id]);

    const selectedBahan = useMemo(() => {
        return bahanList.find((b) => b.id === formInput.bahan_id);
    }, [bahanList, formInput.bahan_id]);

    // 🔄 Auto-select Mesin saat Karyawan Dipilih (jika ada mesin yang ditugaskan ke karyawan)
    useEffect(() => {
        if (formInput.karyawan_id && !formInput.kode_mesin && mesinList.length > 0) {
            const assignedMesin = mesinList.find((m) => m.operator_id === formInput.karyawan_id);
            if (assignedMesin) {
                setFormInput((prev) => ({ ...prev, kode_mesin: assignedMesin.kode_mesin }));
            }
        }
    }, [formInput.karyawan_id, formInput.kode_mesin, mesinList, setFormInput]);

    // 🔄 Auto-suggest Pemakaian Bahan saat Cutting jika SPK memiliki data konsumsi bahan
    useEffect(() => {
        if (formInput.tahapan_proses === 'CUTTING' && formInput.bahan_id && selectedSPK) {
            const konsumsi = (selectedSPK as any).konsumsi_kain_per_pcs || 0;
            if (konsumsi > 0 && qtyPassNum > 0 && !formInput.jumlah_bahan_digunakan) {
                const totalEstimasiBahan = (qtyPassNum * konsumsi).toFixed(2);
                setFormInput((prev) => ({ ...prev, jumlah_bahan_digunakan: totalEstimasiBahan }));
            }
        }
    }, [formInput.tahapan_proses, formInput.bahan_id, selectedSPK, qtyPassNum, formInput.jumlah_bahan_digunakan, setFormInput]);

    // 💰 Hitung Tarif & Estimasi Upah Borongan Live
    const tarifSnapshot = useMemo(() => {
        if (!selectedSPK || !selectedSPK.tarif_list) return 0;
        const matched = selectedSPK.tarif_list.find((t) => t.tahapan_proses === formInput.tahapan_proses);
        return matched?.tarif_per_pcs || 0;
    }, [selectedSPK, formInput.tahapan_proses]);

    const estimasiUpahRp = useMemo(() => {
        return qtyPassNum * tarifSnapshot;
    }, [qtyPassNum, tarifSnapshot]);

    const handleQuickAddQty = (addAmount: number) => {
        const currentDisetor = parseInt(formInput.qty_disetor || '0', 10);
        const newDisetor = currentDisetor + addAmount;
        const newPass = Math.max(0, newDisetor - qtyReworkNum - qtyScrapNum);

        setFormInput((prev) => ({
            ...prev,
            qty_disetor: String(newDisetor),
            qty_pass: String(newPass)
        }));
    };

    const isButtonDisabled = isSubmitting || cooldown > 0 || isMathMismatch || !formInput.karyawan_id || !formInput.spk_id;

    return (
        <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Setor Output Pekerja
                    </h2>
                    {cooldown > 0 && (
                        <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            Cooldown: {cooldown}s
                        </span>
                    )}
                </div>

                <form onSubmit={handleFormSubmitWithCooldown} className="space-y-4">
                    {/* TANGGAL & NOMOR TIKET BUNDLE */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Tanggal Setor *</label>
                            <input
                                type="date"
                                value={formInput.tanggal}
                                onChange={(e) => setFormInput({ ...formInput, tanggal: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                                No Tiket / Lot
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: BND-012"
                                value={formInput.nomor_tiket || ''}
                                onChange={(e) => setFormInput({ ...formInput, nomor_tiket: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono uppercase"
                            />
                        </div>
                    </div>

                    {/* 1. DROPDOWN PEKERJA (MODUL KARYAWAN) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                Pilih Pekerja Produksi *
                            </span>
                            {selectedKaryawan && (
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                    Skema: {selectedKaryawan.tipe_pay || 'BORONGAN'}
                                </span>
                            )}
                        </label>
                        <select
                            value={formInput.karyawan_id}
                            onChange={(e) => setFormInput({ ...formInput, karyawan_id: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                            required
                        >
                            <option value="" className="text-slate-500">-- Pilih Pekerja --</option>
                            {filteredKaryawan.map((k) => (
                                <option key={k.id_karyawan} value={k.id_karyawan} className="bg-slate-900">
                                    {k.nama} ({k.jabatan || 'Operator Produksi'}) - [{k.id_karyawan}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. DROPDOWN SPK & ARTIKEL */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            Pilih Artikel / SPK *
                        </label>
                        <select
                            value={formInput.spk_id}
                            onChange={(e) => setFormInput({ ...formInput, spk_id: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer font-medium"
                            required
                        >
                            <option value="" className="text-slate-500">-- Pilih SPK --</option>
                            {activeSPKList.map((s) => (
                                <option key={s.id} value={s.id} className="bg-slate-900">
                                    [{s.id}] {s.nama_artikel} ({s.target_qty} Pcs)
                                </option>
                            ))}
                        </select>

                        {selectedSPK && (
                            <div className="mt-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
                                <span>Buyer: <strong className="text-slate-200">{selectedSPK.nama_pemesan || '-'}</strong></span>
                                <span className="text-cyan-400 font-mono">Hard-Cap: {selectedSPK.realisasi_potong || 0}/{selectedSPK.target_qty} Pcs</span>
                            </div>
                        )}
                    </div>

                    {/* 3. TAHAPAN PROSES & DROPDOWN MESIN (MODUL MESIN) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                                Sub-Proses *
                            </label>
                            <select
                                value={formInput.tahapan_proses}
                                onChange={(e) => setFormInput({ ...formInput, tahapan_proses: e.target.value as TahapanProses })}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer font-bold"
                                required
                            >
                                <option value="CUTTING" className="bg-slate-900">1. Cutting (Potong)</option>
                                <option value="PERSIAPAN_PRESS" className="bg-slate-900">2. Persiapan Press</option>
                                <option value="SEWING" className="bg-slate-900">3. Sewing (Jahit Utama)</option>
                                <option value="BUANG_BENANG" className="bg-slate-900">4. Buang Benang</option>
                                <option value="FINISHING_PRESS" className="bg-slate-900">5. Finishing Press</option>
                                <option value="PACKING" className="bg-slate-900">6. Packing & Lipat</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                Mesin Digunakan
                            </label>
                            <select
                                value={formInput.kode_mesin || ''}
                                onChange={(e) => setFormInput({ ...formInput, kode_mesin: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-cyan-500 outline-none transition-all cursor-pointer font-mono"
                            >
                                <option value="" className="text-slate-500">-- Tanpa Mesin / Manual --</option>
                                {mesinList.map((m) => (
                                    <option key={m.kode_mesin || m.id} value={m.kode_mesin} className="bg-slate-900">
                                        [{m.kode_mesin}] {m.nama_mesin} ({m.lokasi_line || m.status || 'OPERASIONAL'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 4. BAHAN BAKU INVENTARIS (MODUL INVENTARIS) */}
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-indigo-400" />
                                Pengurangan Bahan Inventaris (Opsional)
                            </label>
                            {selectedBahan && (
                                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                    Stok: {selectedBahan.stok_saat_ini} {selectedBahan.satuan}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <select
                                    value={formInput.bahan_id || ''}
                                    onChange={(e) => setFormInput({ ...formInput, bahan_id: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="" className="text-slate-500">-- Pilih Bahan dari Gudang --</option>
                                    {bahanList.map((b) => (
                                        <option key={b.id} value={b.id} className="bg-slate-900">
                                            [{b.kode_sku}] {b.nama_item} ({b.stok_saat_ini} {b.satuan})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={selectedBahan ? `Jml (${selectedBahan.satuan})` : "Jml Pakai"}
                                    value={formInput.jumlah_bahan_digunakan || ''}
                                    onChange={(e) => setFormInput({ ...formInput, jumlah_bahan_digunakan: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center"
                                />
                            </div>
                        </div>
                        {selectedBahan && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Info className="w-3 h-3 text-indigo-400 shrink-0" />
                                Stok gudang akan otomatis dipotong saat setoran dicatat (Log: KELUAR_PRODUKSI).
                            </p>
                        )}
                    </div>

                    {/* PRESET LUSIN / BUNDLE */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-400" />
                                Quick Add Bundle (Pcs)
                            </label>
                            <button
                                type="button"
                                onClick={() => setFormInput((prev) => ({ ...prev, qty_disetor: '0', qty_pass: '0', qty_rework: '0', qty_scrap: '0', qty_reject: '0' }))}
                                className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                            >
                                Reset QTY
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {[12, 24, 50, 100].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleQuickAddQty(num)}
                                    className="py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg text-xs font-mono font-bold transition-all active:scale-95"
                                >
                                    +{num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* INPUT QUANTITY: TOTAL, PASS, REWORK, SCRAP */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Disetor (Total) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formInput.qty_disetor}
                                    onChange={handleLocalQtyDisetorChange}
                                    placeholder="0"
                                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 text-center text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-emerald-400 mb-1 flex items-center justify-center gap-0.5">
                                    <CheckCircle className="w-3 h-3" /> Pass (Bagus) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formInput.qty_pass}
                                    onChange={(e) => setFormInput({ ...formInput, qty_pass: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-2 text-center text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                            <div>
                                <label className="block text-[10px] font-semibold text-amber-400 mb-1 flex items-center justify-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> Rework (Perbaikan)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formInput.qty_rework || '0'}
                                    onChange={(e) => handleDefectChange('qty_rework', e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl p-2 text-center text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-rose-400 mb-1 flex items-center justify-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Scrap (BS / Cacat)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formInput.qty_scrap || '0'}
                                    onChange={(e) => handleDefectChange('qty_scrap', e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-2 text-center text-xs font-bold font-mono focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* LIVE VALIDATION BADGES */}
                    {isMathMismatch && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-center gap-2 animate-pulse">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>
                                Selisih: Pass ({qtyPassNum}) + Rework ({qtyReworkNum}) + Scrap ({qtyScrapNum}) = <strong>{totalInputted} Pcs</strong>. Tidak cocok dengan Disetor (<strong>{qtyDisetorNum} Pcs</strong>).
                            </span>
                        </div>
                    )}

                    {isMathValid && (
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>Kuantitas cocok: Pass ({qtyPassNum}) + Rework ({qtyReworkNum}) + Scrap ({qtyScrapNum}) = {qtyDisetorNum} Pcs.</span>
                        </div>
                    )}

                    {/* 5. LIVE PREVIEW ESTIMASI UPAH BORONGAN & PAYROLL */}
                    {selectedSPK && (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-300">
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                    <Coins className="w-3.5 h-3.5" />
                                    Tarif SPK:
                                </span>
                                <span className="font-mono font-bold text-slate-200">
                                    {tarifSnapshot > 0 ? `Rp ${tarifSnapshot.toLocaleString('id-ID')} / Pcs` : 'Belum Diatur'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
                                <span className="text-emerald-300 font-bold">Estimasi Upah Setoran:</span>
                                <span className="font-mono font-black text-sm text-emerald-400">
                                    Rp {estimasiUpahRp.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 pt-0.5">
                                * Otomatis masuk rekapitulasi gaji karyawan setelah di-approve QC.
                            </p>
                        </div>
                    )}

                    {/* BUKTI FOTO & CATATAN */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-slate-400" /> URL Foto Bukti Setoran (Opsional)
                            </label>
                            <input
                                type="text"
                                value={formInput.foto_bukti_setoran || ''}
                                onChange={(e) => setFormInput({ ...formInput, foto_bukti_setoran: e.target.value })}
                                placeholder="https://... / path-foto-bukti.jpg"
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Catatan Tambahan
                            </label>
                            <input
                                type="text"
                                value={formInput.catatan}
                                onChange={(e) => setFormInput({ ...formInput, catatan: e.target.value })}
                                placeholder="Contoh: Rework benang loncat di bagian kerah"
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isButtonDisabled}
                        className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-xs ${isButtonDisabled
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-[0.99]'
                            }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menyimpan Transaksi & Potong Stok...</span>
                            </>
                        ) : cooldown > 0 ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                <span>Tunggu Cooldown ({cooldown}s)...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 stroke-[2.5]" />
                                <span>Simpan Setoran Output</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}