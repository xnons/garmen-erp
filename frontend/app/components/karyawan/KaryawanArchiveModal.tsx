'use client';

import React, { useState, useEffect } from 'react';
import { Karyawan, ArsipKaryawanInfo } from './types';
import { UserMinus, AlertTriangle, X, Calendar, FileText, Tag } from 'lucide-react';

interface KaryawanArchiveModalProps {
    karyawan: Karyawan | null;
    onClose: () => void;
    onConfirmArchive: (id_karyawan: string, archiveData: ArsipKaryawanInfo) => void;
}

export const KaryawanArchiveModal: React.FC<KaryawanArchiveModalProps> = ({
    karyawan,
    onClose,
    onConfirmArchive
}) => {
    const [alasan, setAlasan] = useState<ArsipKaryawanInfo['alasan_keluar']>('RESIGN');
    const [tanggalKeluar, setTanggalKeluar] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [catatan, setCatatan] = useState('');

    useEffect(() => {
        if (karyawan) {
            setAlasan('RESIGN');
            setTanggalKeluar(new Date().toISOString().split('T')[0]);
            setCatatan('');
        }
    }, [karyawan]);

    if (!karyawan) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirmArchive(karyawan.id_karyawan, {
            alasan_keluar: alasan,
            tanggal_keluar: tanggalKeluar,
            catatan_keluar: catatan,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all">
            <div className="w-full max-w-md bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative animate-modal-pop backdrop-blur-xl">

                {/* Tombol Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition-all hover:bg-slate-800/50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Modal */}
                <div className="flex flex-col items-center text-center space-y-2 mt-2">
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl shadow-inner animate-lock-pulse">
                        <UserMinus className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                        Arsipkan / Nonaktifkan Karyawan
                    </h3>
                    <p className="text-xs text-slate-400 px-2 leading-relaxed">
                        Anda akan mengarsipkan data <strong className="text-white">{karyawan.nama}</strong> ({karyawan.jabatan}). Data riwayat poin & kerja tetap tersimpan.
                    </p>
                </div>

                {/* Warning Callout */}
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Karyawan terarsip tidak akan muncul di daftar aktif dan akses login sistem akan dibekukan.</span>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Alasan Keluar */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-rose-400" />
                            Alasan Berhenti / Keluar
                        </label>
                        <select
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value as ArsipKaryawanInfo['alasan_keluar'])}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition-all"
                        >
                            <option value="RESIGN">Mengundurkan Diri (Resign)</option>
                            <option value="DIPECAT">Pemutusan Hubungan Kerja (Dipecat / PHK)</option>
                            <option value="HABIS_KONTRAK">Masa Kontrak Kerja Habis</option>
                            <option value="PENSIUN">Pensiun / Usia Kerja</option>
                            <option value="LAINNYA">Lainnya</option>
                        </select>
                    </div>

                    {/* Tanggal Keluar */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-rose-400" />
                            Tanggal Efektif Keluar
                        </label>
                        <input
                            type="date"
                            value={tanggalKeluar}
                            onChange={(e) => setTanggalKeluar(e.target.value)}
                            required
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition-all"
                        />
                    </div>

                    {/* Catatan Tambahan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-rose-400" />
                            Catatan / Keterangan (Opsional)
                        </label>
                        <textarea
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Menyerahkan seragam dan ID Card, pesangon lunas..."
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition-all resize-none placeholder:text-slate-600"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                        >
                            <UserMinus className="w-4 h-4" />
                            <span>Proses Arsip</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default KaryawanArchiveModal;