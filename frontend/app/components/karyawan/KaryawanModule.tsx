import React, { useState, useEffect } from 'react';
import { UserPlus, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Karyawan, LogPelanggaran, KaryawanModuleProps } from './types';
import { KaryawanTable } from './KaryawanTable';
import { AddKaryawanModal } from './AddKaryawanModal';
import { EditKaryawanModal } from './EditKaryawanModal';
import { SanksiModal } from './SanksiModal';

export const KaryawanModule: React.FC<KaryawanModuleProps> = ({ activeUser }) => {
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // --- MODAL STATES ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSanksiModal, setShowSanksiModal] = useState(false);
    const [selectedKaryawan, setSelectedKaryawan] = useState<Karyawan | null>(null);

    // --- SANKSI TAB & LOG STATES ---
    const [activeSanksiTab, setActiveSanksiTab] = useState<'list' | 'add'>('list');
    const [sanksiLogs, setSanksiLogs] = useState<LogPelanggaran[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Helper Generator Password Acak (8 Karakter)
    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
        let pass = '';
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    // --- FORM STATES ---
    const [formData, setFormData] = useState({
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

    // API Helpers
    const API_BASE = 'http://127.0.0.1:8000/api';
    const getAuthHeader = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
    });

    // Fetch List Karyawan
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

    // Fetch Log Sanksi Karyawan
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

    const showToast = (msg: string, isError = false) => {
        if (isError) setErrorMsg(msg);
        else setSuccessMsg(msg);
        setTimeout(() => {
            setErrorMsg('');
            setSuccessMsg('');
        }, 4000);
    };

    const handleOpenSanksiModal = (karyawan: Karyawan) => {
        setSelectedKaryawan(karyawan);
        setActiveSanksiTab('list');
        setShowSanksiModal(true);
        fetchSanksiLogs(karyawan.id_karyawan);
    };

    // Handlers
    const handleAddKaryawan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal mendaftarkan karyawan');

            showToast(`🟢 ${data.message}`);
            setShowAddModal(false);
            setFormData(prev => ({ ...prev, password: generateRandomPassword(), nama: '', username: '' }));
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
            if (!res.ok) throw new Error(data.detail || 'Gagal memperbarui data karyawan');

            showToast(`✏️ Data karyawan ${editFormData.nama} berhasil diperbarui`);
            setShowEditModal(false);
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

            showToast(`⚠️ ${data.message}`);
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

            showToast(`🧹 Sanksi berhasil dicabut!`);
            if (selectedKaryawan) {
                fetchSanksiLogs(selectedKaryawan.id_karyawan);
            }
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

            showToast(`🧹 Poin sanksi ${selectedKaryawan.nama} berhasil dibersihkan!`);
            fetchSanksiLogs(selectedKaryawan.id_karyawan);
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const handleDelete = async (id: string, nama: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus karyawan "${nama}"?`)) return;
        try {
            const res = await fetch(`${API_BASE}/karyawan/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Gagal menghapus data');

            showToast(`🗑️ ${data.message}`);
            fetchKaryawan();
        } catch (err: any) {
            showToast(err.message, true);
        }
    };

    const filteredKaryawan = karyawanList.filter(k =>
        k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.id_karyawan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.jabatan?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Toast Notifications */}
            {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{errorMsg}</span>
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>👥 Kelola Data Karyawan</span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Manajemen SDM, skema borongan/bulanan, dan log sanksi kedisiplinan pabrik.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama / ID / jabatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all w-64"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setFormData(prev => ({ ...prev, password: generateRandomPassword() }));
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Tambah Karyawan</span>
                    </button>
                </div>
            </div>

            {/* Tabel Utama */}
            <KaryawanTable
                loading={loading}
                karyawanList={filteredKaryawan}
                onEdit={(k) => { setEditFormData({ ...k }); setShowEditModal(true); }}
                onSanksi={handleOpenSanksiModal}
                onDelete={handleDelete}
            />

            {/* Modals */}
            <AddKaryawanModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddKaryawan}
                onGeneratePassword={() => setFormData({ ...formData, password: generateRandomPassword() })}
            />

            <EditKaryawanModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                onSubmit={handleEditKaryawan}
            />

            <SanksiModal
                isOpen={showSanksiModal}
                onClose={() => setShowSanksiModal(false)}
                selectedKaryawan={selectedKaryawan}
                activeTab={activeSanksiTab}
                setActiveTab={setActiveSanksiTab}
                sanksiLogs={sanksiLogs}
                loadingLogs={loadingLogs}
                sanksiData={sanksiData}
                setSanksiData={setSanksiData}
                onAddSanksi={handleAddSanksi}
                onDeleteSingleSanksi={handleDeleteSingleSanksi}
                onResetSanksi={handleResetSanksi}
            />
        </div>
    );
};

export default KaryawanModule;