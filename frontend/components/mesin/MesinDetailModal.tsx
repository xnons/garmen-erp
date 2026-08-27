'use client';

import React, { useState } from 'react';
import { X, Cpu, CreditCard, Archive, Info, ShieldCheck, MapPin, Calendar, Receipt } from 'lucide-react';
import { MesinAsset } from './types';

interface MesinDetailModalProps {
    machine: MesinAsset | null;
    onClose: () => void;
}

export default function MesinDetailModal({ machine, onClose }: MesinDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'SPEC' | 'PAYMENT' | 'ARCHIVE'>('SPEC');

    if (!machine) return null;

    const formatIDR = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl bg-slate-900/95 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 animate-modal-pop backdrop-blur-xl max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-mono text-indigo-400 font-semibold">{machine.kode_mesin}</span>
                            <h2 className="text-xl font-bold text-white mt-0.5">{machine.nama_mesin}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">{machine.merk_model} • Vendor: {machine.vendor_supplier || '-'}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
                    <button
                        onClick={() => setActiveTab('SPEC')}
                        className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'SPEC' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        <Info className="w-3.5 h-3.5" />
                        <span>Spesifikasi & Finansial</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('PAYMENT')}
                        className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'PAYMENT' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Riwayat Pembayaran ({machine.riwayat_pembayaran?.length || 0})</span>
                    </button>
                    {machine.status === 'ARCHIVED' && (
                        <button
                            onClick={() => setActiveTab('ARCHIVE')}
                            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'ARCHIVE' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                        >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Info Pengarsipan</span>
                        </button>
                    )}
                </div>

                {/* Tab 1: Spec & Financial */}
                {activeTab === 'SPEC' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                            <div>
                                <p className="text-slate-500 text-[11px] font-medium">Nomor Seri (Serial No)</p>
                                <p className="font-mono text-white font-semibold mt-1">{machine.no_seri || '-'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[11px] font-medium">Garansi Berakhir</p>
                                <p className="text-slate-200 font-semibold mt-1">{machine.garansi_hingga ? new Date(machine.garansi_hingga).toLocaleDateString('id-ID') : 'Tidak Ada'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[11px] font-medium">Lokasi Line Produksi</p>
                                <p className="text-slate-200 font-semibold mt-1">📍 {machine.lokasi_line || 'Workshop'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[11px] font-medium">Harga Beli Awal</p>
                                <p className="font-bold text-white mt-1 font-mono">{formatIDR(machine.harga_beli)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[11px] font-medium">Nilai Buku Saat Ini</p>
                                <p className="font-bold text-emerald-400 mt-1 font-mono">{formatIDR(machine.nilai_buku_saat_ini || machine.harga_beli)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[11px] font-medium">Sisa Utang Pembelian</p>
                                <p className={`font-bold mt-1 font-mono ${machine.sisa_pembayaran > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {formatIDR(machine.sisa_pembayaran)}
                                </p>
                            </div>
                        </div>

                        {machine.catatan && (
                            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                                <p className="text-slate-400 font-semibold mb-1">Catatan Tambahan:</p>
                                <p className="text-slate-300">{machine.catatan}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Payment History */}
                {activeTab === 'PAYMENT' && (
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {machine.riwayat_pembayaran && machine.riwayat_pembayaran.length > 0 ? (
                            machine.riwayat_pembayaran.map((rec) => (
                                <div key={rec.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                                            <Receipt className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{rec.catatan || 'Pembayaran Cicilan'}</p>
                                            <p className="text-slate-500 text-[10px] mt-0.5">{new Date(rec.tanggal).toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-emerald-400 font-mono text-sm">{formatIDR(rec.jumlah)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-8">Belum ada riwayat transaksi pembayaran.</p>
                        )}
                    </div>
                )}

                {/* Tab 3: Archive Info */}
                {activeTab === 'ARCHIVE' && machine.arsip_info && (
                    <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/30 text-xs space-y-2.5">
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
                                <span className="text-slate-400">Nilai Jual Sisa (Scrap):</span>
                                <span className="text-emerald-400 font-bold font-mono">{formatIDR(machine.arsip_info.harga_jual)}</span>
                            </div>
                        ) : null}
                        <p className="text-slate-300 pt-2 border-t border-rose-900/30">Catatan: {machine.arsip_info.catatan || '-'}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end pt-2 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}