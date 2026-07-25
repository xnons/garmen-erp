'use client';

import React from 'react';
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
    const formatIDR = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const renderStatusBadge = (status: MachineStatus) => {
        const config: Record<MachineStatus, { bg: string; label: string }> = {
            AKTIF: { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Aktif' },
            MAINTENANCE: { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'Maintenance' },
            PERLU_SERVIS: { bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400', label: 'Perlu Servis' },
            RUSAK: { bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', label: 'Rusak' },
            NON_AKTIF: { bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400', label: 'Non-Aktif' },
            ARCHIVED: { bg: 'bg-rose-950/40 border-rose-800/50 text-rose-400', label: 'Terarsip / Buang' },
        };
        const c = config[status] || config.NON_AKTIF;
        return (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg}`}>
                {c.label}
            </span>
        );
    };

    const renderPaymentBadge = (status: PaymentStatus, sisa: number) => {
        if (status === 'LUNAS') {
            return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Lunas</span>;
        }
        return (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                Sisa {formatIDR(sisa)}
            </span>
        );
    };

    if (machines.length === 0) {
        return (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
                <p className="text-slate-400 text-sm">Tidak ada data mesin yang cocok dengan kriteria pencarian.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                        <th className="px-4 py-4">Mesin & Perangkat</th>
                        <th className="px-4 py-4">Vendor & Garansi</th>
                        <th className="px-4 py-4">Status Operasional</th>
                        <th className="px-4 py-4">Status Pembayaran</th>
                        <th className="px-4 py-4 text-right">Nilai Buku</th>
                        <th className="px-4 py-4 text-center">Aksi Operasi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {machines.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="px-4 py-4">
                                <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">{m.nama_mesin}</div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                    {m.kode_mesin} • {m.merk_model}
                                </div>
                                {m.no_seri && <div className="text-[10px] text-slate-600 font-mono">SN: {m.no_seri}</div>}
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-slate-300 text-xs font-medium">{m.vendor_supplier || '-'}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    Garansi: {m.garansi_hingga ? new Date(m.garansi_hingga).toLocaleDateString('id-ID') : 'Tidak Ada'}
                                </div>
                            </td>
                            <td className="px-4 py-4">{renderStatusBadge(m.status)}</td>
                            <td className="px-4 py-4">{renderPaymentBadge(m.status_pembayaran, m.sisa_pembayaran)}</td>
                            <td className="px-4 py-4 text-right">
                                <div className="font-semibold text-slate-200">{formatIDR(m.nilai_buku_saat_ini)}</div>
                                <div className="text-[10px] text-rose-400/80 mt-0.5">-{formatIDR(m.depresiasi_per_bulan)}/bln</div>
                            </td>
                            <td className="px-4 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <button
                                        onClick={() => onSelectDetail(m)}
                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                                        title="Lihat Detail & Riwayat"
                                    >
                                        🔍
                                    </button>
                                    <button
                                        onClick={() => onEdit(m)}
                                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                                        title="Edit Spesifikasi"
                                    >
                                        ✏️
                                    </button>

                                    {m.status_pembayaran !== 'LUNAS' && m.status !== 'ARCHIVED' && (
                                        <button
                                            onClick={() => onOpenPaymentModal(m)}
                                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all"
                                            title="Catat Angsuran Pembayaran"
                                        >
                                            💳
                                        </button>
                                    )}

                                    {m.status !== 'ARCHIVED' && (
                                        <button
                                            onClick={() => onOpenArchiveModal(m)}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                            title="Arsipkan / Buang Mesin"
                                        >
                                            📦
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