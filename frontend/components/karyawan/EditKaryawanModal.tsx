import React from 'react';
import { Pencil, X } from 'lucide-react';
import { Karyawan } from './types';

interface EditKaryawanModalProps {
    isOpen: boolean;
    onClose: () => void;
    editFormData: Karyawan | null;
    setEditFormData: React.Dispatch<React.SetStateAction<Karyawan | null>>;
    onSubmit: (e: React.FormEvent) => void;
}

export const EditKaryawanModal: React.FC<EditKaryawanModalProps> = ({
    isOpen,
    onClose,
    editFormData,
    setEditFormData,
    onSubmit,
}) => {
    if (!isOpen || !editFormData) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-modal-pop">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-indigo-400" /> Edit Karyawan ({editFormData.id_karyawan})
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Nama Lengkap</label>
                            <input
                                type="text" required
                                value={editFormData.nama}
                                onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Jabatan Spesifik</label>
                            <input
                                type="text"
                                value={editFormData.jabatan || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, jabatan: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Role System</label>
                            <select
                                value={editFormData.role}
                                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            >
                                <option value="PRODUKSI">PRODUKSI</option>
                                <option value="PPIC">PPIC</option>
                                <option value="GUDANG">GUDANG</option>
                                <option value="QC_INSPECTOR">QC INSPECTOR</option>
                                <option value="LINE_SUPERVISOR">LINE SUPERVISOR</option>
                                <option value="CUTTING_OPERATOR">CUTTING OPERATOR</option>
                                <option value="FINISHING_OPERATOR">FINISHING OPERATOR</option>
                                <option value="EXPEDITION_DRIVER">DRIVER EKSPEDISI</option>
                                <option value="FINANCE">FINANCE</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="OWNER">OWNER</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Hak Akses Login Web</label>
                            <select
                                value={editFormData.can_login !== false ? 'TRUE' : 'FALSE'}
                                onChange={(e) => setEditFormData({ ...editFormData, can_login: e.target.value === 'TRUE' })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            >
                                <option value="TRUE">AKTIF (Bisa Login Web)</option>
                                <option value="FALSE">OFFLINE (Non-Login)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Tipe Penggajian</label>
                            <select
                                value={editFormData.tipe_pay}
                                onChange={(e) => setEditFormData({ ...editFormData, tipe_pay: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            >
                                <option value="BORONGAN">BORONGAN (Per Pcs)</option>
                                <option value="BULANAN">BULANAN (Gaji Pokok)</option>
                                <option value="HARIAN">HARIAN</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Tarif Borongan (Rp/pcs)</label>
                            <input
                                type="number"
                                value={editFormData.tarif_borongan_pcs || 0}
                                onChange={(e) => setEditFormData({ ...editFormData, tarif_borongan_pcs: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Gaji Pokok / Harian (Rp)</label>
                            <input
                                type="number"
                                value={editFormData.gaji_pokok || 0}
                                onChange={(e) => setEditFormData({ ...editFormData, gaji_pokok: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">No WhatsApp / HP</label>
                            <input
                                type="text"
                                value={editFormData.no_hp || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, no_hp: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>

                        {/* Tanggal Lahir */}
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Tanggal Lahir</label>
                            <input
                                type="date"
                                value={editFormData.tanggal_lahir || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, tanggal_lahir: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>

                        {/* Reset Password oleh Atasan */}
                        <div className="md:col-span-2 p-3 bg-slate-950/80 rounded-xl border border-indigo-500/20 space-y-1.5">
                            <label className="text-xs font-bold text-indigo-400 block flex items-center justify-between">
                                <span>Reset Password Akun (Khusus Atasan)</span>
                                <span className="text-[10px] text-slate-500 font-normal">Tercatat di Audit Log</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Masukkan password baru jika ingin mereset (min. 6 karakter)..."
                                value={editFormData.password || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-400">
                                Kosongkan jika tidak ingin mengubah password akun karyawan ini.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                        <button
                            type="button" onClick={onClose}
                            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};