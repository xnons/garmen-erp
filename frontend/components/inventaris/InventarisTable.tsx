'use client';

import React from 'react';
import { ArrowUpRight, Pencil, History, RotateCcw, Archive, Trash2, PackageSearch, AlertCircle, CheckCircle2, PackageX } from 'lucide-react';
import { ItemBahanBaku } from './types';

interface InventarisTableProps {
    items: ItemBahanBaku[];
    onOpenMutasi: (item: ItemBahanBaku) => void;
    onOpenEdit: (item: ItemBahanBaku) => void;
    onToggleArchive: (item: ItemBahanBaku) => void;
    onDelete: (id: string) => void;
    onOpenLog?: (item: ItemBahanBaku) => void;
}

export default function InventarisTable({
    items,
    onOpenMutasi,
    onOpenEdit,
    onToggleArchive,
    onDelete,
    onOpenLog
}: InventarisTableProps) {
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px] tracking-wider">
                        <tr>
                            <th className="p-4">SKU & Item Material</th>
                            <th className="p-4">Supplier / Vendor</th>
                            <th className="p-4">Pembelian & PO</th>
                            <th className="p-4">Kondisi Stok</th>
                            <th className="p-4">Harga Satuan (HPP)</th>
                            <th className="p-4">Total Nilai Stok</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-16">
                                    <div className="max-w-xs mx-auto text-center space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                                            <PackageSearch className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-300">
                                            Tidak ada data material
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Tidak ada bahan baku yang cocok dengan kata kunci atau filter yang dipilih.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const totalValue = (item.stok_saat_ini || 0) * (item.harga_per_satuan || 0);
                                const isMenipis = !item.is_archived && item.stok_saat_ini <= item.stok_minimum && item.stok_saat_ini > 0;
                                const isHabis = !item.is_archived && item.stok_saat_ini === 0;

                                return (
                                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                        {/* SKU & Nama */}
                                        <td className="p-4">
                                            <div>
                                                <p className="font-bold text-white flex items-center gap-2 text-sm">
                                                    {item.warna_kode && (
                                                        <span
                                                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                                                            style={{ backgroundColor: item.warna_kode }}
                                                            title={`Warna: ${item.warna_kode}`}
                                                        />
                                                    )}
                                                    {item.nama_item}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className="text-xs text-indigo-400 font-mono font-semibold">
                                                        {item.kode_sku}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-medium">
                                                        {item.kategori}
                                                    </span>
                                                    {item.nomor_lot_batch && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                                                            Lot: {item.nomor_lot_batch}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Vendor */}
                                        <td className="p-4">
                                            <p className="text-xs font-semibold text-slate-200">{item.supplier_utama || '-'}</p>
                                            {item.nomor_vendor && (
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.nomor_vendor}</p>
                                            )}
                                            {item.lokasi_gudang && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">📍 {item.lokasi_gudang}</p>
                                            )}
                                        </td>

                                        {/* PO & Tanggal */}
                                        <td className="p-4 font-mono text-xs">
                                            <p className="text-slate-300">{item.tanggal_pembelian || '-'}</p>
                                            {item.nomor_nota_po && (
                                                <p className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                                                    PO: {item.nomor_nota_po}
                                                </p>
                                            )}
                                        </td>

                                        {/* Jumlah Stok & Progress Mini */}
                                        <td className="p-4">
                                            <div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className={`font-mono font-extrabold text-base ${isHabis ? 'text-rose-400' : isMenipis ? 'text-amber-400' : 'text-white'}`}>
                                                        {item.stok_saat_ini.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">{item.satuan}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                                    <span>Min: {item.stok_minimum} {item.satuan}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* HPP */}
                                        <td className="p-4 font-mono text-xs text-slate-300">
                                            {formatIDR(item.harga_per_satuan)}
                                        </td>

                                        {/* Total Value */}
                                        <td className="p-4 font-mono font-bold text-emerald-400 text-xs">
                                            {formatIDR(totalValue)}
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            {item.is_archived ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                                                    <Archive className="w-3 h-3" />
                                                    <span>TERARSIP</span>
                                                </span>
                                            ) : isHabis ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                                    <PackageX className="w-3 h-3" />
                                                    <span>HABIS</span>
                                                </span>
                                            ) : isMenipis ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span>REORDER</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>AMAN</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Tombol Aksi */}
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => onOpenMutasi(item)}
                                                    title="Catat Mutasi Stok (Masuk/Keluar)"
                                                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                    <span>Mutasi</span>
                                                </button>

                                                <button
                                                    onClick={() => onOpenEdit(item)}
                                                    title="Edit Data Bahan"
                                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => onOpenLog ? onOpenLog(item) : alert(`Riwayat Transaksi: ${item.nama_item}`)}
                                                    title="Log Transaksi Mutasi"
                                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => onToggleArchive(item)}
                                                    title={item.is_archived ? "Restore dari Arsip" : "Arsipkan Material"}
                                                    className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${item.is_archived
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-800'
                                                        }`}
                                                >
                                                    {item.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                                </button>

                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    title="Hapus Permanen"
                                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}