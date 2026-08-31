'use client';

import React, { useEffect } from 'react';
import {
    UserPlus,
    X,
    RefreshCw,
    User,
    Key,
    Briefcase,
    ShieldCheck,
    Wallet,
    Phone,
    Calendar,
    Check,
    DollarSign
} from 'lucide-react';

interface AddKaryawanModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    onGeneratePassword: () => void;
    activeUser?: any;
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

    // 🔒 HIERARKI ROLE BERDASARKAN USER LOGIN
    const getAvailableRoles = (currentRole?: string) => {
        const role = currentRole?.toUpperCase() || '';
        switch (role) {
            case 'DEVELOPER':
                return ['DEVELOPER', 'OWNER', 'ADMIN', 'FINANCE', 'GUDANG', 'PRODUKSI', 'KARYAWAN'];
            case 'OWNER':
                return ['ADMIN', 'FINANCE', 'GUDANG', 'PRODUKSI', 'KARYAWAN'];
            case 'ADMIN':
                return ['FINANCE', 'GUDANG', 'PRODUKSI', 'KARYAWAN'];
            default:
                return ['PRODUKSI', 'GUDANG', 'FINANCE', 'KARYAWAN'];
        }
    };

    const availableRoles = getAvailableRoles(activeUser?.role);

    // 🛡️ Kunci penyesuaian Role otomatis
    useEffect(() => {
        if (isOpen && availableRoles.length > 0) {
            if (!formData?.role || !availableRoles.includes(formData.role)) {
                setFormData((prev: any) => ({ ...prev, role: availableRoles[0] }));
            }
        }
    }, [isOpen, activeUser]);

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-modal-pop">

                {/* Modal Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Tambah Karyawan Baru</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Daftarkan akun, hak akses role, serta skema penggajian operasional karyawan.
                            </p>
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

                <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

                    {/* PILIHAN TIPE AKSES KARYAWAN */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                            <span>Tipe Akses Karyawan</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                                {formData?.can_login === false ? 'Hanya Pendataan Profil & Upah' : 'Memiliki Akun Login Web'}
                            </span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, can_login: false })}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                    formData?.can_login === false
                                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    🏢 Karyawan Operasional
                                </span>
                                <span className="text-[10px] font-normal text-slate-400">Offline / Tanpa Login Web</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, can_login: true });
                                    if (!formData?.password) onGeneratePassword();
                                }}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                    formData?.can_login !== false
                                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-sm'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    💻 Pengguna Aplikasi
                                </span>
                                <span className="text-[10px] font-normal text-slate-400">Akses Dashboard Web</span>
                            </button>
                        </div>
                    </div>

                    {/* SECTION 1: Akun & Kredensial Login */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            <User className="w-4 h-4" />
                            <span>1. Profil {formData?.can_login !== false ? '& Kredensial Login' : 'Karyawan'}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={formData?.can_login === false ? 'md:col-span-2' : ''}>
                                <label className="text-xs font-medium text-slate-400 mb-1 block">Nama Lengkap *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Budi Santoso"
                                    value={formData?.nama ?? ''}
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {formData?.can_login !== false && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Username Login *</label>
                                        <input
                                            type="text"
                                            required={formData?.can_login !== false}
                                            placeholder="budisantoso"
                                            value={formData?.username ?? ''}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                                                <Key className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Password Auto-Generate *</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={onGeneratePassword}
                                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                <span>Acak Password</span>
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            required={formData?.can_login !== false}
                                            value={formData?.password ?? ''}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono font-bold tracking-wider focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: Jabatan & Skema Penggajian */}
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                            <Briefcase className="w-4 h-4" />
                            <span>2. Jabatan & Skema Penggajian</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 block">Jabatan Spesifik</label>
                                <input
                                    type="text"
                                    value={formData?.jabatan ?? ''}
                                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                                    placeholder="Contoh: Operator Sewing, QC, Mekanik"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {/* 🛡️ FIX SELECT ROLE: Menggunakan Fallback (?? '') */}
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Role Akses Sistem *</span>
                                </label>
                                <select
                                    value={formData?.role ?? availableRoles[0] ?? ''}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                                >
                                    {availableRoles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 🛡️ FIX SELECT TIPE PAY: Menggunakan Fallback (?? 'BORONGAN') */}
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Tipe Penggajian</span>
                                </label>
                                <select
                                    value={formData?.tipe_pay ?? 'BORONGAN'}
                                    onChange={(e) => setFormData({ ...formData, tipe_pay: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="BORONGAN">BORONGAN (Per Pcs)</option>
                                    <option value="BULANAN">BULANAN (Gaji Pokok)</option>
                                    <option value="HARIAN">HARIAN</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>
                                        {formData?.tipe_pay === 'BORONGAN' ? 'Tarif per Pcs (Rp)' : 'Gaji Pokok / Harian (Rp)'}
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData?.tipe_pay === 'BORONGAN' ? (formData?.tarif_borongan_pcs ?? 0) : (formData?.gaji_pokok ?? 0)}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (formData?.tipe_pay === 'BORONGAN') {
                                            setFormData({ ...formData, tarif_borongan_pcs: val });
                                        } else {
                                            setFormData({ ...formData, gaji_pokok: val });
                                        }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Kontak & Biodata */}
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <Phone className="w-4 h-4" />
                            <span>3. Kontak & Biodata</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                    <span>No WhatsApp / HP</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData?.no_hp ?? ''}
                                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                                    placeholder="08123456789"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Tanggal Lahir</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData?.tanggal_lahir ?? ''}
                                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Simpan Karyawan</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddKaryawanModal;