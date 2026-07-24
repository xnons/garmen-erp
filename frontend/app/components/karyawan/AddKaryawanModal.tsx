import React, { useEffect } from 'react';
import { UserPlus, X, RefreshCw } from 'lucide-react';

interface AddKaryawanModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    onGeneratePassword: () => void;
    activeUser?: any; // 👈 Prop baru untuk membaca role user yang sedang login
}

export const AddKaryawanModal: React.FC<AddKaryawanModalProps> = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    onGeneratePassword,
    activeUser,
}) => {
    if (!isOpen) return null;

    // 🔒 HIERARKI ROLE BERDASARKAN SIAPA YANG SEDANG LOGIN
    const getAvailableRoles = (currentRole?: string) => {
        const role = currentRole?.toUpperCase() || '';
        switch (role) {
            case 'DEVELOPER':
                // Developer bisa membuat semua role
                return ['DEVELOPER', 'OWNER', 'ADMIN', 'FINANCE', 'GUDANG', 'PRODUKSI', 'KARYAWAN'];
            case 'OWNER':
                // Owner bisa membuat Admin dan Staff di bawahnya
                return ['ADMIN', 'FINANCE', 'GUDANG', 'PRODUKSI', 'KARYAWAN'];
            case 'ADMIN':
                // Admin HANYA bisa membuat Staff operasional (TIDAK bisa Owner/Admin)
                return ['FINANCE', 'GUDANG', 'PRODUKSI', 'KARYAWAN'];
            default:
                return ['PRODUKSI', 'GUDANG', 'FINANCE', 'KARYAWAN'];
        }
    };

    const availableRoles = getAvailableRoles(activeUser?.role);

    // 🛡️ Otomatis sesuaikan formData.role jika role saat ini tidak diizinkan untuk dikelola
    useEffect(() => {
        if (isOpen && availableRoles.length > 0) {
            if (!availableRoles.includes(formData.role)) {
                setFormData((prev: any) => ({ ...prev, role: availableRoles[0] }));
            }
        }
    }, [isOpen, activeUser]);

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-modal-pop">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Karyawan Baru
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Nama Lengkap *</label>
                            <input
                                type="text" required
                                value={formData.nama}
                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Username Login *</label>
                            <input
                                type="text" required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>

                        {/* Password Acak */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-400 block">Password Auto-Generate *</label>
                                <button
                                    type="button"
                                    onClick={onGeneratePassword}
                                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" /> Acak Password
                                </button>
                            </div>
                            <input
                                type="text" required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-emerald-400 font-mono font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">PIN Security Gate (4 Digit) *</label>
                            <input
                                type="text" maxLength={4} required
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Jabatan Spesifik</label>
                            <input
                                type="text"
                                value={formData.jabatan}
                                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                                placeholder="Contoh: Operator Sewing, QC, Mekanik"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>

                        {/* DROPDOWN ROLE DINAMIS DENGAN DUKUNGAN RBAC */}
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Role Akses Sistem *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            >
                                {availableRoles.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Tipe Penggajian</label>
                            <select
                                value={formData.tipe_pay}
                                onChange={(e) => setFormData({ ...formData, tipe_pay: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            >
                                <option value="BORONGAN">BORONGAN (Per Pcs)</option>
                                <option value="BULANAN">BULANAN (Gaji Pokok)</option>
                                <option value="HARIAN">HARIAN</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">
                                {formData.tipe_pay === 'BORONGAN' ? 'Tarif per Pcs (Rp)' : 'Gaji Pokok / Harian (Rp)'}
                            </label>
                            <input
                                type="number"
                                value={formData.tipe_pay === 'BORONGAN' ? formData.tarif_borongan_pcs : formData.gaji_pokok}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (formData.tipe_pay === 'BORONGAN') setFormData({ ...formData, tarif_borongan_pcs: val });
                                    else setFormData({ ...formData, gaji_pokok: val });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">No WhatsApp / HP</label>
                            <input
                                type="text"
                                value={formData.no_hp}
                                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                                placeholder="08123456789"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
                        </div>

                        {/* Tanggal Lahir */}
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Tanggal Lahir</label>
                            <input
                                type="date"
                                value={formData.tanggal_lahir}
                                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white"
                            />
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
                            Simpan Karyawan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};