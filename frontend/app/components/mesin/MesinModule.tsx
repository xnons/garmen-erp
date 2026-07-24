"use client";

import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, AlertTriangle, Plus, Search, Filter, Cpu, User } from 'lucide-react';

interface MesinItem {
    id: number;
    kode_mesin: string;
    nama_mesin: string;
    kategori: string;
    merk_tipe?: string;
    lokasi_line: string;
    status: 'OPERASIONAL' | 'MAINTENANCE' | 'RUSAK';
    operator_id?: string;
    nama_operator?: string;
    keterangan?: string;
}

export default function MesinModule({ activeUser }: { activeUser: any }) {
    const [mesinList, setMesinList] = useState<MesinItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nama_mesin: '',
        kategori: 'JAHIT',
        merk_tipe: '',
        lokasi_line: 'Line 1',
        status: 'OPERASIONAL',
        keterangan: ''
    });

    const fetchMesinData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token') || '';
            const res = await fetch('http://127.0.0.1:8000/api/mesin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMesinList(data);
            }
        } catch (e) {
            console.error('Gagal mengambil data mesin', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMesinData();
    }, []);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token') || '';
            const res = await fetch('http://127.0.0.1:8000/api/mesin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowAddModal(false);
                setFormData({
                    nama_mesin: '',
                    kategori: 'JAHIT',
                    merk_tipe: '',
                    lokasi_line: 'Line 1',
                    status: 'OPERASIONAL',
                    keterangan: ''
                });
                fetchMesinData();
            }
        } catch (e) {
            alert('Gagal menambah mesin baru');
        }
    };

    // Quick Status Update
    const handleStatusChange = async (kode_mesin: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('access_token') || '';
            await fetch(`http://127.0.0.1:8000/api/mesin/${kode_mesin}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            fetchMesinData();
        } catch (e) {
            console.error('Gagal memperbarui status');
        }
    };

    // Filtered List
    const filteredMesin = mesinList.filter((m) => {
        const matchesSearch =
            m.nama_mesin.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.kode_mesin.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.lokasi_line.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate Metrics
    const totalMesin = mesinList.length;
    const countOperasional = mesinList.filter((m) => m.status === 'OPERASIONAL').length;
    const countMaintenance = mesinList.filter((m) => m.status === 'MAINTENANCE').length;
    const countRusak = mesinList.filter((m) => m.status === 'RUSAK').length;

    return (
        <main className="flex-1 p-8 overflow-y-auto bg-slate-900 text-slate-100 space-y-6">

            {/* HEADER & ACTION */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        ⚙️ Inventaris & Status Mesin Pabrik
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Pantau kondisi kelayakan mesin jahit, obras, dan mesin potong di lantai produksi.
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Mesin Baru</span>
                </button>
            </div>

            {/* STATS SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Unit Mesin</p>
                        <h3 className="text-2xl font-black text-white mt-1 font-mono">{totalMesin} <span className="text-xs font-normal text-slate-500">Unit</span></h3>
                    </div>
                    <Cpu className="w-8 h-8 text-indigo-400/80" />
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Ready / Operasional</p>
                        <h3 className="text-2xl font-black text-emerald-400 mt-1 font-mono">{countOperasional} <span className="text-xs font-normal text-slate-500">Unit</span></h3>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/80" />
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Maintenance / Servis</p>
                        <h3 className="text-2xl font-black text-amber-400 mt-1 font-mono">{countMaintenance} <span className="text-xs font-normal text-slate-500">Unit</span></h3>
                    </div>
                    <Wrench className="w-8 h-8 text-amber-400/80" />
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-rose-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Kondisi Rusak / Down</p>
                        <h3 className="text-2xl font-black text-rose-400 mt-1 font-mono">{countRusak} <span className="text-xs font-normal text-slate-500">Unit</span></h3>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-rose-400/80" />
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950 p-4 rounded-2xl border border-white/5">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Cari Kode, Nama Mesin, atau Line..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                    {['ALL', 'OPERASIONAL', 'MAINTENANCE', 'RUSAK'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${statusFilter === st
                                ? 'bg-emerald-500 text-slate-950 shadow-md'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                                }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABEL DATA MESIN */}
            <div className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider bg-slate-900/50">
                                <th className="p-4 font-bold">Kode Unit</th>
                                <th className="p-4 font-bold">Nama Mesin & Merk</th>
                                <th className="p-4 font-bold">Kategori</th>
                                <th className="p-4 font-bold">Lokasi Line</th>
                                <th className="p-4 font-bold">Operator PJ</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-center">Ubah Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                                        Memuat data inventaris mesin...
                                    </td>
                                </tr>
                            ) : filteredMesin.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                                        Tidak ada unit mesin yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredMesin.map((mesin) => (
                                    <tr key={mesin.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-mono font-bold text-emerald-400">{mesin.kode_mesin}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-white">{mesin.nama_mesin}</p>
                                            <p className="text-[10px] text-slate-500">{mesin.merk_tipe || '-'}</p>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-400">{mesin.kategori}</td>
                                        <td className="p-4 font-mono">{mesin.lokasi_line}</td>
                                        <td className="p-4">
                                            {mesin.nama_operator ? (
                                                <span className="flex items-center gap-1.5 text-slate-300">
                                                    <User className="w-3 h-3 text-indigo-400" />
                                                    {mesin.nama_operator}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 italic">Belum Ada</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {mesin.status === 'OPERASIONAL' && (
                                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[10px]">
                                                    🟢 OPERASIONAL
                                                </span>
                                            )}
                                            {mesin.status === 'MAINTENANCE' && (
                                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold text-[10px]">
                                                    🟡 MAINTENANCE
                                                </span>
                                            )}
                                            {mesin.status === 'RUSAK' && (
                                                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-bold text-[10px]">
                                                    🔴 RUSAK
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <select
                                                value={mesin.status}
                                                onChange={(e) => handleStatusChange(mesin.kode_mesin, e.target.value)}
                                                className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500"
                                            >
                                                <option value="OPERASIONAL">Set READY</option>
                                                <option value="MAINTENANCE">Set SERVIS</option>
                                                <option value="RUSAK">Set RUSAK</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL TAMBAH MESIN BARU */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-950 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-white">Tambah Unit Mesin Baru</h3>

                        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-400 mb-1">Nama Mesin</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Mesin Obras 4 Benang"
                                    value={formData.nama_mesin}
                                    onChange={(e) => setFormData({ ...formData, nama_mesin: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1">Kategori</label>
                                    <select
                                        value={formData.kategori}
                                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="JAHIT">JAHIT</option>
                                        <option value="OBRAS">OBRAS</option>
                                        <option value="CUTTING">CUTTING</option>
                                        <option value="PRESS">PRESS</option>
                                        <option value="EMBROIDERY">EMBROIDERY</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Lokasi Line</label>
                                    <select
                                        value={formData.lokasi_line}
                                        onChange={(e) => setFormData({ ...formData, lokasi_line: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="Line 1">Line 1</option>
                                        <option value="Line 2">Line 2</option>
                                        <option value="Line 3">Line 3</option>
                                        <option value="Cutting Room">Cutting Room</option>
                                        <option value="Finishing">Finishing Area</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Merk & Tipe (Opsional)</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Juki DDL-8700"
                                    value={formData.merk_tipe}
                                    onChange={(e) => setFormData({ ...formData, merk_tipe: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl font-bold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-bold"
                                >
                                    Simpan Unit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </main>
    );
}