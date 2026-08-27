import api from './api';

// ===========================================================================
// TYPES & INTERFACES
// ===========================================================================
export type StatusSPK = 'DRAFT' | 'ON_PROGRESS' | 'FINISHED' | 'ARCHIVED';
export type PrioritasSPK = 'NORMAL' | 'HIGH' | 'URGENT';

export type TahapanProses =
    | 'CUTTING'
    | 'PERSIAPAN_PRESS'
    | 'SEWING'
    | 'BUANG_BENANG'
    | 'FINISHING_PRESS'
    | 'PACKING';

export type StatusVerifikasiOutput = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KaryawanProduksi {
    id_karyawan: string;
    nama: string;
    jabatan: string;
    username: string;
}

export interface MasterTarif {
    id?: number;
    spk_id?: string;
    tahapan_proses: TahapanProses;
    tarif_per_pcs: number;
    keterangan?: string;
}

export interface SPK {
    id: string;
    nama_pemesan?: string;
    kontak_pemesan?: string;
    no_po_buyer?: string;
    alamat_pengiriman?: string;

    nama_artikel: string;
    kategori_produk?: string;
    prioritas?: PrioritasSPK;
    deskripsi?: string;
    foto_sampel?: string;

    size_matrix?: Record<string, number>;
    target_qty: number;
    realisasi_potong: number;

    jenis_kain?: string;
    warna_kain?: string;
    aksesoris?: string;
    spesifikasi_sablon_bordir?: string;
    toleransi_defect_pct?: number;

    tanggal_mulai: string;
    target_cutting?: string;
    target_sewing?: string;
    deadline: string;
    status: StatusSPK;

    harga_jual_per_pcs?: number;

    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
    tarif_list?: MasterTarif[];
}

export interface LogOutput {
    id: number;
    tanggal: string;
    karyawan_id: string;
    spk_id: string;
    tahapan_proses: TahapanProses;
    nomor_tiket?: string;      // 🟢 Standar Pabrik: Nomor Bundle / Lot Tiket
    kode_mesin?: string;       // 🟢 Modul Mesin Terintegrasi
    nama_mesin?: string;
    bahan_id?: string;         // 🟢 Modul Inventaris Terintegrasi
    nama_bahan?: string;
    satuan_bahan?: string;
    jumlah_bahan_digunakan?: number;
    qty_disetor: number;
    qty_pass: number;
    qty_rework?: number;     // 🟢 Standar Pabrik: Barang cacat bisa diperbaiki
    qty_scrap?: number;      // 🟢 Standar Pabrik: BS / Cacat permanen
    qty_reject: number;
    tarif_per_pcs: number;
    subtotal_rp: number;
    status_verifikasi: StatusVerifikasiOutput;
    catatan?: string;
    petugas_input: string;
    verifier_id?: string;

    foto_bukti_setoran?: string;
    foto_bukti_defect?: string;

    is_paid?: boolean;
    payroll_id?: string;
    paid_at?: string;

    created_at?: string;

    nama_karyawan?: string;
    tipe_pay_karyawan?: string;
    nama_artikel?: string;
}

export interface RecordOutputPayload {
    tanggal: string;
    karyawan_id: string;
    spk_id: string;
    tahapan_proses: TahapanProses;
    nomor_tiket?: string;     // 🟢 Nomor Tiket Bundle/Lot Fisik
    kode_mesin?: string;      // 🟢 Mesin yang digunakan
    bahan_id?: string;        // 🟢 Bahan baku yang dikurangi
    jumlah_bahan_digunakan?: number; // 🟢 Konsumsi bahan
    qty_disetor: number;
    qty_pass: number;
    qty_rework?: number;    // 🟢 Rework
    qty_scrap?: number;     // 🟢 Scrap / BS
    qty_reject?: number;
    catatan?: string;
    foto_bukti_setoran?: string;
}

export interface LogOutputFilters {
    tanggal?: string;
    start_date?: string; // 🟢 Tambahan rentang awal
    end_date?: string;   // 🟢 Tambahan rentang akhir
    karyawan_id?: string;
    spk_id?: string;
    status_verifikasi?: StatusVerifikasiOutput;
}

export interface BulkVerifyResponse {
    message: string;
    verified_count: number;
    skipped_self_verify: number;
}

export interface PayrollLogItem {
    log_id: number;
    tanggal: string;
    spk_id: string;
    nama_artikel: string;
    tahapan_proses: TahapanProses;
    qty_pass: number;
    tarif_per_pcs: number;
    subtotal_rp: number;
}

export interface RekapGajiPekerjaResponse {
    karyawan_id: string;
    nama_karyawan: string;
    tipe_pay: string;
    total_setoran_approved: number;
    total_pcs_pass: number;
    total_gaji_unpaid_rp: number;
    total_gaji_paid_rp: number;
    detail_unpaid_logs: PayrollLogItem[];
}

export interface DailyTrendPoint {
    tanggal: string;
    total_pcs_disetor: number;
    total_pcs_pass: number;
    total_pcs_reject: number;
    total_upah_rp: number;
}

export interface SPKProgressItem {
    spk_id: string;
    nama_artikel: string;
    target_qty: number;
    realisasi_potong: number;
    progress_sewing: number;
    progress_packing: number;
    persentase_selesai: number;
    status: StatusSPK;
}

export interface DefectRateByTahapan {
    tahapan_proses: TahapanProses;
    total_disetor: number;
    total_reject: number;
    defect_rate_pct: number;
}

export interface TopWorkerItem {
    karyawan_id: string;
    nama_karyawan: string;
    total_pcs_pass: number;
    total_pendapatan_rp: number;
}

export interface ProductionAnalyticsDashboard {
    period_start: string;
    period_end: string;
    total_output_pass: number;
    total_output_reject: number;
    average_defect_rate: number;
    total_upah_borongan: number;
    trend_harian: DailyTrendPoint[];
    progress_spk: SPKProgressItem[];
    defect_breakdown: DefectRateByTahapan[];
    top_workers: TopWorkerItem[];
}

// ===========================================================================
// HELPER SANITASI PARAMS (PENCEGAH ERROR 422 FASTAPI)
// ===========================================================================
/**
 * Membersihkan parameter query dari value bernilai "", null, atau undefined
 * Mencegah Pydantic FastAPI menolak validasi date/enum akibat string kosong.
 */
const cleanQueryParams = (params: Record<string, any>): Record<string, any> => {
    const cleaned: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            cleaned[key] = value;
        }
    });
    return cleaned;
};

// ===========================================================================
// SERVICE IMPLEMENTATION
// ===========================================================================
export const produksiService = {
    // 0️⃣ Filtering Karyawan Khusus Divisi Produksi
    getKaryawanProduksi: async (): Promise<KaryawanProduksi[]> => {
        const response = await api.get('/api/produksi/karyawan-produksi');
        return response.data;
    },

    // 1️⃣ SPK Management & Lifecycle
    getAllSPK: async (search = '', status = ''): Promise<SPK[]> => {
        const response = await api.get('/api/produksi/spk', {
            params: cleanQueryParams({ search, status_filter: status }),
        });
        return response.data;
    },

    getSPKDetail: async (spkId: string): Promise<SPK> => {
        const response = await api.get(`/api/produksi/spk/${spkId}`);
        return response.data;
    },

    createSPK: async (payload: Partial<SPK> & { tarif_initial?: MasterTarif[] }): Promise<SPK> => {
        const response = await api.post('/api/produksi/spk', payload);
        return response.data;
    },

    updateSPK: async (spkId: string, payload: Partial<SPK>): Promise<SPK> => {
        const response = await api.put(`/api/produksi/spk/${spkId}`, payload);
        return response.data;
    },

    archiveSPK: async (spkId: string): Promise<{ message: string; spk_id: string }> => {
        const response = await api.post(`/api/produksi/spk/${spkId}/archive`);
        return response.data;
    },

    deleteSPK: async (
        spkId: string,
        alasan_hapus = 'Pembatalan SPK'
    ): Promise<{ message: string; spk_id: string }> => {
        const response = await api.post(`/api/produksi/spk/${spkId}/delete`, {
            alasan_hapus,
        });
        return response.data;
    },

    // 🟢 SISIPKAN DI SINI
    ownerFinishSPK: async (spkId: string): Promise<{ message: string; spk_id: string; status: string }> => {
        const response = await api.post(`/api/produksi/spk/${spkId}/owner-finish`);
        return response.data;
    },

    // 2️⃣ Tarif Borongan Sub-Proses
    setTarifBorongan: async (spkId: string, payload: MasterTarif): Promise<MasterTarif> => {
        const response = await api.post(`/api/produksi/spk/${spkId}/tarif`, payload);
        return response.data;
    },

    // 3️⃣ Log Output Borongan Worker
    recordOutput: async (payload: RecordOutputPayload): Promise<LogOutput> => {
        const response = await api.post('/api/produksi/output', payload);
        return response.data;
    },

    getOutputLogs: async (filters: LogOutputFilters = {}): Promise<LogOutput[]> => {
        const response = await api.get('/api/produksi/output', {
            params: cleanQueryParams(filters),
        });
        return response.data;
    },

    deleteOutputLog: async (
        logId: number,
        alasan_hapus = 'Kesalahan Input Data'
    ): Promise<{ message: string; log_id: number }> => {
        const response = await api.post(`/api/produksi/output/${logId}/delete`, null, {
            params: { alasan_hapus }
        });
        return response.data;
    },

    // 4️⃣ Verification QC (Single & Bulk)
    verifyOutput: async (
        logId: number,
        payload: {
            status_verifikasi: StatusVerifikasiOutput;
            catatan?: string;
            foto_bukti_defect?: string;
        }
    ): Promise<LogOutput> => {
        const response = await api.put(`/api/produksi/output/${logId}/verifikasi`, payload);
        return response.data;
    },

    bulkVerifyOutput: async (
        logIds: number[],
        statusVerifikasi: StatusVerifikasiOutput,
        catatan?: string
    ): Promise<BulkVerifyResponse> => {
        const response = await api.post('/api/produksi/output/bulk-verifikasi', {
            log_ids: logIds,
            status_verifikasi: statusVerifikasi,
            catatan,
        });
        return response.data;
    },

    // 5️⃣ Integrasi Payroll & Pencairan Gaji Borongan
    getRekapGajiUnpaid: async (): Promise<RekapGajiPekerjaResponse[]> => {
        const response = await api.get('/api/produksi/payroll/rekap-unpaid');
        return response.data;
    },

    markPayrollPaid: async (
        karyawanIds: string[],
        payrollId: string
    ): Promise<{
        message: string;
        payroll_id: string;
        total_transaksi_paid: number;
        total_nominal_cair_rp: number;
    }> => {
        const response = await api.post('/api/produksi/payroll/mark-paid', {
            karyawan_ids: karyawanIds,
            payroll_id: payrollId,
        });
        return response.data;
    },

    // 6️⃣ Analytics Dashboard Data
    getAnalytics: async (
        startDate?: string,
        endDate?: string,
        spkId?: string
    ): Promise<ProductionAnalyticsDashboard> => {
        const response = await api.get('/api/produksi/analytics', {
            params: cleanQueryParams({
                start_date: startDate,
                end_date: endDate,
                spk_id: spkId,
            }),
        });
        return response.data;
    },
};

export default produksiService;