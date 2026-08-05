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
    Sparkles
} from 'lucide-react';
import { MesinAsset, FilterState } from './types';

interface MesinHeaderProps {
    machines: MesinAsset[];
    filter: FilterState;
    setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
    onOpenAddModal: () => void;
}

export default function MesinHeader({ machines, filter, setFilter, onOpenAddModal }: MesinHeaderProps) {
    const activeMachines = (machines || []).filter(m => m.status !== 'ARCHIVED');

    const totalAssets = activeMachines.length;
    const activeAssets = activeMachines.filter(m => m.status === 'AKTIF').length;

    // 🟢 Safe Reduce untuk menghindari nilai NaN saat akumulasi
    const totalSisaUtang = activeMachines.reduce((acc, m) => acc + (Number(m.sisa_pembayaran) || 0), 0);
    const totalNilaiBuku = activeMachines.reduce((acc, m) => acc + (Number(m.nilai_buku_saat_ini) || 0), 0);

    // 🟢 Safe IDR Formatter untuk mencegah tampilan 'RpNaN'
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
        <div className="space-y-6 mb-6">
            {/* Header Title & Action Button */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2 backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        <span>Nexora Asset Engine v2.0</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Manajemen Mesin & Pembayaran
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Tracking operasional, siklus garansi, angsuran aset, dan penyusutan nilai finansial.
                    </p>
                </div>

                <button
                    onClick={onOpenAddModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                    <span>Registrasi Mesin Baru</span>
                </button>
            </div>

            {/* Dynamic KPI Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Aset Aktif */}
                <div className="group relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Aset Aktif</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-extrabold text-white">{totalAssets}</span>
                            <span className="text-xs text-slate-500">Unit Terdaftar</span>
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Cpu className="w-5 h-5" />
                    </div>
                </div>

                {/* Siap Beroperasi */}
                <div className="group relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Siap Beroperasi</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-extrabold text-emerald-400">{activeAssets}</span>
                            <span className="text-xs text-emerald-600/80">Normal</span>
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                {/* Sisa Utang Pembelian */}
                <div className="group relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl hover:border-amber-500/30 transition-all duration-300 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Sisa Utang Pembelian</p>
                        <div className="text-2xl font-extrabold text-amber-400 mt-2 truncate font-mono">
                            {formatIDR(totalSisaUtang)}
                        </div>
                        <p className="text-[10px] text-amber-500/70 mt-1">Status cicilan berjalan</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>

                {/* Nilai Buku Aset */}
                <div className="group relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Nilai Buku Aset</p>
                        <div className="text-2xl font-extrabold text-indigo-300 mt-2 truncate font-mono">
                            {formatIDR(totalNilaiBuku)}
                        </div>
                        <p className="text-[10px] text-indigo-500/70 mt-1">Setelah estimasi penyusutan</p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-center gap-3 shadow-inner">
                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Cari Kode, Nama Mesin, Vendor, No Seri..."
                        value={filter.search}
                        onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>

                <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-medium"
                >
                    <option value="ALL">Semua Status Operasional</option>
                    <option value="AKTIF">Aktif</option>
                    <option value="PERLU_SERVIS">Perlu Servis</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RUSAK">Rusak</option>
                    <option value="NON_AKTIF">Non-Aktif</option>
                </select>

                {/* Toggle Arsip Button */}
                <button
                    onClick={() => setFilter(prev => ({ ...prev, showArchived: !prev.showArchived }))}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${filter.showArchived
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                >
                    <Archive className={`w-4 h-4 ${filter.showArchived ? 'text-rose-400' : 'text-purple-400'}`} />
                    <span>{filter.showArchived ? 'Tampilkan Mesin Aktif' : 'Lihat Arsip / Buang'}</span>
                </button>
            </div>
        </div>
    );
}