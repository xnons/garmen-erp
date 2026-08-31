import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { MesinAsset, FilterState, PaymentRecord, ViewMode } from './types';
import MesinHeader from './MesinHeader';
import MesinTable from './MesinTable';
import MesinFormModal from './MesinFormModal';
import MesinDetailModal from './MesinDetailModal';
import MesinPaymentModal from './MesinPaymentModal';
import MesinArchiveModal from './MesinArchiveModal';

// 🟢 KONFIGURASI REST API FASTAPI DENGAN DYNAMIC ORIGIN DETECTION
const getAPIBase = (): string => {
    if (typeof window !== 'undefined') {
        const customUrl = localStorage.getItem('custom_api_url');
        if (customUrl) return `${customUrl.replace(/\/$/, '')}/api`;
        if (window.location.hostname.includes('onrender.com')) {
            return `${window.location.origin}/api`;
        }
    }
    const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    return rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;
};

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
    const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedMode = localStorage.getItem('mesin_view_mode') as ViewMode;
            if (savedMode && ['TABLE', 'CARDS', 'COMPACT'].includes(savedMode)) {
                setViewMode(savedMode);
            }
        } catch (e) {}
    }, []);

    const handleChangeViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        try {
            localStorage.setItem('mesin_view_mode', mode);
        } catch (e) {}
    };

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEdit, setSelectedEdit] = useState<MesinAsset | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<MesinAsset | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<MesinAsset | null>(null);
    const [selectedArchive, setSelectedArchive] = useState<MesinAsset | null>(null);

    const showToastSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3500);
    };

    const showToastError = (msg: string) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(null), 4000);
    };

    // 🟢 1. FETCH DATA MESIN DARI FASTAPI BACKEND
    const fetchMachines = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getAPIBase()}/mesin`, {
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
            showToastError(err.message || 'Gagal menghubungkan ke server.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMachines();
    }, []);

    const filteredMachines = machines.filter((m) => {
        if (filter.showArchived) {
            if (m.status !== 'ARCHIVED') return false;
        } else {
            if (m.status === 'ARCHIVED') return false;
        }

        const matchesSearch =
            (m.nama_mesin && m.nama_mesin.toLowerCase().includes(filter.search.toLowerCase())) ||
            (m.kode_mesin && m.kode_mesin.toLowerCase().includes(filter.search.toLowerCase())) ||
            (m.vendor_supplier && m.vendor_supplier.toLowerCase().includes(filter.search.toLowerCase())) ||
            (m.merk_model && m.merk_model.toLowerCase().includes(filter.search.toLowerCase()));

        let matchesStatus = true;
        if (filter.status !== 'ALL') {
            matchesStatus = m.status === filter.status;
        }

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
                keterangan: formData.keterangan || formData.vendor_supplier || '',
                harga_beli: Number(formData.harga_beli) || 0,
                jumlah_terbayar: Number(formData.jumlah_terbayar) || 0,
                status_pembayaran: formData.status_pembayaran || 'LUNAS',
                vendor_supplier: formData.vendor_supplier,
                no_seri: formData.no_seri,
                tanggal_pembelian: formData.tanggal_pembelian,
                garansi_hingga: formData.garansi_hingga
            };

            if (selectedEdit) {
                // 🔄 PUT /api/mesin/{kode_mesin}
                const res = await fetch(`${getAPIBase()}/mesin/${selectedEdit.kode_mesin}`, {
                    method: 'PUT',
                    headers: getAuthHeader(),
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Gagal memperbarui data mesin');
                showToastSuccess(`Data mesin "${formData.nama_mesin}" berhasil diperbarui.`);
            } else {
                // ➕ POST /api/mesin
                const res = await fetch(`${getAPIBase()}/mesin`, {
                    method: 'POST',
                    headers: getAuthHeader(),
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Gagal mendaftarkan mesin baru');
                showToastSuccess(`Mesin baru "${formData.nama_mesin}" berhasil didaftarkan.`);
            }

            fetchMachines();
            setIsFormOpen(false);
        } catch (err: any) {
            console.error('Error saving machine:', err.message);
            showToastError(`Gagal menyimpan data mesin: ${err.message}`);
        }
    };

    // 🟢 3. TAMBAH PEMBAYARAN CICILAN
    const handleAddPayment = async (machineId: string, record: PaymentRecord) => {
        const target = machines.find(m => String(m.id) === String(machineId) || m.kode_mesin === machineId);
        if (!target) return;

        try {
            const currentHistory = Array.isArray(target.riwayat_pembayaran) ? target.riwayat_pembayaran : [];
            const updatedHistory = [...currentHistory, record];
            const newTerbayar = (Number(target.jumlah_terbayar) || 0) + Number(record.jumlah);
            const hargaBeli = Number(target.harga_beli) || 0;
            const newStatus = (hargaBeli > 0 && newTerbayar >= hargaBeli) ? 'LUNAS' : (newTerbayar > 0 ? 'DICICIL' : 'BELUM_BAYAR');

            const res = await fetch(`${getAPIBase()}/mesin/${target.kode_mesin}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify({
                    jumlah_terbayar: newTerbayar,
                    status_pembayaran: newStatus,
                    riwayat_pembayaran: updatedHistory
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal memperbarui data pembayaran');

            showToastSuccess(`Pembayaran cicilan Rp ${record.jumlah.toLocaleString('id-ID')} berhasil dicatat.`);
            fetchMachines();
            setSelectedPayment(null);
        } catch (err: any) {
            console.error('Error payment:', err.message);
            showToastError(`Gagal mencatat pembayaran: ${err.message}`);
        }
    };

    // 🟢 4. ARSIPKAN MESIN
    const handleConfirmArchive = async (machineId: string, archiveData: any) => {
        const target = machines.find(m => String(m.id) === String(machineId) || m.kode_mesin === machineId);
        if (!target) return;

        try {
            const res = await fetch(`${getAPIBase()}/mesin/${target.kode_mesin}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify({
                    status: 'ARCHIVED',
                    keterangan: `Diarsipkan: ${archiveData.alasan || '-'}`
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal mengarsipkan mesin');

            showToastSuccess(`Mesin "${target.nama_mesin}" berhasil diarsipkan.`);
            fetchMachines();
            setSelectedArchive(null);
        } catch (err: any) {
            console.error('Error archive:', err.message);
            showToastError(`Gagal mengarsipkan mesin: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast Alerts */}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-semibold">{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-lg shadow-rose-500/5">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-semibold">{errorMsg}</span>
                </div>
            )}

            {/* Header, KPI, & Filters */}
            <MesinHeader
                machines={machines}
                filter={filter}
                setFilter={setFilter}
                viewMode={viewMode}
                setViewMode={handleChangeViewMode}
                onOpenAddModal={() => {
                    setSelectedEdit(null);
                    setIsFormOpen(true);
                }}
                onRefresh={fetchMachines}
                loading={isLoading}
            />

            {/* Table or Loading Indicator */}
            {isLoading && machines.length === 0 ? (
                <div className="glass-panel p-16 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-xs font-semibold">Memuat data inventaris mesin...</span>
                </div>
            ) : (
                <MesinTable
                    machines={filteredMachines}
                    viewMode={viewMode}
                    onSelectDetail={(m) => setSelectedDetail(m)}
                    onEdit={(m) => {
                        setSelectedEdit(m);
                        setIsFormOpen(true);
                    }}
                    onOpenPaymentModal={(m) => setSelectedPayment(m)}
                    onOpenArchiveModal={(m) => setSelectedArchive(m)}
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
        </div>
    );
}