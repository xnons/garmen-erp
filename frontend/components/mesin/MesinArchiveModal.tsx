'use client';

import React, { useState } from 'react';
import { Archive, X, AlertTriangle } from 'lucide-react';
import { MesinAsset, ArchiveReason } from './types';

interface MesinArchiveModalProps {
    machine: MesinAsset | null;
    onClose: () => void;
    onConfirmArchive: (machineId: string, archiveData: any) => void;
}

export default function MesinArchiveModal({ machine, onClose, onConfirmArchive }: MesinArchiveModalProps) {
    const [alasan, setAlasan] = useState<ArchiveReason>('DIJUAL');
    const [catatan, setCatatan] = useState('');
    const [hargaJual, setHargaJual] = useState<number>(0);
    const [tanggalArsip, setTanggalArsip] = useState(new Date().toISOString().split('T')[0]);

    if (!machine) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirmArchive(machine.id, {
            tanggal_arsip: tanggalArsip,
            alasan,
            catatan,
            harga_jual: alasan === 'DIJUAL' ? Number(hargaJual) : 0,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5 animate-modal-pop backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                            <Archive className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">
                                Arsipkan / Buang Mesin
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                        Anda akan mengarsipkan <strong className="text-white">{machine.nama_mesin}</strong> (<span className="font-mono text-indigo-400">{machine.kode_mesin}</span>). Status mesin akan diubah ke non-operasional.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Alasan Pengarsipan / Pembuangan</label>
                        <select
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value as ArchiveReason)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-rose-500 outline-none transition-colors"
                        >
                            <option value="DIJUAL">Dijual (Aset Bekas)</option>
                            <option value="DIBUANG_SCRAP">Dibuang / Besi Tua (Scrap)</option>
                            <option value="RUSAK_TOTAL">Rusak Total / Tidak Bisa Diperbaiki</option>
                            <option value="HILANG">Hilang</option>
                            <option value="LAINNYA">Lainnya</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 font-semibold mb-1.5">Tanggal Berhenti</label>
                            <input
                                type="date"
                                required
                                value={tanggalArsip}
                                onChange={(e) => setTanggalArsip(e.target.value)}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-rose-500 outline-none font-mono"
                            />
                        </div>
                        {alasan === 'DIJUAL' && (
                            <div>
                                <label className="block text-slate-400 font-semibold mb-1.5">Harga Jual (IDR)</label>
                                <input
                                    type="number"
                                    value={hargaJual || ''}
                                    onChange={(e) => setHargaJual(Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-rose-500 outline-none font-mono"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">Catatan Kondisi / Pembeli</label>
                        <textarea
                            rows={2}
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            placeholder="Alasan detail pembuangan / nama pembeli mesin bekas..."
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-rose-500 outline-none resize-none transition-colors"
                        />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
                        >
                            Konfirmasi Arsip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}