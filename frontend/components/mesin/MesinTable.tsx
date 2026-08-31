'use client';

import React, { useState, useMemo } from 'react';
import {
    Eye,
    Pencil,
    CreditCard,
    Archive,
    CheckCircle2,
    Wrench,
    AlertTriangle,
    XCircle,
    ShieldAlert,
    PackageSearch,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Cpu,
    DollarSign,
    Calendar,
    Truck
} from 'lucide-react';
import { MesinAsset, MachineStatus, PaymentStatus, ViewMode } from './types';

interface MesinTableProps {
    machines: MesinAsset[];
    viewMode?: ViewMode;
    onSelectDetail: (m: MesinAsset) => void;
    onEdit: (m: MesinAsset) => void;
    onOpenPaymentModal: (m: MesinAsset) => void;
    onOpenArchiveModal: (m: MesinAsset) => void;
}

export default function MesinTable({
    machines,
    viewMode = 'TABLE',
    onSelectDetail,
    onEdit,
    onOpenPaymentModal,
    onOpenArchiveModal,
}: MesinTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);

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

    // Pagination Math
    const totalItems = machines.length;
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize) || 1;
    const paginatedMachines = useMemo(() => {
        if (pageSize === -1) return machines;
        const start = (currentPage - 1) * pageSize;
        return machines.slice(start, start + pageSize);
    }, [machines, currentPage, pageSize]);

    // Reset page if count changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [machines.length]);

    // 🟢 Badge Status Operasional dengan Icon Modern
    const renderStatusBadge = (status: MachineStatus) => {
        const config: Record<MachineStatus, { bg: string; label: string; icon: React.ReactNode }> = {
            AKTIF: {
                bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                label: 'Aktif / Normal',
                icon: <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
            },
            MAINTENANCE: {
                bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                label: 'Maintenance',
                icon: <Wrench className="w-3 h-3 shrink-0 text-amber-400" />
            },
            PERLU_SERVIS: {
                bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
                label: 'Perlu Servis',
                icon: <AlertTriangle className="w-3 h-3 shrink-0 text-orange-400" />
            },
            RUSAK: {
                bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
                label: 'Rusak',
                icon: <XCircle className="w-3 h-3 shrink-0 text-rose-400" />
            },
            NON_AKTIF: {
                bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
                label: 'Non-Aktif',
                icon: <XCircle className="w-3 h-3 shrink-0 text-slate-400" />
            },
            ARCHIVED: {
                bg: 'bg-rose-950/40 border-rose-800/50 text-rose-400',
                label: 'Terarsip',
                icon: <ShieldAlert className="w-3 h-3 shrink-0 text-rose-400" />
            },
        };

        const c = config[status] || config.NON_AKTIF;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg}`}>
                {c.icon}
                <span>{c.label}</span>
            </span>
        );
    };

    // 🟢 Badge Status Pembayaran
    const renderPaymentBadge = (status: PaymentStatus, sisa: number) => {
        if (status === 'LUNAS') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>LUNAS</span>
                </span>
            );
        }
        return (
            <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                    <CreditCard className="w-3 h-3" />
                    <span>DICICIL</span>
                </span>
                {sisa > 0 && (
                    <span className="block text-[10px] text-slate-400 font-mono">
                        Sisa: {formatIDR(sisa)}
                    </span>
                )}
            </div>
        );
    };

    if (machines.length === 0) {
        return (
            <div className="glass-panel border border-slate-800 rounded-2xl p-16 text-center shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
                    <PackageSearch className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-200">
                    Tidak ada data mesin
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Tidak ada mesin yang sesuai dengan kata kunci atau filter pencarian saat ini. Silakan klik "Registrasi Mesin Baru" untuk menambah aset pabrik.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 🌟 1. GRID CARDS VIEW */}
            {viewMode === 'CARDS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedMachines.map((m) => {
                        const nilaiBuku = Number(m.nilai_buku_saat_ini) || Number(m.harga_beli) || 0;
                        const sisaUtang = Number(m.sisa_pembayaran) || 0;

                        return (
                            <div
                                key={m.id}
                                className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-200 shadow-xl flex flex-col justify-between group hover:border-slate-700"
                            >
                                <div>
                                    {/* Header: Kode Mesin & Status */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                <Cpu className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-mono font-bold text-indigo-400">
                                                    {m.kode_mesin}
                                                </span>
                                                <span className="block text-[10px] text-slate-400 font-medium">
                                                    {m.kategori || 'Mesin Garmen'}
                                                </span>
                                            </div>
                                        </div>

                                        {renderStatusBadge(m.status)}
                                    </div>

                                    {/* Nama Mesin & Model */}
                                    <div className="mb-3">
                                        <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                                            {m.nama_mesin}
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Merk/Model: <strong className="text-slate-300">{m.merk_model}</strong>
                                            {m.no_seri && <span className="text-slate-500 font-mono text-[10px] ml-1">({m.no_seri})</span>}
                                        </p>
                                    </div>

                                    {/* Location & Cost Info Box */}
                                    <div className="space-y-1.5 text-xs text-slate-400 mb-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-rose-400" /> Lokasi Line:
                                            </span>
                                            <span className="font-semibold text-slate-200">{m.lokasi_line || 'Workshop'}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3 text-emerald-400" /> Nilai Buku:
                                            </span>
                                            <span className="font-mono font-bold text-emerald-400">{formatIDR(nilaiBuku)}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                                            <span className="text-[11px] text-slate-400">Pembayaran:</span>
                                            <div>{renderPaymentBadge(m.status_pembayaran, sisaUtang)}</div>
                                        </div>
                                    </div>

                                    {/* Vendor & Servis Info */}
                                    <div className="space-y-1 text-[11px] text-slate-500 mb-3">
                                        {m.vendor_supplier && (
                                            <p className="flex items-center gap-1 truncate">
                                                <Truck className="w-3 h-3 text-slate-600 shrink-0" />
                                                <span>Vendor: <strong className="text-slate-400">{m.vendor_supplier}</strong></span>
                                            </p>
                                        )}
                                        {m.jadwal_servis_berikutnya && (
                                            <p className="flex items-center gap-1 text-amber-400/90 font-mono text-[10px]">
                                                <Calendar className="w-3 h-3 shrink-0" />
                                                <span>Servis Berikutnya: {m.jadwal_servis_berikutnya}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Bar */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                                    <button
                                        onClick={() => onSelectDetail(m)}
                                        className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Detail</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {m.status_pembayaran === 'DICICIL' && (
                                            <button
                                                onClick={() => onOpenPaymentModal(m)}
                                                title="Catat Cicilan"
                                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
                                            >
                                                <CreditCard className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onEdit(m)}
                                            title="Edit Mesin"
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl transition-all cursor-pointer"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                            onClick={() => onOpenArchiveModal(m)}
                                            title="Arsip / Scrap"
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-all cursor-pointer"
                                        >
                                            <Archive className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 📋 2. TABLE VIEW & 3. COMPACT VIEW */}
            {(viewMode === 'TABLE' || viewMode === 'COMPACT') && (
                <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px] tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Mesin & Spesifikasi</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Lokasi & Line</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Vendor & Garansi</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Status Operasional</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Status Pembayaran</th>
                                    <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'} text-right`}>Nilai Buku / HPP</th>
                                    <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'} text-center`}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {paginatedMachines.map((m) => {
                                    const nilaiBuku = Number(m.nilai_buku_saat_ini) || Number(m.harga_beli) || 0;
                                    const sisaUtang = Number(m.sisa_pembayaran) || 0;
                                    const isCompact = viewMode === 'COMPACT';

                                    return (
                                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                                            {/* Mesin & Spesifikasi */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div>
                                                    <p className={`font-bold text-white ${isCompact ? 'text-xs' : 'text-sm'}`}>{m.nama_mesin}</p>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] text-indigo-400 font-mono font-semibold">
                                                            {m.kode_mesin}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                                            {m.merk_model}
                                                        </span>
                                                        {m.no_seri && (
                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                SN: {m.no_seri}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Lokasi */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                    <span className="font-semibold text-slate-200">{m.lokasi_line || 'Workshop'}</span>
                                                </div>
                                            </td>

                                            {/* Vendor */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="text-xs">
                                                    <p className="font-semibold text-slate-200">{m.vendor_supplier || '-'}</p>
                                                    {m.garansi_hingga && (
                                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            Garansi: {m.garansi_hingga}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Operasional */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                {renderStatusBadge(m.status)}
                                            </td>

                                            {/* Status Pembayaran */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                {renderPaymentBadge(m.status_pembayaran, sisaUtang)}
                                            </td>

                                            {/* Nilai Buku */}
                                            <td className={`${isCompact ? 'py-2 px-3' : 'p-4'} text-right font-mono`}>
                                                <span className="text-xs font-bold text-white">
                                                    {formatIDR(nilaiBuku)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => onSelectDetail(m)}
                                                        title="Lihat Detail & Servis"
                                                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>

                                                    {m.status_pembayaran === 'DICICIL' && (
                                                        <button
                                                            onClick={() => onOpenPaymentModal(m)}
                                                            title="Catat Pembayaran Cicilan"
                                                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                                                        >
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => onEdit(m)}
                                                        title="Edit Data Mesin"
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onOpenArchiveModal(m)}
                                                        title="Arsipkan / Hapus Mesin"
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-all cursor-pointer"
                                                    >
                                                        <Archive className="w-3.5 h-3.5" />
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

            {/* 📑 4. PAGINATION BAR */}
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
                        <option value={10}>10 Mesin</option>
                        <option value={25}>25 Mesin</option>
                        <option value={50}>50 Mesin</option>
                        <option value={-1}>Semua ({totalItems})</option>
                    </select>
                    <span className="text-slate-500">
                        • Menampilkan {pageSize === -1 ? totalItems : Math.min(totalItems, (currentPage - 1) * pageSize + 1)} - {pageSize === -1 ? totalItems : Math.min(totalItems, currentPage * pageSize)} dari {totalItems} unit mesin
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
}