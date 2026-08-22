"use client";

import React, { useState, useMemo } from 'react';
import {
    Check,
    XCircle,
    CheckSquare,
    Square,
    ShieldAlert,
    Loader2,
    Image as ImageIcon,
    Clock,
    Filter,
    RotateCcw,
    Sparkles,
    CheckCircle2,
    RefreshCw,
    Lock,
    AlertTriangle
} from 'lucide-react';
import { LogOutput, StatusVerifikasiOutput } from '../services/produksiService';

interface TabVerifikasiQCProps {
    outputLogs: LogOutput[];
    handleVerify: (
        logId: number,
        statusQC: StatusVerifikasiOutput,
        fotoDefect?: string,
        alasan?: string
    ) => void;
    handleBulkVerify?: (logIds: number[], statusQC: StatusVerifikasiOutput) => Promise<void> | void;
    currentUserId?: string;
    onOpenLightbox?: (url: string, title: string, caption?: string) => void;
}

export default function TabVerifikasiQC({
    outputLogs,
    handleVerify,
    handleBulkVerify,
    currentUserId,
    onOpenLightbox
}: TabVerifikasiQCProps) {
    // 🎛️ Mode Tampilan: 'pending' (Antrean Aktif) vs 'history' (Riwayat)
    const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');

    // 🔲 State Checkbox Bulk Selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkSubmitting, setIsBulkSubmitting] = useState<boolean>(false);

    // 🔍 State Filter Parameters
    const [filterTanggal, setFilterTanggal] = useState<string>('');
    const [filterPekerja, setFilterPekerja] = useState<string>('');
    const [filterSPK, setFilterSPK] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('APPROVED');

    // Modal Koreksi Status (Tanpa PIN)
    const [koreksiModal, setKoreksiModal] = useState<{
        isOpen: boolean;
        log: LogOutput | null;
        targetStatus: StatusVerifikasiOutput;
        alasan: string;
        error: string;
    }>({
        isOpen: false,
        log: null,
        targetStatus: 'APPROVED',
        alasan: '',
        error: ''
    });

    // 📋 Master Options untuk Dropdown Filter
    const workerOptions = useMemo(() => {
        const set = new Set<string>();
        outputLogs.forEach((log) => {
            if (log.nama_karyawan) set.add(log.nama_karyawan);
            else if (log.karyawan_id) set.add(log.karyawan_id);
        });
        return Array.from(set);
    }, [outputLogs]);

    const spkOptions = useMemo(() => {
        const set = new Set<string>();
        outputLogs.forEach((log) => {
            if (log.spk_id) set.add(log.spk_id);
        });
        return Array.from(set);
    }, [outputLogs]);

    // 🔄 Filter Logic
    const displayedLogs = useMemo(() => {
        return outputLogs.filter((log) => {
            if (viewMode === 'pending') {
                if (log.status_verifikasi !== 'PENDING') return false;
            } else {
                if (filterStatus && log.status_verifikasi !== filterStatus) return false;
            }

            if (filterTanggal && log.tanggal !== filterTanggal) return false;
            if (filterPekerja) {
                const nameMatch = log.nama_karyawan?.toLowerCase().includes(filterPekerja.toLowerCase());
                const idMatch = log.karyawan_id?.toLowerCase().includes(filterPekerja.toLowerCase());
                if (!nameMatch && !idMatch) return false;
            }
            if (filterSPK && log.spk_id !== filterSPK) return false;

            return true;
        });
    }, [outputLogs, viewMode, filterTanggal, filterPekerja, filterSPK, filterStatus]);

    const pendingCount = useMemo(() => {
        return outputLogs.filter((log) => log.status_verifikasi === 'PENDING').length;
    }, [outputLogs]);

    const isSelfEntry = (log: LogOutput) => {
        if (!currentUserId) return false;
        const normalizedCurrentUser = currentUserId.toLowerCase().trim();
        const isWorker = log.karyawan_id?.toLowerCase().trim() === normalizedCurrentUser;
        const isPetugas = log.petugas_input?.toLowerCase().trim() === normalizedCurrentUser;
        return isWorker || isPetugas;
    };

    const pendingInDisplayed = useMemo(() => {
        return displayedLogs.filter((log) => log.status_verifikasi === 'PENDING');
    }, [displayedLogs]);

    const allPendingSelected = pendingInDisplayed.length > 0 && pendingInDisplayed.every((log) => selectedIds.includes(log.id));

    const toggleSelectAll = () => {
        if (allPendingSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingInDisplayed.map((log) => log.id));
        }
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const executeBulkVerify = async (statusQC: StatusVerifikasiOutput) => {
        if (!handleBulkVerify || selectedIds.length === 0) return;
        setIsBulkSubmitting(true);
        try {
            await handleBulkVerify(selectedIds, statusQC);
            setSelectedIds([]);
        } finally {
            setIsBulkSubmitting(false);
        }
    };

    // Trigger Buka Modal Koreksi untuk Revisi Riwayat
    const handleOpenKoreksiModal = (log: LogOutput) => {
        if (log.is_paid) return; // Guard: Tidak bisa diubah jika sudah paid
        const newStatus: StatusVerifikasiOutput = log.status_verifikasi === 'APPROVED' ? 'REJECTED' : 'APPROVED';
        setKoreksiModal({
            isOpen: true,
            log,
            targetStatus: newStatus,
            alasan: '',
            error: ''
        });
    };

    // Submit Koreksi Langsung Tanpa PIN
    const handleConfirmKoreksi = () => {
        if (!koreksiModal.log) return;
        if (!koreksiModal.alasan || koreksiModal.alasan.trim().length < 3) {
            setKoreksiModal((prev) => ({ ...prev, error: 'Wajib mengisikan alasan perubahan status' }));
            return;
        }

        handleVerify(
            koreksiModal.log.id,
            koreksiModal.targetStatus,
            undefined,
            koreksiModal.alasan
        );

        setKoreksiModal({ isOpen: false, log: null, targetStatus: 'APPROVED', alasan: '', error: '' });
    };

    return (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800/80 space-y-4 animate-in fade-in duration-200">
            {/* HEADER & SWITCHER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        Panel Verifikasi Setoran QC
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Persetujuan setoran harian pekerja untuk dasar kalkulasi dan pencairan gaji borongan
                    </p>
                </div>

                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => { setViewMode('pending'); setSelectedIds([]); }}
                        className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'pending'
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        Antrean Pending
                        {pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950 text-emerald-400">
                                {pendingCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setViewMode('history'); setSelectedIds([]); }}
                        className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${viewMode === 'history'
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Riwayat Verifikasi
                    </button>
                </div>
            </div>

            {/* CONTROL PANEL FILTER */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-emerald-400" />
                        Filter Data Setoran QC
                    </span>
                    <button
                        type="button"
                        onClick={() => { setFilterTanggal(''); setFilterPekerja(''); setFilterSPK(''); setFilterStatus('APPROVED'); }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3" /> Reset Filter
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {viewMode === 'history' && (
                        <div>
                            <label className="block text-slate-400 mb-1 font-medium">Status QC</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                            >
                                <option value="">-- Semua Status --</option>
                                <option value="APPROVED">APPROVED (Disetujui)</option>
                                <option value="REJECTED">REJECTED (Ditolak)</option>
                                <option value="PENDING">PENDING (Menunggu)</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-400 mb-1 font-medium">Tanggal Setor</label>
                        <input
                            type="date"
                            value={filterTanggal}
                            onChange={(e) => setFilterTanggal(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1 font-medium">Pekerja</label>
                        <select
                            value={filterPekerja}
                            onChange={(e) => setFilterPekerja(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">-- Semua Pekerja --</option>
                            {workerOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1 font-medium">SPK / Artikel</label>
                        <select
                            value={filterSPK}
                            onChange={(e) => setFilterSPK(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">-- Semua SPK --</option>
                            {spkOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ACTION BAR BULK VERIFY */}
            {selectedIds.length > 0 && (
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 animate-in fade-in">
                    <span className="text-xs font-semibold text-slate-300 px-2">
                        {selectedIds.length} Setoran Dipilih
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => executeBulkVerify('APPROVED')}
                            disabled={isBulkSubmitting}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-50"
                        >
                            {isBulkSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            Setujui Massal
                        </button>

                        <button
                            type="button"
                            onClick={() => executeBulkVerify('REJECTED')}
                            disabled={isBulkSubmitting}
                            className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                            {isBulkSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Tolak Massal
                        </button>
                    </div>
                </div>
            )}

            {/* TABEL DATA VERIFIKASI */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase border-y border-slate-800 font-semibold">
                        <tr>
                            <th className="py-3 px-3 text-center w-10">
                                <button
                                    type="button"
                                    onClick={toggleSelectAll}
                                    disabled={pendingInDisplayed.length === 0}
                                    className="text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
                                >
                                    {allPendingSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                                </button>
                            </th>
                            <th className="py-3 px-3.5 font-semibold">Tanggal</th>
                            <th className="py-3 px-3.5 font-semibold">Pekerja</th>
                            <th className="py-3 px-3.5 font-semibold">SPK & Artikel</th>
                            <th className="py-3 px-3.5 font-semibold">Sub-Proses</th>
                            <th className="py-3 px-3.5 text-center font-semibold">Setor / OK / Cacat</th>
                            <th className="py-3 px-3.5 text-center font-semibold">Bukti Foto</th>
                            <th className="py-3 px-3.5 text-right font-semibold">Subtotal</th>
                            <th className="py-3 px-3.5 text-center font-semibold">Aksi Verifikasi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {displayedLogs.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-16 text-center text-slate-500 font-medium">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Sparkles className="w-8 h-8 text-emerald-400/50 stroke-[1.5]" />
                                        <span>
                                            {viewMode === 'pending'
                                                ? 'Tidak ada antrean setoran pending. Semua sudah diverifikasi!'
                                                : 'Tidak ada data riwayat setoran yang cocok dengan filter.'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayedLogs.map((log) => {
                                const isSelf = isSelfEntry(log);
                                const isPending = log.status_verifikasi === 'PENDING';
                                const isSelected = selectedIds.includes(log.id);

                                return (
                                    <tr key={log.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                                        <td className="py-3 px-3 text-center">
                                            {isPending ? (
                                                <button type="button" onClick={() => toggleSelectRow(log.id)} className="text-slate-400 hover:text-slate-200">
                                                    {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                                                </button>
                                            ) : (
                                                <span className="text-slate-700">-</span>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                                            {log.tanggal}
                                        </td>

                                        <td className="py-3.5 px-3.5">
                                            <div className="font-bold text-slate-100">{log.nama_karyawan || log.karyawan_id}</div>
                                            {isSelf && (
                                                <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit">
                                                    <ShieldAlert className="w-3 h-3 shrink-0" />
                                                    <span>Input Sendiri (4-Eyes)</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-3.5">
                                            <div className="font-bold text-emerald-400 font-mono text-xs">{log.spk_id}</div>
                                            <div className="text-[11px] text-slate-400 font-medium line-clamp-1">{log.nama_artikel || '-'}</div>
                                        </td>

                                        <td className="py-3.5 px-3.5">
                                            <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 font-semibold px-2 py-0.5 rounded-md font-mono">
                                                {log.tahapan_proses}
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-3.5 text-center font-mono text-xs">
                                            <span className="font-bold text-white">{log.qty_disetor}</span> /{' '}
                                            <span className="font-bold text-emerald-400">{log.qty_pass}</span> /{' '}
                                            <span className={`font-bold ${log.qty_reject > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{log.qty_reject}</span>
                                        </td>

                                        <td className="py-3.5 px-3.5 text-center">
                                            {log.foto_bukti_setoran ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenLightbox?.(log.foto_bukti_setoran!, `Bukti Setoran: ${log.spk_id}`, `Pekerja: ${log.nama_karyawan || log.karyawan_id}`)}
                                                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 rounded-lg border border-slate-800 text-xs flex items-center gap-1 mx-auto"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                    <span>Foto</span>
                                                </button>
                                            ) : (
                                                <span className="text-slate-600 text-[10px]">Tanpa Foto</span>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-3.5 text-right font-bold text-white font-mono text-xs whitespace-nowrap">
                                            Rp {(log.subtotal_rp || 0).toLocaleString('id-ID')}
                                        </td>

                                        <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                                            {isPending ? (
                                                /* VERIFIKASI AWAL (PENDING QUEUE) */
                                                <div className="flex justify-center items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerify(log.id, 'APPROVED')}
                                                        disabled={isSelf}
                                                        className={`p-1.5 rounded-lg transition-all ${isSelf ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'}`}
                                                        title={isSelf ? 'Dilarang memverifikasi pengerjaan sendiri' : 'Setujui (Approve)'}
                                                    >
                                                        <Check className="w-4 h-4 stroke-[3]" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerify(log.id, 'REJECTED')}
                                                        disabled={isSelf}
                                                        className={`p-1.5 rounded-lg transition-all ${isSelf ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40'}`}
                                                        title={isSelf ? 'Dilarang memverifikasi pengerjaan sendiri' : 'Tolak (Reject)'}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                /* RIWAYAT VERIFIKASI */
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border inline-flex items-center justify-center gap-1 ${log.status_verifikasi === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>
                                                        {log.status_verifikasi === 'APPROVED' ? <CheckCircle2 className="w-3 h-3 stroke-[2.5]" /> : <XCircle className="w-3 h-3" />}
                                                        {log.status_verifikasi}
                                                    </span>

                                                    {/* JIKA SUDAH PAID: TOMBOL LOCK PERMANEN */}
                                                    {log.is_paid ? (
                                                        <span className="p-1.5 bg-slate-950 text-slate-500 rounded-lg border border-slate-800 inline-flex items-center gap-1 text-[10px]" title="Terkunci: Sudah dicairkan dalam Penggajian Payroll">
                                                            <Lock className="w-3 h-3 text-amber-500" />
                                                            <span>Paid</span>
                                                        </span>
                                                    ) : (
                                                        /* JIKA BELUM PAID: BISA KOREKSI STATUS */
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenKoreksiModal(log)}
                                                            disabled={isSelf}
                                                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40 rounded-lg text-[10px] font-medium transition flex items-center gap-1"
                                                            title={isSelf ? 'Dilarang memverifikasi pengerjaan sendiri' : 'Revisi Status Verifikasi'}
                                                        >
                                                            <RefreshCw className="w-3 h-3" />
                                                            <span>Koreksi</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL REVISI KOREKSI STATUS (TANPA PIN) */}
            {koreksiModal.isOpen && koreksiModal.log && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                                <RefreshCw className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Revisi Verifikasi QC</h3>
                                <p className="text-xs text-slate-400">Konfirmasi perubahan status setoran</p>
                            </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5 font-mono">
                            <div className="flex justify-between text-slate-400">
                                <span>Target Log ID:</span>
                                <strong className="text-white">#{koreksiModal.log.id}</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Pekerja:</span>
                                <strong className="text-white">{koreksiModal.log.nama_karyawan || koreksiModal.log.karyawan_id}</strong>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>SPK / Sub-Proses:</span>
                                <strong className="text-emerald-400">{koreksiModal.log.spk_id} ({koreksiModal.log.tahapan_proses})</strong>
                            </div>
                            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                                <span>Aksi Perubahan:</span>
                                <span className="font-bold text-amber-400">
                                    {koreksiModal.log.status_verifikasi} ➔ {koreksiModal.targetStatus}
                                </span>
                            </div>
                        </div>

                        {koreksiModal.error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{koreksiModal.error}</span>
                            </div>
                        )}

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">
                                    Alasan Koreksi / Revisi <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Salah klik saat pengecekan awal"
                                    value={koreksiModal.alasan}
                                    onChange={(e) => setKoreksiModal((prev) => ({ ...prev, alasan: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setKoreksiModal({ isOpen: false, log: null, targetStatus: 'APPROVED', alasan: '', error: '' })}
                                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmKoreksi}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20"
                            >
                                Konfirmasi & Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}