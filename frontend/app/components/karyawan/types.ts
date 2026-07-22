export interface Karyawan {
    id_karyawan: string;
    nama: string;
    username: string;
    role: string;
    jabatan: string;
    tanggal_lahir?: string;
    no_hp?: string;
    alamat?: string;
    status_karyawan: string;
    tanggal_masuk?: string;
    is_active: boolean;
    tipe_pay: string;
    gaji_pokok: number;
    tarif_borongan_pcs: number;
    poin_pelanggaran: number;
}

export interface LogPelanggaran {
    id: number;
    id_karyawan: string;
    jenis: string;
    poin: number;
    keterangan: string;
    tanggal: string;
}

export interface KaryawanModuleProps {
    activeUser?: {
        id_karyawan?: string;
        nama?: string;
        role?: string;
        username?: string;
    } | any;
}