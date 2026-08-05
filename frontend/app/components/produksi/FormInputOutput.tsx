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
    XCircle
} from 'lucide-react';
import { SPK, TahapanProses } from '../services/produksiService';
import { Karyawan } from '../services/karyawanService';

export interface FormInputState {
    tanggal: string;
    karyawan_id: string;
    spk_id: string;
    tahapan_proses: TahapanProses;
    qty_disetor: string;
    qty_pass: string;
    qty_reject: string;
    catatan: string;
    foto_bukti_setoran?: string;
}

interface FormInputOutputProps {
    formInput: FormInputState;
    setFormInput: React.Dispatch<React.SetStateAction<FormInputState>>;
    karyawanList: Karyawan[];
    spkList: SPK[];
    handleQtyDisetorChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmitOutput: (e: FormEvent) => Promise<void> | void;
    isSubmitting?: boolean;
}

export default function FormInputOutput({
    formInput,
    setFormInput,
    karyawanList,
    spkList,
    handleQtyDisetorChange,
    handleSubmitOutput,
    isSubmitting = false
}: FormInputOutputProps) {
    // 🛡️ State Cooldown Timer (Anti-Spam / Double Click)
    const [cooldown, setCooldown] = useState<number>(0);

    // Effect hitung mundur cooldown tiap detik
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Handler submit dengan proteksi cooldown
    const handleFormSubmitWithCooldown = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting || cooldown > 0) return;

        setCooldown(3); // Kunci tombol 3 detik setelah diklik
        await handleSubmitOutput(e);
    };

    // Validasi Matematika Real-time
    const qtyDisetorNum = parseInt(formInput.qty_disetor, 10) || 0;
    const qtyPassNum = parseInt(formInput.qty_pass, 10) || 0;
    const qtyRejectNum = parseInt(formInput.qty_reject, 10) || 0;

    const totalInputted = qtyPassNum + qtyRejectNum;
    const isMathValid = qtyDisetorNum > 0 && totalInputted === qtyDisetorNum;
    const isMathMismatch = qtyDisetorNum > 0 && totalInputted !== qtyDisetorNum;

    // Filter Karyawan Produksi & SPK Berjalan
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

    // ⚡ Tombol Cepat Tambah QTY (+10, +25, +50, +100)
    const handleQuickAddQty = (addAmount: number) => {
        const currentDisetor = parseInt(formInput.qty_disetor || '0', 10);
        const newDisetor = currentDisetor + addAmount;
        const currentReject = parseInt(formInput.qty_reject || '0', 10);
        const newPass = Math.max(0, newDisetor - currentReject);

        setFormInput((prev) => ({
            ...prev,
            qty_disetor: String(newDisetor),
            qty_pass: String(newPass)
        }));
    };

    const isButtonDisabled = isSubmitting || cooldown > 0 || isMathMismatch || !formInput.karyawan_id || !formInput.spk_id;

    return (
        <div className="lg:col-span-1">
            {/* 🟢 CONTAINER MENGALIR ALAMI (Tanpa max-h / overflow-y internal) */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">

                {/* HEADER FORM */}
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
                    {/* 1. TANGGAL SETOR */}
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

                    {/* 2. DROPDOWN PEKERJA KHUSUS PRODUKSI */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Pilih Pekerja Produksi *
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
                                    {k.nama} ({k.jabatan || 'Operator Produksi'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3. DROPDOWN SPK PRODUKSI */}
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

                        {/* Ringkasan Kuota Hard-Cap SPK Terpilih */}
                        {selectedSPK && (
                            <div className="mt-1.5 p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
                                <span>Buyer: <strong className="text-slate-200">{selectedSPK.nama_pemesan || '-'}</strong></span>
                                <span className="text-cyan-400 font-mono">Hard-Cap: {selectedSPK.realisasi_potong || 0}/{selectedSPK.target_qty} Pcs</span>
                            </div>
                        )}
                    </div>

                    {/* 4. TAHAPAN PROSES */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                            Tahapan Sub-Proses *
                        </label>
                        <select
                            value={formInput.tahapan_proses}
                            onChange={(e) => setFormInput({ ...formInput, tahapan_proses: e.target.value as TahapanProses })}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer font-bold"
                            required
                        >
                            <option value="CUTTING" className="bg-slate-900">1. Cutting (Pemotongan Kain)</option>
                            <option value="PERSIAPAN_PRESS" className="bg-slate-900">2. Persiapan Press / Fusing</option>
                            <option value="SEWING" className="bg-slate-900">3. Sewing (Jahit Utama)</option>
                            <option value="BUANG_BENANG" className="bg-slate-900">4. Buang Benang / Trimming</option>
                            <option value="FINISHING_PRESS" className="bg-slate-900">5. Finishing Press / Iron</option>
                            <option value="PACKING" className="bg-slate-900">6. Packing & Lipat</option>
                        </select>
                    </div>

                    {/* ⚡ TOMBOL PRESET CEPAT TAMBAH QTY */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-400" />
                                Quick Add QTY
                            </label>
                            <button
                                type="button"
                                onClick={() => setFormInput((prev) => ({ ...prev, qty_disetor: '0', qty_pass: '0', qty_reject: '0' }))}
                                className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                            >
                                Reset QTY
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {[10, 25, 50, 100].map((num) => (
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

                    {/* 5. QUANTITY INPUTS (DISETOR, PASS, REJECT) */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Disetor (Pcs) *</label>
                            <input
                                type="number"
                                min="1"
                                value={formInput.qty_disetor}
                                onChange={handleQtyDisetorChange}
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 text-center text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-emerald-400 mb-1 flex items-center justify-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Pass / OK
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
                        <div>
                            <label className="block text-[11px] font-semibold text-rose-400 mb-1 flex items-center justify-center gap-0.5">
                                <XCircle className="w-3 h-3" /> Reject
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formInput.qty_reject}
                                onChange={(e) => setFormInput({ ...formInput, qty_reject: e.target.value })}
                                placeholder="0"
                                className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-2 text-center text-sm font-bold font-mono focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* LIVE MATH VALIDATION BADGES */}
                    {isMathMismatch && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-center gap-2 animate-pulse">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>
                                Selisih: Pass ({qtyPassNum}) + Reject ({qtyRejectNum}) = <strong>{totalInputted} Pcs</strong>. Tidak cocok dengan Disetor (<strong>{qtyDisetorNum} Pcs</strong>).
                            </span>
                        </div>
                    )}

                    {isMathValid && (
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>Kuantitas cocok: Pass ({qtyPassNum}) + Reject ({qtyRejectNum}) = {qtyDisetorNum} Pcs.</span>
                        </div>
                    )}

                    {/* 6. BUKTI FOTO SETORAN & CATATAN */}
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
                                placeholder="Contoh: Ikatan ikat ke-2, Ukuran L"
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* SUBMIT BUTTON WITH ANTI-DOUBLE-SUBMIT */}
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
                                <span>Menyimpan Transaksi...</span>
                            </>
                        ) : cooldown > 0 ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                                <span>Tunggu Cooldown ({cooldown}s)...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 stroke-[2.5]" />
                                <span>Simpan Setoran Borongan</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}