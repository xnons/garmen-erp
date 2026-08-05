'use client';

import React, { useState } from 'react';
import { CreditCard, X, Calendar, FileText, Banknote, Wallet } from 'lucide-react';
import { MesinAsset, PaymentRecord } from './types';

interface MesinPaymentModalProps {
    machine: MesinAsset | null;
    onClose: () => void;
    onAddPayment: (machineId: string, record: PaymentRecord) => void;
}

export default function MesinPaymentModal({ machine, onClose, onAddPayment }: MesinPaymentModalProps) {
    const [nominal, setNominal] = useState<number>(0);
    const [catatan, setCatatan] = useState<string>('Angsuran Cicilan Mesin');
    const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);

    if (!machine) return null;

    // 🟢 Safe IDR Formatter untuk mencegah error 'RpNaN'
    const formatIDR = (val: any) => {
        const num = Number(val);
        if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const hargaBeli = Number(machine.harga_beli) || 0;
    const sisaPembayaran = Number(machine.sisa_pembayaran) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nominal <= 0) return alert('Masukkan nominal pembayaran yang valid');

        const newRecord: PaymentRecord = {
            id: Date.now().toString(),
            tanggal,
            jumlah: Number(nominal),
            catatan,
            pembayar: 'Finance Staff',
        };

        onAddPayment(machine.id, newRecord);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-6">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                                Opsi Pencatatan Angsuran
                            </span>
                            <h2 className="text-lg font-bold text-white">{machine.nama_mesin}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 font-medium text-xs">
                    <div className="flex items-start gap-2.5">
                        <Wallet className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-slate-500">Harga Beli Total</p>
                            <p className="text-sm font-semibold text-white font-mono mt-0.5">{formatIDR(hargaBeli)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <Banknote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-slate-500">Sisa Utang</p>
                            <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">{formatIDR(sisaPembayaran)}</p>
                        </div>
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Nominal Pembayaran (IDR) *</label>
                        <input
                            type="number"
                            required
                            max={sisaPembayaran > 0 ? sisaPembayaran : undefined}
                            value={nominal || ''}
                            onChange={(e) => setNominal(Number(e.target.value))}
                            placeholder="misal: 2500000"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Tanggal Bayar *</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Catatan</span>
                            </label>
                            <input
                                type="text"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                        >
                            Simpan Pembayaran
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}