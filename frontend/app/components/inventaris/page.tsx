'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Warehouse, Plus, Lock } from 'lucide-react';
import { ItemBahanBaku, FilterInventaris, LogTransaksiStok, StatusStok } from './types';

// Import Sub-Komponen & Modal
import PinGateModal from '../karyawan/PinGateModal';
import StokMutasiModal from './StokMutasiModal';
import BahanFormModal from './BahanFormModal';
import InventarisKpiCards from './InventarisKpiCards';
import InventarisFilterBar from './InventarisFilterBar';
import InventarisTable from './InventarisTable';

// Mock Data Awal
const INITIAL_INVENTORY: ItemBahanBaku[] = [
    {
        id: '1',
        kode_sku: 'MAT-FAB-001',
        nama_item: 'Kain Cotton Combed 30s - Jet Black',
        kategori: 'KAIN',
        satuan: 'KG',
        stok_saat_ini: 145.5,
        stok_minimum: 50.0,
        harga_per_satuan: 115000,
        lokasi_gudang: 'Gudang Utama - Rak A1',
        supplier_utama: 'PT Tekstil Nusantara',
        nomor_vendor: '0812-9876-5432 (Bpk. Agus)',
        nomor_nota_po: 'PO-2026-088',
        tanggal_pembelian: '2026-07-20',
        nomor_lot_batch: 'LOT-992-BLK',
        warna_kode: '#000000',
        status_stok: 'AMAN',
        is_archived: false,
        terakhir_diperbarui: '2026-07-24',
        riwayat_transaksi: [
            { id: 't1', tanggal: '2026-07-20', tipe: 'MASUK', jumlah: 200, stok_sebelum: 0, stok_sesudah: 200, referensi_po_spk: 'PO-2026-088', catatan: 'Pembelian awal' },
            { id: 't2', tanggal: '2026-07-24', tipe: 'KELUAR_PRODUKSI', jumlah: 54.5, stok_sebelum: 200, stok_sesudah: 145.5, referensi_po_spk: 'SPK-2026-012', catatan: 'Potong T-Shirt Size L' }
        ]
    },
    {
        id: '2',
        kode_sku: 'MAT-ACC-004',
        nama_item: 'Zipper YKK Metal No 5 - 60cm Black',
        kategori: 'AKSESORIS',
        satuan: 'PCS',
        stok_saat_ini: 28,
        stok_minimum: 100,
        harga_per_satuan: 8500,
        lokasi_gudang: 'Gudang B - Aksesoris B2',
        supplier_utama: 'CV Aksesoris Garment',
        nomor_vendor: '0856-1122-3344',
        nomor_nota_po: 'INV-8831',
        tanggal_pembelian: '2026-07-15',
        nomor_lot_batch: 'LOT-ACC-11',
        status_stok: 'MENIPIS',
        is_archived: false,
        terakhir_diperbarui: '2026-07-25',
        riwayat_transaksi: [
            { id: 't3', tanggal: '2026-07-25', tipe: 'KELUAR_PRODUKSI', jumlah: 120, stok_sebelum: 148, stok_sesudah: 28, referensi_po_spk: 'SPK-2026-015', catatan: 'Produksi Jacket Windbreaker' }
        ]
    },
    {
        id: '3',
        kode_sku: 'MAT-THR-002',
        nama_item: 'Benang Jahit Spun Polyester 40/2 White',
        kategori: 'BENANG',
        satuan: 'CONE',
        stok_saat_ini: 0,
        stok_minimum: 15,
        harga_per_satuan: 18500,
        lokasi_gudang: 'Gudang Utama - Rak C1',
        supplier_utama: 'PT Sinar Benang',
        nomor_vendor: '021-555-8900',
        nomor_nota_po: 'PO-2026-041',
        tanggal_pembelian: '2026-06-10',
        status_stok: 'HABIS',
        is_archived: false,
        terakhir_diperbarui: '2026-07-22',
        riwayat_transaksi: []
    }
];

export default function InventarisPage() {
    // 🟢 1. STATE MANAGEMENT (Seluruh Hook Berada di Dalam Komponen)
    const [inventory, setInventory] = useState<ItemBahanBaku[]>(INITIAL_INVENTORY);
    const [filter, setFilter] = useState<FilterInventaris>({
        search: '',
        kategori: 'ALL',
        statusStok: 'ALL',
        tanggalMulai: '',
        tanggalSelesai: '',
        showArchived: false
    });

    // Modals & Security Gate State
    const [isSessionUnlocked, setIsSessionUnlocked] = useState(false);
    const [isPinGateOpen, setIsPinGateOpen] = useState(true);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const [selectedMutasiItem, setSelectedMutasiItem] = useState<ItemBahanBaku | null>(null);
    const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);

    const [isBahanModalOpen, setIsBahanModalOpen] = useState(false);
    const [selectedEditItem, setSelectedEditItem] = useState<ItemBahanBaku | null>(null);

    useEffect(() => {
        if (!isSessionUnlocked) {
            setIsPinGateOpen(true);
        }
    }, [isSessionUnlocked]);

    // 🟢 2. ACTION HANDLERS
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

    const handleOpenMutasi = (item: ItemBahanBaku) => {
        executeWithPin(() => {
            setSelectedMutasiItem(item);
            setIsMutasiModalOpen(true);
        });
    };

    const handleOpenEditBahan = (item: ItemBahanBaku) => {
        executeWithPin(() => {
            setSelectedEditItem(item);
            setIsBahanModalOpen(true);
        });
    };

    const handleOpenTambahBahan = () => {
        executeWithPin(() => {
            setSelectedEditItem(null);
            setIsBahanModalOpen(true);
        });
    };

    const handleToggleArchive = (targetItem: ItemBahanBaku) => {
        executeWithPin(() => {
            setInventory((prev) => prev.map((item) =>
                item.id === targetItem.id ? { ...item, is_archived: !item.is_archived } : item
            ));
        });
    };

    const handleTriggerDelete = (itemId: string) => {
        executeWithPin(() => {
            setInventory((prev) => prev.filter((item) => item.id !== itemId));
        });
    };

    const handleSaveMutasi = (itemId: string, transaction: LogTransaksiStok) => {
        setInventory((prev) => prev.map((item) => {
            if (item.id !== itemId) return item;

            const newStok = transaction.stok_sesudah;
            let newStatus: StatusStok = 'AMAN';
            if (newStok === 0) newStatus = 'HABIS';
            else if (newStok <= item.stok_minimum) newStatus = 'MENIPIS';

            return {
                ...item,
                stok_saat_ini: newStok,
                status_stok: newStatus,
                terakhir_diperbarui: transaction.tanggal,
                riwayat_transaksi: [transaction, ...item.riwayat_transaksi]
            };
        }));
    };

    const handleSaveBahan = (data: Partial<ItemBahanBaku>) => {
        if (selectedEditItem) {
            setInventory((prev) => prev.map((item) => item.id === selectedEditItem.id ? { ...item, ...data } as ItemBahanBaku : item));
        } else {
            const newItem: ItemBahanBaku = {
                id: Date.now().toString(),
                kode_sku: data.kode_sku || 'MAT-NEW',
                nama_item: data.nama_item || 'Bahan Baru',
                kategori: data.kategori || 'KAIN',
                satuan: data.satuan || 'KG',
                stok_saat_ini: data.stok_saat_ini || 0,
                stok_minimum: data.stok_minimum || 10,
                harga_per_satuan: data.harga_per_satuan || 0,
                lokasi_gudang: data.lokasi_gudang || 'Gudang Utama',
                supplier_utama: data.supplier_utama || '-',
                nomor_vendor: data.nomor_vendor || '-',
                nomor_nota_po: data.nomor_nota_po || '-',
                tanggal_pembelian: data.tanggal_pembelian || new Date().toISOString().split('T')[0],
                nomor_lot_batch: data.nomor_lot_batch || '-',
                status_stok: (data.stok_saat_ini || 0) === 0 ? 'HABIS' : (data.stok_saat_ini || 0) <= (data.stok_minimum || 10) ? 'MENIPIS' : 'AMAN',
                is_archived: false,
                terakhir_diperbarui: new Date().toISOString().split('T')[0],
                riwayat_transaksi: []
            };
            setInventory((prev) => [newItem, ...prev]);
        }
    };

    // 🟢 3. METRICS & LOGIKA MULTI-FILTER
    const activeInventory = useMemo(() => inventory.filter((i) => !i.is_archived), [inventory]);
    const totalAsetInventaris = useMemo(() => activeInventory.reduce((acc, item) => acc + (item.stok_saat_ini * item.harga_per_satuan), 0), [activeInventory]);
    const totalItemMenipis = useMemo(() => activeInventory.filter((i) => i.stok_saat_ini <= i.stok_minimum && i.stok_saat_ini > 0).length, [activeInventory]);
    const totalItemHabis = useMemo(() => activeInventory.filter((i) => i.stok_saat_ini === 0).length, [activeInventory]);

    const filteredInventory = useMemo(() => {
        return inventory.filter((item) => {
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
                (item.nomor_nota_po && item.nomor_nota_po.toLowerCase().includes(q)) ||
                (item.nomor_lot_batch && item.nomor_lot_batch.toLowerCase().includes(q));

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
    }, [inventory, filter]);

    // 🔒 SCREEN DISPLAY TERKUNCI PIN
    if (!isSessionUnlocked) {
        return (
            <main className="flex-1 h-screen overflow-y-auto p-8 bg-slate-900 flex items-center justify-center text-slate-100 relative">
                <div className="text-center max-w-sm p-8 glass-panel rounded-3xl shadow-2xl border border-slate-800 relative z-10">
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Akses Inventaris Terkunci</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Verifikasi PIN Security Gate 4-Digit untuk mengelola stok kain, aksesoris, HPP bahan, dan transaksi gudang.
                    </p>
                    <button
                        onClick={() => setIsPinGateOpen(true)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
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

    // 🟢 UNLOCKED DISPLAY (DENGAN CONTAINER SCROLLING)
    return (
        <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8 bg-slate-900 text-slate-100 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Warehouse className="w-6 h-6 text-indigo-400" />
                            <span>Inventaris & Stok Bahan Baku</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Pencatatan kain, aksesoris, benang, PO vendor, lot dyeing, dan alokasi material SPK.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenTambahBahan}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Bahan Baku</span>
                    </button>
                </div>

                {/* KPI Section */}
                <InventarisKpiCards
                    totalAset={totalAsetInventaris}
                    totalMenipis={totalItemMenipis}
                    totalHabis={totalItemHabis}
                />

                {/* Multi-Filter Section */}
                <InventarisFilterBar
                    filter={filter}
                    setFilter={setFilter}
                />

                {/* Table Data Section */}
                <InventarisTable
                    items={filteredInventory}
                    onOpenMutasi={handleOpenMutasi}
                    onOpenEdit={handleOpenEditBahan}
                    onToggleArchive={handleToggleArchive}
                    onDelete={handleTriggerDelete}
                />

                {/* Operasional Modals */}
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