"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    Award,
    Loader2,
    RefreshCw,
    Layers,
    PieChart,
    Filter,
    RotateCcw,
    PackageCheck,
    Briefcase
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';

import {
    produksiService,
    ProductionAnalyticsDashboard,
    SPK
} from '../services/produksiService';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function TabAnalitik() {
    const [analytics, setAnalytics] = useState<ProductionAnalyticsDashboard | null>(null);
    const [spkList, setSpkList] = useState<SPK[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string>('');

    // 🎛️ State Filter Bar
    const [selectedSpk, setSelectedSpk] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // 📦 Fetch Master SPK / Projek untuk Dropdown Filter
    useEffect(() => {
        const fetchSpkMaster = async () => {
            try {
                const data = await produksiService.getAllSPK();
                setSpkList(data || []);
            } catch (err) {
                console.error('Gagal memuat daftar SPK:', err);
            }
        };
        fetchSpkMaster();
    }, []);

    // 📊 Fetch Data Analytics
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const data = await produksiService.getAnalytics(
                startDate || undefined,
                endDate || undefined,
                selectedSpk || undefined
            );
            setAnalytics(data);
        } catch (err: any) {
            console.error('Gagal memuat analitik produksi:', err);
            setErrorMsg(err.response?.data?.detail || 'Gagal mengambil data analitik dari server.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, selectedSpk]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Reset Filter Form
    const handleResetFilter = () => {
        setSelectedSpk('');
        setStartDate('');
        setEndDate('');
    };

    if (loading && !analytics) {
        return (
            <div className="bg-slate-900 p-20 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center gap-4 text-slate-400 shadow-2xl">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
                <span className="text-sm font-semibold tracking-wide">Mengkalkulasi Metrik & Visualisasi Produksi...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 🟢 HEADER TOOLBAR */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <BarChart3 className="w-5 h-5 text-emerald-400" />
                        Dashboard Analitik & KPI Produksi
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Ringkasan performa output harian, tingkat defect, distribusi upah borongan, dan progres real-time.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={fetchAnalytics}
                        disabled={loading}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-inner"
                        title="Reload Data Analitik"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                        <span>Refresh Data</span>
                    </button>
                </div>
            </div>

            {/* 🔍 FILTER CONTROL PANEL */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                            Parameter Filter Analitik
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20"
                    >
                        <RotateCcw className="w-3 h-3" /> Reset Filter
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                        <label className="block text-slate-400 mb-1.5 font-semibold">Filter SPK / Artikel</label>
                        <select
                            value={selectedSpk}
                            onChange={(e) => setSelectedSpk(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
                        >
                            <option value="">-- Semua SPK / Projek --</option>
                            {spkList.map((spk) => (
                                <option key={spk.id} value={spk.id}>
                                    {spk.id} - {spk.nama_artikel} ({spk.nama_pemesan || 'Umum'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1.5 font-semibold">Tanggal Mulai</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1.5 font-semibold">Tanggal Selesai</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 rounded-xl shadow-md">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span className="font-medium">{errorMsg}</span>
                </div>
            )}

            {analytics && (
                <>
                    {/* 📊 KPI SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 space-y-2 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Output Pass</span>
                                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                                    <PackageCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white font-mono relative z-10">
                                {analytics.total_output_pass?.toLocaleString('id-ID') || 0}{' '}
                                <span className="text-xs text-slate-500 font-normal">Pcs</span>
                            </h3>
                            <p className="text-[11px] text-emerald-400 font-semibold relative z-10">Lolos QC & Siap Payroll</p>
                        </div>

                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 space-y-2 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all"></div>
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rata-rata Defect</span>
                                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-rose-400 font-mono relative z-10">
                                {analytics.average_defect_rate || 0}%
                            </h3>
                            <p className="text-[11px] text-slate-400 font-semibold relative z-10">
                                Total Cacat: {analytics.total_output_reject?.toLocaleString('id-ID') || 0} Pcs
                            </p>
                        </div>

                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 space-y-2 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all"></div>
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Upah Borongan</span>
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-amber-400 font-mono relative z-10">
                                Rp {(analytics.total_upah_borongan || 0).toLocaleString('id-ID')}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-semibold relative z-10">Akumulasi Status Approved</p>
                        </div>

                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 space-y-2 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all"></div>
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Setoran Reject</span>
                                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                                    <PieChart className="w-4 h-4" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-200 font-mono relative z-10">
                                {analytics.total_output_reject?.toLocaleString('id-ID') || 0}{' '}
                                <span className="text-xs text-slate-500 font-normal">Pcs</span>
                            </h3>
                            <p className="text-[11px] text-rose-400 font-semibold relative z-10">Membutuhkan Rework / Scrap</p>
                        </div>
                    </div>

                    {/* 📈 AREA GRAFIK VISUALISASI UTAMA (AREA & BAR) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Grafik Tren Harian */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <h4 className="text-sm font-bold text-white">Tren Hasil Produksi Harian (Pass vs Reject)</h4>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                    Timeline Harian
                                </span>
                            </div>

                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.trend_harian || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorReject" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="tanggal" stroke="#64748b" fontSize={10} tickLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        <Area type="monotone" dataKey="total_pcs_pass" name="Lolos (Pass)" stroke="#10b981" fillOpacity={1} fill="url(#colorPass)" strokeWidth={2.5} />
                                        <Area type="monotone" dataKey="total_pcs_reject" name="Cacat (Reject)" stroke="#f43f5e" fillOpacity={1} fill="url(#colorReject)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Grafik Defect Rate per Tahapan */}
                        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    <h4 className="text-sm font-bold text-white">Persentase Defect Rate (%) Berdasarkan Tahapan</h4>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                    Analisis Kualitas
                                </span>
                            </div>

                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.defect_breakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="tahapan_proses" stroke="#64748b" fontSize={10} tickLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} unit="%" tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        />
                                        <Bar dataKey="defect_rate_pct" name="Tingkat Cacat (%)" radius={[6, 6, 0, 0]}>
                                            {(analytics.defect_breakdown || []).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 🏆 SPK PROGRESS & LEADERBOARD PEKERJA */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-400" />
                                    Progress Target & Output SPK Aktif
                                </h3>
                                <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 font-mono">
                                    {analytics.progress_spk?.length || 0} SPK Berjalan
                                </span>
                            </div>

                            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                                {!analytics.progress_spk || analytics.progress_spk.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-12">
                                        Belum ada data progress SPK aktif.
                                    </p>
                                ) : (
                                    analytics.progress_spk.map((item) => (
                                        <div
                                            key={item.spk_id}
                                            className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2.5 hover:border-slate-700 transition-all"
                                        >
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-400 font-mono">{item.spk_id}</span>
                                                    <span className="text-slate-200 font-semibold">{item.nama_artikel}</span>
                                                </div>
                                                <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                                                    {item.persentase_selesai}% Selesai
                                                </span>
                                            </div>

                                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                    style={{ width: `${Math.min(100, item.persentase_selesai)}%` }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1 font-mono">
                                                <div>Target: <strong className="text-white">{item.target_qty}</strong></div>
                                                <div>Potong: <strong className="text-white">{item.realisasi_potong}</strong></div>
                                                <div>Sewing: <strong className="text-white">{item.progress_sewing}</strong></div>
                                                <div>Packing: <strong className="text-emerald-400">{item.progress_packing}</strong></div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    Top 5 Pekerja Produktif
                                </h3>
                                <span className="text-[10px] text-slate-400 font-mono">Berdasarkan Qty Pass</span>
                            </div>

                            <div className="space-y-3">
                                {!analytics.top_workers || analytics.top_workers.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-12">
                                        Belum ada data akumulasi pekerja.
                                    </p>
                                ) : (
                                    analytics.top_workers.map((worker, idx) => (
                                        <div
                                            key={worker.karyawan_id}
                                            className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0
                                                        ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                                                        : idx === 1
                                                            ? 'bg-slate-300 text-slate-950'
                                                            : idx === 2
                                                                ? 'bg-amber-700 text-white'
                                                                : 'bg-slate-800 text-slate-400'
                                                        }`}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <div className="text-xs font-bold text-white">
                                                        {worker.nama_karyawan}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {worker.total_pcs_pass?.toLocaleString('id-ID')} Pcs Pass
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right text-xs font-bold text-emerald-400 font-mono">
                                                Rp {(worker.total_pendapatan_rp || 0).toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}