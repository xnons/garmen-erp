import React from 'react';
import { Lock } from 'lucide-react';

interface LockedViewProps {
    title?: string;
    description?: string;
    onOpenPinModal: () => void;
}

export const LockedView: React.FC<LockedViewProps> = ({
    title = "Akses Terkunci",
    description = "Akses ke modul sensitif ini membutuhkan verifikasi PIN Security Gate 4-Digit setiap kali dibuka.",
    onOpenPinModal
}) => {
    return (
        <main className="flex-1 p-8 bg-slate-900 flex items-center justify-center text-slate-100 relative">
            <div className="text-center max-w-sm p-8 glass-panel rounded-3xl shadow-2xl animate-modal-pop border border-slate-800 relative z-10">
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-lock-pulse">
                    <Lock className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    {description}
                </p>

                <button
                    onClick={onOpenPinModal}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200"
                >
                    Masukkan PIN Keamanan
                </button>
            </div>
        </main>
    );
};

export default LockedView;