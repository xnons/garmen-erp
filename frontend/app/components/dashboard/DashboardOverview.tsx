"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Scissors,
    Users,
    Package,
    Cpu,
    TrendingUp,
    AlertTriangle,
    Activity,
    PieChart as PieIcon,
    Loader2,
    RefreshCw,
    Inbox
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import api from '../services/api';

interface DashboardOverviewProps {
    activeUser: any;
    onNavigate?: (menu: string) => void;
}

interface TrenProduksiItem {
    hari: string;
    pcs: number;
    target: number;
}

interface AlokasiBrandItem {
    name: string;
    value: number;
    color: string;
}

const BRAND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#38bdf8', '#a855f7', '#64748b'];

export default function DashboardOverview({ activeUser, onNavigate }: DashboardOverviewProps) {
    const userRole = activeUser?.role?.toUpperCase() || 'PRODUKSI';
    const isOwnerOrDev = ['OWNER', 'DEVELOPER'].includes(userRole);
    const isAdminOrGudang = ['ADMIN', 'GUDANG'].includes(userRole);
    const isFinance = userRole === 'FINANCE';
    const isProduksi = ['PRODUKSI', 'KARYAWAN'].includes(userRole);

    const [loading, setLoading] = useState(false);

    const [summaryMetrics, setSummaryMetrics] = useState({
        totalOutputToday: 0,
        targetQuotaToday: 1000,
        totalAsetMaterial: 0,
        totalSkuCount: 0,
        mesinSiap: 0,
        mesinTotal: 0,
        mesinPerluService: 0,
        totalKaryawan: 0,
        upahHariIni: 0
    });

    const [trenProduksi, setTrenProduksi] = useState<TrenProduksiItem[]>([]);
    const [alokasiBrand, setAlokasiBrand] = useState<AlokasiBrandItem[]>([]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [resStats, resProduksi, resBrand] = await Promise.all([
                api.get('/api/dashboard/overview-stats').catch(() => null),
                api.get('/api/dashboard/chart-produksi').catch(() => null),
                api.get('/api/dashboard/chart-brand-material').catch(() => null)
            ]);

            if (resStats && resStats.data) {
                setSummaryMetrics((prev) => ({
                    ...prev,
                    ...resStats.data
                }));
            }

            if (resProduksi && Array.isArray(resProduksi.data)) {
                setTrenProduksi(resProduksi.data);
            }

            if (resBrand && Array.isArray(resBrand.data)) {
                setAlokasiBrand(
                    resBrand.data.map((item: any, idx: number) => ({
                        ...item,
                        color: BRAND_COLORS[idx % BRAND_COLORS.length]
                    }))
                );
            }
        } catch (err) {
            console.error('Gagal mengambil data dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData, activeUser]);

    const formatIDR = (val: number) => {
        const num = Number(val);
        if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatNumber = (val: number) => {
        const num = Number(val);
        if (isNaN(num) || num === null || num === undefined) return '0';
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl space-y-1 text-xs">
                    <p className="font-bold text-white mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="font-mono font-semibold">
                            {entry.name}: {typeof entry.value === 'number' && entry.value > 10000 ? formatIDR(entry.value) : `${formatNumber(entry.value)} Pcs`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950 text-slate-100 space-y-6 custom-scrollbar">

            {/* Header Module */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            {isOwnerOrDev && 'Ringkasan Eksekutif Operasional Pabrik'}
                            {isAdminOrGudang && 'Papan Kendali Logistik & Inventaris'}
                            {isFinance && 'Ringkasan Finansial & Penggajian'}
                            {isProduksi && 'Lantai Produksi & Target Borongan'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {userRole}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">
                        Selamat datang kembali, <strong className="text-slate-200">{activeUser?.nama || 'Pengguna'}</strong>.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                    <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Segarkan Data Real-time"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                    </button>
                    <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Sistem Aktif | Shift Pagi</span>
                    </div>
                </div>
            </div>

            {/* KARTU KPI UTAMA REAL-TIME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg hover:border-indigo-500/40 transition-all">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Output Hari Ini</span>
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
                            <Scissors className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white font-mono">
                            {formatNumber(summaryMetrics.totalOutputToday)} <span className="text-xs font-normal text-slate-400">Pcs</span>
                        </p>
                        <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Target Quota: {formatNumber(summaryMetrics.targetQuotaToday)} Pcs
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg hover:border-emerald-500/40 transition-all">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aset Material Gudang</span>
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-400 font-mono">
                            {formatIDR(summaryMetrics.totalAsetMaterial)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{summaryMetrics.totalSkuCount} SKU Bahan Baku Terdaftar</p>
                    </div>
                </div>

                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg hover:border-sky-500/40 transition-all">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Mesin Jahit</span>
                        <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl">
                            <Cpu className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white font-mono">
                            {summaryMetrics.mesinSiap} / {summaryMetrics.mesinTotal} <span className="text-xs font-normal text-slate-400">Siap Pakai</span>
                        </p>
                        <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {summaryMetrics.mesinPerluService} Unit Perlu Service
                        </p>
                    </div>
                </div>

                {/* KARTU PRESENSI STAFF */}
                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg hover:border-purple-500/40 transition-all">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presensi Staff</span>
                        <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-base font-bold text-amber-400 font-mono leading-tight">
                            Modul Dalam Pengembangan
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Total {summaryMetrics.totalKaryawan || 0} Karyawan Terdaftar
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION GRAFIK VISUALISASI RECHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Area Chart Tren Produksi Harian */}
                <div className="lg:col-span-2 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl min-h-[340px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Tren Output Produksi Harian</h3>
                                <p className="text-[11px] text-slate-400">Record riil output pcs borongan dari database</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 w-full pt-2">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                <span className="text-xs">Memuat data dari database...</span>
                            </div>
                        ) : trenProduksi.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trenProduksi}>
                                    <defs>
                                        <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hari" stroke="#64748b" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="pcs" name="Output Real" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOutput)" />
                                    <Area type="monotone" dataKey="target" name="Target" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5">
                                <Inbox className="w-8 h-8 opacity-30 text-indigo-400" />
                                <span>Belum ada record data tren produksi di database.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Donut Chart Alokasi Material Brand */}
                <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between min-h-[340px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                                <PieIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Alokasi Material Brand</h3>
                                <p className="text-[11px] text-slate-400">Distribusi stok material peruntukan brand</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-48 w-full relative flex items-center justify-center">
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                        ) : alokasiBrand.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={alokasiBrand}
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {alokasiBrand.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-bold text-white font-mono">{alokasiBrand.length} Brand</span>
                                    <span className="text-[10px] text-slate-400">Aktif</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5">
                                <Inbox className="w-8 h-8 opacity-30 text-emerald-400" />
                                <span>Belum ada data alokasi brand.</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
                        {alokasiBrand.length > 0 ? (
                            alokasiBrand.map((item) => (
                                <div key={item.name} className="flex items-center gap-1.5 truncate">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-slate-300 truncate">{item.name} ({item.value}%)</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-slate-500 text-[10px] col-span-2 text-center">Menunggu entri stok material peruntukan brand.</span>
                        )}
                    </div>
                </div>

            </div>

        </main>
    );
}