'use client';

import React from 'react';
import { DollarSign, AlertTriangle, Package } from 'lucide-react';

interface InventarisKpiCardsProps {
    totalAset: number;
    totalMenipis: number;
    totalHabis: number;
}

export default function InventarisKpiCards({ totalAset, totalMenipis, totalHabis }: InventarisKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-medium">Total Nilai Aset Bahan</p>
                    <h4 className="text-xl font-bold text-white mt-0.5">
                        Rp {totalAset.toLocaleString('id-ID')}
                    </h4>
                </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-medium">Stok Menipis (Reorder)</p>
                    <h4 className="text-xl font-bold text-amber-400 mt-0.5">
                        {totalMenipis} Item
                    </h4>
                </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                    <Package className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-medium">Stok Habis</p>
                    <h4 className="text-xl font-bold text-rose-400 mt-0.5">
                        {totalHabis} Item
                    </h4>
                </div>
            </div>
        </div>
    );
}