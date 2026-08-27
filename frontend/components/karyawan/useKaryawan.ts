import { useState, useEffect } from 'react';
import { Karyawan, LogPelanggaran, ArsipKaryawanInfo } from './types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/api';
const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
});

export const generateIdKaryawan = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `KRY-${year}-${randomNum}`;
};

export const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let pass = '';
    for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
};

export function useKaryawan() {
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Tab & Modal States
    const [viewTab, setViewTab] = useState<'AKTIF' | 'ARCHIVED' | 'ALL'>('AKTIF');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSanksiModal, setShowSanksiModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);

    const [selectedKaryawan, setSelectedKaryawan] = useState<Karyawan | null>(null);
    const [selectedArchiveKaryawan, setSelectedArchiveKaryawan] = useState<Karyawan | null>(null);

    // Sanksi States
    const [activeSanksiTab, setActiveSanksiTab] = useState<'list' | 'add'>('list');
    const [sanksiLogs, setSanksiLogs] = useState<LogPelanggaran[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        id_karyawan: generateIdKaryawan(),
        nama: '',
        username: '',
        password: generateRandomPassword(),
        pin: '1234',
        role: 'PRODUKSI',
        jabatan: 'Operator Sewing',
        tanggal_lahir: '2000-01-01',
        no_hp: '',
        alamat: '',
        status_karyawan: 'KONTRAK',
        tanggal_masuk: new Date().toISOString().split('T')[0],
        tipe_pay: 'BORONGAN',
        gaji_pokok: 0,
        tarif_borongan_pcs: 2500
    });

    const [editFormData, setEditFormData] = useState<Karyawan | null>(null);
    const [sanksiData, setSanksiData] = useState({
        jenis: 'Ringan',
        poin: 5,
        keterangan: 'Terlambat masuk shift kerja'
    });

    const showToast = (msg: string, isError = false) => {
        if (isError) setErrorMsg(msg);
        else setSuccessMsg(msg);
        setTimeout(() => {
            setErrorMsg('');
            setSuccessMsg('');
        }, 4000);
    };

    // --- API CALLS ---
    const fetchKaryawan = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/karyawan`, { headers: getAuthHeader() });
            if (!res.ok) throw new Error('Gagal mengambil data karyawan');
            const data = await res.json();
            setKaryawanList(data);
        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan koneksi ke server.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSanksiLogs = async (id_karyawan: string) => {
        setLoadingLogs(true);
        try {
            const res = await fetch(`${API_BASE}/karyawan/${id_karyawan}/pelanggaran`, { headers: getAuthHeader() });
            if (!res.ok) throw new Error('Gagal mengambil riwayat sanksi');
            const data = await res.json();
            setSanksiLogs(data);
        } catch (err: any) {
            console.error(err.message);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchKaryawan();
    }, []);

    // Handlers
    const handleAddKaryawan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/karyawan`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok) {
                const detailMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
                throw new Error(detailMsg || 'Gagal mendaftarkan karyawan');
            }

            showToast(data.message || 'Karyawan berhasil ditambahkan!');
            setShowAddModal(false);
            setFormData({
                id_karyawan: generateIdKaryawan(),
                nama: '',
                username: '',
                password: generateRandomPassword(),
                pin: '1234',
                role: 'PRODUKSI',
                jabatan: 'Operator Sewing',
                tanggal_lahir: '2000-01-01',
                no_hp: '',
                alamat: '',
                status_karyawan: 'KONTRAK',
                tanggal_masuk: new Date().toISOString().split('T')[0],
                tipe_pay: 'BORONGAN',
                gaji_pokok: 0,
                tarif_borongan_pcs: 2500
            });
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const handleEditKaryawan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editFormData) return;
        try {
            const res = await fetch(`${API_BASE}/karyawan/${editFormData.id_karyawan}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify(editFormData)
            });
            const data = await res.json();
            if (!res.ok) {
                const detailMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
                throw new Error(detailMsg || 'Gagal memperbarui data karyawan');
            }

            showToast(`Data karyawan ${editFormData.nama} berhasil diperbarui`);
            setShowEditModal(false);
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const handleConfirmArchive = async (id_karyawan: string, archiveData: ArsipKaryawanInfo) => {
        try {
            const res = await fetch(`${API_BASE}/karyawan/${id_karyawan}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify({ status_karyawan: 'ARCHIVED', is_active: false })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal mengarsipkan karyawan');

            showToast(`Karyawan berhasil diarsipkan (${archiveData.alasan_keluar})`);
            setShowArchiveModal(false);
            setSelectedArchiveKaryawan(null);
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const handleAddSanksi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKaryawan) return;
        try {
            const res = await fetch(`${API_BASE}/karyawan/${selectedKaryawan.id_karyawan}/pelanggaran`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(sanksiData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal mencatat sanksi');

            showToast(data.message || 'Sanksi berhasil dicatat');
            fetchSanksiLogs(selectedKaryawan.id_karyawan);
            fetchKaryawan();
            setActiveSanksiTab('list');
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const handleDeleteSingleSanksi = async (id_log: number, jenis: string, poin: number) => {
        if (!confirm(`Apakah Anda yakin ingin mencabut sanksi "${jenis}" (-${poin} poin)?`)) return;
        try {
            const res = await fetch(`${API_BASE}/pelanggaran/${id_log}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal mencabut sanksi');

            showToast('Sanksi berhasil dicabut!');
            if (selectedKaryawan) fetchSanksiLogs(selectedKaryawan.id_karyawan);
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const handleResetSanksi = async () => {
        if (!selectedKaryawan) return;
        if (!confirm(`Apakah Anda yakin ingin MERESET seluruh poin sanksi "${selectedKaryawan.nama}" menjadi 0?`)) return;
        try {
            const res = await fetch(`${API_BASE}/karyawan/${selectedKaryawan.id_karyawan}/reset-sanksi`, {
                method: 'PUT',
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal mereset sanksi');

            showToast(`Poin sanksi ${selectedKaryawan.nama} berhasil dibersihkan!`);
            fetchSanksiLogs(selectedKaryawan.id_karyawan);
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const handleDelete = async (id: string, nama: string) => {
        if (!confirm(`Apakah Anda yakin ingin MENGHAPUS PERMANEN data "${nama}"? (Disarankan pilih Arsip)`)) return;
        try {
            const res = await fetch(`${API_BASE}/karyawan/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal menghapus data');

            showToast(data.message || 'Data karyawan berhasil dihapus');
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    // Filter Calculation
    const filteredKaryawan = karyawanList.filter(k => {
        const isArchived = k.status_karyawan === 'ARCHIVED' || k.is_active === false;
        if (viewTab === 'AKTIF' && isArchived) return false;
        if (viewTab === 'ARCHIVED' && !isArchived) return false;

        return (
            k.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.id_karyawan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.jabatan?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const totalAktif = karyawanList.filter(k => k.status_karyawan !== 'ARCHIVED' && k.is_active !== false).length;
    const totalArchived = karyawanList.filter(k => k.status_karyawan === 'ARCHIVED' || k.is_active === false).length;

    return {
        // States
        karyawanList, filteredKaryawan, searchQuery, setSearchQuery, loading, errorMsg, successMsg,
        viewTab, setViewTab, totalAktif, totalArchived,
        showAddModal, setShowAddModal, showEditModal, setShowEditModal,
        showSanksiModal, setShowSanksiModal, showArchiveModal, setShowArchiveModal,
        selectedKaryawan, setSelectedKaryawan, selectedArchiveKaryawan, setSelectedArchiveKaryawan,
        activeSanksiTab, setActiveSanksiTab, sanksiLogs, loadingLogs,
        formData, setFormData, editFormData, setEditFormData, sanksiData, setSanksiData,
        // Handlers
        handleAddKaryawan, handleEditKaryawan, handleConfirmArchive,
        handleAddSanksi, handleDeleteSingleSanksi, handleResetSanksi, handleDelete,
        fetchSanksiLogs,
        fetchKaryawan // 👈 PASTI KAN DITAMBAHKAN DI SINI
    };

}