import React from 'react';
import { AlertTriangle, X, RotateCcw, ListFilter, Plus, CheckCircle2, Calendar, Trash2 } from 'lucide-react';
import { Karyawan, LogPelanggaran } from './types';

interface SanksiModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedKaryawan: Karyawan | null;
    activeTab: 'list' | 'add';
    setActiveTab: (tab: 'list' | 'add') => void;
    sanksiLogs: LogPelanggaran[];
    loadingLogs: boolean;
    sanksiData: { jenis: string; poin: number; keterangan: string };
    setSanksiData: React.Dispatch<React.SetStateAction<{ jenis: string; poin: number; keterangan: string }>>;
    onAddSanksi: (e: React.FormEvent) => void;
    onDeleteSingleSanksi: (id_log: number, jenis: string, poin: number) => void;
    onResetSanksi: () => void;
}

export const SanksiModal: React.FC<SanksiModalProps> = ({
    isOpen,
    onClose,
    selectedKaryawan,
    activeTab,
    setActiveTab,
    sanksiLogs,
    loadingLogs,
    sanksiData,
    setSanksiData,
    onAddSanksi,
    onDeleteSingleSanksi,
    onResetSanksi,
}) => {
    if (!isOpen || !selectedKaryawan) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-modal-pop">

                {/* Modal Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div>
                        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Kelola Sanksi Kedisiplinan
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Karyawan: <strong className="text-white">{selectedKaryawan.nama}</strong> ({selectedKaryawan.id_karyawan})
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header: Akumulasi Poin & Fast Reset */}
                <div className="px-5 py-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                        Total Akumulasi: <strong className="text-amber-400 text-sm">{selectedKaryawan.poin_pelanggaran || 0} Poin</strong>
                    </span>
                    {(selectedKaryawan.poin_pelanggaran || 0) > 0 && (
                        <button
                            type="button"
                            onClick={onResetSanksi}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                            title="Reset seluruh poin menjadi 0"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Semua Ke 0</span>
                        </button>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'list'
                            ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <ListFilter className="w-4 h-4" />
                        <span>Riwayat & Hapus Sanksi ({sanksiLogs.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'add'
                            ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Sanksi Baru</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto space-y-4 max-h-[60vh]">
                    {/* TAB 1: RIWAYAT & HAPUS SANKSI INDIVIDUAL */}
                    {activeTab === 'list' && (
                        <div className="space-y-3">
                            {loadingLogs ? (
                                <p className="text-center py-6 text-xs text-slate-500">Memuat log sanksi...</p>
                            ) : sanksiLogs.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400 font-medium">Tidak ada catatan sanksi aktif.</p>
                                    <p className="text-[11px] text-slate-500 mt-1">Karyawan ini bersih dari catatan pelanggaran.</p>
                                </div>
                            ) : (
                                sanksiLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-500/30 rounded-xl flex items-start justify-between gap-3 transition-all"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    {log.jenis} (+{log.poin} Poin)
                                                </span>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {log.tanggal}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-200 font-medium">{log.keterangan}</p>
                                        </div>

                                        {/* TOMBOL HAPUS / CABUT SANKSI SPESIFIK */}
                                        <button
                                            onClick={() => onDeleteSingleSanksi(log.id, log.jenis, log.poin)}
                                            title="Hapus / Cabut Sanksi Ini"
                                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 shrink-0 transition-all active:scale-95"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB 2: FORM TAMBAH SANKSI BARU */}
                    {activeTab === 'add' && (
                        <form onSubmit={onAddSanksi} className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Tingkat Sanksi Baru</label>
                                <select
                                    value={sanksiData.jenis}
                                    onChange={(e) => setSanksiData({ ...sanksiData, jenis: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                                >
                                    <option value="Ringan">Ringan (5 Poin)</option>
                                    <option value="Sedang">Sedang (15 Poin)</option>
                                    <option value="Berat">Berat (30 Poin)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Bobot Poin</label>
                                <input
                                    type="number" required
                                    value={sanksiData.poin}
                                    onChange={(e) => setSanksiData({ ...sanksiData, poin: Number(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Keterangan / Alasan Pelanggaran</label>
                                <textarea
                                    required rows={3}
                                    value={sanksiData.keterangan}
                                    onChange={(e) => setSanksiData({ ...sanksiData, keterangan: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                                    placeholder="Misal: Terlambat shift pagi 30 menit, merusak bahan kain..."
                                />
                            </div>

                            <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                                <button
                                    type="button" onClick={() => setActiveTab('list')}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-amber-600/30"
                                >
                                    Tambah Poin Sanksi
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};