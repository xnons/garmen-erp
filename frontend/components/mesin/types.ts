export type MachineStatus = 'AKTIF' | 'MAINTENANCE' | 'RUSAK' | 'PERLU_SERVIS' | 'NON_AKTIF' | 'ARCHIVED';
export type PaymentStatus = 'LUNAS' | 'DICICIL' | 'BELUM_BAYAR';
export type ArchiveReason = 'DIJUAL' | 'DIBUANG_SCRAP' | 'RUSAK_TOTAL' | 'HILANG' | 'LAINNYA';

export interface PaymentRecord {
    id: string;
    tanggal: string;
    jumlah: number;
    catatan: string;
    pembayar?: string;
}

export interface ArchiveInfo {
    tanggal_arsip: string;
    alasan: ArchiveReason;
    catatan?: string;
    harga_jual?: number;
}

export interface MesinAsset {
    id: string;
    kode_mesin: string;
    nama_mesin: string;
    kategori: string;
    merk_model: string;
    no_seri?: string;
    vendor_supplier?: string;
    lokasi_line: string;
    status: MachineStatus;

    // Finansial & Pembayaran
    harga_beli: number;
    nilai_sisa: number;
    umur_ekonomis_tahun: number;
    tanggal_pembelian: string;
    garansi_hingga?: string;

    status_pembayaran: PaymentStatus;
    jumlah_terbayar: number;
    sisa_pembayaran: number;
    riwayat_pembayaran: PaymentRecord[];

    depresiasi_per_bulan: number;
    nilai_buku_saat_ini: number;

    // Maintenance
    terakhir_servis?: string;
    jadwal_servis_berikutnya?: string;
    catatan?: string;

    // Info Pengarsipan
    arsip_info?: ArchiveInfo;
}

export interface FilterState {
    search: string;
    status: string;
    kategori: string;
    showArchived: boolean;
}