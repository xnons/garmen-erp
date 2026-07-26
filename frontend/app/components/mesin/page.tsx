'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Loader2, RefreshCw } from 'lucide-react';
import { MesinAsset, FilterState, PaymentRecord } from './types';
import MesinHeader from '../mesin/MesinHeader';
import MesinTable from '../mesin/MesinTable';
import MesinFormModal from '../mesin/MesinFormModal';
import MesinDetailModal from '../mesin/MesinDetailModal';
import MesinPaymentModal from '../mesin/MesinPaymentModal';
import MesinArchiveModal from '../mesin/MesinArchiveModal';
import PinGateModal from '../karyawan/PinGateModal';

// 🟢 KONFIGURASI REST API FASTAPI
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const getAuthHeader = () => {
    const token = typeof window !== 'undefined'
        ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '')
        : '';

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

interface MesinPageProps {
    activeUser?: any;
}

export default function MesinPage({ activeUser }: MesinPageProps) {
    const [machines, setMachines] = useState<MesinAsset[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [filter, setFilter] = useState<FilterState>({ search: '', status: 'ALL', kategori: 'ALL', showArchived: false });

    // 🔒 State Security PIN Gate (Minta PIN Kembali Saat Pindah Modul)
    const [isSessionUnlocked, setIsSessionUnlocked] = useState(false);
    const [isPinGateOpen, setIsPinGateOpen] = useState(true);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEdit, setSelectedEdit] = useState<MesinAsset | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<MesinAsset | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<MesinAsset | null>(null);
    const [selectedArchive, setSelectedArchive] = useState<MesinAsset | null>(null);

    useEffect(() => {
        if (!isSessionUnlocked) {
            setIsPinGateOpen(true);
        }
    }, [isSessionUnlocked]);

    // 🟢 1. FETCH DATA MESIN DARI FASTAPI BACKEND
    const fetchMachines = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/mesin`, {
                headers: getAuthHeader()
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Gagal mengambil data mesin dari server');
            }

            const data = await res.json();
            setMachines(data);
        } catch (err: any) {
            console.error('Error fetching machines:', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isSessionUnlocked) {
            fetchMachines();
        }
    }, [isSessionUnlocked]);

    // 🛡️ Guard Aksi Terproteksi PIN
    const executeWithPin = (action: () => void) => {
        if (isSessionUnlocked) {
            action();
        } else {
            setPendingAction(() => action);
            setIsPinGateOpen(true);
        }
    };

    const handlePinSuccess = () => {
        setIsPinGateOpen(false);
        setIsSessionUnlocked(true);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const filteredMachines = machines.filter((m) => {
        if (filter.showArchived) {
            if (m.status !== 'ARCHIVED') return false;
        } else {
            if (m.status === 'ARCHIVED') return false;
        }

        const matchesSearch =
            m.nama_mesin.toLowerCase().includes(filter.search.toLowerCase()) ||
            m.kode_mesin.toLowerCase().includes(filter.search.toLowerCase()) ||
            (m.vendor_supplier && m.vendor_supplier.toLowerCase().includes(filter.search.toLowerCase())) ||
            (m.merk_model && m.merk_model.toLowerCase().includes(filter.search.toLowerCase()));

        const matchesStatus = filter.status === 'ALL' || m.status === filter.status;
        return matchesSearch && matchesStatus;
    });

    // 🟢 2. SIMPAN ATAU UPDATE MESIN KE FASTAPI
    const handleSave = async (formData: Partial<MesinAsset>) => {
        try {
            const payload = {
                kode_mesin: formData.kode_mesin,
                nama_mesin: formData.nama_mesin,
                kategori: formData.kategori,
                merk_tipe: formData.merk_model,
                lokasi_line: formData.lokasi_line,
                status: formData.status || 'OPERASIONAL',
                keterangan: formData.vendor_supplier || ''
            };

            if (selectedEdit) {
                // 🔄 PUT /api/mesin/{kode_mesin}
                const res = await fetch(`${API_BASE}/mesin/${selectedEdit.kode_mesin}`, {
                    method: 'PUT',
                    headers: getAuthHeader(),
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Gagal memperbarui data mesin');

            } else {
                // ➕ POST /api/mesin
                const res = await fetch(`${API_BASE}/mesin`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Gagal mendaftarkan mesin baru');
            }

            // Reload data dari server setelah simpan berhasil
            fetchMachines();
            setIsFormOpen(false);

        } catch (err: any) {
            console.error('Error saving machine:', err.message);
            alert(`Gagal menyimpan data mesin: ${err.message}`);
        }
    };

    // 🟢 3. TAMBAH PEMBAYARAN CICILAN
    const handleAddPayment = async (machineId: string, record: PaymentRecord) => {
        const target = machines.find(m => m.id === machineId);
        if (!target) return;

        try {
            const res = await fetch(`${API_BASE}/mesin/${target.kode_mesin}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify({
                    jumlah_terbayar: target.jumlah_terbayar + record.jumlah,
                    catatan_pembayaran: record.catatan
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal memperbarui data pembayaran');

            fetchMachines();
            setSelectedPayment(null);
        } catch (err: any) {
            console.error('Error payment:', err.message);
            alert(`Gagal menyimpan pembayaran: ${err.message}`);
        }
    };

    // 🟢 4. ARSIPKAN MESIN
    const handleConfirmArchive = async (machineId: string, archiveData: any) => {
        const target = machines.find(m => m.id === machineId);
        if (!target) return;

        try {
            const res = await fetch(`${API_BASE}/mesin/${target.kode_mesin}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify({
                    status: 'ARCHIVED',
                    keterangan: `Diarsipkan: ${archiveData.alasan || '-'}`
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal mengarsipkan mesin');

            fetchMachines();
            setSelectedArchive(null);
        } catch (err: any) {
            console.error('Error archive:', err.message);
            alert(`Gagal mengarsipkan mesin: ${err.message}`);
        }
    };

    // 🔴 1. SCREEN TERKUNCI PIN
    if (!isSessionUnlocked) {
        return (
            <main className="flex-1 h-screen overflow-y-auto p-8 bg-slate-900 flex items-center justify-center text-slate-100 relative">
                <div className="text-center max-w-sm p-8 glass-panel rounded-3xl shadow-2xl animate-modal-pop border border-slate-800 relative z-10">
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-lock-pulse">
                        <Lock className="w-8 h-8" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">Akses Kelola Mesin Terkunci</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Akses ke modul sensitif ini membutuhkan verifikasi PIN Security Gate 4-Digit setiap kali dibuka.
                    </p>

                    <button
                        onClick={() => setIsPinGateOpen(true)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200"
                    >
                        Masukkan PIN Keamanan
                    </button>
                </div>

                <PinGateModal
                    isOpen={isPinGateOpen}
                    onClose={() => setIsPinGateOpen(false)}
                    onSuccess={handlePinSuccess}
                    title="Akses Terkunci"
                    description="Masukkan 4 Digit PIN Security Gate untuk mengakses menu ini."
                />
            </main>
        );
    }

    // 🟢 2. SCREEN UTAMA DASHBOARD MESIN
    return (
        <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8 bg-slate-900 text-slate-100">
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* Header & Control Bar */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <MesinHeader
                            machines={machines}
                            filter={filter}
                            setFilter={setFilter}
                            onOpenAddModal={() => executeWithPin(() => {
                                setSelectedEdit(null);
                                setIsFormOpen(true);
                            })}
                        />
                    </div>

                    {/* Quick Refresh Data Action Bar */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={fetchMachines}
                            disabled={isLoading}
                            title="Refresh Data Mesin dari Server"
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh Data</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-xs font-semibold">Memuat data mesin dari backend server...</span>
                    </div>
                ) : (
                    <MesinTable
                        machines={filteredMachines}
                        onSelectDetail={(m) => setSelectedDetail(m)}
                        onEdit={(m) => executeWithPin(() => {
                            setSelectedEdit(m);
                            setIsFormOpen(true);
                        })}
                        onOpenPaymentModal={(m) => executeWithPin(() => setSelectedPayment(m))}
                        onOpenArchiveModal={(m) => executeWithPin(() => setSelectedArchive(m))}
                    />
                )}

                {/* Modals Operasional */}
                <MesinFormModal
                    isOpen={isFormOpen}
                    initialData={selectedEdit}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />

                <MesinDetailModal
                    machine={selectedDetail}
                    onClose={() => setSelectedDetail(null)}
                />

                <MesinPaymentModal
                    machine={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                    onAddPayment={handleAddPayment}
                />

                <MesinArchiveModal
                    machine={selectedArchive}
                    onClose={() => setSelectedArchive(null)}
                    onConfirmArchive={handleConfirmArchive}
                />

                {/* Modal Verification PIN */}
                <PinGateModal
                    isOpen={isPinGateOpen}
                    onClose={() => setIsPinGateOpen(false)}
                    onSuccess={handlePinSuccess}
                    title="Akses Terkunci"
                    description="Masukkan 4 Digit PIN Security Gate untuk mengakses menu ini."
                />
            </div>
        </main>
    );
}