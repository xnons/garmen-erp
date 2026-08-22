'use client';

import React from 'react';
import { ArrowUpRight, Pencil, History, RotateCcw, Archive, Trash2 } from 'lucide-react';
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
    return (
        <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4">SKU & Item Material</th>
                            <th className="p-4">Supplier / Vendor</th>
                            <th className="p-4">Pembelian & PO</th>
                            <th className="p-4">Jumlah Stok</th>
                            <th className="p-4">Harga (HPP)</th>
                            <th className="p-4">Total Value</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                                    Tidak ada data material yang sesuai dengan kriteria filter.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const totalValue = item.stok_saat_ini * item.harga_per_satuan;

                                return (
                                    <tr key={item.id} className="hover:bg-slate-800/30 transition-all">
                                        {/* SKU & Nama */}
                                        <td className="p-4">
                                            <div>
                                                <p className="font-semibold text-white flex items-center gap-2">
                                                    {item.warna_kode && (
                                                        <span
                                                            className="w-3 h-3 rounded-full border border-slate-600 shrink-0"
                                                            style={{ backgroundColor: item.warna_kode }}
                                                        />
                                                    )}
                                                    {item.nama_item}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-indigo-400 font-mono">{item.kode_sku}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                                                        {item.kategori}
                                                    </span>
                                                    {item.nomor_lot_batch && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-amber-400/90 font-mono border border-amber-500/20">
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
                                        </td>

                                        {/* PO & Tanggal */}
                                        <td className="p-4 font-mono text-xs">
                                            <p className="text-slate-300">{item.tanggal_pembelian || '-'}</p>
                                            {item.nomor_nota_po && (
                                                <p className="text-[10px] text-amber-400/90 mt-0.5">{item.nomor_nota_po}</p>
                                            )}
                                        </td>

                                        {/* Jumlah Stok */}
                                        <td className="p-4">
                                            <div>
                                                <span className="font-mono font-bold text-white text-base">
                                                    {item.stok_saat_ini.toLocaleString('id-ID')}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1 font-semibold">{item.satuan}</span>
                                                <p className="text-[10px] text-slate-500">Min: {item.stok_minimum} {item.satuan}</p>
                                            </div>
                                        </td>

                                        {/* HPP */}
                                        <td className="p-4 font-mono text-xs text-slate-300">
                                            Rp {item.harga_per_satuan.toLocaleString('id-ID')}
                                        </td>

                                        {/* Total Value */}
                                        <td className="p-4 font-mono font-semibold text-emerald-400 text-xs">
                                            Rp {totalValue.toLocaleString('id-ID')}
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            {item.is_archived ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                    <Archive className="w-3 h-3" />
                                                    <span>TERARSIP</span>
                                                </span>
                                            ) : item.stok_saat_ini === 0 ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                    HABIS
                                                </span>
                                            ) : item.stok_saat_ini <= item.stok_minimum ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                                    REORDER
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    AMAN
                                                </span>
                                            )}
                                        </td>

                                        {/* Tombol Aksi */}
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => onOpenMutasi(item)}
                                                    title="Mutasi Stok (In/Out)"
                                                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                                                >
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                    <span>Mutasi</span>
                                                </button>

                                                <button
                                                    onClick={() => onOpenEdit(item)}
                                                    title="Edit Master Data"
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all active:scale-95"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => onOpenLog ? onOpenLog(item) : alert(`Riwayat Transaksi: ${item.nama_item}`)}
                                                    title="Log Mutasi"
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all active:scale-95"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => onToggleArchive(item)}
                                                    title={item.is_archived ? "Restore dari Arsip" : "Arsipkan Material"}
                                                    className={`p-1.5 rounded-lg border transition-all active:scale-95 ${item.is_archived
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                                        }`}
                                                >
                                                    {item.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                                </button>

                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    title="Hapus Permanen"
                                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition-all active:scale-95"
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