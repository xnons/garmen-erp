"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    ShieldAlert,
    CheckCircle,
    XCircle,
    RefreshCw,
    Loader2,
    Laptop,
    Smartphone,
    MapPin,
    Search,
    Shield,
    AlertTriangle,
    Clock,
    Lock
} from 'lucide-react';
import api from '../services/api';

interface LoginLog {
    id: number;
    username: string;
    karyawan_id: string;
    timestamp: string;
    status: string;
    ip_address: string;
    device_info?: string;
    lokasi?: string;
    keterangan: string;
}

export default function TabAuditLog() {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await api.get('/api/audit/login-logs');
            setLogs(res.data || []);
        } catch (err: any) {
            console.error("Gagal memuat log login:", err);
            setErrorMsg(err.response?.data?.detail || 'Gagal mengambil data log dari server.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // KPI Metrics
    const totalLogs = logs.length;
    const totalSuccess = logs.filter(l => l.status === 'SUCCESS').length;
    const totalFailed = logs.filter(l => l.status === 'FAILED_PASSWORD').length;
    const totalBlockedHours = logs.filter(l => l.status === 'BLOCKED_OFF_HOURS').length;

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                (log.username && log.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.karyawan_id && log.karyawan_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.ip_address && log.ip_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.device_info && log.device_info.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.lokasi && log.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (log.keterangan && log.keterangan.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [logs, searchQuery, filterStatus]);

    return (
        <div className="space-y-6 text-slate-100">
            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Aktivitas Login */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                                Total Percobaan Login
                            </p>
                            <h4 className="text-2xl font-black text-white mt-1">
                                {totalLogs}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Aktivitas terekam sistem
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                            <Shield className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Login Sukses */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                Login Berhasil
                            </p>
                            <h4 className="text-2xl font-black text-emerald-400 mt-1">
                                {totalSuccess}
                            </h4>
                            <p className="text-[11px] text-emerald-400/70 mt-1">
                                Autentikasi valid terverifikasi
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 3. Password Salah / Gagal */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                                Password Salah
                            </p>
                            <h4 className="text-2xl font-black text-amber-400 mt-1">
                                {totalFailed}
                            </h4>
                            <p className="text-[11px] text-amber-400/70 mt-1">
                                Percobaan kredensial keliru
                            </p>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                            <Lock className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 4. Blokir Jam Kerja */}
                <div className="glass-panel glass-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                                Blokir Luar Jam Kerja
                            </p>
                            <h4 className="text-2xl font-black text-rose-400 mt-1">
                                {totalBlockedHours}
                            </h4>
                            <p className="text-[11px] text-rose-400/70 mt-1">
                                Dibatasi (20:00 - 07:00 WIB)
                            </p>
                        </div>
                        <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* HEADER & FILTER BAR */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2.5 text-white">
                            <ShieldAlert className="w-6 h-6 text-amber-400" />
                            <span>Log Keamanan, Device & Lokasi Login</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Memonitor perangkat (PC/HP), lokasi login geografis, dan mendeteksi upaya login mencurigakan.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="bg-slate-950 hover:bg-slate-800 text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 border border-slate-800 transition-all font-semibold disabled:opacity-50 active:scale-95 cursor-pointer shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Log</span>
                    </button>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Cari user, IP, device, lokasi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer w-full sm:w-auto font-medium"
                        >
                            <option value="ALL">Semua Status Akses</option>
                            <option value="SUCCESS">Hanya Sukses</option>
                            <option value="FAILED_PASSWORD">Password Salah</option>
                            <option value="BLOCKED_OFF_HOURS">Blokir Jam Kerja</option>
                            <option value="BLOCKED_INACTIVE">Blokir Non-Aktif</option>
                        </select>
                    </div>
                </div>

                {/* ERROR MESSAGE */}
                {errorMsg && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}
            </div>

            {/* TABEL DATA LOG */}
            <div className="glass-panel border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-800">
                            <tr>
                                <th className="py-4 px-4">Waktu Akses</th>
                                <th className="py-4 px-4">Akun & ID Karyawan</th>
                                <th className="py-4 px-4">Status Akses</th>
                                <th className="py-4 px-4">Perangkat (Device)</th>
                                <th className="py-4 px-4">Lokasi & IP Address</th>
                                <th className="py-4 px-4">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-500 font-sans">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                                            <span className="text-xs font-semibold">Memuat riwayat log keamanan & device...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-500 font-sans">
                                        <div className="max-w-xs mx-auto text-center space-y-2">
                                            <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                                            <p className="text-xs font-semibold text-slate-400">Tidak ada riwayat log yang cocok</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors font-sans">
                                        {/* WAKTU */}
                                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </td>

                                        {/* AKUN & ID */}
                                        <td className="py-3.5 px-4 font-mono">
                                            <div className="font-bold text-white text-xs">
                                                {log.username}
                                            </div>
                                            <div className="text-[10px] text-indigo-400 font-medium mt-0.5">
                                                {log.karyawan_id || 'ID: -'}
                                            </div>
                                        </td>

                                        {/* STATUS */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {log.status === 'SUCCESS' ? (
                                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5 shadow-sm">
                                                    <CheckCircle className="w-3 h-3" /> SUKSES
                                                </span>
                                            ) : log.status === 'BLOCKED_OFF_HOURS' ? (
                                                <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5">
                                                    <XCircle className="w-3 h-3" /> BLOKIR (JAM KERJA)
                                                </span>
                                            ) : log.status === 'FAILED_PASSWORD' ? (
                                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-bold text-[10px] inline-flex items-center gap-1.5">
                                                    <Lock className="w-3 h-3" /> PASSWORD SALAH
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-bold text-[10px]">
                                                    {log.status}
                                                </span>
                                            )}
                                        </td>

                                        {/* PERANGKAT (DEVICE) */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 shadow-inner">
                                                    <span>{log.device_info || 'Perangkat Standar'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* LOKASI & IP */}
                                        <td className="py-3.5 px-4 font-mono">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-200 font-sans font-medium">
                                                <span>{log.lokasi || '📍 Indonesia'}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                IP: {log.ip_address || '127.0.0.1'}
                                            </div>
                                        </td>

                                        {/* KETERANGAN */}
                                        <td className="py-3.5 px-4 text-slate-300 text-xs font-sans">
                                            {log.keterangan || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}