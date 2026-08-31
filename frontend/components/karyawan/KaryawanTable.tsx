import React, { useState, useMemo } from 'react';
import {
    Calendar, Phone, Briefcase, DollarSign, Pencil, AlertTriangle,
    Trash2, Archive, UserCheck, UserMinus, ChevronLeft, ChevronRight,
    User, Mail, ShieldAlert, Sparkles
} from 'lucide-react';
import { Karyawan, ViewMode, DepartmentFilter } from './types';

interface KaryawanTableProps {
    loading: boolean;
    karyawanList: Karyawan[];
    viewMode?: ViewMode;
    deptFilter?: DepartmentFilter;
    onEdit: (karyawan: Karyawan) => void;
    onSanksi: (karyawan: Karyawan) => void;
    onArchive: (karyawan: Karyawan) => void;
    onDelete: (id: string, nama: string) => void;
}

export const KaryawanTable: React.FC<KaryawanTableProps> = ({
    loading,
    karyawanList,
    viewMode = 'TABLE',
    deptFilter = 'ALL',
    onEdit,
    onSanksi,
    onArchive,
    onDelete,
}) => {
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // 1. Department Filtering Logic
    const filteredList = useMemo(() => {
        if (deptFilter === 'ALL') return karyawanList;
        return karyawanList.filter((k) => {
            const j = (k.jabatan || '').toLowerCase();
            const r = (k.role || '').toLowerCase();
            if (deptFilter === 'SEWING') return j.includes('jahit') || j.includes('sewing') || r.includes('sewing') || j.includes('operator');
            if (deptFilter === 'CUTTING') return j.includes('potong') || j.includes('cutting') || j.includes('pola');
            if (deptFilter === 'FINISHING') return j.includes('finishing') || j.includes('pack') || j.includes('steam') || j.includes('kancing') || j.includes('lipat');
            if (deptFilter === 'DRIVER') return j.includes('driver') || j.includes('logistik') || j.includes('ekspedisi') || r.includes('driver');
            if (deptFilter === 'STAFF') return j.includes('admin') || j.includes('staff') || j.includes('owner') || j.includes('dev') || r.includes('admin');
            return true;
        });
    }, [karyawanList, deptFilter]);

    // 2. Pagination Math
    const totalItems = filteredList.length;
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize) || 1;
    const paginatedList = useMemo(() => {
        if (pageSize === -1) return filteredList;
        const start = (currentPage - 1) * pageSize;
        return filteredList.slice(start, start + pageSize);
    }, [filteredList, currentPage, pageSize]);

    // Reset page if filtered results change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [deptFilter, karyawanList.length]);

    const getInitialBg = (nama: string) => {
        const colors = [
            'from-indigo-600 to-purple-600',
            'from-emerald-600 to-teal-600',
            'from-amber-600 to-orange-600',
            'from-cyan-600 to-blue-600',
            'from-rose-600 to-pink-600'
        ];
        let hash = 0;
        for (let i = 0; i < nama.length; i++) hash += nama.charCodeAt(i);
        return colors[Math.abs(hash) % colors.length];
    };

    if (loading) {
        return (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">Memuat data SDM & Skema Penggajian...</p>
            </div>
        );
    }

    if (totalItems === 0) {
        return (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-base font-bold text-white">Tidak ada data karyawan ditemukan</p>
                <p className="text-xs text-slate-500 mt-1">Coba ubah filter divisi atau kata kunci pencarian Anda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 🌟 1. GRID CARDS VIEW */}
            {viewMode === 'CARDS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedList.map((k) => {
                        const isArchived = k.status_karyawan === 'ARCHIVED' || k.is_active === false;
                        const initial = (k.nama || 'K').substring(0, 2).toUpperCase();

                        return (
                            <div
                                key={k.id_karyawan}
                                className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-200 shadow-xl flex flex-col justify-between group hover:border-slate-700"
                            >
                                <div>
                                    {/* Card Header: Avatar & Status */}
                                    <div className="flex items-start justify-between gap-3 mb-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getInitialBg(k.nama)} flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/20`}>
                                                {initial}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors leading-tight">
                                                    {k.nama}
                                                </h4>
                                                <p className="text-[11px] text-indigo-400 font-mono mt-0.5">
                                                    {k.id_karyawan} • @{k.username}
                                                </p>
                                            </div>
                                        </div>

                                        {isArchived ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
                                                TERARSIP
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                                AKTIF
                                            </span>
                                        )}
                                    </div>

                                    {/* Role & Department */}
                                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                                            <Briefcase className="w-3 h-3 text-indigo-400" />
                                            <span>{k.jabatan || 'Operator'}</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            {k.role}
                                        </span>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                <DollarSign className="w-3 h-3 text-emerald-400" /> Skema Gaji:
                                            </span>
                                            <span className="font-bold text-white">
                                                {k.tipe_pay === 'BORONGAN'
                                                    ? `Rp ${k.tarif_borongan_pcs?.toLocaleString('id-ID') || 0} /pcs`
                                                    : `Rp ${k.gaji_pokok?.toLocaleString('id-ID') || 0} /bln`}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3 text-amber-400" /> Poin Sanksi:
                                            </span>
                                            <span className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${(k.poin_pelanggaran || 0) > 0 ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400'}`}>
                                                {k.poin_pelanggaran || 0} Poin
                                            </span>
                                        </div>

                                        {k.no_hp && (
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                                                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-slate-500" /> No. HP:
                                                </span>
                                                <span className="text-slate-300 font-mono text-[11px]">{k.no_hp}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-800/80">
                                    <button
                                        onClick={() => onEdit(k)}
                                        title="Edit Profil & Gaji"
                                        className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={() => onSanksi(k)}
                                        title="Catat Poin Sanksi"
                                        className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Sanksi</span>
                                    </button>

                                    {!isArchived && (
                                        <button
                                            onClick={() => onArchive(k)}
                                            title="Arsipkan Karyawan"
                                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                                        >
                                            <Archive className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => onDelete(k.id_karyawan, k.nama)}
                                        title="Hapus Karyawan"
                                        className="p-2 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 📋 2. TABLE VIEW & 3. COMPACT VIEW */}
            {(viewMode === 'TABLE' || viewMode === 'COMPACT') && (
                <div className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar scroll-smooth">
                        <table className="w-full text-left text-sm text-slate-300 border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-md text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px] tracking-wider shadow-sm select-none">
                                <tr>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3 bg-slate-950/95' : 'p-4 bg-slate-950/95'}>Pekerja & ID</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3 bg-slate-950/95' : 'p-4 bg-slate-950/95'}>Jabatan & Role</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3 bg-slate-950/95' : 'p-4 bg-slate-950/95'}>Skema Gaji</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3 bg-slate-950/95' : 'p-4 bg-slate-950/95'}>Sanksi</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3 bg-slate-950/95' : 'p-4 bg-slate-950/95'}>Status</th>
                                    <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'} text-center bg-slate-950/95`}>Aksi Operasional</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
                                {paginatedList.map((k) => {
                                    const isArchived = k.status_karyawan === 'ARCHIVED' || k.is_active === false;
                                    const isCompact = viewMode === 'COMPACT';

                                    return (
                                        <tr key={k.id_karyawan} className="hover:bg-slate-800/40 transition-all duration-150">
                                            {/* Profil Karyawan */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div>
                                                    <p className={`font-semibold text-white ${isCompact ? 'text-xs' : 'text-sm'}`}>{k.nama}</p>
                                                    <p className="text-[11px] text-indigo-400 font-mono">{k.id_karyawan} • @{k.username}</p>
                                                    {!isCompact && k.no_hp && (
                                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <Phone className="w-3 h-3" /> {k.no_hp}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Jabatan & Role */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
                                                        <Briefcase className="w-3 h-3 text-indigo-400" /> {k.jabatan || 'Operator'}
                                                    </span>
                                                    <div>
                                                        <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                            {k.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Skema Pay */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="text-xs">
                                                    <p className="font-semibold text-slate-200 flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3 text-emerald-400" /> {k.tipe_pay}
                                                    </p>
                                                    {k.tipe_pay === 'BORONGAN' ? (
                                                        <p className="text-slate-400 text-[11px] font-mono">Rp {k.tarif_borongan_pcs?.toLocaleString('id-ID') || 0} /pcs</p>
                                                    ) : (
                                                        <p className="text-slate-400 text-[11px] font-mono">Rp {k.gaji_pokok?.toLocaleString('id-ID') || 0} /bln</p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Poin Sanksi */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${(k.poin_pelanggaran || 0) > 15
                                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                                    : (k.poin_pelanggaran || 0) > 0
                                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {k.poin_pelanggaran || 0} Poin
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                {isArchived ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                        <UserMinus className="w-3 h-3" />
                                                        <span>TERARSIP</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <UserCheck className="w-3 h-3" />
                                                        <span>AKTIF</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => onEdit(k)}
                                                        title="Edit Data & Gaji"
                                                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onSanksi(k)}
                                                        title="Kelola Sanksi"
                                                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                                    >
                                                        <AlertTriangle className="w-3 h-3" />
                                                        <span className="hidden lg:inline">Sanksi</span>
                                                    </button>

                                                    {!isArchived && (
                                                        <button
                                                            onClick={() => onArchive(k)}
                                                            title="Arsipkan"
                                                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                                                        >
                                                            <Archive className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => onDelete(k.id_karyawan, k.nama)}
                                                        title="Hapus Permanen"
                                                        className="p-1.5 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-all cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 📑 4. PAGINATION CONTROLLER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 glass-panel rounded-2xl border border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <span>Tampilkan:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
                    >
                        <option value={10}>10 Baris</option>
                        <option value={25}>25 Baris</option>
                        <option value={50}>50 Baris</option>
                        <option value={-1}>Semua Data ({totalItems})</option>
                    </select>
                    <span className="text-slate-500">
                        • Menampilkan {pageSize === -1 ? totalItems : Math.min(totalItems, (currentPage - 1) * pageSize + 1)} - {pageSize === -1 ? totalItems : Math.min(totalItems, currentPage * pageSize)} dari {totalItems} pekerja
                    </span>
                </div>

                {pageSize !== -1 && totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                            // Show first, last, current, and adjacent pages
                            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                            currentPage === p
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                );
                            }
                            if (p === currentPage - 2 || p === currentPage + 2) {
                                return <span key={p} className="px-1 text-slate-600">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};