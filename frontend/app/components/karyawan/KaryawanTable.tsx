import React from 'react';
import { Calendar, Phone, Briefcase, DollarSign, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import { Karyawan } from './types';

interface KaryawanTableProps {
    loading: boolean;
    karyawanList: Karyawan[];
    onEdit: (karyawan: Karyawan) => void;
    onSanksi: (karyawan: Karyawan) => void;
    onDelete: (id: string, nama: string) => void;
}

export const KaryawanTable: React.FC<KaryawanTableProps> = ({
    loading,
    karyawanList,
    onEdit,
    onSanksi,
    onDelete,
}) => {
    return (
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                            <th className="p-4">Pekerja & ID</th>
                            <th className="p-4">Jabatan & Role</th>
                            <th className="p-4">Skema Gaji</th>
                            <th className="p-4">Sanksi</th>
                            <th className="p-4 text-center">Aksi Operasional</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">Memuat data karyawan...</td>
                            </tr>
                        ) : karyawanList.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data karyawan terdaftar.</td>
                            </tr>
                        ) : (
                            karyawanList.map((k) => (
                                <tr key={k.id_karyawan} className="hover:bg-slate-800/30 transition-all">
                                    {/* Profil Karyawan */}
                                    <td className="p-4">
                                        <div>
                                            <p className="font-semibold text-white">{k.nama}</p>
                                            <p className="text-xs text-indigo-400 font-mono mt-0.5">{k.id_karyawan} • @{k.username}</p>
                                            {k.tanggal_lahir && (
                                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" /> Tgl Lahir: {k.tanggal_lahir}
                                                </p>
                                            )}
                                            {k.no_hp && (
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Phone className="w-3 h-3" /> {k.no_hp}
                                                </p>
                                            )}
                                        </div>
                                    </td>

                                    {/* Jabatan & Role */}
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
                                                <Briefcase className="w-3 h-3 text-indigo-400" /> {k.jabatan || 'Operator'}
                                            </span>
                                            <div>
                                                <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    {k.role}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Skema Pay */}
                                    <td className="p-4">
                                        <div className="text-xs">
                                            <p className="font-semibold text-slate-200 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3 text-emerald-400" /> {k.tipe_pay}
                                            </p>
                                            {k.tipe_pay === 'BORONGAN' ? (
                                                <p className="text-slate-400 mt-0.5">Rp {k.tarif_borongan_pcs?.toLocaleString() || 0} / pcs</p>
                                            ) : (
                                                <p className="text-slate-400 mt-0.5">Rp {k.gaji_pokok?.toLocaleString() || 0} / bln</p>
                                            )}
                                        </div>
                                    </td>

                                    {/* Poin Sanksi */}
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${(k.poin_pelanggaran || 0) > 15
                                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                            : (k.poin_pelanggaran || 0) > 0
                                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {k.poin_pelanggaran || 0} Poin Sanksi
                                        </span>
                                    </td>

                                    {/* Action Buttons */}
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* ✏️ EDIT */}
                                            <button
                                                onClick={() => onEdit(k)}
                                                title="Edit Data & Gaji Karyawan"
                                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>

                                            {/* ⚠️ SANKSI */}
                                            <button
                                                onClick={() => onSanksi(k)}
                                                title="Kelola & Catat Sanksi"
                                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span>Sanksi</span>
                                            </button>

                                            {/* 🗑️ HAPUS */}
                                            <button
                                                onClick={() => onDelete(k.id_karyawan, k.nama)}
                                                title="Hapus Karyawan"
                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
};