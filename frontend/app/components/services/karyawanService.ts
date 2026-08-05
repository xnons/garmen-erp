import api from './api';

export type RoleKaryawan =
    | 'OWNER'
    | 'ADMIN'
    | 'CHECKER'
    | 'PEKERJA'
    | 'PRODUKSI'
    | 'FINANCE'
    | 'GUDANG'
    | 'DEVELOPER';

export interface Karyawan {
    id_karyawan: string;
    nama: string;
    username?: string;
    nik?: string;
    jabatan: string;
    divisi?: string;
    no_hp?: string;
    alamat?: string;
    is_active: boolean;
    role: RoleKaryawan;
    tipe_pay?: 'BORONGAN' | 'HARIAN' | 'BULANAN';
    pin?: string;
    created_at?: string;
    updated_at?: string;
}

export interface KaryawanFilterParams {
    search?: string;
    role?: RoleKaryawan;
    divisi?: string;
    is_active?: boolean;
}

// Helper sanitasi parameter query
const cleanQueryParams = (params: Record<string, any>): Record<string, any> => {
    const cleaned: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            cleaned[key] = value;
        }
    });
    return cleaned;
};

export const karyawanService = {
    getAllKaryawan: async (filters: KaryawanFilterParams = {}): Promise<Karyawan[]> => {
        const response = await api.get('/api/karyawan', {
            params: cleanQueryParams(filters)
        });
        return response.data;
    },

    getKaryawanProduksi: async (): Promise<Karyawan[]> => {
        const response = await api.get('/api/karyawan', {
            params: cleanQueryParams({ role: 'PRODUKSI', is_active: true })
        });
        return response.data;
    },

    getKaryawanById: async (id: string): Promise<Karyawan> => {
        const response = await api.get(`/api/karyawan/${id}`);
        return response.data;
    },

    createKaryawan: async (payload: Omit<Karyawan, 'created_at' | 'updated_at'>): Promise<Karyawan> => {
        const response = await api.post('/api/karyawan', payload);
        return response.data;
    },

    updateKaryawan: async (id: string, payload: Partial<Karyawan>): Promise<Karyawan> => {
        const response = await api.put(`/api/karyawan/${id}`, payload);
        return response.data;
    },

    toggleStatusKaryawan: async (id: string, isActive: boolean): Promise<Karyawan> => {
        const response = await api.patch(`/api/karyawan/${id}/status`, { is_active: isActive });
        return response.data;
    },

    verifyPin: async (pin: string): Promise<{ valid: boolean; message?: string }> => {
        const response = await api.post('/api/karyawan/verify-pin', { pin });
        return response.data;
    },

    updatePin: async (id: string, newPin: string): Promise<{ message: string }> => {
        const response = await api.put(`/api/karyawan/${id}/pin`, { pin: newPin });
        return response.data;
    }
};

export default karyawanService; 