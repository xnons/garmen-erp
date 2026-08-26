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
    PackageSearch,
    MapPin
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
    // 🟢 Safe IDR Formatter
    const formatIDR = (val: any) => {
        const num = Number(val);
        if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    // 🟢 Badge Status Operasional dengan Icon Modern
    const renderStatusBadge = (status: MachineStatus) => {
        const config: Record<MachineStatus, { bg: string; label: string; icon: React.ReactNode }> = {
            AKTIF: {
                bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                label: 'Aktif / Normal',
                icon: <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
            },
            MAINTENANCE: {
                bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                label: 'Maintenance',
                icon: <Wrench className="w-3 h-3 shrink-0 text-amber-400" />
            },
            PERLU_SERVIS: {
                bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
                label: 'Perlu Servis',
                icon: <AlertTriangle className="w-3 h-3 shrink-0 text-orange-400" />
            },
            RUSAK: {
                bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
                label: 'Rusak',
                icon: <XCircle className="w-3 h-3 shrink-0 text-rose-400" />
            },
            NON_AKTIF: {
                bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
                label: 'Non-Aktif',
                icon: <XCircle className="w-3 h-3 shrink-0 text-slate-400" />
            },
            ARCHIVED: {
                bg: 'bg-rose-950/40 border-rose-800/50 text-rose-400',
                label: 'Terarsip',
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
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>LUNAS</span>
                </span>
            );
        }
        return (
            <div className="space-y-0.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                    CICILAN
                </span>
                <p className="text-[11px] font-mono text-amber-400/90 font-semibold">
                    Sisa: {formatIDR(sisa)}
                </p>
            </div>
        );
    };

    return (
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="p-4">Mesin & Spesifikasi</th>
                            <th className="p-4">Lokasi & Line</th>
                            <th className="p-4">Vendor & Garansi</th>
                            <th className="p-4">Status Operasional</th>
                            <th className="p-4">Status Pembayaran</th>
                            <th className="p-4 text-right">Nilai Buku / HPP</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                        {machines.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-16">
                                    <div className="max-w-xs mx-auto text-center space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                                            <PackageSearch className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-300">
                                            Tidak ada data mesin
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Tidak ada mesin yang sesuai dengan kata kunci atau filter pencarian saat ini.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            machines.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-800/30 transition-colors group">
                                    {/* MESIN & SPESIFIKASI */}
                                    <td className="p-4">
                                        <div>
                                            <div className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm">
                                                {m.nama_mesin}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <span className="text-xs text-indigo-400 font-mono font-semibold">
                                                    {m.kode_mesin}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-medium">
                                                    {m.kategori || 'Mesin Jahit'}
                                                </span>
                                                {m.merk_model && (
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        • {m.merk_model}
                                                    </span>
                                                )}
                                            </div>
                                            {m.no_seri && (
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    SN: {m.no_seri}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* LOKASI LINE */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                            <span>{m.lokasi_line || 'Workshop'}</span>
                                        </div>
                                    </td>

                                    {/* VENDOR & GARANSI */}
                                    <td className="p-4">
                                        <div className="text-slate-200 text-xs font-semibold">{m.vendor_supplier || '-'}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            Garansi: {m.garansi_hingga ? new Date(m.garansi_hingga).toLocaleDateString('id-ID') : 'Tidak Ada'}
                                        </div>
                                    </td>

                                    {/* STATUS OPERASIONAL */}
                                    <td className="p-4">{renderStatusBadge(m.status)}</td>

                                    {/* STATUS PEMBAYARAN */}
                                    <td className="p-4">{renderPaymentBadge(m.status_pembayaran, m.sisa_pembayaran)}</td>

                                    {/* NILAI BUKU */}
                                    <td className="p-4 text-right font-mono">
                                        <div className="font-bold text-white text-xs">
                                            {formatIDR(m.nilai_buku_saat_ini || m.harga_beli)}
                                        </div>
                                        {m.depresiasi_per_bulan > 0 && (
                                            <div className="text-[10px] text-rose-400/80 mt-0.5">
                                                -{formatIDR(m.depresiasi_per_bulan)}/bln
                                            </div>
                                        )}
                                    </td>

                                    {/* AKSI OPERASI */}
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => onSelectDetail(m)}
                                                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 rounded-lg border border-slate-800 transition-all active:scale-95 cursor-pointer"
                                                title="Lihat Detail & Riwayat Mesin"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => onEdit(m)}
                                                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-800 transition-all active:scale-95 cursor-pointer"
                                                title="Edit Data Mesin"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>

                                            {m.status_pembayaran !== 'LUNAS' && m.status !== 'ARCHIVED' && (
                                                <button
                                                    onClick={() => onOpenPaymentModal(m)}
                                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
                                                    title="Catat Angsuran Pembayaran"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                </button>
                                            )}

                                            {m.status !== 'ARCHIVED' && (
                                                <button
                                                    onClick={() => onOpenArchiveModal(m)}
                                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-all active:scale-95 cursor-pointer"
                                                    title="Arsipkan / Buang Mesin"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}