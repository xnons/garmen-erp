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
    Inbox,
    Sparkles,
    Mail,
    CheckCircle2,
    BarChart3,
    ShieldCheck
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import api from '@/services/api';
import { produksiService, SPK } from '@/services/produksiService';
import DeadlineAlertBanner from '@/components/dashboard/DeadlineAlertBanner';
import { AICopilotModal } from '@/components/ai/AICopilotModal';

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

const BRAND_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#38bdf8', '#a855f7', '#ec4899'];

export default function DashboardOverview({ activeUser, onNavigate }: DashboardOverviewProps) {
    const userRole = activeUser?.role?.toUpperCase() || 'PRODUKSI';
    const isOwnerOrDev = ['OWNER', 'DEVELOPER'].includes(userRole);
    const isAdminOrGudang = ['ADMIN', 'GUDANG'].includes(userRole);
    const isFinance = userRole === 'FINANCE';
    const canViewFinancial = ['OWNER', 'DEVELOPER', 'ADMIN', 'FINANCE'].includes(userRole);

    const [loading, setLoading] = useState(false);
    const [spkList, setSpkList] = useState<SPK[]>([]);
    const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

    // Email Dispatch State
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

    const [summaryMetrics, setSummaryMetrics] = useState({
        totalOutputToday: 0,
        targetQuotaToday: 1000,
        totalAsetMaterial: 0,
        totalSkuCount: 0,
        mesinSiap: 0,
        mesinTotal: 0,
        mesinPerluService: 0,
        totalKaryawan: 0,
        upahHariIni: 0,
        soAktifCount: 0,
        canViewFinancial: true
    });

    const [ownerAnalytics, setOwnerAnalytics] = useState<{
        stationThroughput: any[];
        buyerShare: any[];
        financialTrend: any[];
        healthScore: number;
        totalDiscrepancyLost: number;
        totalRejects: number;
        totalShippedPcs: number;
    } | null>(null);

    const [trenProduksi, setTrenProduksi] = useState<TrenProduksiItem[]>([]);
    const [alokasiBrand, setAlokasiBrand] = useState<AlokasiBrandItem[]>([]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [resStats, resProduksi, resBrand, resSPK, resOwner] = await Promise.all([
                api.get('/api/dashboard/overview-stats').catch(() => null),
                api.get('/api/dashboard/chart-produksi').catch(() => null),
                api.get('/api/dashboard/chart-brand-material').catch(() => null),
                produksiService.getAllSPK().catch(() => []),
                isOwnerOrDev ? api.get('/api/dashboard/owner-analytics').catch(() => null) : Promise.resolve(null)
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

            if (resOwner && resOwner.data && !resOwner.data.error) {
                setOwnerAnalytics(resOwner.data);
            }

            if (Array.isArray(resSPK)) {
                setSpkList(resSPK);
            }
        } catch (err) {
            console.error('Gagal mengambil data dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [isOwnerOrDev]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData, activeUser]);

    const handleSendExecutiveEmail = async () => {
        setIsSendingEmail(true);
        setEmailStatusMsg(null);
        try {
            const res = await api.post('/api/reports/send-briefing', {
                recipient_email: 'muhammadtegarsaputra@gmail.com',
                recipient_name: activeUser?.nama || 'Muhammad Tegar Saputra'
            });
            setEmailStatusMsg(res.data?.message || 'Laporan eksekutif berhasil dikirim!');
            setTimeout(() => setEmailStatusMsg(null), 5000);
        } catch (err: any) {
            setEmailStatusMsg('⚠️ Terjadi kendala saat mengirim email.');
            setTimeout(() => setEmailStatusMsg(null), 5000);
        } finally {
            setIsSendingEmail(false);
        }
    };

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
        <div className="space-y-4 sm:space-y-6 text-slate-100">

            {/* AI CO-PILOT MODAL */}
            <AICopilotModal
                isOpen={isAICopilotOpen}
                onClose={() => setIsAICopilotOpen(false)}
                activeUser={activeUser}
            />

            {/* 🟢 BANNER PERINGATAN DEADLINE OTOMATIS */}
            <DeadlineAlertBanner
                spkList={spkList}
                onNavigateToSPK={() => {
                    if (onNavigate) onNavigate('produksi');
                }}
            />

            {/* HEADER DASHBOARD */}
            <div className="bg-slate-900/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h2 className="text-2xl font-black tracking-tight text-white">
                            {isOwnerOrDev && 'Ringkasan Eksekutif Operasional Pabrik'}
                            {isAdminOrGudang && 'Papan Kendali Logistik & Inventaris'}
                            {isFinance && 'Ringkasan Finansial & Penggajian'}
                            {!canViewFinancial && 'Lantai Produksi & Target Borongan'}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {userRole}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">
                        Selamat datang kembali, <strong className="text-slate-200">{activeUser?.nama || 'Pengguna'}</strong>. Sistem siap memantau alur manufaktur garmen end-to-end.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* BUTTON KIRIM EMAIL LAPORAN */}
                    {canViewFinancial && (
                        <button
                            onClick={handleSendExecutiveEmail}
                            disabled={isSendingEmail}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
                            title="Kirim Laporan Eksekutif ke Email Owner"
                        >
                            <Mail className={`w-4 h-4 ${isSendingEmail ? 'animate-bounce text-indigo-400' : 'text-slate-400'}`} />
                            {isSendingEmail ? 'Mengirim...' : 'Kirim Email Briefing'}
                        </button>
                    )}

                    <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shadow-md"
                        title="Segarkan Data Real-time"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ⚡ 1-CLICK QUICK ACTION BAR */}
            <div className="bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0 hidden sm:inline">
                    Aksi Cepat:
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => onNavigate && onNavigate('ppic')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                        <Package className="w-3.5 h-3.5" /> + Register SO Baru
                    </button>
                    <button
                        onClick={() => onNavigate && onNavigate('warehouse')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                        <Package className="w-3.5 h-3.5" /> + Log Roll Kain
                    </button>
                    <button
                        onClick={() => onNavigate && onNavigate('cutting')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                        <Scissors className="w-3.5 h-3.5" /> + Log Meja Potong
                    </button>
                    <button
                        onClick={() => onNavigate && onNavigate('shipping')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/10 hover:bg-sky-600/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                        <TrendingUp className="w-3.5 h-3.5" /> + Terbitkan SJP
                    </button>
                </div>
            </div>

            {/* EMAIL STATUS ALERT TOAST */}
            {emailStatusMsg && (
                <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{emailStatusMsg}</span>
                    </div>
                </div>
            )}

            {/* KARTU KPI UTAMA REAL-TIME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. TOTAL OUTPUT HARI INI */}
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

                {/* 2. ASET MATERIAL GUDANG (ISOLASI FINANSIAL: NON-FINANCIAL LIHAT SKU) */}
                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg hover:border-emerald-500/40 transition-all">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {canViewFinancial ? 'Aset Material Gudang' : 'Stok Material Gudang'}
                        </span>
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-400 font-mono">
                            {canViewFinancial ? formatIDR(summaryMetrics.totalAsetMaterial) : `${summaryMetrics.totalSkuCount} SKU Aktif`}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {canViewFinancial ? `${summaryMetrics.totalSkuCount} SKU Bahan Baku Terdaftar` : 'Bahan Baku Siap Potong'}
                        </p>
                    </div>
                </div>

                {/* 3. STATUS MESIN JAHIT */}
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

                {/* 4. TOTAL BATCH SO AKTIF */}
                <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-lg hover:border-purple-500/40 transition-all">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch Sales Order</span>
                        <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white font-mono">
                            {summaryMetrics.soAktifCount || 0} <span className="text-xs font-normal text-slate-400">SO Aktif</span>
                        </p>
                        <p className="text-[11px] text-indigo-400 mt-1 font-semibold">
                            Total {summaryMetrics.totalKaryawan || 0} Karyawan Terdaftar
                        </p>
                    </div>
                </div>
            </div>

            {/* 🌟 LIVE ORDER PIPELINE TRACKER */}
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Live Order Pipeline & Work-In-Progress Radar</h3>
                            <p className="text-[11px] text-slate-400">Tahapan manufaktur live dari Kain Mentah hingga SJP Dikirim</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg self-start sm:self-auto">
                        7 FASE REAL-TIME
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                    {[
                        { step: '1', title: 'PPIC / SO', status: 'REGISTERED', color: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-300' },
                        { step: '2', title: 'QC 4-Point', status: 'INSPECTED', color: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-300' },
                        { step: '3', title: 'Meja Potong', status: 'CUTTING', color: 'border-amber-500/40 bg-amber-500/5 text-amber-300' },
                        { step: '4', title: 'Subcon Jahit', status: 'SEWING WIP', color: 'border-blue-500/40 bg-blue-500/5 text-blue-300' },
                        { step: '5', title: 'Washing', status: 'TREATMENT', color: 'border-teal-500/40 bg-teal-500/5 text-teal-300' },
                        { step: '6', title: 'Finishing', status: 'STEAM/PACK', color: 'border-purple-500/40 bg-purple-500/5 text-purple-300' },
                        { step: '7', title: 'SJP Terkirim', status: 'DELIVERED', color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300' }
                    ].map((phase, idx) => (
                        <div
                            key={phase.step}
                            className={`p-3 rounded-2xl border ${phase.color} flex flex-col justify-between space-y-2 hover:scale-[1.02] transition-transform`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black font-mono opacity-60">Fase {phase.step}</span>
                                <span className="w-2 h-2 rounded-full bg-current animate-ping" style={{ animationDuration: `${2 + idx}s` }} />
                            </div>
                            <div>
                                <p className="font-black text-xs text-white leading-tight">{phase.title}</p>
                                <p className="text-[9px] font-mono uppercase tracking-wider opacity-75 mt-0.5">{phase.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============================================================= */}
            {/* 👑 OWNER & DEVELOPER EXECUTIVE ANALYTICS (MULTI-GRAPHICS)     */}
            {/* ============================================================= */}
            {isOwnerOrDev && ownerAnalytics && (
                <div className="space-y-6 pt-2">
                    
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-lg font-black text-white tracking-tight">
                            Executive Multi-Graphics Analytics (Owner Only)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* 1. BAR CHART: THROUGHPUT ANTAR STASIUN PABRIK */}
                        <div className="lg:col-span-2 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div>
                                    <h4 className="font-bold text-white text-sm">Throughput Output Antar Stasiun</h4>
                                    <p className="text-[11px] text-slate-400">Total akumulasi pcs output per tahapan produksi garmen</p>
                                </div>
                                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold rounded-lg border border-indigo-500/20">
                                    Live Stream
                                </span>
                            </div>

                            <div className="h-64 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ownerAnalytics.stationThroughput}>
                                        <XAxis dataKey="station" stroke="#64748b" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="output" name="Output Pcs" radius={[8, 8, 0, 0]}>
                                            {ownerAnalytics.stationThroughput.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. CARD TELEMETRI KESEHATAN PABRIK */}
                        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div>
                                    <h4 className="font-bold text-white text-sm">Factory Health Index</h4>
                                    <p className="text-[11px] text-slate-400">Skor performa dan audit integritas pabrik</p>
                                </div>
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            </div>

                            <div className="py-4 flex flex-col items-center justify-center">
                                <div className="w-28 h-28 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
                                    <span className="text-3xl font-black text-white font-mono">{ownerAnalytics.healthScore}</span>
                                    <span className="text-[10px] text-indigo-400 font-bold uppercase">Skor / 100</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                                <div className="flex justify-between text-slate-300">
                                    <span>Total Pengiriman SJP:</span>
                                    <strong className="text-emerald-400 font-mono">{ownerAnalytics.totalShippedPcs} pcs</strong>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Selisih Subkon Hilang:</span>
                                    <strong className={`${ownerAnalytics.totalDiscrepancyLost > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'} font-mono`}>
                                        {ownerAnalytics.totalDiscrepancyLost} pcs
                                    </strong>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Total Rijek Terdata:</span>
                                    <strong className="text-amber-400 font-mono">{ownerAnalytics.totalRejects} pcs</strong>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* SECTION GRAFIK STANDAR (TREN OUTPUT & PORSI BUYER) */}
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

        </div>
    );
}