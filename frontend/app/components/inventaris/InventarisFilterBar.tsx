'use client';

import React from 'react';
import { Search, Archive } from 'lucide-react';
import { FilterInventaris } from './types';

interface InventarisFilterBarProps {
    filter: FilterInventaris;
    setFilter: React.Dispatch<React.SetStateAction<FilterInventaris>>;
}

export default function InventarisFilterBar({ filter, setFilter }: InventarisFilterBarProps) {
    return (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
            {/* Baris 1: Search Bar & Toggle Arsip */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari SKU, Nama Material, Vendor, No PO, Lot..."
                        value={filter.search}
                        onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all"
                    />
                </div>

                <button
                    onClick={() => setFilter((prev) => ({ ...prev, showArchived: !prev.showArchived }))}
                    className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${filter.showArchived
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                >
                    <Archive className="w-4 h-4" />
                    <span>{filter.showArchived ? 'Tampilkan Stok Aktif' : 'Lihat Arsip Material'}</span>
                </button>
            </div>

            {/* Baris 2: Filter Dropdowns & Tanggal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Kategori</label>
                    <select
                        value={filter.kategori}
                        onChange={(e) => setFilter((prev) => ({ ...prev, kategori: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">Semua Kategori</option>
                        <option value="KAIN">Kain</option>
                        <option value="AKSESORIS">Aksesoris</option>
                        <option value="BENANG">Benang</option>
                        <option value="PACKAGING">Packaging</option>
                        <option value="LAINNYA">Lainnya</option>
                    </select>
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Status Stok</label>
                    <select
                        value={filter.statusStok}
                        onChange={(e) => setFilter((prev) => ({ ...prev, statusStok: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="AMAN">🟢 Stok Aman</option>
                        <option value="MENIPIS">🟡 Stok Menipis</option>
                        <option value="HABIS">🔴 Stok Habis</option>
                    </select>
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Tgl Pembelian Dari</label>
                    <input
                        type="date"
                        value={filter.tanggalMulai || ''}
                        onChange={(e) => setFilter((prev) => ({ ...prev, tanggalMulai: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Tgl Pembelian Sampai</label>
                    <input
                        type="date"
                        value={filter.tanggalSelesai || ''}
                        onChange={(e) => setFilter((prev) => ({ ...prev, tanggalSelesai: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 font-mono focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>
        </div>
    );
}