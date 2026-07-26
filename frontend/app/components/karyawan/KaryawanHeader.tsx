'use client';

import React from 'react';
import { UserPlus, Search, Archive, Users, UserCheck, RefreshCw } from 'lucide-react';

interface KaryawanHeaderProps {
    viewTab: 'AKTIF' | 'ARCHIVED' | 'ALL';
    setViewTab: (tab: 'AKTIF' | 'ARCHIVED' | 'ALL') => void;
    totalAktif: number;
    totalArchived: number;
    totalAll: number;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    onOpenAddModal: () => void;
    onRefresh?: () => void; // 👈 Prop opsional untuk trigger refresh data
    loading?: boolean;      // 👈 Prop opsional untuk indikator loading
}

export const KaryawanHeader: React.FC<KaryawanHeaderProps> = ({
    viewTab, setViewTab, totalAktif, totalArchived, totalAll,
    searchQuery, setSearchQuery, onOpenAddModal, onRefresh, loading = false
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>👥 Kelola Data Karyawan</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Manajemen SDM, skema borongan/bulanan, log sanksi, dan pengarsipan offboarding.
                </p>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mt-4 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 w-fit">
                    <button
                        onClick={() => setViewTab('AKTIF')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewTab === 'AKTIF'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Karyawan Aktif</span>
                        <span className="ml-1 px-1.5 py-0.2 bg-slate-900/80 rounded-md text-[10px] border border-slate-700/50">
                            {totalAktif}
                        </span>
                    </button>

                    <button
                        onClick={() => setViewTab('ARCHIVED')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewTab === 'ARCHIVED'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Terarsip / Keluar</span>
                        <span className="ml-1 px-1.5 py-0.2 bg-slate-900/80 rounded-md text-[10px] border border-slate-700/50">
                            {totalArchived}
                        </span>
                    </button>

                    <button
                        onClick={() => setViewTab('ALL')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewTab === 'ALL'
                            ? 'bg-slate-800 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>Semua ({totalAll})</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama / ID / jabatan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all w-64"
                    />
                </div>

                {/* 🔄 Tombol Refresh Data */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh Data dari Server"
                        className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                )}

                {/* Tombol Tambah Karyawan */}
                <button
                    onClick={onOpenAddModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Karyawan</span>
                </button>
            </div>
        </div>
    );
};