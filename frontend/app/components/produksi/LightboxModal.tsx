"use client";

import React from 'react';
import { X, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface LightboxModalProps {
    isOpen: boolean;
    imageUrl?: string | null;
    title?: string;
    caption?: string;
    onClose: () => void;
}

export default function LightboxModal({
    isOpen,
    imageUrl,
    title = "Dokumen Bukti Foto Physical",
    caption,
    onClose
}: LightboxModalProps) {
    if (!isOpen || !imageUrl) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">{title}</h3>
                            {caption && <p className="text-xs text-slate-400 line-clamp-1">{caption}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                            title="Buka Ukuran Asli di Tab Baru"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Gambar View Container */}
                <div className="p-4 flex items-center justify-center bg-slate-950 overflow-auto flex-1 min-h-[300px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={title}
                        className="max-h-[65vh] w-auto object-contain rounded-xl border border-slate-800 shadow-xl"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400/0f172a/94a3b8?text=Foto+Gagal+Dimuat";
                        }}
                    />
                </div>

                {/* Footer Caption */}
                {caption && (
                    <div className="p-3.5 border-t border-slate-800 bg-slate-900 text-xs text-slate-300 font-medium">
                        <span className="font-bold text-emerald-400">Catatan/Keterangan:</span> {caption}
                    </div>
                )}
            </div>
        </div>
    );
}