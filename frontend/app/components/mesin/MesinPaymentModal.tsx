'use client';

import React, { useState } from 'react';
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

    const formatIDR = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

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
            <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">

                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                        <span className="text-xs font-mono text-emerald-400">BAYAR ANGSURAN</span>
                        <h2 className="text-lg font-bold text-white">{machine.nama_mesin}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div>
                        <p className="text-xs text-slate-500">Harga Beli Total</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{formatIDR(machine.harga_beli)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Sisa Utang</p>
                        <p className="text-sm font-bold text-amber-400 mt-0.5">{formatIDR(machine.sisa_pembayaran)}</p>
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Nominal Pembayaran (IDR)</label>
                        <input
                            type="number"
                            required
                            max={machine.sisa_pembayaran}
                            value={nominal || ''}
                            onChange={(e) => setNominal(Number(e.target.value))}
                            placeholder="misal: 2500000"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Bayar</label>
                            <input
                                type="date"
                                required
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Catatan</label>
                            <input
                                type="text"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
                        >
                            Simpan Pembayaran
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}