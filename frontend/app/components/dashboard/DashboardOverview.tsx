"use client";

import React from 'react';
import { ShieldAlert, TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface DashboardOverviewProps {
    activeUser: any;
}

export default function DashboardOverview({ activeUser }: DashboardOverviewProps) {
    return (
        <main className="flex-1 p-8 overflow-y-auto bg-slate-900 text-slate-100 space-y-8">
            {/* Header Ringkasan */}
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-5">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        Ringkasan Operasional Pabrik
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Selamat datang kembali, <span className="text-emerald-400 font-semibold">{activeUser?.nama || 'User'}</span>.
                    </p>
                </div>
                <div className="text-right font-mono text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                    Sistem Aktif | Shift Pagi
                </div>
            </div>

            {/* Kartu Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Produksi */}
                <div className="glass-panel glass-hover p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🧵 Total Produksi Hari Ini</p>
                        <TrendingUp className="w-5 h-5 text-emerald-400 opacity-80" />
                    </div>
                    <h3 className="text-3xl font-black text-white mt-2 font-mono">
                        1,240 <span className="text-xs font-normal text-slate-400">Pcs</span>
                    </h3>
                    <p className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
                        ↑ 12% dari target kuota harian
                    </p>
                </div>

                {/* Kehadiran Staff */}
                <div className="glass-panel glass-hover p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">👥 Kehadiran Staff Produksi</p>
                        <Users className="w-5 h-5 text-indigo-400 opacity-80" />
                    </div>
                    <h3 className="text-3xl font-black text-white mt-2 font-mono">96%</h3>
                    <p className="text-[11px] text-slate-400 mt-2">24 Penjahit hadir | 1 Izin</p>
                </div>

                {/* Indeks Pelanggaran */}
                <div className="glass-panel glass-hover p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚠️ Indeks Pelanggaran Kerja</p>
                        <AlertTriangle className="w-5 h-5 text-rose-400 opacity-80" />
                    </div>
                    <h3 className="text-3xl font-black text-rose-400 mt-2 font-mono">
                        0 <span className="text-xs font-normal text-slate-500">Kasus</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-2">Lantai kerja kondusif & disiplin</p>
                </div>
            </div>

            {/* Papan Regulasi */}
            <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    <div>
                        <h4 className="font-bold text-white text-base">Papan Regulasi & Kedisiplinan Garmen</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Sistem akumulasi poin otomatis untuk memantau performa dan standar kerja lantai produksi.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 glass-hover">
                        <span className="text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span> 🟡 Pelanggaran Light (5 Pts)
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Keterlambatan masuk shift tanpa izin tertulis atau tidak menggunakan seragam APD lengkap.
                        </p>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 glass-hover">
                        <span className="text-amber-400 font-bold block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span> 🟠 Pelanggaran Medium (10 Pts)
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Kelalaian teknis seperti salah potong kain pola massal atau meninggalkan stasiun borongan saat jam aktif.
                        </p>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 glass-hover">
                        <span className="text-rose-400 font-bold block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 🔴 Pelanggaran Heavy (25 Pts)
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Tindakan fatal merusak mesin jahit/obras inventaris, mangkir kerja, atau memanipulasi laporan hitungan pcs borongan.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}