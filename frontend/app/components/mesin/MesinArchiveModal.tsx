'use client';

import React, { useState } from 'react';
import { Archive, X } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                        <Archive className="w-5 h-5 text-rose-400" />
                        <span>Arsipkan / Buang Mesin</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-slate-300">
                    Kamu akan mengarsipkan <strong className="text-white">{machine.nama_mesin}</strong> ({machine.kode_mesin}).
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div>
                        <label className="block text-slate-400 mb-1">Alasan Pengarsipan / Pembuangan</label>
                        <select
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value as ArchiveReason)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-rose-500 outline-none"
                        >
                            <option value="DIJUAL">Dijual (Aset Bekas)</option>
                            <option value="DIBUANG_SCRAP">Dibuang / Besi Tua (Scrap)</option>
                            <option value="RUSAK_TOTAL">Rusak Total / Tidak BIsa Diperbaiki</option>
                            <option value="HILANG">Hilang</option>
                            <option value="LAINNYA">Lainnya</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-400 mb-1">Tanggal Berhenti</label>
                            <input
                                type="date"
                                required
                                value={tanggalArsip}
                                onChange={(e) => setTanggalArsip(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none"
                            />
                        </div>
                        {alasan === 'DIJUAL' && (
                            <div>
                                <label className="block text-slate-400 mb-1">Harga Jual (IDR)</label>
                                <input
                                    type="number"
                                    value={hargaJual || ''}
                                    onChange={(e) => setHargaJual(Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-1">Catatan Kondisi / Pembeli</label>
                        <textarea
                            rows={2}
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            placeholder="Alasan detail pembuangan / nama pembeli mesin bekas..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20"
                        >
                            Konfirmasi Arsip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}