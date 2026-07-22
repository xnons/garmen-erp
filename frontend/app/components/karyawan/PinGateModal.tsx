import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, AlertCircle } from 'lucide-react';

interface PinGateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

export const PinGateModal: React.FC<PinGateModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = "Akses Terkunci",
    description = "Masukkan 4 Digit PIN Security Gate untuk mengakses menu ini."
}) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // 🔄 Reset state saat modal dibuka atau ditutup
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setErrorMsg('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // 🔐 Fungsi Utama Verifikasi PIN ke API Backend
    const verifyPinSubmit = async (pinToVerify: string) => {
        if (pinToVerify.length !== 4) {
            setErrorMsg('PIN harus terdiri dari 4 digit angka!');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/auth/verify-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                },
                body: JSON.stringify({ pin: pinToVerify })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'PIN yang Anda masukkan salah!');
            }

            // Verifikasi Berhasil
            setPin('');
            setErrorMsg('');
            onSuccess();
        } catch (err: any) {
            setErrorMsg(err.message || 'Verifikasi PIN gagal');
            setPin(''); // Reset input PIN jika salah agar siap diketik ulang
        } finally {
            setLoading(false);
        }
    };

    // Handler Submit via Tombol / Form Enter
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!loading && pin.length === 4) {
            verifyPinSubmit(pin);
        }
    };

    // Handler Input PIN + Auto Trigger Verifikasi pada Digit Ke-4
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, ''); // Filter hanya angka
        if (val.length <= 4) {
            setPin(val);
            if (errorMsg) setErrorMsg(''); // Hapus pesan error saat pengguna mengetik ulang

            // ⚡ Auto-submit jika sudah terisi 4 digit
            if (val.length === 4) {
                verifyPinSubmit(val);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all">

            {/* Container Card dengan Animasi Dynamic (Pop-Up & Shake saat Error) */}
            <div
                className={`w-full max-w-sm bg-slate-900/90 border rounded-3xl p-6 shadow-2xl relative animate-modal-pop backdrop-blur-xl transition-all duration-200 ${errorMsg ? 'animate-shake border-rose-500/50 shadow-rose-950/50' : 'border-slate-800 shadow-indigo-950/20'
                    }`}
            >

                {/* Tombol Close / Batal */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition-all hover:bg-slate-800/50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Modal */}
                <div className="flex flex-col items-center text-center space-y-2 mt-2">
                    <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shadow-inner animate-indigo-pulse">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mt-2 tracking-tight">{title}</h3>
                    <p className="text-xs text-slate-400 px-2 leading-relaxed">{description}</p>
                </div>

                {/* Form Entry PIN */}
                <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
                    <div>
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            autoFocus
                            disabled={loading}
                            onChange={handleInputChange}
                            placeholder="••••"
                            className="w-full text-center text-3xl font-bold tracking-[1em] py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-indigo-400 font-mono pin-input-glow focus:outline-none focus:border-indigo-500 transition-all placeholder:tracking-widest disabled:opacity-50"
                        />
                    </div>

                    {/* Pesan Error Alert */}
                    {errorMsg && (
                        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-slate-300 font-semibold text-xs rounded-xl transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || pin.length !== 4}
                            className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:active:scale-100 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                        >
                            <KeyRound className="w-4 h-4" />
                            <span>{loading ? 'Memeriksa...' : 'Buka Akses'}</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default PinGateModal;