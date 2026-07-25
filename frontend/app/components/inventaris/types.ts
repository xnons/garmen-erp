export type KategoriBahan = 'KAIN' | 'AKSESORIS' | 'BENANG' | 'PACKAGING' | 'LAINNYA';
export type SatuanBahan = 'METER' | 'YARD' | 'KG' | 'ROLL' | 'PCS' | 'CONE' | 'SET';
export type StatusStok = 'AMAN' | 'MENIPIS' | 'HABIS';

export interface LogTransaksiStok {
    id: string;
    tanggal: string;
    tipe: 'MASUK' | 'KELUAR_PRODUKSI' | 'PENYESUAIAN' | 'RETUR';
    jumlah: number;
    stok_sebelum: number;
    stok_sesudah: number;
    referensi_po_spk?: string; // No PO Supplier atau No SPK Produksi
    catatan?: string;
    petugas?: string;
}

export interface ItemBahanBaku {
    id: string;
    kode_sku: string;
    nama_item: string;
    kategori: KategoriBahan;
    satuan: SatuanBahan;
    stok_saat_ini: number;
    stok_minimum: number;
    harga_per_satuan: number; // HPP Per Unit
    lokasi_gudang: string;
    supplier_utama?: string;

    // 🚩 Detail Informasi Vendor & Pembelian
    nomor_vendor?: string;        // Kontak / No WA Supplier
    nomor_nota_po?: string;       // No PO / Invoice Pembelian
    tanggal_pembelian?: string;   // Format YYYY-MM-DD
    nomor_lot_batch?: string;     // Identifikasi Lot Warna Dyeing

    // 🚩 Control & Status Flags
    status_stok: StatusStok;
    is_archived?: boolean;        // Soft delete status
    warna_kode?: string;
    riwayat_transaksi: LogTransaksiStok[];
    terakhir_diperbarui: string;
}

export interface FilterInventaris {
    search: string;
    kategori: 'ALL' | KategoriBahan;
    statusStok: 'ALL' | StatusStok;
    tanggalMulai?: string;
    tanggalSelesai?: string;
    showArchived: boolean;

}