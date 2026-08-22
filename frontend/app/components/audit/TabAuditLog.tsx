"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import api from '../services/api';

interface LoginLog {
    id: number;
    username: string;
    karyawan_id: string;
    timestamp: string;
    status: string;
    ip_address: string;
    keterangan: string;
}

export default function TabAuditLog() {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string>('');

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

    return (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 text-slate-100 shadow-xl">
            {/* HEADER & REFRESH BUTTON */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                        Log Keamanan & Percobaan Login
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Memantau aktivitas akses sistem, termasuk blokir otomatis di luar jam operasional.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchLogs}
                    disabled={loading}
                    className="bg-slate-800 hover:bg-slate-700 text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all font-semibold disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                    <span>Refresh Log</span>
                </button>
            </div>

            {/* ERROR MESSAGE */}
            {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
                    {errorMsg}
                </div>
            )}

            {/* TABEL DATA */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase border-y border-slate-800">
                        <tr>
                            <th className="py-3 px-3.5">Waktu</th>
                            <th className="py-3 px-3.5">Username / ID</th>
                            <th className="py-3 px-3.5">Status Akses</th>
                            <th className="py-3 px-3.5">IP Address</th>
                            <th className="py-3 px-3.5">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                        {loading && logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                                        <span>Memuat riwayat log keamanan...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                                    Belum ada catatan log login yang terekam.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="py-3.5 px-3.5 text-slate-300">
                                        {new Date(log.timestamp).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-3.5 px-3.5 font-bold text-white">
                                        {log.username} <span className="text-slate-500 font-normal">({log.karyawan_id || '-'})</span>
                                    </td>
                                    <td className="py-3.5 px-3.5 font-sans">
                                        {log.status === 'SUCCESS' ? (
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> SUKSES
                                            </span>
                                        ) : log.status === 'BLOCKED_OFF_HOURS' ? (
                                            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> BLOKIR (JAM KERJA)
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-bold text-[10px]">
                                                {log.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-3.5 text-slate-400">{log.ip_address || '-'}</td>
                                    <td className="py-3.5 px-3.5 text-slate-300 font-sans">{log.keterangan || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}