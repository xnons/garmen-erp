"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { ClipboardList, CheckCircle2, Settings, AlertCircle, FileCheck, RefreshCw, BarChart2, BookOpen, X } from 'lucide-react';
import {
    produksiService,
    SPK,
    LogOutput,
    TahapanProses,
    StatusVerifikasiOutput,
    LogOutputFilters
} from '../services/produksiService';
import { Karyawan } from '../services/karyawanService';

import FormInputOutput, { FormInputState } from './FormInputOutput';
import TableOutputHariIni from './TableOutputHariIni';
import TabVerifikasiQC from './TabVerifikasiQC';
import TabSPKTarif from './TabSPKTarif';
import SPKModal from './SPKModal';
import TabAnalitik from './TabAnalitik';
import LightboxModal from './LightboxModal';
import TabTutorial from './TabTutorial';

type TabType = 'input' | 'qc' | 'spk' | 'analitik' | 'tutorial';

interface ProduksiPageProps {
    currentUser?: {
        id_karyawan?: string;
        nama?: string;
        role?: string;
    };
}

export const extractErrorMessage = (err: any): string => {
    if (!err) return 'Terjadi kesalahan tidak diketahui.';

    const detail = err.response?.data?.detail;

    if (typeof detail === 'string') {
        return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
        return detail
            .map((item) => {
                if (typeof item === 'string') return item;
                const field = item.loc ? item.loc[item.loc.length - 1] : '';
                return field ? `[${field}] ${item.msg}` : item.msg || JSON.stringify(item);
            })
            .join(' | ');
    }

    if (typeof detail === 'object' && detail !== null) {
        return detail.msg || detail.message || JSON.stringify(detail);
    }

    return err.message || 'Gagal terhubung ke server backend.';
};

export default function ProduksiPage({ currentUser }: ProduksiPageProps) {
    const [activeTab, setActiveTab] = useState<TabType>('input');

    // Data States
    const [spkList, setSpkList] = useState<SPK[]>([]);
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [outputLogs, setOutputLogs] = useState<LogOutput[]>([]);

    // Loading & Feedback States
    const [loading, setLoading] = useState<boolean>(false);
    const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // Lightbox State
    const [lightboxData, setLightboxData] = useState<{
        isOpen: boolean;
        url?: string;
        title?: string;
        caption?: string;
    }>({ isOpen: false });

    // Form Input State
    const [formInput, setFormInput] = useState<FormInputState>({
        tanggal: '',
        karyawan_id: '',
        spk_id: '',
        tahapan_proses: 'SEWING',
        nomor_tiket: '',
        qty_disetor: '',
        qty_pass: '',
        qty_rework: '0',
        qty_scrap: '0',
        qty_reject: '0',
        catatan: ''
    });

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        setFormInput((prev) => ({ ...prev, tanggal: todayStr }));
    }, []);

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [dataSPK, dataKaryawan] = await Promise.all([
                produksiService.getAllSPK(),
                produksiService.getKaryawanProduksi().catch(() => [])
            ]);

            setSpkList(dataSPK.filter((s) => s.status !== 'ARCHIVED'));
            setKaryawanList(dataKaryawan as unknown as Karyawan[]);
        } catch (err: any) {
            setErrorMessage(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchOutputLogs = useCallback(async (filters?: LogOutputFilters) => {
        try {
            setLoading(true);
            const logs = await produksiService.getOutputLogs(filters);
            setOutputLogs(logs);
        } catch (err: any) {
            console.error('Gagal mengambil log output borongan:', err);
            setErrorMessage(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
        fetchOutputLogs();
    }, [loadInitialData, fetchOutputLogs]);

    useEffect(() => {
        if (activeTab === 'qc' || activeTab === 'input') {
            fetchOutputLogs();
        }
    }, [activeTab, fetchOutputLogs]);

    const handleQtyDisetorChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const rejectVal = parseInt(formInput.qty_reject || '0', 10) || 0;
        const disetorVal = parseInt(val, 10) || 0;
        const passVal = Math.max(0, disetorVal - rejectVal);

        setFormInput((prev) => ({
            ...prev,
            qty_disetor: val,
            qty_pass: String(passVal)
        }));
    };

    const handleSubmitOutput = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsSubmittingForm(true);

        try {
            await produksiService.recordOutput({
                tanggal: formInput.tanggal,
                karyawan_id: formInput.karyawan_id,
                spk_id: formInput.spk_id,
                tahapan_proses: formInput.tahapan_proses as TahapanProses,
                nomor_tiket: formInput.nomor_tiket || '',
                qty_disetor: parseInt(formInput.qty_disetor || '0', 10),
                qty_pass: parseInt(formInput.qty_pass || '0', 10),
                qty_rework: parseInt(formInput.qty_rework || '0', 10),
                qty_scrap: parseInt(formInput.qty_scrap || '0', 10),
                qty_reject: parseInt(formInput.qty_reject || '0', 10),
                catatan: formInput.catatan.trim() || undefined
            });

            setSuccessMessage('Output borongan berhasil dicatat & menunggu verifikasi QC!');

            setFormInput((prev) => ({
                ...prev,
                nomor_tiket: '',
                qty_disetor: '',
                qty_pass: '',
                qty_rework: '0',
                qty_scrap: '0',
                qty_reject: '0',
                catatan: ''
            }));

            fetchOutputLogs();
        } catch (err: any) {
            setErrorMessage(extractErrorMessage(err));
        } finally {
            setIsSubmittingForm(false);
        }
    };

    const handleVerify = async (logId: number, statusQC: StatusVerifikasiOutput) => {
        try {
            await produksiService.verifyOutput(logId, {
                status_verifikasi: statusQC,
                catatan: statusQC === 'APPROVED' ? 'Disetujui Checker/Mandor' : 'Ditolak/Revisi'
            });
            setSuccessMessage(`Status verifikasi setoran #${logId} berhasil diperbarui.`);
            fetchOutputLogs();
        } catch (err: any) {
            setErrorMessage(extractErrorMessage(err));
        }
    };

    const handleBulkVerify = async (logIds: number[], statusQC: StatusVerifikasiOutput) => {
        try {
            const res = await produksiService.bulkVerifyOutput(logIds, statusQC);
            let msg = `Berhasil memverifikasi ${res.verified_count} setoran.`;
            if (res.skipped_self_verify > 0) {
                msg += ` (${res.skipped_self_verify} setoran dilewati karena pengerjaan/inputan sendiri).`;
            }

            setSuccessMessage(msg);
            fetchOutputLogs();
        } catch (err: any) {
            setErrorMessage(extractErrorMessage(err));
        }
    };

    // 🟢 Menerima type `string | undefined` untuk mencegah error TS2345
    const handleOpenLightbox = (url?: string, title?: string, caption?: string) => {
        if (!url) return;
        setLightboxData({
            isOpen: true,
            url,
            title: title || 'Dokumen Bukti Foto',
            caption
        });
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
            {/* HEADER PAGE & NAVIGATION TABS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-wide">Modul Produksi Borongan</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Pencatatan output harian, verifikasi QC anti-fraud, dan penetapan tarif borongan SPK
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            loadInitialData();
                            fetchOutputLogs();
                        }}
                        disabled={loading}
                        className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all mr-2"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('input')}
                            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'input'
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                        >
                            <ClipboardList className="w-4 h-4" />
                            Input Output Harian
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('qc')}
                            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'qc'
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Verifikasi QC
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('spk')}
                            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'spk'
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            SPK & Tarif
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('analitik')}
                            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'analitik'
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                        >
                            <BarChart2 className="w-4 h-4" />
                            Dashboard Analitik
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('tutorial')}
                            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'tutorial'
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Tutorial
                        </button>
                    </div>
                </div>
            </div>

            {/* FEEDBACK ALERTS */}
            {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between rounded-xl shadow-lg backdrop-blur-sm animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage('')}
                        className="p-1 text-rose-400 hover:text-white rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between rounded-xl shadow-lg backdrop-blur-sm animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <FileCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span className="font-medium">{successMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage('')}
                        className="p-1 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* TAB CONTENT 1: INPUT OUTPUT HARIAN */}
            {activeTab === 'input' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <FormInputOutput
                        formInput={formInput}
                        setFormInput={setFormInput}
                        karyawanList={karyawanList}
                        spkList={spkList}
                        handleQtyDisetorChange={handleQtyDisetorChange}
                        handleSubmitOutput={handleSubmitOutput}
                        isSubmitting={isSubmittingForm}
                    />
                    <TableOutputHariIni
                        outputLogs={outputLogs}
                        onOpenLightbox={handleOpenLightbox}
                        karyawanList={karyawanList.map((k) => ({ id_karyawan: k.id_karyawan, nama: k.nama }))}
                        spkList={spkList.map((s) => ({ id: s.id, nama_artikel: s.nama_artikel }))}
                        onFetchLogs={fetchOutputLogs}
                        isLoading={loading}
                    />
                </div>
            )}

            {/* TAB CONTENT 2: VERIFIKASI QC */}
            {activeTab === 'qc' && (
                <TabVerifikasiQC
                    outputLogs={outputLogs}
                    handleVerify={handleVerify}
                    handleBulkVerify={handleBulkVerify}
                    currentUserId={currentUser?.id_karyawan || currentUser?.nama}
                    onOpenLightbox={handleOpenLightbox}
                />
            )}

            {/* TAB CONTENT 3: DAFTAR SPK & TARIF */}
            {activeTab === 'spk' && (
                <TabSPKTarif
                    spkList={spkList}
                    currentUser={currentUser}
                    onOpenModal={() => setIsModalOpen(true)}
                    onRefresh={() => loadInitialData()}
                />
            )}

            {/* TAB CONTENT 4: DASHBOARD ANALITIK */}
            {activeTab === 'analitik' && <TabAnalitik />}

            {/* TAB CONTENT 5: PANDUAN TUTORIAL */}
            {activeTab === 'tutorial' && <TabTutorial />}

            {/* MODAL RILIS SPK BARU */}
            <SPKModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => loadInitialData()}
            />

            {/* MODAL LIGHTBOX FOTO */}
            <LightboxModal
                isOpen={lightboxData.isOpen}
                imageUrl={lightboxData.url}
                title={lightboxData.title}
                caption={lightboxData.caption}
                onClose={() => setLightboxData({ isOpen: false })}
            />
        </div>
    );
}