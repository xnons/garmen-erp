import React, { useState, useEffect, useMemo } from 'react';
import { Warehouse, Plus, Loader2, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ItemBahanBaku, LogTransaksiStok, ViewMode } from './types';
import { useInventaris } from './useInventaris';
import { useConfirm } from '@/components/common/ConfirmDialog';

// Import Sub-Komponen & Modal
import StokMutasiModal from './StokMutasiModal';
import BahanFormModal from './BahanFormModal';
import InventarisKpiCards from './InventarisKpiCards';
import InventarisFilterBar from './InventarisFilterBar';
import InventarisTable from './InventarisTable';

const ALLOWED_ROLES = ['OWNER', 'DEVELOPER', 'DEV', 'ADMIN'];

interface InventarisPageProps {
    activeUser?: {
        role?: string;
        nama?: string;
        [key: string]: any;
    } | null;
}

export default function InventarisModule({ activeUser }: InventarisPageProps) {
    const confirm = useConfirm();
    // 🟢 1. STATE USER & ACCESS CONTROL
    const [currentUser, setCurrentUser] = useState<any>(activeUser || null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('TABLE');

    useEffect(() => {
        try {
            const savedMode = localStorage.getItem('inventaris_view_mode') as ViewMode;
            if (savedMode && ['TABLE', 'CARDS', 'COMPACT'].includes(savedMode)) {
                setViewMode(savedMode);
            }
        } catch (e) {}
    }, []);

    const handleChangeViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        try {
            localStorage.setItem('inventaris_view_mode', mode);
        } catch (e) {}
    };

    useEffect(() => {
        if (activeUser) {
            setCurrentUser(activeUser);
        } else {
            try {
                const storedUser = localStorage.getItem('user_data') || localStorage.getItem('user');
                if (storedUser) {
                    setCurrentUser(JSON.parse(storedUser));
                } else {
                    const storedRole = localStorage.getItem('user_role');
                    if (storedRole) {
                        setCurrentUser({ role: storedRole });
                    }
                }
            } catch (err) {
                console.error("Gagal membaca session user dari localStorage", err);
            }
        }
    }, [activeUser]);

    // Role check
    const userRole = (currentUser?.role || activeUser?.role || '').toUpperCase();
    const isAccessAllowed = userRole ? ALLOWED_ROLES.includes(userRole) : false;

    // Custom Hook Backend
    const {
        inventarisList,
        loading,
        error,
        filter,
        setFilter,
        fetchInventaris,
        addBahanBaku,
        catatMutasi,
        updateBahanBaku,
        deleteBahanBaku,
    } = useInventaris();

    // Helper Toast
    const showToastSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3500);
    };

    const showToastError = (msg: string) => {
        setActionError(msg);
        setTimeout(() => setActionError(null), 4000);
    };

    // State Modals
    const [selectedMutasiItem, setSelectedMutasiItem] = useState<ItemBahanBaku | null>(null);
    const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);

    const [isBahanModalOpen, setIsBahanModalOpen] = useState(false);
    const [selectedEditItem, setSelectedEditItem] = useState<ItemBahanBaku | null>(null);

    // 🟢 2. MEMOIZATIONS & STATS
    const activeInventory = useMemo(
        () => (inventarisList || []).filter((i) => !i.is_archived),
        [inventarisList]
    );

    const archivedInventory = useMemo(
        () => (inventarisList || []).filter((i) => i.is_archived),
        [inventarisList]
    );

    const totalAsetInventaris = useMemo(
        () => activeInventory.reduce((acc, item) => acc + ((item.stok_saat_ini || 0) * (item.harga_per_satuan || 0)), 0),
        [activeInventory]
    );

    const totalItemMenipis = useMemo(
        () => activeInventory.filter((i) => i.stok_saat_ini <= i.stok_minimum && i.stok_saat_ini > 0).length,
        [activeInventory]
    );

    const totalItemHabis = useMemo(
        () => activeInventory.filter((i) => i.stok_saat_ini === 0).length,
        [activeInventory]
    );

    const filteredInventory = useMemo(() => {
        return (inventarisList || []).filter((item) => {
            if (filter.showArchived) {
                if (!item.is_archived) return false;
            } else {
                if (item.is_archived) return false;
            }

            const q = filter.search.toLowerCase();
            const matchesSearch =
                item.nama_item.toLowerCase().includes(q) ||
                item.kode_sku.toLowerCase().includes(q) ||
                (item.supplier_utama && item.supplier_utama.toLowerCase().includes(q)) ||
                (item.nomor_nota_po && item.nomor_nota_po.toLowerCase().includes(q));

            const matchesKategori = filter.kategori === 'ALL' || item.kategori === filter.kategori;

            let matchesStatus = true;
            if (filter.statusStok === 'AMAN') {
                matchesStatus = item.stok_saat_ini > item.stok_minimum;
            } else if (filter.statusStok === 'MENIPIS') {
                matchesStatus = item.stok_saat_ini <= item.stok_minimum && item.stok_saat_ini > 0;
            } else if (filter.statusStok === 'HABIS') {
                matchesStatus = item.stok_saat_ini === 0;
            }

            let matchesTanggal = true;
            if (filter.tanggalMulai && item.tanggal_pembelian) {
                matchesTanggal = matchesTanggal && item.tanggal_pembelian >= filter.tanggalMulai;
            }
            if (filter.tanggalSelesai && item.tanggal_pembelian) {
                matchesTanggal = matchesTanggal && item.tanggal_pembelian <= filter.tanggalSelesai;
            }

            return matchesSearch && matchesKategori && matchesStatus && matchesTanggal;
        });
    }, [inventarisList, filter]);

    // 🟢 3. ACTION HANDLERS
    const handleOpenMutasi = (item: ItemBahanBaku) => {
        setSelectedMutasiItem(item);
        setIsMutasiModalOpen(true);
    };

    const handleOpenEditBahan = (item: ItemBahanBaku) => {
        setSelectedEditItem(item);
        setIsBahanModalOpen(true);
    };

    const handleOpenTambahBahan = () => {
        setSelectedEditItem(null);
        setIsBahanModalOpen(true);
    };

    const handleToggleArchive = async (targetItem: ItemBahanBaku) => {
        const nextArchived = !targetItem.is_archived;
        const res = await updateBahanBaku(targetItem.id, {
            is_archived: nextArchived,
        });
        if (!res.success) {
            showToastError(res.message || 'Gagal mengubah status arsip.');
        } else {
            showToastSuccess(nextArchived ? `Material "${targetItem.nama_item}" berhasil diarsipkan.` : `Material "${targetItem.nama_item}" dipulihkan ke stok aktif.`);
        }
    };

    const handleTriggerDelete = async (itemId: string) => {
        const ok = await confirm({
            title: 'Hapus bahan baku permanen?',
            message: 'Data bahan baku ini akan dihapus permanen dan tidak bisa dikembalikan.',
            confirmText: 'Hapus',
            tone: 'danger',
        });
        if (!ok) return;
        const res = await deleteBahanBaku(itemId);
        if (!res.success) {
            showToastError(res.message || 'Gagal menghapus bahan baku.');
        } else {
            showToastSuccess('Bahan baku berhasil dihapus secara permanen.');
        }
    };

    const handleSaveMutasi = async (itemId: string, transaction: LogTransaksiStok) => {
        const res = await catatMutasi(itemId, {
            tipe: transaction.tipe,
            jumlah: transaction.jumlah,
            referensi_po_spk: transaction.referensi_po_spk,
            catatan: transaction.catatan,
            petugas: transaction.petugas,
        });

        if (!res.success) {
            showToastError(res.message || 'Gagal menyimpan mutasi stok.');
        } else {
            setIsMutasiModalOpen(false);
            setSelectedMutasiItem(null);
            showToastSuccess(`Mutasi stok (${transaction.tipe} ${transaction.jumlah}) berhasil dicatat.`);
        }
    };

    const handleSaveBahan = async (data: Partial<ItemBahanBaku>) => {
        if (selectedEditItem) {
            const res = await updateBahanBaku(selectedEditItem.id, data);
            if (!res.success) {
                showToastError(res.message || 'Gagal memperbarui data bahan baku.');
            } else {
                setIsBahanModalOpen(false);
                setSelectedEditItem(null);
                showToastSuccess('Data bahan baku berhasil diperbarui.');
            }
        } else {
            const res = await addBahanBaku({
                kode_sku: data.kode_sku || `SKU-${Date.now()}`,
                nama_item: data.nama_item || 'Bahan Baru',
                kategori: data.kategori || 'KAIN',
                satuan: data.satuan || 'KG',
                stok_awal: data.stok_saat_ini || 0,
                stok_minimum: data.stok_minimum || 10,
                harga_per_satuan: data.harga_per_satuan || 0,
                lokasi_gudang: data.lokasi_gudang || 'Gudang Utama',
                supplier_utama: data.supplier_utama,
                nomor_nota_po: data.nomor_nota_po,
                tanggal_pembelian: data.tanggal_pembelian,
                warna_kode: data.warna_kode,
            });

            if (!res.success) {
                showToastError(res.message || 'Gagal menambahkan bahan baku baru.');
            } else {
                setIsBahanModalOpen(false);
                showToastSuccess('Bahan baku baru berhasil ditambahkan ke inventaris.');
            }
        }
    };

    // 🛑 4. ACCESS RESTRICTION FALLBACK
    if (!isAccessAllowed) {
        return (
            <div className="flex items-center justify-center p-8 text-slate-100 min-h-[60vh]">
                <div className="text-center max-w-md p-8 glass-panel rounded-3xl border border-rose-500/30 bg-rose-950/10 shadow-2xl">
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Akses Ditolak</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Modul Inventaris & Stok Bahan Baku bersifat terbatas. Hanya pengguna dengan hak akses <strong className="text-rose-300">Owner</strong>, <strong className="text-rose-300">Developer</strong>, atau <strong className="text-rose-300">Admin</strong> yang memiliki izin untuk mengelola inventaris.
                    </p>
                    <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                        Role Anda saat ini: <span className="text-indigo-400 font-semibold">{userRole || 'TIDAK DIKETAHUI'}</span>
                    </div>
                </div>
            </div>
        );
    }

    // 🟢 5. MAIN CONTENT VIEW
    return (
        <div className="space-y-6">
            {/* Toast Alerts */}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-semibold">{successMsg}</span>
                </div>
            )}
            {(error || actionError) && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-lg shadow-rose-500/5">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-semibold">{error || actionError}</span>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                        <Warehouse className="w-6 h-6 text-indigo-400" />
                        <span>Inventaris & Stok Bahan Baku</span>
                        {loading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin ml-2" />}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Pencatatan kain, aksesoris, benang, PO vendor, lot batching, dan mutasi material SPK.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                        onClick={fetchInventaris}
                        disabled={loading}
                        title="Refresh Data dari Server"
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                        onClick={handleOpenTambahBahan}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Bahan Baku</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <InventarisKpiCards
                totalAset={totalAsetInventaris}
                totalItemAktif={activeInventory.length}
                totalMenipis={totalItemMenipis}
                totalHabis={totalItemHabis}
            />

            {/* Filter Bar */}
            <InventarisFilterBar
                filter={filter}
                setFilter={setFilter}
                totalAktif={activeInventory.length}
                totalArchived={archivedInventory.length}
                viewMode={viewMode}
                setViewMode={handleChangeViewMode}
            />

            {/* Table */}
            <InventarisTable
                items={filteredInventory}
                viewMode={viewMode}
                onOpenMutasi={handleOpenMutasi}
                onOpenEdit={handleOpenEditBahan}
                onToggleArchive={handleToggleArchive}
                onDelete={handleTriggerDelete}
            />

            {/* Modals */}
            <StokMutasiModal
                item={selectedMutasiItem}
                isOpen={isMutasiModalOpen}
                onClose={() => {
                    setIsMutasiModalOpen(false);
                    setSelectedMutasiItem(null);
                }}
                onSaveMutasi={handleSaveMutasi}
            />

            <BahanFormModal
                isOpen={isBahanModalOpen}
                onClose={() => {
                    setIsBahanModalOpen(false);
                    setSelectedEditItem(null);
                }}
                onSave={handleSaveBahan}
                initialData={selectedEditItem}
            />
        </div>
    );
}