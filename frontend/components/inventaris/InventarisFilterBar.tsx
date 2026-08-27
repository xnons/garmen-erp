'use client';

import React from 'react';
import { Search, Archive, SlidersHorizontal, X, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FilterInventaris } from './types';

interface InventarisFilterBarProps {
    filter: FilterInventaris;
    setFilter: React.Dispatch<React.SetStateAction<FilterInventaris>>;
    totalAktif?: number;
    totalArchived?: number;
}

export default function InventarisFilterBar({
    filter,
    setFilter,
    totalAktif,
    totalArchived
}: InventarisFilterBarProps) {
    const handleResetFilter = () => {
        setFilter({
            search: '',
            kategori: 'ALL',
            statusStok: 'ALL',
            showArchived: false,
            tanggalMulai: undefined,
            tanggalSelesai: undefined
        });
    };

    const hasActiveFilter = filter.search || filter.kategori !== 'ALL' || filter.statusStok !== 'ALL' || filter.tanggalMulai || filter.tanggalSelesai;

    return (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            {/* Baris 1: Status Tab Pills & Search Bar & Archive Toggle */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Quick Status Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setFilter(prev => ({ ...prev, statusStok: 'ALL', showArchived: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${!filter.showArchived && filter.statusStok === 'ALL'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Semua Material</span>
                        {totalAktif !== undefined && (
                            <span className="px-1.5 py-0.2 bg-slate-900/80 rounded text-[10px] border border-slate-700/50">
                                {totalAktif}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, statusStok: 'AMAN', showArchived: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${!filter.showArchived && filter.statusStok === 'AMAN'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'text-slate-400 hover:text-emerald-400'
                            }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Stok Aman</span>
                    </button>

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, statusStok: 'MENIPIS', showArchived: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${!filter.showArchived && filter.statusStok === 'MENIPIS'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'text-slate-400 hover:text-amber-400'
                            }`}
                    >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Perlu Reorder</span>
                    </button>

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, statusStok: 'HABIS', showArchived: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${!filter.showArchived && filter.statusStok === 'HABIS'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'text-slate-400 hover:text-rose-400'
                            }`}
                    >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Stok Habis</span>
                    </button>

                    <button
                        onClick={() => setFilter(prev => ({ ...prev, showArchived: !prev.showArchived }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${filter.showArchived
                            ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Terarsip</span>
                        {totalArchived !== undefined && (
                            <span className="px-1.5 py-0.2 bg-slate-900/80 rounded text-[10px] border border-slate-700/50">
                                {totalArchived}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 lg:w-72">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari SKU, nama, vendor, PO..."
                            value={filter.search}
                            onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-8 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                        />
                        {filter.search && (
                            <button
                                onClick={() => setFilter((prev) => ({ ...prev, search: '' }))}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Baris 2: Advanced Dropdowns & Date Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Kategori Material
                    </label>
                    <select
                        value={filter.kategori}
                        onChange={(e) => setFilter((prev) => ({ ...prev, kategori: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                        <option value="ALL">Semua Kategori</option>
                        <option value="KAIN">Kain (Fabric)</option>
                        <option value="AKSESORIS">Aksesoris (Kancing, Resleting)</option>
                        <option value="BENANG">Benang (Thread)</option>
                        <option value="PACKAGING">Packaging (Plastik, Label)</option>
                        <option value="LAINNYA">Lain-lain</option>
                    </select>
                </div>

                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Filter Tanggal Dari
                    </label>
                    <input
                        type="date"
                        value={filter.tanggalMulai || ''}
                        onChange={(e) => setFilter((prev) => ({ ...prev, tanggalMulai: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Filter Tanggal Sampai
                    </label>
                    <input
                        type="date"
                        value={filter.tanggalSelesai || ''}
                        onChange={(e) => setFilter((prev) => ({ ...prev, tanggalSelesai: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="flex items-end">
                    {hasActiveFilter && (
                        <button
                            onClick={handleResetFilter}
                            className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Reset Filter</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}