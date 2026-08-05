"use client";

import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Lock, X, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import api from '../services/api'; // Pastikan path instance axios kamu sesuai

interface UpdatePinQCModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeUser?: any;
}

export const UpdatePinQCModal: React.FC<UpdatePinQCModalProps> = ({ isOpen, onClose, activeUser }) => {
    const [oldPin, setOldPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

    const userRole = activeUser?.role?.toUpperCase() || 'PRODUKSI';
    // Mandor, Admin, Owner, Dev boleh ubah PIN QC
    const isAuthorized = ['OWNER', 'DEVELOPER', 'ADMIN', 'PRODUKSI'].includes(userRole);
    const isDev = userRole === 'DEVELOPER';

    const handleUpdatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (newPin.length < 4 || oldPin.length < 4) {
            setErrorMsg('PIN harus terdiri dari minimal 4-6 digit angka!');
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
            // 🟢 Menembak Endpoint Khusus PIN QC Produksi
            const res = await api.put('/api/produksi/pin-qc/update', {
                old_pin: oldPin,
                new_pin: newPin
            });

            setSuccessMsg(res.data.message || 'PIN Otorisasi QC berhasil diperbarui!');
            setOldPin('');
            setNewPin('');
            setConfirmPin('');

            setTimeout(() => {
                setSuccessMsg('');
                onClose();
            }, 1800);

        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || 'Gagal mengubah PIN Otorisasi QC';
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">

                {/* HEADER MODAL KHUSUS PRODUKSI */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Ubah PIN Otorisasi QC</h3>
                            <p className="text-[10px] text-slate-400">Kunci Keamanan Verifikasi Setoran Produksi</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!isAuthorized ? (
                    <div className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Akses Dibatasi!</h4>
                        <p className="text-xs text-slate-400">Anda tidak memiliki wewenang untuk mengubah PIN QC.</p>
                        <button type="button" onClick={onClose} className="mt-2 w-full py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
                            Mengerti
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePin} className="p-6 space-y-4">
                        {successMsg && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}
                        {errorMsg && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {isDev && (
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-[11px] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span><strong>Dev Mode:</strong> Gunakan PIN universal <strong>6767</strong> jika lupa PIN lama.</span>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> PIN QC Saat Ini (Default: 123456) *
                            </label>
                            <input
                                type="password"
                                maxLength={6}
                                required
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="PIN QC Lama"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white font-mono focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-emerald-400" /> PIN QC Baru *
                            </label>
                            <input
                                type="password"
                                maxLength={6}
                                required
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="4-6 Digit PIN Baru"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white font-mono focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1 block">
                                Konfirmasi PIN QC Baru *
                            </label>
                            <input
                                type="password"
                                maxLength={6}
                                required
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ulangi PIN QC Baru"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-center text-white font-mono focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {loading ? 'Menyimpan...' : 'Perbarui PIN QC'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};