import { useState, useEffect, useCallback } from 'react';
import {
    ItemBahanBaku,
    FilterInventaris,
    LogTransaksiStok,
    KategoriBahan,
    SatuanBahan
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const useInventaris = () => {
    const [inventarisList, setInventarisList] = useState<ItemBahanBaku[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // State Filter
    const [filter, setFilter] = useState<FilterInventaris>({
        search: '',
        kategori: 'ALL',
        statusStok: 'ALL',
        showArchived: false,
    });

    // 🔑 Helper Authorization Header (Mendukung 'access_token' & fallback 'token')
    const getAuthHeaders = () => {
        const token = typeof window !== 'undefined'
            ? (localStorage.getItem('access_token') || localStorage.getItem('token'))
            : null;

        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    // 🟢 1. FETCH DAFTAR INVENTARIS
    const fetchInventaris = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filter.search) params.append('search', filter.search);
            if (filter.kategori !== 'ALL') params.append('kategori', filter.kategori);
            if (filter.statusStok !== 'ALL') params.append('status_stok', filter.statusStok);

            const response = await fetch(`${API_BASE_URL}/inventaris?${params.toString()}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Gagal mengambil data inventaris');
            }

            const data = await response.json();

            // Mapping penyesuaian nama field dari database ke frontend interface
            const mappedData: ItemBahanBaku[] = data.map((item: any) => ({
                id: String(item.id),
                kode_sku: item.kode_sku,
                nama_item: item.nama_item,
                kategori: item.kategori as KategoriBahan,
                satuan: item.satuan as SatuanBahan,
                stok_saat_ini: item.stok_saat_ini,
                stok_minimum: item.stok_minimum,
                harga_per_satuan: item.harga_per_satuan,
                lokasi_gudang: item.lokasi_gudang,
                supplier_utama: item.supplier_utama,
                nomor_nota_po: item.no_faktur_po,
                tanggal_pembelian: item.tanggal_masuk,
                status_stok: item.status_stok,
                warna_kode: item.warna_kode,
                is_archived: item.is_archived || false,
                terakhir_diperbarui: item.terakhir_diperbarui,
                riwayat_transaksi: [],
            }));

            setInventarisList(mappedData);
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan server');
        } finally {
            setLoading(false);
        }
    }, [filter.search, filter.kategori, filter.statusStok]);

    // Fetch otomatis saat filter berubah
    useEffect(() => {
        fetchInventaris();
    }, [fetchInventaris]);

    // 🟢 2. TAMBAH BAHAN BAKU BARU (POST)
    const addBahanBaku = async (payload: {
        kode_sku: string;
        nama_item: string;
        kategori: KategoriBahan;
        satuan: SatuanBahan;
        stok_awal: number;
        stok_minimum: number;
        harga_per_satuan: number;
        lokasi_gudang: string;
        supplier_utama?: string;
        nomor_nota_po?: string;
        tanggal_pembelian?: string;
        warna_kode?: string;
    }) => {
        setLoading(true);
        try {
            const body = {
                ...payload,
                no_faktur_po: payload.nomor_nota_po,
                tanggal_masuk: payload.tanggal_pembelian,
            };

            const response = await fetch(`${API_BASE_URL}/inventaris`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Gagal menambahkan bahan baku');
            }

            await fetchInventaris(); // Refresh list otomatis setelah insert
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    };

    // 🟢 3. CATAT MUTASI STOK (POST)
    const catatMutasi = async (
        itemId: string,
        mutasiData: {
            tipe: 'MASUK' | 'KELUAR_PRODUKSI' | 'PENYESUAIAN' | 'RETUR';
            jumlah: number;
            referensi_po_spk?: string;
            catatan?: string;
            petugas?: string;
        }
    ) => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventaris/${itemId}/mutasi`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(mutasiData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Gagal mencatat mutasi stok');
            }

            await fetchInventaris(); // Refresh list agar stok saat ini ter-update
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    // 🟢 4. FETCH RIWAYAT MUTASI UNTUK 1 ITEM (GET)
    const fetchRiwayatMutasi = async (itemId: string): Promise<LogTransaksiStok[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventaris/${itemId}/mutasi`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) return [];

            const logs = await response.json();
            return logs.map((log: any) => ({
                id: String(log.id),
                tanggal: log.tanggal,
                tipe: log.tipe,
                jumlah: log.jumlah,
                stok_sebelum: log.stok_sebelum,
                stok_sesudah: log.stok_sesudah,
                referensi_po_spk: log.referensi_po_spk,
                catatan: log.catatan,
                petugas: log.petugas,
            }));
        } catch (err) {
            return [];
        }
    };

    // 🟢 5. EDIT MASTER BAHAN BAKU (PUT)
    const updateBahanBaku = async (itemId: string, payload: Partial<ItemBahanBaku>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventaris/${itemId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Gagal memperbarui data bahan baku');
            }

            await fetchInventaris();
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    // 🟢 6. HAPUS BAHAN BAKU (DELETE)
    const deleteBahanBaku = async (itemId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventaris/${itemId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Gagal menghapus data inventaris');
            }

            await fetchInventaris();
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    return {
        inventarisList,
        loading,
        error,
        filter,
        setFilter,
        fetchInventaris,
        addBahanBaku,
        catatMutasi,
        fetchRiwayatMutasi,
        updateBahanBaku,
        deleteBahanBaku,
    };
};