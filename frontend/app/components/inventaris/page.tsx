'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Warehouse, Plus, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { ItemBahanBaku, LogTransaksiStok } from './types';
import { useInventaris } from './useInventaris';

// Import Sub-Komponen & Modal (Tanpa PinGateModal)
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

export default function InventarisPage({ activeUser }: InventarisPageProps) {
    // 🟢 1. ALL HOOKS - STATE & EFFECT
    const [currentUser, setCurrentUser] = useState<any>(activeUser || null);

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

    // State Modals (Tanpa PIN Gate)
    const [selectedMutasiItem, setSelectedMutasiItem] = useState<ItemBahanBaku | null>(null);
    const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);

    const [isBahanModalOpen, setIsBahanModalOpen] = useState(false);
    const [selectedEditItem, setSelectedEditItem] = useState<ItemBahanBaku | null>(null);

    // 🟢 2. ALL HOOKS - MEMOIZATIONS
    const activeInventory = useMemo(
        () => (inventarisList || []).filter((i) => !i.is_archived),
        [inventarisList]
    );

    const totalAsetInventaris = useMemo(
        () => activeInventory.reduce((acc, item) => acc + (item.stok_saat_ini * item.harga_per_satuan), 0),
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
            const matchesStatus = filter.statusStok === 'ALL' || item.status_stok === filter.statusStok;

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

    // 🟢 3. ACTION HANDLERS (Langsung Eksekusi Berdasarkan Role Login)
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
        const res = await updateBahanBaku(targetItem.id, {
            is_archived: !targetItem.is_archived,
        });
        if (!res.success) {
            alert(res.message || 'Gagal mengubah status arsip.');
        }
    };

    const handleTriggerDelete = async (itemId: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus bahan baku ini secara permanen?')) {
            const res = await deleteBahanBaku(itemId);
            if (!res.success) {
                alert(res.message || 'Gagal menghapus bahan baku.');
            }
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
            alert(res.message || 'Gagal menyimpan mutasi stok.');
        } else {
            setIsMutasiModalOpen(false);
            setSelectedMutasiItem(null);
        }
    };

    const handleSaveBahan = async (data: Partial<ItemBahanBaku>) => {
        if (selectedEditItem) {
            const res = await updateBahanBaku(selectedEditItem.id, data);
            if (!res.success) {
                alert(res.message || 'Gagal memperbarui data bahan baku.');
            } else {
                setIsBahanModalOpen(false);
                setSelectedEditItem(null);
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
                alert(res.message || 'Gagal menambahkan bahan baku baru.');
            } else {
                setIsBahanModalOpen(false);
            }
        }
    };

    // 🛑 4. CONDITIONAL RENDERING / EARLY RETURNS

    // A. Role Tidak Diizinkan
    if (!isAccessAllowed) {
        return (
            <main className="flex-1 h-screen overflow-y-auto p-8 bg-slate-900 flex items-center justify-center text-slate-100">
                <div className="text-center max-w-md p-8 glass-panel rounded-3xl border border-rose-500/30 bg-rose-950/10 shadow-2xl">
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Akses Ditolak</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Modul Inventaris & Stok Bahan Baku bersifat terbatas. Hanya pengguna dengan role <strong className="text-rose-300">Owner</strong>, <strong className="text-rose-300">Developer</strong>, atau <strong className="text-rose-300">Admin</strong> yang memiliki izin untuk mengakses menu ini.
                    </p>
                    <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                        Role Anda saat ini: <span className="text-indigo-400 font-semibold">{userRole || 'TIDAK DIKETAHUI'}</span>
                    </div>
                </div>
            </main>
        );
    }

    // B. Tampilan Utama (Tanpa PIN Gate)
    return (
        <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8 bg-slate-900 text-slate-100 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Warehouse className="w-6 h-6 text-indigo-400" />
                            <span>Inventaris & Stok Bahan Baku</span>
                            {loading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin ml-2" />}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Pencatatan kain, aksesoris, benang, PO vendor, lot dyeing, dan alokasi material SPK.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchInventaris}
                            disabled={loading}
                            title="Refresh Data dari Server"
                            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh Data</span>
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

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center justify-between">
                        <span>{error}</span>
                    </div>
                )}

                <InventarisKpiCards
                    totalAset={totalAsetInventaris}
                    totalMenipis={totalItemMenipis}
                    totalHabis={totalItemHabis}
                />

                <InventarisFilterBar
                    filter={filter}
                    setFilter={setFilter}
                />

                <InventarisTable
                    items={filteredInventory}
                    onOpenMutasi={handleOpenMutasi}
                    onOpenEdit={handleOpenEditBahan}
                    onToggleArchive={handleToggleArchive}
                    onDelete={handleTriggerDelete}
                />

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
        </main>
    );
}