"use client";

import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Lock, X, CheckCircle2, ShieldAlert, Sparkles, Building2, Factory, Loader2 } from 'lucide-react';
import api from '../services/api'; // 🟢 Menggunakan instance Axios terpusat untuk menghindari error CORS

interface UpdatePinModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeUser: any;
    initialTab?: 'master' | 'qc';
}

export const UpdatePinModal: React.FC<UpdatePinModalProps> = ({
    isOpen,
    onClose,
    activeUser,
    initialTab = 'master'
}) => {
    // State Tab Active: 'master' (Owner/System) atau 'qc' (Produksi)
    const [activeTab, setActiveTab] = useState<'master' | 'qc'>(initialTab);

    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

    const userRole = activeUser?.role?.toUpperCase() || '';
    const isDev = userRole === 'DEVELOPER';

    // Hak Akses Spesifik per Tab
    const isMasterAuthorized = ['OWNER', 'DEVELOPER'].includes(userRole);
    const isQCAuthorized = ['OWNER', 'DEVELOPER', 'ADMIN', 'PRODUKSI'].includes(userRole);

    const isCurrentTabAuthorized = activeTab === 'master' ? isMasterAuthorized : isQCAuthorized;

    // Reset Form saat berpindah Tab
    const handleSwitchTab = (tab: 'master' | 'qc') => {
        setActiveTab(tab);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setErrorMsg('');
        setSuccessMsg('');
    };

    // Handler Submit Ubah PIN (Berjalan via Axios `api`)
    const handleUpdatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        // Validasi Digit Angka berdasarkan Tab
        if (activeTab === 'master') {
            if (oldPin.length !== 4 || newPin.length !== 4) {
                setErrorMsg('Master PIN Gate harus 4 digit angka!');
                return;
            }
        } else {
            if (oldPin.length < 4 || newPin.length < 4) {
                setErrorMsg('PIN Otorisasi QC minimal 4-6 digit angka!');
                return;
            }
        }

        if (newPin !== confirmPin) {
            setErrorMsg('Konfirmasi PIN baru tidak cocok!');
            return;
        }

        if (oldPin === newPin) {
            setErrorMsg('PIN baru tidak boleh sama dengan PIN lama!');
            return;
        }

        setLoading(true);

        try {
            // Penentuan Endpoint Dinamis sesuai Tab
            const endpoint = activeTab === 'master'
                ? '/api/security/update-pin'
                : '/api/produksi/pin-qc/update';

            // 🟢 Mengirim request via instance Axios `api`
            const res = await api.put(endpoint, {
                old_pin: oldPin,
                new_pin: newPin
            });

            const successText = res.data?.message || (
                activeTab === 'master'
                    ? 'Master System PIN berhasil diperbarui!'
                    : 'PIN Otorisasi QC Produksi berhasil diperbarui!'
            );

            setSuccessMsg(successText);
            setOldPin('');
            setNewPin('');
            setConfirmPin('');

            // Auto close modal setelah sukses
            setTimeout(() => {
                setSuccessMsg('');
                onClose();
            }, 1800);

        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : (err.message || 'Terjadi kesalahan sistem.');
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">

                {/* HEADER MODAL & TAB SELECTOR */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/50 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl border ${activeTab === 'master'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                }`}>
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Pengaturan Security PIN</h3>
                                <p className="text-[10px] text-slate-400">Otorisasi Kunci Akses & QC System</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* TAB NAVIGATOR (MASTER SYSTEM vs QC PRODUKSI) */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleSwitchTab('master')}
                            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'master'
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Master PIN (Owner)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSwitchTab('qc')}
                            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'qc'
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Factory className="w-3.5 h-3.5" />
                            <span>PIN QC (Produksi)</span>
                        </button>
                    </div>
                </div>

                {/* IF UNAUTHORIZED ROLE */}
                {!isCurrentTabAuthorized ? (
                    <div className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Akses Dibatasi!</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {activeTab === 'master' ? (
                                <>Hanya role <span className="text-amber-400 font-semibold">OWNER</span> / <span className="text-emerald-400 font-semibold">DEVELOPER</span> yang dapat mengubah Master PIN Gate Sistem.</>
                            ) : (
                                <>Anda tidak memiliki hak akses untuk mengubah PIN Otorisasi QC Produksi.</>
                            )}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                        >
                            Mengerti
                        </button>
                    </div>
                ) : (
                    /* FORM INPUT */
                    <form onSubmit={handleUpdatePin} className="p-6 space-y-4">

                        {/* FEEDBACK ALERTS */}
                        {successMsg && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2.5">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}
                        {errorMsg && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2.5">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* DEV BYPASS HINT */}
                        {isDev && (
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-[11px] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span><strong>Dev Mode:</strong> Anda bisa menggunakan PIN universal <strong>6767</strong> sebagai PIN Lama.</span>
                            </div>
                        )}

                        {/* INPUT PIN LAMA */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <KeyRound className={`w-3.5 h-3.5 ${activeTab === 'master' ? 'text-amber-400' : 'text-emerald-400'}`} />
                                {activeTab === 'master' ? 'Master PIN Lama (Default: 1234) *' : 'PIN QC Lama (Default: 123456) *'}
                            </label>
                            <input
                                type="password"
                                maxLength={activeTab === 'master' ? 4 : 6}
                                required
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                                placeholder={activeTab === 'master' ? '4 Digit PIN Lama' : 'PIN QC Saat Ini'}
                                className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white font-mono focus:outline-none transition-all ${activeTab === 'master' ? 'focus:border-amber-500' : 'focus:border-emerald-500'
                                    }`}
                            />
                        </div>

                        {/* INPUT PIN BARU */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                {activeTab === 'master' ? 'Master PIN Baru (4 Digit) *' : 'PIN QC Baru (4-6 Digit) *'}
                            </label>
                            <input
                                type="password"
                                maxLength={activeTab === 'master' ? 4 : 6}
                                required
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="PIN Baru"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* KONFIRMASI PIN BARU */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 block">
                                Konfirmasi PIN Baru *
                            </label>
                            <input
                                type="password"
                                maxLength={activeTab === 'master' ? 4 : 6}
                                required
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ulangi PIN Baru"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* BUTTON ACTIONS */}
                        <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-5 py-2 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 ${activeTab === 'master'
                                    ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                                    : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                                    }`}
                            >
                                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {loading ? 'Menyimpan...' : activeTab === 'master' ? 'Perbarui Master PIN' : 'Perbarui PIN QC'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};