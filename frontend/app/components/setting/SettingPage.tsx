"use client";

import React, { useState } from 'react';
import {
    User,
    ShieldCheck,
    KeyRound,
    Lock,
    Sparkles,
    Terminal,
    CheckCircle2,
    ShieldAlert,
    UserCheck,
    Settings
} from 'lucide-react';
import { UpdatePinModal } from '@/app/components/karyawan/UpdatePinModal';

interface SettingPageProps {
    activeUser: {
        id_karyawan?: string;
        nama?: string;
        username?: string;
        role?: string;
        jabatan?: string;
        no_hp?: string;
    } | any;
}

export const SettingPage: React.FC<SettingPageProps> = ({ activeUser }) => {
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    // State untuk Form Ubah Password User
    const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [loadingPass, setLoadingPass] = useState(false);
    const [passSuccessMsg, setPassSuccessMsg] = useState('');
    const [passErrorMsg, setPassErrorMsg] = useState('');

    const userRole = activeUser?.role?.toUpperCase() || 'KARYAWAN';
    const isOwnerOrDev = ['OWNER', 'DEVELOPER'].includes(userRole);
    const isDev = userRole === 'DEVELOPER';

    // Handler Ubah Password Personal User
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassErrorMsg('');
        setPassSuccessMsg('');

        if (passData.newPassword !== passData.confirmPassword) {
            setPassErrorMsg('Konfirmasi password baru tidak cocok!');
            return;
        }

        if (passData.newPassword.length < 6) {
            setPassErrorMsg('Password baru minimal harus 6 karakter.');
            return;
        }

        setLoadingPass(true);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('access_token') || '';

            const res = await fetch(`${API_BASE}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_password: passData.oldPassword,
                    new_password: passData.newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal memperbarui password');

            setPassSuccessMsg('Password berhasil diperbarui!');
            setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setPassErrorMsg(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            setLoadingPass(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">

            {/* HEADER SECTION */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Pengaturan & Keamanan Akun
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Kelola profil personal, kredensial login, dan otoritas Master PIN Security Gate.
                        </p>
                    </div>
                </div>
                {isDev && (
                    <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> DEV_MODE ACTIVE
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: INFORMASI PROFIL & PERMISSION */}
                <div className="space-y-6">

                    {/* USER CARD */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 flex flex-col items-center text-center shadow-xl">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-xl shadow-indigo-500/20 mb-4">
                            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                                <User className="w-10 h-10 text-indigo-400" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white">{activeUser?.nama || 'User Garment'}</h3>
                        <p className="text-xs text-slate-400 mb-3">@{activeUser?.username || 'username'}</p>

                        <div className="flex flex-wrap gap-2 justify-center">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${isDev
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : userRole === 'OWNER'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                }`}>
                                {userRole}
                            </span>
                            <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {activeUser?.jabatan || 'Staff'}
                            </span>
                        </div>

                        <div className="w-full border-t border-slate-800/80 my-5" />

                        <div className="w-full space-y-2.5 text-xs text-left">
                            <div className="flex justify-between py-1 text-slate-400">
                                <span>ID Karyawan:</span>
                                <span className="text-white font-mono">{activeUser?.id_karyawan || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-400">
                                <span>No. WhatsApp:</span>
                                <span className="text-white font-mono">{activeUser?.no_hp || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-400">
                                <span>Status Akun:</span>
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5" /> Aktif
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* MASTER PIN GATE CONTROL CARD (KHUSUS OWNER & DEV) */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Master PIN Security Gate</h4>
                                <p className="text-[11px] text-slate-400">Akses aksi kritis & otoritas sistem</p>
                            </div>
                        </div>

                        {isOwnerOrDev ? (
                            <div className="space-y-3 pt-2">
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    PIN ini digunakan untuk membuka verifikasi gate pada fitur sensitif seperti reset gaji, sanksi, dan registrasi pengguna baru.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsPinModalOpen(true)}
                                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <KeyRound className="w-4 h-4" />
                                    <span>Ubah Master PIN Gate</span>
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-2">
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Otoritas perubahan Master PIN hanya dimiliki oleh role <strong className="text-amber-400">OWNER</strong> dan <strong className="text-emerald-400">DEVELOPER</strong>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: FORM UBAH PASSWORD ACCOUNT */}
                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
                        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Ubah Password Login</h3>
                                <p className="text-xs text-slate-400">Perbarui kata sandi untuk mengamankan akun Anda secara berkala.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">

                            {passSuccessMsg && (
                                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>{passSuccessMsg}</span>
                                </div>
                            )}
                            {passErrorMsg && (
                                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                    <span>{passErrorMsg}</span>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                                    Password Saat Ini *
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={passData.oldPassword}
                                    onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                                    placeholder="Masukkan password lama"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                                        Password Baru *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={passData.newPassword}
                                        onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
                                        Konfirmasi Password Baru *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={passData.confirmPassword}
                                        onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                        placeholder="Ulangi password baru"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loadingPass}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                                >
                                    {loadingPass ? 'Menyimpan...' : 'Simpan Password Baru'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* INFORMASI KEAMANAN TAMBAHAN */}
                    <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h5 className="text-xs font-bold text-white">Panduan Keamanan ERP</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Password dan PIN Gate digunakan secara langsung oleh enkripsi sistem JWT. Jangan bagikan PIN Master kepada pihak yang tidak berwenang untuk menjaga integritas data produksi dan finansial pabrik.
                            </p>
                        </div>
                    </div>

                </div>

            </div>

            {/* MODAL MASTER PIN GATE */}
            <UpdatePinModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                activeUser={activeUser}
            />

        </div>
    );
};

export default SettingPage;