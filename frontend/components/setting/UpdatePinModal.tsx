"use client";

import React, { useState } from 'react';
import { Lock, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (newPin !== confirmPin) {
            setErrorMsg('Konfirmasi PIN baru tidak sesuai!');
            return;
        }

        if (newPin.length < 4 || newPin.length > 6) {
            setErrorMsg('PIN baru harus 4-6 digit angka.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/api/auth/change-pin', {
                old_pin: oldPin,
                new_pin: newPin
            });
            setSuccessMsg(res.data.message || 'PIN berhasil diubah!');
            setTimeout(() => {
                onClose();
                setOldPin('');
                setNewPin('');
                setConfirmPin('');
                setSuccessMsg('');
            }, 1500);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.detail || 'Gagal mengubah PIN.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-sm text-white">Ubah PIN Keamanan Gate</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="block text-slate-400 font-semibold mb-1">PIN Lama</label>
                        <input
                            type="password"
                            maxLength={6}
                            required
                            placeholder="••••"
                            value={oldPin}
                            onChange={(e) => setOldPin(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 font-semibold mb-1">PIN Baru (4-6 Digit)</label>
                        <input
                            type="password"
                            maxLength={6}
                            required
                            placeholder="••••"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 font-semibold mb-1">Konfirmasi PIN Baru</label>
                        <input
                            type="password"
                            maxLength={6}
                            required
                            placeholder="••••"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Simpan PIN
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdatePinModal;
