"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Wallet,
    Users,
    Banknote,
    Loader2,
    Send,
    Calendar,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Search,
    History,
    Filter,
    LayoutGrid,
    List,
    SlidersHorizontal,
    FileText
} from 'lucide-react';
import api from '@/services/api';

interface DetailKaryawan {
    id_karyawan: string;
    nama: string;
    jabatan: string;
    tipe_pay: string;
    gaji_pokok: number;
    tarif_borongan_pcs: number;
    total_pcs_bulan_ini: number;
    total_gaji: number;
}

interface PayrollSummaryResponse {
    periode: string;
    total_karyawan: number;
    total_output_pcs: number;
    total_tagihan_gaji: number;
    detail_karyawan: DetailKaryawan[];
}

interface HistoryLog {
    id: number;
    waktu: string;
    eksekutor_id: string;
    periode: string;
    catatan: string;
}

export default function PayrollModule() {
    const [activeTab, setActiveTab] = useState<'rekap' | 'history'>('rekap');

    // Filter Controls
    const [selectedPeriode, setSelectedPeriode] = useState<string>(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    });
    const [filterTipePay, setFilterTipePay] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [viewMode, setViewMode] = useState<'TABLE' | 'COMPACT' | 'CARDS'>('TABLE');
    const [catatanTransfer, setCatatanTransfer] = useState<string>('');
    const [historyPeriode, setHistoryPeriode] = useState<string>('ALL');

    // Data States
    const [payrollData, setPayrollData] = useState<PayrollSummaryResponse | null>(null);
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');

    // Fetch Summary Gaji
    const fetchPayrollSummary = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await api.get(
                `/api/payroll/summary?periode=${selectedPeriode}&tipe_pay=${filterTipePay}&search=${searchQuery}`
            );
            setPayrollData(res.data);
        } catch (err: any) {
            console.error("Gagal memuat rekap payroll:", err);
            setErrorMsg(err.response?.data?.detail || "Gagal mengambil data payroll dari server.");
        } finally {
            setLoading(false);
        }
    }, [selectedPeriode, filterTipePay, searchQuery]);

    // Fetch History Pencairan
    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const url = historyPeriode === 'ALL'
                ? '/api/payroll/history'
                : `/api/payroll/history?periode=${historyPeriode}`;

            const res = await api.get(url);
            setHistoryLogs(res.data || []);
        } catch (err) {
            console.error("Gagal memuat history:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [historyPeriode]);

    useEffect(() => {
        if (activeTab === 'rekap') {
            fetchPayrollSummary();
        } else {
            fetchHistory();
        }
    }, [activeTab, fetchPayrollSummary, fetchHistory]);

    const handleCairkanGaji = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalNominal = payrollData?.total_tagihan_gaji || 0;

        if (!confirm(`Apakah Anda yakin ingin mencairkan total gaji Rp ${totalNominal.toLocaleString('id-ID')} untuk periode ${selectedPeriode}?`)) {
            return;
        }

        setActionLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const res = await api.post(
                '/api/payroll/mark-paid',
                {
                    periode_gaji: selectedPeriode,
                    catatan_pembayaran: catatanTransfer || `Pencairan Payroll Periode ${selectedPeriode}`
                }
            );
            setSuccessMsg(res.data.message);
            setCatatanTransfer('');
            fetchPayrollSummary();
        } catch (err: any) {
            console.error("Gagal pencairan:", err);
            setErrorMsg(err.response?.data?.detail || "Terjadi kesalahan saat mencairkan gaji.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* HEADER & TAB CONTROL */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-400" />
                            Modul Payroll & Penggajian Karyawan
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Rekapitulasi otomatis gaji bulanan (Borongan, Bulanan, Harian) terintegrasi dengan setoran produksi.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                        <button
                            onClick={() => setActiveTab('rekap')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'rekap'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Wallet className="w-3.5 h-3.5" />
                            Rekap Gaji
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'history'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <History className="w-3.5 h-3.5" />
                            Log History
                        </button>
                    </div>
                </div>

                {/* FILTER BAR TAB REKAP */}
                {activeTab === 'rekap' && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                                <Filter className="w-3.5 h-3.5 text-indigo-400" /> Skema:
                            </span>
                            {['ALL', 'BORONGAN', 'BULANAN', 'HARIAN'].map((tipe) => (
                                <button
                                    key={tipe}
                                    onClick={() => setFilterTipePay(tipe)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterTipePay === tipe
                                        ? 'bg-slate-800 text-indigo-400 border border-indigo-500/40'
                                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                                        }`}
                                >
                                    {tipe === 'ALL' ? 'Semua Pekerja' : tipe}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                <input
                                    type="month"
                                    value={selectedPeriode}
                                    onChange={(e) => setSelectedPeriode(e.target.value)}
                                    className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
                                />
                            </div>
                            <button
                                onClick={fetchPayrollSummary}
                                disabled={loading}
                                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                            </button>
                        </div>
                    </div>
                )}

                {/* FILTER BAR TAB HISTORY LOG */}
                {activeTab === 'history' && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filter Riwayat Log:
                        </span>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {historyPeriode !== 'ALL' ? (
                                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                    <input
                                        type="month"
                                        value={historyPeriode}
                                        onChange={(e) => setHistoryPeriode(e.target.value)}
                                        className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
                                    />
                                </div>
                            ) : (
                                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/30">
                                    Menampilkan Semua Bulan
                                </span>
                            )}

                            <button
                                onClick={() => setHistoryPeriode(historyPeriode === 'ALL' ? selectedPeriode : 'ALL')}
                                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 font-bold transition-all cursor-pointer"
                            >
                                {historyPeriode === 'ALL' ? 'Filter Per Bulan' : 'Tampilkan Semua Bulan'}
                            </button>

                            <button
                                onClick={fetchHistory}
                                disabled={historyLoading}
                                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin text-emerald-400' : ''}`} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* NOTIFIKASI */}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 shadow-lg">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2 shadow-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* TAB CONTENT 1: REKAP GAJI BERJALAN */}
            {activeTab === 'rekap' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Pekerja Filtered</p>
                            <div className="flex items-end gap-2 mt-2">
                                <Users className="w-6 h-6 text-indigo-400" />
                                <span className="text-2xl font-black text-white">{loading ? '...' : payrollData?.total_karyawan || 0}</span>
                                <span className="text-xs text-slate-500 mb-0.5">orang</span>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Setoran Borongan ({selectedPeriode})</p>
                            <div className="flex items-end gap-2 mt-2">
                                <Wallet className="w-6 h-6 text-emerald-400" />
                                <span className="text-2xl font-black text-white">{loading ? '...' : (payrollData?.total_output_pcs || 0).toLocaleString('id-ID')}</span>
                                <span className="text-xs text-slate-500 mb-0.5">pcs</span>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950/40">
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Akumulasi Gaji</p>
                            <div className="flex items-end gap-2 mt-2">
                                <Banknote className="w-6 h-6 text-amber-400" />
                                <span className="text-2xl font-black text-amber-400">
                                    {loading ? '...' : `Rp ${(payrollData?.total_tagihan_gaji || 0).toLocaleString('id-ID')}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white">Rincian Per Karyawan ({selectedPeriode})</h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-bold">
                                    {payrollData?.detail_karyawan.length || 0} Orang
                                </span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {/* Search Box */}
                                <div className="relative flex-1 sm:w-60">
                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama / ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                {/* Layout / Density Switcher */}
                                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                                    <button
                                        onClick={() => setViewMode('TABLE')}
                                        className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                            viewMode === 'TABLE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                        title="Mode Tabel Standar"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('COMPACT')}
                                        className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                            viewMode === 'COMPACT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                        title="Mode Kompak (Rapat)"
                                    >
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('CARDS')}
                                        className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                            viewMode === 'CARDS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                        title="Mode Kartu Grid"
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 1. VIEW MODE: CARDS GRID */}
                        {viewMode === 'CARDS' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {loading ? (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                                        <span>Memuat data kartu payroll...</span>
                                    </div>
                                ) : payrollData?.detail_karyawan.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-slate-500">
                                        Tidak ada data karyawan sesuai filter.
                                    </div>
                                ) : (
                                    payrollData?.detail_karyawan.map((k) => (
                                        <div
                                            key={k.id_karyawan}
                                            className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3 shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-xs uppercase">
                                                        {k.nama.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-xs leading-tight">{k.nama}</h4>
                                                        <p className="text-[10px] text-slate-500 font-mono">{k.id_karyawan} • {k.jabatan}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                                    k.tipe_pay === 'BORONGAN'
                                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                                        : k.tipe_pay === 'BULANAN'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                }`}>
                                                    {k.tipe_pay}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60 text-[11px]">
                                                <div>
                                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Rate/Pokok</span>
                                                    <span className="text-slate-300 font-mono">
                                                        {k.tipe_pay === 'BORONGAN' ? `Rp ${k.tarif_borongan_pcs.toLocaleString('id-ID')}` : `Rp ${k.gaji_pokok.toLocaleString('id-ID')}`}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Setoran</span>
                                                    <span className="text-slate-200 font-mono font-bold">
                                                        {k.tipe_pay === 'BORONGAN' ? `${k.total_pcs_bulan_ini.toLocaleString('id-ID')} Pcs` : '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                                                <span className="text-[10px] text-slate-400 font-semibold">Total Gaji:</span>
                                                <span className="text-sm font-black text-emerald-400 font-mono">
                                                    Rp {k.total_gaji.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 2. VIEW MODE: TABLE & COMPACT */}
                        {viewMode !== 'CARDS' && (
                            <div className="overflow-x-auto">
                                <table className={`w-full text-left ${viewMode === 'COMPACT' ? 'text-[11px]' : 'text-xs'}`}>
                                    <thead className="bg-slate-950 text-slate-400 uppercase border-y border-slate-800">
                                        <tr>
                                            <th className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3 px-3.5'}`}>ID / Nama Pekerja</th>
                                            <th className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3 px-3.5'}`}>Jabatan</th>
                                            <th className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3 px-3.5'}`}>Skema Pay</th>
                                            <th className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3 px-3.5'}`}>Rate / Gaji Pokok</th>
                                            <th className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3 px-3.5'}`}>Setoran Bulan Ini</th>
                                            <th className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3 px-3.5'} text-right`}>Total Akumulasi Gaji</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                                                        <span>Mengkalkulasi setoran dan skema gaji...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : payrollData?.detail_karyawan.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                                                    Tidak ada data karyawan sesuai filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            payrollData?.detail_karyawan.map((k) => (
                                                <tr key={k.id_karyawan} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3.5 px-3.5'} font-bold text-white font-sans`}>
                                                        {k.nama} <span className="text-[10px] text-slate-500 font-mono font-normal">({k.id_karyawan})</span>
                                                    </td>
                                                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3.5 px-3.5'} text-slate-300 font-sans`}>{k.jabatan || '-'}</td>
                                                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3.5 px-3.5'} font-sans`}>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${k.tipe_pay === 'BORONGAN'
                                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                                            : k.tipe_pay === 'BULANAN'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                            }`}>
                                                            {k.tipe_pay}
                                                        </span>
                                                    </td>
                                                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3.5 px-3.5'} text-slate-400`}>
                                                        {k.tipe_pay === 'BORONGAN'
                                                            ? `Rp ${k.tarif_borongan_pcs.toLocaleString('id-ID')} / pcs`
                                                            : `Rp ${k.gaji_pokok.toLocaleString('id-ID')}`
                                                        }
                                                    </td>
                                                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3.5 px-3.5'} text-slate-200 font-bold`}>
                                                        {k.tipe_pay === 'BORONGAN' ? `${k.total_pcs_bulan_ini.toLocaleString('id-ID')} pcs` : '-'}
                                                    </td>
                                                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-2.5' : 'py-3.5 px-3.5'} text-right font-bold text-emerald-400 ${viewMode === 'COMPACT' ? 'text-xs' : 'text-sm'}`}>
                                                        Rp {k.total_gaji.toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Send className="w-4 h-4 text-indigo-400" />
                            Eksekusi Pencairan Dana & Rekam Audit Trail
                        </h3>

                        <form onSubmit={handleCairkanGaji} className="flex flex-col md:flex-row items-center gap-4">
                            <input
                                type="text"
                                placeholder="Catatan transfer / info bank (opsional)..."
                                value={catatanTransfer}
                                onChange={(e) => setCatatanTransfer(e.target.value)}
                                className="w-full md:flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={actionLoading || loading || (payrollData?.total_tagihan_gaji || 0) === 0}
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Cairkan Gaji Periode Ini</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* TAB CONTENT 2: LOG HISTORY PENCAIRAN */}
            {activeTab === 'history' && (
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <History className="w-4 h-4 text-indigo-400" />
                            Riwayat Transaksi Pencairan Gaji
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">
                            {historyPeriode === 'ALL' ? 'Menampilkan Semua Bulan' : `Periode Filter: ${historyPeriode}`}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-950 text-slate-400 uppercase border-y border-slate-800">
                                <tr>
                                    <th className="py-3 px-3.5">Waktu Eksekusi</th>
                                    <th className="py-3 px-3.5">Eksekutor (Actor)</th>
                                    <th className="py-3 px-3.5">Periode Gaji</th>
                                    <th className="py-3 px-3.5">Rincian / Catatan Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {historyLoading ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-500 font-sans">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                                                <span>Memuat riwayat log history pencairan...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : historyLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-slate-500 font-sans">
                                            Belum ada catatan pencairan gaji untuk periode ini.
                                        </td>
                                    </tr>
                                ) : (
                                    historyLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3.5 px-3.5 text-slate-300">
                                                {new Date(log.waktu).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3.5 px-3.5 font-bold text-white font-sans">{log.eksekutor_id}</td>
                                            <td className="py-3.5 px-3.5 text-indigo-400 font-bold">{log.periode}</td>
                                            <td className="py-3.5 px-3.5 text-slate-300 font-sans">{log.catatan}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}