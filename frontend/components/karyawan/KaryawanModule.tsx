'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { KaryawanModuleProps } from './types';
import { KaryawanTable } from './KaryawanTable';
import { AddKaryawanModal } from './AddKaryawanModal';
import { EditKaryawanModal } from './EditKaryawanModal';
import { SanksiModal } from './SanksiModal';
import { KaryawanArchiveModal } from './KaryawanArchiveModal';
import { KaryawanHeader } from './KaryawanHeader';
import { useKaryawan, generateIdKaryawan, generateRandomPassword } from './useKaryawan';

export const KaryawanModule: React.FC<KaryawanModuleProps> = ({ activeUser }) => {
    const {
        karyawanList, filteredKaryawan, searchQuery, setSearchQuery, loading, errorMsg, successMsg,
        viewTab, setViewTab, totalAktif, totalArchived,
        showAddModal, setShowAddModal, showEditModal, setShowEditModal,
        showSanksiModal, setShowSanksiModal, showArchiveModal, setShowArchiveModal,
        selectedKaryawan, setSelectedKaryawan, selectedArchiveKaryawan, setSelectedArchiveKaryawan,
        activeSanksiTab, setActiveSanksiTab, sanksiLogs, loadingLogs,
        formData, setFormData, editFormData, setEditFormData, sanksiData, setSanksiData,
        handleAddKaryawan, handleEditKaryawan, handleConfirmArchive,
        handleAddSanksi, handleDeleteSingleSanksi, handleResetSanksi, handleDelete,
        fetchSanksiLogs, fetchKaryawan
    } = useKaryawan();

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

            {/* Header & Controls dengan Tombol Refresh */}
            <KaryawanHeader
                viewTab={viewTab}
                setViewTab={setViewTab}
                totalAktif={totalAktif}
                totalArchived={totalArchived}
                totalAll={karyawanList.length}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onRefresh={fetchKaryawan}
                loading={loading}
                onOpenAddModal={() => {
                    setFormData(prev => ({
                        ...prev,
                        id_karyawan: generateIdKaryawan(),
                        password: generateRandomPassword()
                    }));
                    setShowAddModal(true);
                }}
            />

            {/* Tabel Utama */}
            <KaryawanTable
                loading={loading}
                karyawanList={filteredKaryawan}
                onEdit={(k) => { setEditFormData({ ...k }); setShowEditModal(true); }}
                onSanksi={(k) => {
                    setSelectedKaryawan(k);
                    setActiveSanksiTab('list');
                    setShowSanksiModal(true);
                    fetchSanksiLogs(k.id_karyawan);
                }}
                onArchive={(k) => {
                    setSelectedArchiveKaryawan(k);
                    setShowArchiveModal(true);
                }}
                onDelete={handleDelete}
            />

            {/* Modals Operasional */}
            <AddKaryawanModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAddKaryawan}
                onGeneratePassword={() => setFormData(prev => ({ ...prev, password: generateRandomPassword() }))}
                activeUser={activeUser}
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

            <KaryawanArchiveModal
                karyawan={selectedArchiveKaryawan}
                onClose={() => {
                    setShowArchiveModal(false);
                    setSelectedArchiveKaryawan(null);
                }}
                onConfirmArchive={handleConfirmArchive}
            />
        </div>
    );
};

export default KaryawanModule;