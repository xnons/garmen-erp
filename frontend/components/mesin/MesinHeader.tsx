'use client';

import React from 'react';
import {
    Cpu,
    CheckCircle2,
    Wallet,
    TrendingDown,
    Search,
    Plus,
    Archive,
    Wrench,
    RefreshCw,
    X,
    Layers,
    Sparkles,
    AlertTriangle
} from 'lucide-react';
import { MesinAsset, FilterState } from './types';

interface MesinHeaderProps {
    machines: MesinAsset[];
    filter: FilterState;
    setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
    onOpenAddModal: () => void;
    onRefresh?: () => void;
    loading?: boolean;
}

export default function MesinHeader({
    machines,
    filter,
    setFilter,
    onOpenAddModal,
    onRefresh,
    loading = false
}: MesinHeaderProps) {
    const allMachines = machines || [];
    const activeMachines = allMachines.filter(m => m.status !== 'ARCHIVED');
    const archivedMachines = allMachines.filter(m => m.status === 'ARCHIVED');

    const totalAssets = activeMachines.length;
    const readyAssets = activeMachines.filter(m => m.status === 'AKTIF').length;
    const maintenanceAssets = activeMachines.filter(m => m.status === 'MAINTENANCE' || m.status === 'PERLU_SERVIS' || m.status === 'RUSAK').length;

    // 🟢 Safe Reduce untuk menghindari nilai NaN saat akumulasi
    const totalSisaUtang = activeMachines.reduce((acc, m) => acc + (Number(m.sisa_pembayaran) || 0), 0);
    const totalNilaiBuku = activeMachines.reduce((acc, m) => acc + (Number(m.nilai_buku_saat_ini) || Number(m.harga_beli) || 0), 0);

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

    return (
        <div className="space-y-6">
            {/* Header Title & Action Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                        <Cpu className="w-6 h-6 text-indigo-400" />
                        <span>Inventaris Mesin & Aset Produksi</span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Tracking operasional mesin jahit/obras, jadwal servis berkala, cicilan aset, dan depresiasi nilai.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            title="Refresh Data Mesin dari Server"
                            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    )}

                    <button
                        onClick={onOpenAddModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Registrasi Mesin Baru</span>
                    </button>
                </div>
            </div>

            {/* Dynamic KPI Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Unit Mesin */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                                Total Aset Mesin
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-black text-white">{totalAssets}</span>
                                <span className="text-xs text-slate-400">Unit Aktif</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Tersebar di line jahit & finishing
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Cpu className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Siap Beroperasi (Normal) */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                Siap Beroperasi
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-black text-emerald-400">{readyAssets}</span>
                                <span className="text-xs text-emerald-500/80">Kondisi Prima</span>
                            </div>
                            <p className="text-[11px] text-emerald-400/70 mt-1">
                                Operasional lancar tanpa kendala
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 3. Maintenance / Perlu Servis */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                                Maintenance & Servis
                            </p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-black text-amber-400">{maintenanceAssets}</span>
                                <span className="text-xs text-amber-500/80">Unit Perlu Tindakan</span>
                            </div>
                            <p className="text-[11px] text-amber-400/70 mt-1">
                                Servis berkala / perbaikan
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                            <Wrench className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 4. Sisa Cicilan / Nilai Buku */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                                Sisa Utang Pembelian
                            </p>
                            <div className="text-xl font-black text-white mt-1 truncate font-mono">
                                {formatIDR(totalSisaUtang)}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Nilai Buku: <span className="text-indigo-300 font-mono font-medium">{formatIDR(totalNilaiBuku)}</span>
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
                {/* Baris 1: Quick Status Tabs & Search Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setFilter(prev => ({ ...prev, status: 'ALL', showArchived: false }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${!filter.showArchived && filter.status === 'ALL'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Semua Mesin</span>
                            <span className="px-1.5 py-0.2 bg-slate-900/80 rounded text-[10px] border border-slate-700/50">
                                {totalAssets}
                            </span>
                        </button>

                        <button
                            onClick={() => setFilter(prev => ({ ...prev, status: 'AKTIF', showArchived: false }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${!filter.showArchived && filter.status === 'AKTIF'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'text-slate-400 hover:text-emerald-400'
                                }`}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Siap Kerja ({readyAssets})</span>
                        </button>

                        <button
                            onClick={() => setFilter(prev => ({ ...prev, status: 'MAINTENANCE', showArchived: false }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${!filter.showArchived && filter.status === 'MAINTENANCE'
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                                : 'text-slate-400 hover:text-amber-400'
                                }`}
                        >
                            <Wrench className="w-3.5 h-3.5 text-amber-400" />
                            <span>Maintenance ({maintenanceAssets})</span>
                        </button>

                        <button
                            onClick={() => setFilter(prev => ({ ...prev, showArchived: !prev.showArchived }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${filter.showArchived
                                ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Terarsip / Buang ({archivedMachines.length})</span>
                        </button>
                    </div>

                    {/* Search & Category Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari kode, nama, merk, vendor..."
                                value={filter.search}
                                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                            />
                            {filter.search && (
                                <button
                                    onClick={() => setFilter(prev => ({ ...prev, search: '' }))}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <select
                            value={filter.status}
                            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="AKTIF">Aktif</option>
                            <option value="PERLU_SERVIS">Perlu Servis</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="RUSAK">Rusak</option>
                            <option value="NON_AKTIF">Non-Aktif</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}