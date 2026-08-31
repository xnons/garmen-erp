'use client';

import React, { useState, useMemo } from 'react';
import {
    ArrowUpRight, Pencil, History, RotateCcw, Archive, Trash2,
    PackageSearch, AlertCircle, CheckCircle2, PackageX, ChevronLeft, ChevronRight,
    Tag, DollarSign, Layers, Boxes, Truck
} from 'lucide-react';
import { ItemBahanBaku, ViewMode } from './types';

interface InventarisTableProps {
    items: ItemBahanBaku[];
    viewMode?: ViewMode;
    onOpenMutasi: (item: ItemBahanBaku) => void;
    onOpenEdit: (item: ItemBahanBaku) => void;
    onToggleArchive: (item: ItemBahanBaku) => void;
    onDelete: (id: string) => void;
    onOpenLog?: (item: ItemBahanBaku) => void;
}

export default function InventarisTable({
    items,
    viewMode = 'TABLE',
    onOpenMutasi,
    onOpenEdit,
    onToggleArchive,
    onDelete,
    onOpenLog
}: InventarisTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    // Pagination Math
    const totalItems = items.length;
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize) || 1;
    const paginatedItems = useMemo(() => {
        if (pageSize === -1) return items;
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, currentPage, pageSize]);

    // Reset page if items count changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [items.length]);

    if (items.length === 0) {
        return (
            <div className="glass-panel border border-slate-800 rounded-2xl p-16 text-center shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
                    <PackageSearch className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-200">
                    Tidak ada data material
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Tidak ada bahan baku yang cocok dengan kata kunci atau filter yang dipilih. Silakan klik tombol "Tambah Bahan Baku" untuk mendaftarkan kain/aksesoris baru.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 🌟 1. GRID CARDS VIEW */}
            {viewMode === 'CARDS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedItems.map((item) => {
                        const totalValue = (item.stok_saat_ini || 0) * (item.harga_per_satuan || 0);
                        const isMenipis = !item.is_archived && item.stok_saat_ini <= item.stok_minimum && item.stok_saat_ini > 0;
                        const isHabis = !item.is_archived && item.stok_saat_ini === 0;

                        return (
                            <div
                                key={item.id}
                                className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-200 shadow-xl flex flex-col justify-between group hover:border-slate-700"
                            >
                                <div>
                                    {/* Header: SKU, Category & Status */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <span className="text-xs font-mono font-bold text-indigo-400">
                                                {item.kode_sku}
                                            </span>
                                            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 font-medium">
                                                {item.kategori}
                                            </span>
                                        </div>

                                        {item.is_archived ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                Terarsip
                                            </span>
                                        ) : isHabis ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                                <PackageX className="w-3 h-3" /> Habis
                                            </span>
                                        ) : isMenipis ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Menipis
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Aman
                                            </span>
                                        )}
                                    </div>

                                    {/* Item Name */}
                                    <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors flex items-center gap-2 mb-3">
                                        {item.warna_kode && (
                                            <span
                                                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                                                style={{ backgroundColor: item.warna_kode }}
                                                title={`Warna: ${item.warna_kode}`}
                                            />
                                        )}
                                        <span className="truncate">{item.nama_item}</span>
                                    </h4>

                                    {/* Stock Metrics Box */}
                                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs mb-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                <Boxes className="w-3 h-3 text-cyan-400" /> Stok Fisik:
                                            </span>
                                            <span className="font-black text-white font-mono text-sm">
                                                {item.stok_saat_ini?.toLocaleString('id-ID')} {item.satuan}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                                <DollarSign className="w-3 h-3 text-emerald-400" /> HPP Unit:
                                            </span>
                                            <span className="text-slate-300 font-mono">
                                                {formatIDR(item.harga_per_satuan)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                                            <span className="text-slate-400 text-[11px] font-bold">Total Nilai Aset:</span>
                                            <span className="font-black text-emerald-400 font-mono">
                                                {formatIDR(totalValue)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Supplier & Peruntukan Info */}
                                    <div className="space-y-1 text-[11px] text-slate-400 mb-3">
                                        {item.supplier_utama && (
                                            <p className="flex items-center gap-1 truncate">
                                                <Truck className="w-3 h-3 text-slate-500 shrink-0" />
                                                <span className="truncate">Vendor: <strong className="text-slate-300">{item.supplier_utama}</strong></span>
                                            </p>
                                        )}
                                        {item.peruntukan_brand && (
                                            <p className="flex items-center gap-1 truncate">
                                                <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                                                <span className="truncate">Brand: <strong className="text-indigo-300">{item.peruntukan_brand}</strong></span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Bar */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                                    <button
                                        onClick={() => onOpenMutasi(item)}
                                        className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                                    >
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                        <span>Mutasi Stok</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {onOpenLog && (
                                            <button
                                                onClick={() => onOpenLog(item)}
                                                title="Riwayat Mutasi"
                                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                                            >
                                                <History className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onOpenEdit(item)}
                                            title="Edit Item"
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl transition-all cursor-pointer"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                            onClick={() => onToggleArchive(item)}
                                            title={item.is_archived ? "Pulihkan" : "Arsipkan"}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-all cursor-pointer"
                                        >
                                            {item.is_archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                        </button>

                                        <button
                                            onClick={() => onDelete(item.id)}
                                            title="Hapus Permanen"
                                            className="p-1.5 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition-all cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>SKU & Item Material</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Supplier / Vendor</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Pembelian & PO</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Kondisi Stok</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Harga Satuan (HPP)</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Total Nilai Stok</th>
                                    <th className={viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'}>Status</th>
                                    <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'p-4'} text-center`}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {paginatedItems.map((item) => {
                                    const totalValue = (item.stok_saat_ini || 0) * (item.harga_per_satuan || 0);
                                    const isMenipis = !item.is_archived && item.stok_saat_ini <= item.stok_minimum && item.stok_saat_ini > 0;
                                    const isHabis = !item.is_archived && item.stok_saat_ini === 0;
                                    const isCompact = viewMode === 'COMPACT';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                            {/* SKU & Nama */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div>
                                                    <p className={`font-bold text-white flex items-center gap-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                                                        {item.warna_kode && (
                                                            <span
                                                                className="w-3 h-3 rounded-full border border-white/20 shrink-0 shadow-sm"
                                                                style={{ backgroundColor: item.warna_kode }}
                                                                title={`Warna: ${item.warna_kode}`}
                                                            />
                                                        )}
                                                        {item.nama_item}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] text-indigo-400 font-mono font-semibold">
                                                            {item.kode_sku}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-medium">
                                                            {item.kategori}
                                                        </span>
                                                        {item.nomor_lot_batch && (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                                                                Lot: {item.nomor_lot_batch}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Vendor */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="text-xs">
                                                    <p className="font-semibold text-slate-200">{item.supplier_utama || '-'}</p>
                                                    {item.nomor_vendor && (
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.nomor_vendor}</p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* PO & Brand */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="text-xs">
                                                    {item.nomor_nota_po ? (
                                                        <span className="font-mono text-indigo-400 font-semibold">{item.nomor_nota_po}</span>
                                                    ) : (
                                                        <span className="text-slate-500 text-[11px]">-</span>
                                                    )}
                                                    {item.peruntukan_brand && (
                                                        <span className="block text-[10px] text-amber-400 font-medium mt-0.5">
                                                            Brand: {item.peruntukan_brand}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Stok Saat Ini */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="text-xs">
                                                    <span className={`font-black font-mono ${isHabis ? 'text-rose-400' : isMenipis ? 'text-amber-400' : 'text-white'}`}>
                                                        {item.stok_saat_ini?.toLocaleString('id-ID')} {item.satuan}
                                                    </span>
                                                    <span className="block text-[10px] text-slate-400">
                                                        Min: {item.stok_minimum} {item.satuan}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* HPP Unit */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <span className="text-xs font-mono text-slate-300">
                                                    {formatIDR(item.harga_per_satuan)}
                                                </span>
                                            </td>

                                            {/* Total Nilai Stok */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <span className="text-xs font-black font-mono text-emerald-400">
                                                    {formatIDR(totalValue)}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                {item.is_archived ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                        Terarsip
                                                    </span>
                                                ) : isHabis ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                        Habis
                                                    </span>
                                                ) : isMenipis ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        Reorder
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Aman
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className={isCompact ? 'py-2 px-3' : 'p-4'}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => onOpenMutasi(item)}
                                                        title="Mutasi Masuk/Keluar"
                                                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
                                                    >
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onOpenEdit(item)}
                                                        title="Edit Data"
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        onClick={() => onToggleArchive(item)}
                                                        title={item.is_archived ? "Pulihkan" : "Arsipkan"}
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-all cursor-pointer"
                                                    >
                                                        {item.is_archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                                    </button>

                                                    <button
                                                        onClick={() => onDelete(item.id)}
                                                        title="Hapus"
                                                        className="p-1.5 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
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
                        <option value={10}>10 Item</option>
                        <option value={25}>25 Item</option>
                        <option value={50}>50 Item</option>
                        <option value={-1}>Semua ({totalItems})</option>
                    </select>
                    <span className="text-slate-500">
                        • Menampilkan {pageSize === -1 ? totalItems : Math.min(totalItems, (currentPage - 1) * pageSize + 1)} - {pageSize === -1 ? totalItems : Math.min(totalItems, currentPage * pageSize)} dari {totalItems} item bahan
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