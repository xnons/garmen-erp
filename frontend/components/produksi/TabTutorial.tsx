"use client";

import React from 'react';
import {
    BookOpen,
    Ticket,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    RotateCcw
} from 'lucide-react';

export default function TabTutorial() {
    return (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800/80 space-y-6 animate-in fade-in duration-200 text-slate-200">
            <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-emerald-400" />
                    Pusat Panduan Operasional Produksi
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                    Pelajari Standar Operasional Prosedur (SOP) pencatatan hasil kerja borongan di sistem ini.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Modul 1: Alur Sistem Tiket */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <Ticket className="w-5 h-5" />
                        1. Alur Sistem Tiket / Kupon Bundle
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Sistem ini menggunakan metode <strong>Tiket Bundle</strong> untuk mencegah kecurangan klaim jumlah jahitan.
                    </p>
                    <ol className="text-xs space-y-3 text-slate-300 list-decimal pl-4">
                        <li>Kain yang sudah dipotong diikat per bundle (misal 1 ikat isi 12 pcs).</li>
                        <li>Setiap ikatan ditempelkan 1 kertas <strong>Tiket Bundle</strong>.</li>
                        <li>Penjahit mengerjakan ikatan tersebut, lalu menyobek kupon di tiket sebagai bukti.</li>
                        <li>Sore harinya, penjahit menyetorkan kumpulan sobekan kupon ke Admin/Mandor.</li>
                        <li>Admin menginput data ke sistem ini berdasarkan <strong>Nomor Tiket</strong> yang tertera pada sobekan kupon.</li>
                    </ol>
                </div>

                {/* Modul 2: Kategori Defect / Cacat */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        2. Pemisahan Barang Cacat (Defect)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Saat penyetoran, Mandor wajib memisahkan hasil kerja menjadi 3 kategori:
                    </p>
                    <ul className="text-xs space-y-3">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-white">Pass (Lolos QC):</strong> Barang bagus, siap dilanjutkan ke proses berikutnya. Pekerja mendapat upah penuh.
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-white">Rework (Perbaikan):</strong> Barang cacat tapi bisa diperbaiki (misal benang loncat). Dikembalikan ke penjahit.
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-white">Scrap / BS:</strong> Barang sisa/cacat permanen (misal kain robek). Barang dibuang/dijual obral, penjahit tidak dapat upah untuk pcs ini.
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Modul 3: Verifikasi 4 Mata */}
                <div className="md:col-span-2 bg-emerald-500/10 p-5 rounded-xl border border-emerald-500/20 space-y-3">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        3. Prinsip Anti-Kecurangan (Verifikasi 4 Mata)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Untuk menjaga keamanan dana pabrik, data yang diinput oleh Admin statusnya masih <strong>PENDING</strong> (belum bisa dicairkan menjadi uang/gaji). Gaji hanya akan diakui oleh sistem jika:
                    </p>
                    <ul className="text-xs space-y-2 text-slate-300 list-disc pl-5">
                        <li>Supervisor / Kepala Produksi / Owner melakukan pengecekan di tab <strong>Verifikasi QC</strong>.</li>
                        <li>Supervisor menekan tombol <strong className="text-emerald-400">Setujui (Approve)</strong>.</li>
                        <li className="text-rose-400 font-medium">Sistem akan menolak (Error) jika Anda mencoba memverifikasi (Approve) data hasil ketikan Anda sendiri. Wajib dilakukan oleh orang kedua.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}