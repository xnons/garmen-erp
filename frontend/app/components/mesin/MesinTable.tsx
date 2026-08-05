'use client';

import React from 'react';
import {
    Eye,
    Pencil,
    CreditCard,
    Archive,
    CheckCircle2,
    Wrench,
    AlertTriangle,
    XCircle,
    ShieldAlert,
    PackageSearch
} from 'lucide-react';
import { MesinAsset, MachineStatus, PaymentStatus } from './types';

interface MesinTableProps {
    machines: MesinAsset[];
    onSelectDetail: (m: MesinAsset) => void;
    onEdit: (m: MesinAsset) => void;
    onOpenPaymentModal: (m: MesinAsset) => void;
    onOpenArchiveModal: (m: MesinAsset) => void;
}

export default function MesinTable({
    machines,
    onSelectDetail,
    onEdit,
    onOpenPaymentModal,
    onOpenArchiveModal,
}: MesinTableProps) {
    // 🟢 Safe IDR Formatter untuk mencegah error 'RpNaN'
    const formatIDR = (val: any) => {
        const num = Number(val);
        if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    // 🟢 Badge Status Operasional dengan Icon Modern Lucide
    const renderStatusBadge = (status: MachineStatus) => {
        const config: Record<MachineStatus, { bg: string; label: string; icon: React.ReactNode }> = {
            AKTIF: {
                bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                label: 'Aktif',
                icon: <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
            },
            MAINTENANCE: {
                bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                label: 'Maintenance',
                icon: <Wrench className="w-3 h-3 shrink-0 text-amber-400" />
            },
            PERLU_SERVIS: {
                bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
                label: 'Perlu Servis',
                icon: <AlertTriangle className="w-3 h-3 shrink-0 text-orange-400" />
            },
            RUSAK: {
                bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
                label: 'Rusak',
                icon: <XCircle className="w-3 h-3 shrink-0 text-rose-400" />
            },
            NON_AKTIF: {
                bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
                label: 'Non-Aktif',
                icon: <XCircle className="w-3 h-3 shrink-0 text-slate-400" />
            },
            ARCHIVED: {
                bg: 'bg-rose-950/40 border-rose-800/50 text-rose-400',
                label: 'Terarsip / Buang',
                icon: <ShieldAlert className="w-3 h-3 shrink-0 text-rose-400" />
            },
        };

        const c = config[status] || config.NON_AKTIF;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg}`}>
                {c.icon}
                <span>{c.label}</span>
            </span>
        );
    };

    // 🟢 Badge Status Pembayaran
    const renderPaymentBadge = (status: PaymentStatus, sisa: number) => {
        if (status === 'LUNAS') {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    Lunas
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 font-mono">
                Sisa {formatIDR(sisa)}
            </span>
        );
    };

    if (machines.length === 0) {
        return (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400">
                    <PackageSearch className="w-8 h-8 opacity-60" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Tidak ada data mesin yang cocok dengan kriteria pencarian.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                        <th className="px-5 py-4">Mesin & Perangkat</th>
                        <th className="px-4 py-4">Vendor & Garansi</th>
                        <th className="px-4 py-4">Status Operasional</th>
                        <th className="px-4 py-4">Status Pembayaran</th>
                        <th className="px-4 py-4 text-right">Nilai Buku</th>
                        <th className="px-5 py-4 text-center">Aksi Operasi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                    {machines.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors group">
                            {/* MESIN & PERANGKAT */}
                            <td className="px-5 py-4">
                                <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    {m.nama_mesin}
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                    {m.kode_mesin} • {m.merk_model}
                                </div>
                                {m.no_seri && (
                                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                        SN: {m.no_seri}
                                    </div>
                                )}
                            </td>

                            {/* VENDOR & GARANSI */}
                            <td className="px-4 py-4">
                                <div className="text-slate-300 text-xs font-medium">{m.vendor_supplier || '-'}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    Garansi: {m.garansi_hingga ? new Date(m.garansi_hingga).toLocaleDateString('id-ID') : 'Tidak Ada'}
                                </div>
                            </td>

                            {/* STATUS OPERASIONAL */}
                            <td className="px-4 py-4">{renderStatusBadge(m.status)}</td>

                            {/* STATUS PEMBAYARAN */}
                            <td className="px-4 py-4">{renderPaymentBadge(m.status_pembayaran, m.sisa_pembayaran)}</td>

                            {/* NILAI BUKU */}
                            <td className="px-4 py-4 text-right font-mono">
                                <div className="font-semibold text-slate-200">{formatIDR(m.nilai_buku_saat_ini)}</div>
                                <div className="text-[10px] text-rose-400/80 mt-0.5">
                                    -{formatIDR(m.depresiasi_per_bulan)}/bln
                                </div>
                            </td>

                            {/* AKSI OPERASI (PRO-ICONS) */}
                            <td className="px-5 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <button
                                        onClick={() => onSelectDetail(m)}
                                        className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 rounded-xl transition-all"
                                        title="Lihat Detail & Riwayat"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onEdit(m)}
                                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 rounded-xl transition-all"
                                        title="Edit Spesifikasi"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>

                                    {m.status_pembayaran !== 'LUNAS' && m.status !== 'ARCHIVED' && (
                                        <button
                                            onClick={() => onOpenPaymentModal(m)}
                                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-xl transition-all"
                                            title="Catat Angsuran Pembayaran"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                        </button>
                                    )}

                                    {m.status !== 'ARCHIVED' && (
                                        <button
                                            onClick={() => onOpenArchiveModal(m)}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
                                            title="Arsipkan / Buang Mesin"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}