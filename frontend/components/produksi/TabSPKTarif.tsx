"use client";

import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Layers,
    PlayCircle,
    FileEdit,
    CheckCircle2,
    Archive,
    Trash2,
    Filter,
    ArrowUpDown,
    Lock,
    X,
    AlertCircle,
    Loader2,
    ArchiveRestore,
    Clock,
    Download
} from 'lucide-react';
import { toast } from 'sonner';
import { produksiService, SPK, StatusSPK, PrioritasSPK } from '@/services/produksiService';
import { exportToExcel } from '@/utils/exportUtils';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { errMsg } from '@/utils/format';

interface TabSPKTarifProps {
    spkList: SPK[];
    onOpenModal: () => void;
    onSelectSPK?: (spk: SPK) => void;
    currentUser?: {
        id_karyawan?: string;
        nama?: string;
        role?: string;
    };
    onRefresh?: () => void;
}

type TabCategory = 'ALL' | StatusSPK | 'REMINDER';

export default function TabSPKTarif({
    spkList,
    onOpenModal,
    onSelectSPK,
    currentUser,
    onRefresh
}: TabSPKTarifProps) {
    const confirm = useConfirm();
    // 🛡️ Deteksi Role Pintar: Prop -> LocalStorage -> Fallback Developer
    const activeRole = useMemo(() => {
        if (currentUser?.role) {
            return currentUser.role.toLowerCase();
        }
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('user') || localStorage.getItem('currentUser');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed?.role) return parsed.role.toLowerCase();
                } catch (e) {
                    console.error("Gagal membaca user dari localStorage:", e);
                }
            }
        }
        return 'developer';
    }, [currentUser]);

    const isOwnerOrDev = ['owner', 'dev', 'developer', 'admin'].includes(activeRole);

    // Filter & Search States
    const [activeTab, setActiveTab] = useState<TabCategory>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [kategoriFilter, setKategoriFilter] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'DATE_ASC' | 'DATE_DESC' | 'DEADLINE_ASC'>('DATE_ASC');

    // Modal Hapus State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        spkId: string;
        namaArtikel: string;
    }>({ isOpen: false, spkId: '', namaArtikel: '' });

    const [alasanHapus, setAlasanHapus] = useState('Kesalahan Input Data');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, spkId: '', namaArtikel: '' });
        setActionError('');
        setAlasanHapus('Kesalahan Input Data');
    };

    // Hitung statistik SPK berdasarkan status lifecycle + Pengingat Deadline
    const counts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reminderCount = spkList.filter((s) => {
            if (!s.deadline || s.status === 'FINISHED' || s.status === 'ARCHIVED') return false;
            const deadlineDate = new Date(s.deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
        }).length;

        return {
            ALL: spkList.length,
            ON_PROGRESS: spkList.filter((s) => s.status === 'ON_PROGRESS').length,
            DRAFT: spkList.filter((s) => s.status === 'DRAFT').length,
            FINISHED: spkList.filter((s) => s.status === 'FINISHED').length,
            ARCHIVED: spkList.filter((s) => s.status === 'ARCHIVED').length,
            REMINDER: reminderCount,
        };
    }, [spkList]);

    // 🔀 Filter & Sorting Engine dengan Logika Tab Pengingat Deadline
    const filteredAndSortedSPK = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return spkList
            .filter((spk) => {
                if (activeTab === 'REMINDER') {
                    if (!spk.deadline || spk.status === 'FINISHED' || spk.status === 'ARCHIVED') return false;
                    const deadlineDate = new Date(spk.deadline);
                    deadlineDate.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays > 7) return false;
                } else if (activeTab !== 'ALL') {
                    if (spk.status !== activeTab) return false;
                }

                const matchesKategori = kategoriFilter === 'ALL' || (spk.kategori_produk || 'Kemeja') === kategoriFilter;

                const q = searchQuery.toLowerCase().trim();
                const matchesSearch =
                    !q ||
                    spk.id.toLowerCase().includes(q) ||
                    spk.nama_artikel.toLowerCase().includes(q) ||
                    (spk.nama_pemesan && spk.nama_pemesan.toLowerCase().includes(q)) ||
                    (spk.no_po_buyer && spk.no_po_buyer.toLowerCase().includes(q));

                return matchesKategori && matchesSearch;
            })
            .sort((a, b) => {
                if (sortOrder === 'DATE_ASC') {
                    const dateA = new Date(a.tanggal_mulai || a.created_at || '2099-01-01').getTime();
                    const dateB = new Date(b.tanggal_mulai || b.created_at || '2099-01-01').getTime();
                    return dateA - dateB;
                }
                if (sortOrder === 'DATE_DESC') {
                    const dateA = new Date(a.tanggal_mulai || a.created_at || '1970-01-01').getTime();
                    const dateB = new Date(b.tanggal_mulai || b.created_at || '1970-01-01').getTime();
                    return dateB - dateA;
                }
                if (sortOrder === 'DEADLINE_ASC') {
                    const deadA = new Date(a.deadline || '2099-01-01').getTime();
                    const deadB = new Date(b.deadline || '2099-01-01').getTime();
                    return deadA - deadB;
                }
                return 0;
            });
    }, [spkList, activeTab, kategoriFilter, searchQuery, sortOrder]);

    // 🟢 Handler Ekspor Data ke Excel (.xlsx)
    const handleExportExcel = () => {
        if (filteredAndSortedSPK.length === 0) {
            toast.warning("Tidak ada data SPK untuk diekspor.");
            return;
        }

        const dataToExport = filteredAndSortedSPK.map((spk, index) => ({
            "No": index + 1,
            "Kode SPK": spk.id,
            "Nama Buyer / Pemesan": spk.nama_pemesan || "-",
            "No PO Buyer": spk.no_po_buyer || "-",
            "Nama Artikel": spk.nama_artikel,
            "Kategori Produk": spk.kategori_produk || "Kemeja",
            "Target Qty (Pcs)": spk.target_qty || 0,
            "Realisasi Potong (Pcs)": spk.realisasi_potong || 0,
            "Progress Potong (%)": spk.target_qty > 0
                ? `${Math.min(100, Math.round(((spk.realisasi_potong || 0) / spk.target_qty) * 100))}%`
                : "0%",
            "Deadline": spk.deadline || "-",
            "Prioritas": spk.prioritas || "NORMAL",
            "Status SPK": spk.status
        }));

        const dateStr = new Date().toISOString().split('T')[0];
        exportToExcel(dataToExport, `Rekap_SPK_Produksi_${dateStr}`, "Daftar SPK");
    };

    // 📦 Handler Arsip / Un-Arsip SPK
    const handleArchiveSPK = async (e: React.MouseEvent, spkId: string, currentStatus?: string) => {
        e.stopPropagation();
        const nextStatus = currentStatus === 'ARCHIVED' ? 'ON_PROGRESS' : 'ARCHIVED';
        const actionName = nextStatus === 'ARCHIVED' ? 'mengarsipkan' : 'mengembalikan';

        const ok = await confirm({
            title: `Konfirmasi ${actionName} SPK`,
            message: `SPK ${spkId} akan di-${actionName === 'mengarsipkan' ? 'arsipkan' : 'kembalikan ke progress'}.`,
            confirmText: 'Ya, lanjutkan',
        });
        if (!ok) return;

        try {
            setActionLoading(true);
            await produksiService.updateSPK(spkId, { status: nextStatus as any });
            toast.success(`SPK ${spkId} berhasil di-${actionName === 'mengarsipkan' ? 'arsipkan' : 'kembalikan'}.`);
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(errMsg(err, 'Gagal mengubah status arsip SPK.'));
        } finally {
            setActionLoading(false);
        }
    };

    // 🔒 Handler Selesai SPK Paksa Khusus Owner / Dev
    const handleOwnerFinishSPK = async (e: React.MouseEvent, spkId: string) => {
        e.stopPropagation();
        const ok = await confirm({
            title: 'Selesaikan SPK secara paksa?',
            message: `SPK '${spkId}' akan ditutup paksa (Owner Lock), melewati validasi normal.`,
            confirmText: 'Selesaikan Paksa',
            tone: 'danger',
        });
        if (!ok) return;

        try {
            setActionLoading(true);
            await produksiService.ownerFinishSPK(spkId);
            toast.success(`SPK ${spkId} ditutup paksa.`);
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(errMsg(err, 'Gagal menyelesaikan SPK.'));
        } finally {
            setActionLoading(false);
        }
    };

    // 🗑️ Handler Hapus SPK
    const handleConfirmDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');

        try {
            setActionLoading(true);
            await produksiService.deleteSPK(deleteModal.spkId, alasanHapus);

            closeDeleteModal();
            if (onRefresh) onRefresh();
        } catch (err: any) {
            const msg = err.response?.data?.detail;
            setActionError(typeof msg === 'string' ? msg : 'Gagal menghapus SPK.');
        } finally {
            setActionLoading(false);
        }
    };

    const renderStatusBadge = (status: StatusSPK) => {
        switch (status) {
            case 'ON_PROGRESS':
                return (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 w-fit mx-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        BERJALAN
                    </span>
                );
            case 'DRAFT':
                return (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit mx-auto block">
                        DRAFT
                    </span>
                );
            case 'FINISHED':
                return (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 w-fit mx-auto block">
                        SELESAI
                    </span>
                );
            case 'ARCHIVED':
                return (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700 w-fit mx-auto block">
                        ARSIP
                    </span>
                );
            default:
                return (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-300 w-fit mx-auto block">
                        {status}
                    </span>
                );
        }
    };

    const renderPrioritasBadge = (prioritas?: PrioritasSPK) => {
        if (prioritas === 'URGENT') {
            return (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    URGENT
                </span>
            );
        }
        if (prioritas === 'HIGH') {
            return (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    HIGH
                </span>
            );
        }
        return null;
    };

    const renderDeadlineBadge = (deadlineStr?: string, statusSPK?: StatusSPK) => {
        if (!deadlineStr || statusSPK === 'FINISHED' || statusSPK === 'ARCHIVED') {
            return <span className="text-slate-400 font-mono text-xs">{deadlineStr || '-'}</span>;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadlineStr);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-[10px] font-bold font-mono">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Terlambat {Math.abs(diffDays)} Hari</span>
                </span>
            );
        } else if (diffDays <= 3) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-[10px] font-bold font-mono animate-pulse">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{diffDays === 0 ? 'Hari Ini' : `${diffDays} Hari Lagi`}</span>
                </span>
            );
        }

        return <span className="text-slate-300 font-mono text-xs">{deadlineStr}</span>;
    };

    return (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800/50 space-y-5">
            {/* HEADER & RILIS BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Daftar SPK Produksi & Tarif Borongan
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Manajemen Surat Perintah Kerja & kuota potong kain (hard-cap limit)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* 🟢 TOMBOL EXPORT EXCEL */}
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-600"
                        title="Unduh Rekap SPK ke Excel (.xlsx)"
                    >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Export Excel</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenModal}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)]"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        Rilis SPK Baru
                    </button>
                </div>
            </div>

            {/* LIFECYCLE TABS & SEARCH BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setActiveTab('ALL')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'ALL'
                            ? 'bg-slate-800 text-white border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Semua ({counts.ALL})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('ON_PROGRESS')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'ON_PROGRESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                    >
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Berjalan ({counts.ON_PROGRESS})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('DRAFT')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                    >
                        <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                        Draft ({counts.DRAFT})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('FINISHED')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'FINISHED'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        Selesai ({counts.FINISHED})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('ARCHIVED')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'ARCHIVED'
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                    >
                        <Archive className="w-3.5 h-3.5 text-slate-400" />
                        Arsip ({counts.ARCHIVED})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('REMINDER')}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap ${activeTab === 'REMINDER'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                            : 'text-rose-400 bg-slate-900 border border-rose-500/30 hover:bg-rose-500/10'
                            }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Pengingat Deadline ({counts.REMINDER})
                    </button>
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari SPK / Artikel / Pemesan..."
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* FILTER BARIS KEDUA */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400 font-medium">Jenis Projek:</span>
                    <select
                        value={kategoriFilter}
                        onChange={(e) => setKategoriFilter(e.target.value)}
                        className="bg-transparent text-white font-bold outline-none cursor-pointer"
                    >
                        <option value="ALL" className="bg-slate-900">Semua Jenis</option>
                        <option value="Kemeja" className="bg-slate-900">Kemeja</option>
                        <option value="Kaos Polo" className="bg-slate-900">Kaos Polo</option>
                        <option value="T-Shirt" className="bg-slate-900">T-Shirt / Kaos Polos</option>
                        <option value="Jaket / Hoodie" className="bg-slate-900">Jaket / Hoodie</option>
                        <option value="Celana Chino" className="bg-slate-900">Celana Chino</option>
                        <option value="Uniform / Seragam" className="bg-slate-900">Uniform / Seragam</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400 font-medium">Urutan:</span>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="bg-transparent text-white font-bold outline-none cursor-pointer"
                    >
                        <option value="DATE_ASC" className="bg-slate-900">Tanggal Mulai: Terawal → Terbaru</option>
                        <option value="DATE_DESC" className="bg-slate-900">Tanggal Mulai: Terbaru → Terawal</option>
                        <option value="DEADLINE_ASC" className="bg-slate-900">Deadline Terdekat</option>
                    </select>
                </div>

                {isOwnerOrDev && (
                    <span className="ml-auto text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> Akses Owner/Dev Aktif
                    </span>
                )}
            </div>

            {/* TABEL SPK PRODUKSI */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase border-y border-slate-800/80">
                        <tr>
                            <th className="py-3 px-3.5 font-semibold">No. SPK & Buyer</th>
                            <th className="py-3 px-3.5 font-semibold">Nama Artikel</th>
                            <th className="py-3 px-3.5 text-center font-semibold">Target Awal</th>
                            <th className="py-3 px-3.5 text-center font-semibold">Realisasi Potong (Hard-Cap)</th>
                            <th className="py-3 px-3.5 font-semibold">Deadline</th>
                            <th className="py-3 px-3.5 text-center font-semibold">Status</th>
                            {isOwnerOrDev && <th className="py-3 px-3.5 text-center font-semibold">Aksi (Owner/Dev)</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {filteredAndSortedSPK.length === 0 ? (
                            <tr>
                                <td colSpan={isOwnerOrDev ? 7 : 6} className="py-12 text-center text-slate-500 font-medium">
                                    Tidak ada data SPK produksi yang cocok dengan filter.
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedSPK.map((spk) => {
                                const percentage =
                                    spk.target_qty > 0
                                        ? Math.min(100, Math.round(((spk.realisasi_potong || 0) / spk.target_qty) * 100))
                                        : 0;

                                return (
                                    <tr
                                        key={spk.id}
                                        onClick={() => onSelectSPK && onSelectSPK(spk)}
                                        className={`hover:bg-slate-800/40 transition-colors ${onSelectSPK ? 'cursor-pointer' : ''}`}
                                    >
                                        <td className="py-3.5 px-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-emerald-400 text-xs tracking-wider font-mono">
                                                    {spk.id}
                                                </span>
                                                {renderPrioritasBadge(spk.prioritas)}
                                            </div>
                                            {spk.nama_pemesan && (
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                    {spk.nama_pemesan} {spk.no_po_buyer ? `(PO: ${spk.no_po_buyer})` : ''}
                                                </p>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-3.5">
                                            <div className="font-semibold text-slate-100">{spk.nama_artikel}</div>
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                Kategori: {spk.kategori_produk || 'Kemeja'}
                                            </span>
                                        </td>

                                        <td className="py-3.5 px-3.5 text-center text-slate-300 font-medium">
                                            {(spk.target_qty || 0).toLocaleString('id-ID')} Pcs
                                        </td>

                                        <td className="py-3.5 px-3.5 text-center min-w-[180px]">
                                            <div className="flex items-center justify-between text-xs font-bold mb-1">
                                                <span className="text-cyan-400">
                                                    {(spk.realisasi_potong || 0).toLocaleString('id-ID')} Pcs
                                                </span>
                                                <span className="text-slate-500 text-[10px]">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                                                <div
                                                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-3.5 text-xs font-mono">
                                            {renderDeadlineBadge(spk.deadline, spk.status)}
                                        </td>

                                        <td className="py-3.5 px-3.5 text-center">
                                            {renderStatusBadge(spk.status)}
                                        </td>

                                        {isOwnerOrDev && (
                                            <td className="py-3.5 px-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* 🟢 TOMBOL SELESAI SPK KHUSUS OWNER/DEV (Tanpa Emote) */}
                                                    {spk.status !== 'FINISHED' && spk.status !== 'ARCHIVED' && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleOwnerFinishSPK(e, spk.id)}
                                                            disabled={actionLoading}
                                                            className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5"
                                                            title="Selesaikan SPK Secara Paksa (Owner Lock)"
                                                        >
                                                            <Lock className="w-3 h-3" />
                                                            <span>Selesai SPK</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleArchiveSPK(e, spk.id, spk.status)}
                                                        disabled={actionLoading}
                                                        className={`p-1.5 rounded-lg border transition-all ${spk.status === 'ARCHIVED'
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/30'
                                                            }`}
                                                        title={spk.status === 'ARCHIVED' ? "Kembalikan dari Arsip" : "Arsipkan SPK"}
                                                    >
                                                        {spk.status === 'ARCHIVED' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteModal({
                                                                isOpen: true,
                                                                spkId: spk.id,
                                                                namaArtikel: spk.nama_artikel
                                                            });
                                                        }}
                                                        disabled={actionLoading}
                                                        className="p-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                                                        title="Hapus SPK (Salah Input)"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL KONFIRMASI HAPUS SPK */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2 text-rose-400">
                                <Trash2 className="w-5 h-5" />
                                <h3 className="font-bold text-base text-white">Konfirmasi Hapus SPK</h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {actionError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{actionError}</span>
                            </div>
                        )}

                        <p className="text-xs text-slate-300 leading-relaxed">
                            Apakah Anda yakin ingin menghapus SPK <span className="font-mono font-bold text-emerald-400">{deleteModal.spkId}</span> ({deleteModal.namaArtikel})? Aksi ini tidak dapat dibatalkan.
                        </p>

                        <form onSubmit={handleConfirmDelete} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                    Alasan Penghapusan
                                </label>
                                <input
                                    type="text"
                                    value={alasanHapus}
                                    onChange={(e) => setAlasanHapus(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus SPK'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}