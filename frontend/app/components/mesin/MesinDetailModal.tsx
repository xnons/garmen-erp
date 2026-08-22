'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MesinAsset } from './types';

interface MesinDetailModalProps {
    machine: MesinAsset | null;
    onClose: () => void;
}

export default function MesinDetailModal({ machine, onClose }: MesinDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'SPEC' | 'PAYMENT' | 'ARCHIVE'>('SPEC');

    if (!machine) return null;

    const formatIDR = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                        <span className="text-xs font-mono text-blue-400">{machine.kode_mesin}</span>
                        <h2 className="text-xl font-extrabold text-white mt-0.5">{machine.nama_mesin}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{machine.merk_model} • Vendor: {machine.vendor_supplier || '-'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
                    <button
                        onClick={() => setActiveTab('SPEC')}
                        className={`pb-2 border-b-2 transition-all ${activeTab === 'SPEC' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
                            }`}
                    >
                        Spesifikasi & Finansial
                    </button>
                    <button
                        onClick={() => setActiveTab('PAYMENT')}
                        className={`pb-2 border-b-2 transition-all ${activeTab === 'PAYMENT' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400'
                            }`}
                    >
                        Riwayat Pembayaran ({machine.riwayat_pembayaran?.length || 0})
                    </button>
                    {machine.status === 'ARCHIVED' && (
                        <button
                            onClick={() => setActiveTab('ARCHIVE')}
                            className={`pb-2 border-b-2 transition-all ${activeTab === 'ARCHIVE' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400'
                                }`}
                        >
                            Info Pengarsipan
                        </button>
                    )}
                </div>

                {/* Tab 1: Spec & Financial */}
                {activeTab === 'SPEC' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                            <div>
                                <p className="text-slate-500">Nomor Seri</p>
                                <p className="font-mono text-white mt-0.5">{machine.no_seri || '-'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Garansi Berakhir</p>
                                <p className="text-slate-200 mt-0.5">{machine.garansi_hingga ? new Date(machine.garansi_hingga).toLocaleDateString('id-ID') : '-'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Lokasi Line</p>
                                <p className="text-slate-200 mt-0.5">{machine.lokasi_line}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Harga Beli Awal</p>
                                <p className="font-semibold text-slate-200 mt-0.5">{formatIDR(machine.harga_beli)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Nilai Buku Saat Ini</p>
                                <p className="font-semibold text-emerald-400 mt-0.5">{formatIDR(machine.nilai_buku_saat_ini)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Sisa Utang Cicilan</p>
                                <p className="font-semibold text-amber-400 mt-0.5">{formatIDR(machine.sisa_pembayaran)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Payment History */}
                {activeTab === 'PAYMENT' && (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {machine.riwayat_pembayaran && machine.riwayat_pembayaran.length > 0 ? (
                            machine.riwayat_pembayaran.map((rec) => (
                                <div key={rec.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs">
                                    <div>
                                        <p className="font-semibold text-white">{rec.catatan}</p>
                                        <p className="text-slate-500 text-[10px]">{new Date(rec.tanggal).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <span className="font-bold text-emerald-400">{formatIDR(rec.jumlah)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-6">Belum ada catatan transaksi tambahan.</p>
                        )}
                    </div>
                )}

                {/* Tab 3: Archive Info */}
                {activeTab === 'ARCHIVE' && machine.arsip_info && (
                    <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/40 text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Tanggal Pengarsipan:</span>
                            <span className="text-rose-300 font-bold">{new Date(machine.arsip_info.tanggal_arsip).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Alasan:</span>
                            <span className="text-rose-300 font-bold">{machine.arsip_info.alasan}</span>
                        </div>
                        {machine.arsip_info.harga_jual ? (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Harga Jual Sisa:</span>
                                <span className="text-emerald-400 font-bold">{formatIDR(machine.arsip_info.harga_jual)}</span>
                            </div>
                        ) : null}
                        <p className="text-slate-300 pt-2 border-t border-rose-900/40">Catatan: {machine.arsip_info.catatan || '-'}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}