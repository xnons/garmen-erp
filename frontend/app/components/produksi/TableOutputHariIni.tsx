"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    History,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Image as ImageIcon,
    DollarSign,
    Layers,
    Sparkles,
    Filter,
    RotateCcw,
    RefreshCw
} from 'lucide-react';

import { LogOutput, StatusVerifikasiOutput, LogOutputFilters } from '../services/produksiService';

interface TableOutputHariIniProps {
    outputLogs: LogOutput[];
    onOpenLightbox?: (url: string, title: string, caption?: string) => void;
    karyawanList?: { id_karyawan: string; nama: string }[];
    spkList?: { id: string; nama_artikel: string }[];
    onFetchLogs?: (filters?: LogOutputFilters) => void;
    isLoading?: boolean;
}

export default function TableOutputHariIni({
    outputLogs,
    onOpenLightbox,
    karyawanList = [],
    spkList = [],
    onFetchLogs,
    isLoading = false
}: TableOutputHariIniProps) {
    // 🗓️ Helper Tanggal Hari Ini (YYYY-MM-DD)
    const getTodayString = () => new Date().toISOString().split('T')[0];

    // 🎛️ State Mode & Filter Local (Mengganti tanggal tunggal dengan rentang startDate & endDate)
    const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
    const [startDate, setStartDate] = useState<string>(getTodayString());
    const [endDate, setEndDate] = useState<string>(getTodayString());
    const [filterKaryawan, setFilterKaryawan] = useState<string>('');
    const [filterSPK, setFilterSPK] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<StatusVerifikasiOutput | ''>('');

    // 🔄 Panggil Refetch Backend saat Mode / Filter Berubah
    useEffect(() => {
        if (!onFetchLogs) return;

        if (viewMode === 'today') {
            onFetchLogs({ tanggal: getTodayString() });
        } else {
            onFetchLogs({
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                karyawan_id: filterKaryawan || undefined,
                spk_id: filterSPK || undefined,
                status_verifikasi: filterStatus ? (filterStatus as StatusVerifikasiOutput) : undefined,
            });
        }
    }, [viewMode, startDate, endDate, filterKaryawan, filterSPK, filterStatus, onFetchLogs]);

    // 🔍 Fallback Filter Client-Side Berdasarkan Rentang Tanggal
    const displayedLogs = useMemo(() => {
        return outputLogs.filter((log) => {
            const logDateOnly = log.tanggal ? String(log.tanggal).split('T')[0] : '';

            if (viewMode === 'today') {
                return logDateOnly === getTodayString();
            }

            // Validasi Rentang Tanggal (Start s/d End Date)
            if (startDate && logDateOnly < startDate) return false;
            if (endDate && logDateOnly > endDate) return false;

            if (filterKaryawan && log.karyawan_id !== filterKaryawan) return false;
            if (filterSPK && log.spk_id !== filterSPK) return false;
            if (filterStatus && log.status_verifikasi !== filterStatus) return false;

            return true;
        });
    }, [outputLogs, viewMode, startDate, endDate, filterKaryawan, filterSPK, filterStatus]);

    // 📊 Kalkulasi Agregat Ringkasan (KPI Metrics)
    const statsToday = useMemo(() => {
        const totalPcsDisetor = displayedLogs.reduce((acc, curr) => acc + (curr.qty_disetor || 0), 0);
        const totalPcsPass = displayedLogs.reduce((acc, curr) => acc + (curr.qty_pass || 0), 0);
        const totalPcsReject = displayedLogs.reduce((acc, curr) => acc + (curr.qty_reject || 0), 0);
        const totalEstimasiUpah = displayedLogs.reduce((acc, curr) => acc + (curr.subtotal_rp || 0), 0);
        return { totalPcsDisetor, totalPcsPass, totalPcsReject, totalEstimasiUpah };
    }, [displayedLogs]);

    // Reset Filter Form
    const handleResetFilter = () => {
        setStartDate(getTodayString());
        setEndDate(getTodayString());
        setFilterKaryawan('');
        setFilterSPK('');
        setFilterStatus('');
    };

    // Helper Badge Status QC
    const renderStatusBadge = (status: StatusVerifikasiOutput) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1 w-fit mx-auto shadow-sm">
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                        APPROVED
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-1 w-fit mx-auto shadow-sm">
                        <XCircle className="w-3 h-3" />
                        REJECTED
                    </span>
                );
            case 'PENDING':
            default:
                return (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1 w-fit mx-auto shadow-sm">
                        <Clock className="w-3 h-3 animate-pulse text-amber-400" />
                        PENDING
                    </span>
                );
        }
    };

    return (
        <div className="lg:col-span-2 space-y-4">
            {/* 📊 WIDGET RINGKASAN KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3 shadow-md hover:border-slate-700/80 transition-all">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                            {viewMode === 'today' ? 'Total Output Setor' : 'Total Setor (Filtered)'}
                        </p>
                        <p className="text-base font-black text-white font-mono leading-tight">
                            {statsToday.totalPcsDisetor.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pcs</span>
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3 shadow-md hover:border-slate-700/80 transition-all">
                    <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">Pass OK / Lolos QC</p>
                        <p className="text-base font-black text-cyan-400 font-mono leading-tight">
                            {statsToday.totalPcsPass.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pcs</span>
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3 shadow-md hover:border-slate-700/80 transition-all">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">Est. Akumulasi Upah</p>
                        <p className="text-base font-black text-amber-400 font-mono leading-tight">
                            Rp {statsToday.totalEstimasiUpah.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>

            {/* 📑 TABEL CONTAINER UTAMA */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">

                {/* 🟢 HEADER & MODE SWITCHER TABS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <History className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                {viewMode === 'today' ? 'Riwayat Setoran Hari Ini' : 'Master Riwayat Output Borongan'}
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            </h2>
                            <p className="text-xs text-slate-400">
                                {viewMode === 'today'
                                    ? 'Daftar pencatatan output borongan terbaru hari ini'
                                    : 'Pencarian dan pencatatan riwayat seluruh transaksi'}
                            </p>
                        </div>
                    </div>

                    {/* Mode Switcher Buttons */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('today');
                                setStartDate(getTodayString());
                                setEndDate(getTodayString());
                            }}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'today'
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Hari Ini
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('history')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'history'
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Riwayat & Filter
                        </button>
                    </div>
                </div>

                {/* 🔍 PANEL FILTER RENTANG TANGGAL (Aktif di Mode 'history') */}
                {viewMode === 'history' && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                                Filter Rentang Tanggal & Atribut
                            </span>
                            <button
                                type="button"
                                onClick={handleResetFilter}
                                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset Filter
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                            {/* Dari Tanggal */}
                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                                />
                            </div>

                            {/* Sampai Tanggal */}
                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                                />
                            </div>

                            {/* Filter Karyawan */}
                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Pekerja</label>
                                <select
                                    value={filterKaryawan}
                                    onChange={(e) => setFilterKaryawan(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">-- Semua Pekerja --</option>
                                    {karyawanList.map((k) => (
                                        <option key={k.id_karyawan} value={k.id_karyawan}>
                                            {k.nama}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter SPK */}
                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">SPK / Artikel</label>
                                <select
                                    value={filterSPK}
                                    onChange={(e) => setFilterSPK(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">-- Semua SPK --</option>
                                    {spkList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.id} - {s.nama_artikel}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter Status QC */}
                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Status QC</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as StatusVerifikasiOutput | '')}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">-- Semua Status --</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* 📊 AREA TABEL ALAMI */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                            <tr>
                                {viewMode === 'history' && <th className="py-3 px-3.5 font-semibold">Tanggal</th>}
                                <th className="py-3 px-3.5 font-semibold">Pekerja</th>
                                <th className="py-3 px-3.5 font-semibold">Artikel SPK</th>
                                <th className="py-3 px-3.5 font-semibold">Sub-Proses</th>
                                <th className="py-3 px-3.5 text-center font-semibold">Pass / Disetor</th>
                                <th className="py-3 px-3.5 text-right font-semibold">Subtotal Rp</th>
                                <th className="py-3 px-3.5 text-center font-semibold">Status QC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={viewMode === 'history' ? 7 : 6} className="py-16 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                                            <span>Memuat data setoran...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : displayedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={viewMode === 'history' ? 7 : 6} className="py-16 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <History className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                                            <span>
                                                {viewMode === 'today'
                                                    ? 'Belum ada setoran output dicatat hari ini.'
                                                    : 'Tidak ada data setoran yang cocok dengan filter rentang tanggal.'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayedLogs.map((log) => {
                                    const hasReject = (log.qty_reject || 0) > 0;

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                            {/* TANGGAL (Hanya Tampil di Mode Riwayat) */}
                                            {viewMode === 'history' && (
                                                <td className="py-3.5 px-3.5 font-mono text-slate-400 text-[11px]">
                                                    {log.tanggal}
                                                </td>
                                            )}

                                            {/* PEKERJA & BUKTI FOTO */}
                                            <td className="py-3.5 px-3.5">
                                                <div className="font-semibold text-slate-100 flex items-center gap-2">
                                                    <span>{log.nama_karyawan || log.karyawan_id}</span>
                                                    {log.foto_bukti_setoran && onOpenLightbox && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onOpenLightbox(
                                                                log.foto_bukti_setoran!,
                                                                `Bukti Foto: ${log.spk_id}`,
                                                                `Pekerja: ${log.nama_karyawan || log.karyawan_id} (${log.tahapan_proses})`
                                                            )}
                                                            className="text-emerald-400 hover:text-emerald-300 p-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-md transition-colors"
                                                            title="Lihat Foto Bukti Setoran"
                                                        >
                                                            <ImageIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                {log.petugas_input && (
                                                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                                                        Input: {log.petugas_input}
                                                    </div>
                                                )}
                                            </td>

                                            {/* SPK & ARTIKEL */}
                                            <td className="py-3.5 px-3.5">
                                                <div className="font-bold text-emerald-400 font-mono text-xs">{log.spk_id}</div>
                                                <div className="text-[11px] text-slate-400 font-medium line-clamp-1">
                                                    {log.nama_artikel || '-'}
                                                </div>
                                            </td>

                                            {/* SUB-PROSES */}
                                            <td className="py-3.5 px-3.5">
                                                <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 font-semibold px-2 py-0.5 rounded-md inline-block">
                                                    {log.tahapan_proses}
                                                </span>
                                            </td>

                                            {/* PASS / DISETOR & REJECT BADGE */}
                                            <td className="py-3.5 px-3.5 text-center">
                                                <div className="font-bold font-mono text-emerald-400 text-xs">
                                                    {log.qty_pass}{' '}
                                                    <span className="text-[11px] text-slate-500 font-normal">
                                                        / {log.qty_disetor} Pcs
                                                    </span>
                                                </div>
                                                {hasReject && (
                                                    <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                                        <span>{log.qty_reject} Reject</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* SUBTOTAL RP */}
                                            <td className="py-3.5 px-3.5 text-right font-bold text-amber-400 font-mono text-xs">
                                                Rp {(log.subtotal_rp || 0).toLocaleString('id-ID')}
                                            </td>

                                            {/* STATUS QC */}
                                            <td className="py-3.5 px-3.5 text-center">
                                                {renderStatusBadge(log.status_verifikasi)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}