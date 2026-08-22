"use client";

import React, { useMemo } from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { SPK } from '../services/produksiService';

interface DeadlineAlertBannerProps {
    spkList: SPK[];
    onNavigateToSPK?: () => void;
}

export default function DeadlineAlertBanner({ spkList, onNavigateToSPK }: DeadlineAlertBannerProps) {
    // 🔍 Hitung SPK yang Terlambat (Overdue) atau Mendekati Deadline (<= 3 Hari)
    const urgentSPKs = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return spkList.filter((spk) => {
            if (!spk.deadline || spk.status === 'FINISHED' || spk.status === 'ARCHIVED') return false;

            const deadlineDate = new Date(spk.deadline);
            deadlineDate.setHours(0, 0, 0, 0);

            const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            // Masuk daftar alert jika sudah lewat (negatif) atau tinggal 3 hari lagi
            return diffDays <= 3;
        });
    }, [spkList]);

    if (urgentSPKs.length === 0) return null; // Sembunyikan banner jika aman

    const overdueCount = urgentSPKs.filter(s => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(s.deadline!);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime();
    }).length;

    return (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-slate-900 border border-rose-500/30 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0 animate-bounce">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Peringatan Tenggat Waktu Produksi (SPK)
                        <span className="text-[10px] px-2 py-0.5 bg-rose-500 text-white font-black rounded-full">
                            {urgentSPKs.length} Proyek Perlu Perhatian
                        </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                        Terdapat <strong className="text-rose-400">{overdueCount} SPK terlambat</strong> dan beberapa mendekati deadline. Harap segera eskalasikan ke bagian produksi.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 mr-2">
                    {urgentSPKs.slice(0, 2).map(s => (
                        <span key={s.id} className="bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
                            {s.id} ({s.nama_artikel})
                        </span>
                    ))}
                </div>
                {onNavigateToSPK && (
                    <button
                        type="button"
                        onClick={onNavigateToSPK}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-rose-500/20 w-full md:w-auto justify-center"
                    >
                        <span>Kelola SPK Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}