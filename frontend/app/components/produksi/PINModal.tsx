"use client";

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Lock, X, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface PINModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
    onClose: () => void;
    onConfirm: (pin: string) => Promise<void>;
}

export default function PINModal({
    isOpen,
    title = "Otorisasi PIN Keamanan",
    description = "Masukkan 6-Digit PIN Supervisor / Owner untuk melanjutkan aksi sensitif ini.",
    onClose,
    onConfirm
}: PINModalProps) {
    const [pin, setPin] = useState<string[]>(Array(6).fill(''));
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setPin(Array(6).fill(''));
            setErrorMsg('');
            setSubmitting(false);
            // Auto focus ke box PIN pertama saat modal terbuka
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (index: number, value: string) => {
        // Hanya terima digit angka
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1); // Ambil karakter terakhir
        setPin(newPin);
        setErrorMsg('');

        // Auto move focus ke kotak berikutnya
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setPin(digits);
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const fullPin = pin.join('');
        if (fullPin.length !== 6) {
            setErrorMsg("PIN wajib terdiri dari 6 angka digit lengkap!");
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            await onConfirm(fullPin);
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data?.detail;
            setErrorMsg(
                typeof backendError === 'string'
                    ? backendError
                    : "PIN Keamanan / Master PIN tidak valid!"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-slate-100 relative">
                {/* Header Modal */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                            <Lock className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">{title}</h3>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Alert */}
                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">{errorMsg}</span>
                    </div>
                )}

                {/* Form PIN Input (6 Boxes) */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2 sm:gap-3">
                        {pin.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => { inputRefs.current[idx] = el; }}
                                type="password"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                onPaste={handlePaste}
                                disabled={submitting}
                                className="w-10 h-12 sm:w-12 sm:h-14 bg-slate-950 border border-slate-800 text-center text-lg font-mono font-bold text-emerald-400 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all disabled:opacity-50"
                            />
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-800 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || pin.join('').length !== 6}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Memverifikasi PIN...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                                    <span>Verifikasi Otorisasi</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}