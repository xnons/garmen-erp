"use client";

import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Lock, X, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface UpdatePinModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeUser: any;
}

export const UpdatePinModal: React.FC<UpdatePinModalProps> = ({ isOpen, onClose, activeUser }) => {
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

    const userRole = activeUser?.role?.toUpperCase();
    const isAuthorized = ['OWNER', 'DEVELOPER'].includes(userRole);
    const isDev = userRole === 'DEVELOPER';

    // Handler Submit Ubah PIN
    const handleUpdatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        // Validasi Form
        if (newPin.length !== 4 || oldPin.length !== 4) {
            setErrorMsg('PIN harus terdiri dari 4 digit angka!');
            return;
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
            const API_BASE = 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('access_token') || '';

            const res = await fetch(`${API_BASE}/security/update-pin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_pin: oldPin,
                    new_pin: newPin
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || 'Gagal mengubah Master PIN');
            }

            setSuccessMsg(data.message || 'Master PIN Gate berhasil diperbarui!');
            setOldPin('');
            setNewPin('');
            setConfirmPin('');

            // Auto close modal setelah sukses
            setTimeout(() => {
                setSuccessMsg('');
                onClose();
            }, 2000);

        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-modal-pop">

                {/* HEADER MODAL */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Ubah Master PIN Gate</h3>
                            <p className="text-[10px] text-slate-400">Pengaturan Kunci Keamanan Sistem Utama</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* JIKA AKSES DITOLAK (BUKAN OWNER / DEV) */}
                {!isAuthorized ? (
                    <div className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Akses Dibatasi!</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Hanya akun ber-role <span className="text-amber-400 font-semibold">OWNER</span> atau{' '}
                            <span className="text-emerald-400 font-semibold">DEVELOPER</span> yang diizinkan untuk mengubah Master PIN Security Gate.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                        >
                            Mengerti
                        </button>
                    </div>
                ) : (
                    /* FORM UBAH PIN */
                    <form onSubmit={handleUpdatePin} className="p-6 space-y-4">

                        {/* NOTIFIKASI SUKSES / ERROR */}
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

                        {/* HINT KHUSUS DEVELOPER */}
                        {isDev && (
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-[11px] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span><strong>Dev Mode:</strong> Anda bisa menggunakan PIN universal <strong>6767</strong> sebagai PIN Lama.</span>
                            </div>
                        )}

                        {/* INPUT PIN LAMA */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> PIN Lama / PIN Saat Ini *
                            </label>
                            <input
                                type="password"
                                maxLength={4}
                                required
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="4 Digit PIN Lama"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white tracking-widest font-mono focus:outline-none focus:border-amber-500 transition-all"
                            />
                        </div>

                        {/* INPUT PIN BARU */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Master PIN Baru *
                            </label>
                            <input
                                type="password"
                                maxLength={4}
                                required
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="4 Digit PIN Baru"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white tracking-widest font-mono focus:outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* KONFIRMASI PIN BARU */}
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 block">
                                Konfirmasi Master PIN Baru *
                            </label>
                            <input
                                type="password"
                                maxLength={4}
                                required
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ulangi 4 Digit PIN Baru"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white tracking-widest font-mono focus:outline-none focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* BUTTON ACTION */}
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
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
                            >
                                {loading ? 'Menyimpan...' : 'Perbarui Master PIN'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};