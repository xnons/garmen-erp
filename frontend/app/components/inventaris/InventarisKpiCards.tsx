'use client';

import React from 'react';
import { DollarSign, AlertTriangle, Package, Boxes, Sparkles } from 'lucide-react';

interface InventarisKpiCardsProps {
    totalAset: number;
    totalItemAktif: number;
    totalMenipis: number;
    totalHabis: number;
}

export default function InventarisKpiCards({
    totalAset,
    totalItemAktif,
    totalMenipis,
    totalHabis
}: InventarisKpiCardsProps) {
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Nilai Aset */}
            <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-between group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            Total Nilai Aset Bahan
                        </p>
                        <h4 className="text-2xl font-black text-white mt-1 font-mono">
                            {formatIDR(totalAset)}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Valuasi HPP stok aktif</span>
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Card 2: Total Jenis Material */}
            <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-between group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                            Total Item Bahan Baku
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-white">{totalItemAktif}</span>
                            <span className="text-xs text-slate-400">SKU Terdaftar</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Kain, benang & aksesoris
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform">
                        <Boxes className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Card 3: Stok Menipis */}
            <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-between group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                            Stok Menipis (Reorder)
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-amber-400">{totalMenipis}</span>
                            <span className="text-xs text-amber-500/80">Item Di Bawah Min</span>
                        </div>
                        <p className="text-[11px] text-amber-400/70 mt-1">
                            Perlu pemesanan ulang PO
                        </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Card 4: Stok Habis */}
            <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-between group">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                            Stok Habis / Kosong
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-rose-400">{totalHabis}</span>
                            <span className="text-xs text-rose-500/80">Item Stok 0</span>
                        </div>
                        <p className="text-[11px] text-rose-400/70 mt-1">
                            Kritis untuk produksi
                        </p>
                    </div>
                    <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}