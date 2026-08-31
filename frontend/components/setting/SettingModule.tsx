'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  LogOut,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  BarChart3,
  ShieldAlert,
  Award,
  Activity,
  Phone,
  MapPin,
  Briefcase,
  Wallet,
  BadgeCheck,
  CreditCard,
  Building,
  KeyRound,
  ShieldCheck,
  Lock,
  ExternalLink,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { UpdatePinModal } from './UpdatePinModal';

interface LogPelanggaranItem {
  id?: string | number;
  tanggal: string;
  jenis: string;
  poin: number;
  keterangan: string;
}

interface SettingModuleProps {
  activeUser: any;
  onLogout: () => void;
  onNavigateMenu?: (menuId: string) => void;
}

export default function SettingModule({ activeUser, onLogout, onNavigateMenu }: SettingModuleProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pelanggaranList, setPelanggaranList] = useState<LogPelanggaranItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const userRole = (activeUser?.role || 'PRODUKSI').toUpperCase();
  const isOwnerOrDev = ['OWNER', 'DEVELOPER'].includes(userRole);

  // Safe IDR Currency Formatter
  const formatIDR = (val: number) => {
    const num = Number(val);
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Data Absensi Real
  const dataAbsensi = {
    hadir: activeUser?.total_hadir ?? 0,
    terlambat: activeUser?.total_terlambat ?? 0,
    izin: activeUser?.total_izin ?? 0,
    alpa: activeUser?.total_alpa ?? 0,
  };

  // Kalkulasi Skor Kepatuhan Kerja (100 - Total Poin Pelanggaran)
  const totalPoinPelanggaran = activeUser?.poin_pelanggaran ??
    pelanggaranList.reduce((acc, curr) => acc + curr.poin, 0);

  const skorKepatuhan = Math.max(0, 100 - totalPoinPelanggaran);

  // Fetch Data Pelanggaran Real-time dari Database / API
  useEffect(() => {
    const fetchUserLogs = async () => {
      if (!activeUser?.id && !activeUser?.id_karyawan) return;
      setLoadingData(true);
      try {
        const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';

        const res = await fetch(`${API_BASE}/karyawan/me/pelanggaran`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setPelanggaranList(Array.isArray(data) ? data : []);
        } else {
          setPelanggaranList([]);
        }
      } catch (err) {
        console.warn('Gagal memuat riwayat pelanggaran:', err);
        setPelanggaranList([]);
      } finally {
        setLoadingData(false);
      }
    };

    fetchUserLogs();
  }, [activeUser]);

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-950 text-slate-100 space-y-6 custom-scrollbar">

      {/* Header Module */}
      <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <User className="w-6 h-6 text-indigo-400" />
            Pengaturan & Akun Pengguna
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Informasi profil kepegawaian, skema kerja, evaluasi kepatuhan, serta kontrol keamanan akun.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil & Kepegawaian</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan & Akses</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFIL & KEPEGAWAIAN                                              */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">

          {/* LEFT COLUMN: KARTU PROFIL UTAMA & STATUS AKUN */}
          <div className="lg:col-span-1 bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-5">

              {/* Avatar & Identitas Singkat */}
              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black border border-indigo-500/30 shadow-lg shadow-indigo-500/20 shrink-0">
                  {activeUser?.nama?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg text-white truncate">{activeUser?.nama || "Nama Karyawan"}</h3>
                  <p className="text-xs text-slate-400 truncate">@{activeUser?.username || "user"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {activeUser?.role || "PRODUKSI"}
                    </span>
                    <span className="inline-block text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      {activeUser?.is_active !== false ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Identitas Kunci */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-indigo-400" /> ID Karyawan
                  </span>
                  <span className="font-mono text-white font-bold">{activeUser?.id_karyawan || "KRY-XXXX"}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Jabatan
                  </span>
                  <span className="text-slate-200 font-medium">{activeUser?.jabatan || "Staff Operasional"}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-400" /> Status Kepegawaian
                  </span>
                  <span className="text-amber-400 font-bold tracking-wide uppercase">
                    {activeUser?.status_karyawan || "TETAP"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Tanggal Masuk
                  </span>
                  <span className="text-slate-300 font-mono">{activeUser?.tanggal_masuk || "-"}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full py-3 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Aplikasi</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAIL DATA KEPEGAWAIAN, PENGGAJIAN, GRAFIK & HRD */}
          <div className="lg:col-span-2 space-y-6">

            {/* SECTION 1: INFORMASI DETAIL BIODATA & PENGGAJIAN */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Biodata & Skema Penggajian</h3>
                  <p className="text-[11px] text-slate-400">Rincian kontak personal dan struktur imbalan kerja</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                {/* Card Kontak & Domisili */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Kontak & Biodata</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. WhatsApp / HP:</span>
                    <span className="text-white font-mono">{activeUser?.no_hp || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tanggal Lahir:</span>
                    <span className="text-slate-200 font-mono">{activeUser?.tanggal_lahir || "-"}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-400" /> Alamat Domisili:
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 text-[11px]">
                      {activeUser?.alamat || "Belum diisi"}
                    </p>
                  </div>
                </div>

                {/* Card Skema Penggajian */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-1">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Skema Finansial & Gaji</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tipe Penggajian:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[10px] uppercase">
                      {activeUser?.tipe_pay || "BULANAN"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Gaji Pokok Flat:</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">
                      {formatIDR(activeUser?.gaji_pokok ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tarif Borongan (per Pcs):</span>
                    <span className="text-sky-400 font-bold font-mono">
                      {formatIDR(activeUser?.tarif_borongan_pcs ?? 0)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 2: VISUAL GRAFIK KEPATUHAN KERJA */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Indeks & Grafik Kepatuhan Kerja</h3>
                    <p className="text-[11px] text-slate-400">Parameter otomatis berdasarkan absensi & poin sanksi</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{skorKepatuhan}</span>
                  <span className="text-xs text-slate-400"> / 100 Pts</span>
                </div>
              </div>

              {/* Progress Bar Score Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" /> Performance Metric
                  </span>
                  <span className={skorKepatuhan >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {skorKepatuhan >= 80 ? 'SANGAT BAIK' : skorKepatuhan >= 60 ? 'CUKUP' : 'PERLU EVALUASI'}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${skorKepatuhan >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : skorKepatuhan >= 60
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-rose-500 to-red-400'
                      }`}
                    style={{ width: `${skorKepatuhan}%` }}
                  />
                </div>
              </div>

              {/* Mini Visual Bar Chart Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Kedisiplinan</p>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${Math.max(10, 100 - (dataAbsensi.terlambat * 10))}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Presensi</p>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${Math.max(10, 100 - (dataAbsensi.alpa * 25))}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">SOP Produksi</p>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${Math.max(10, 100 - (totalPoinPelanggaran * 5))}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Sanksi Aktif</p>
                  <p className="text-xs font-bold text-rose-400 font-mono">+{totalPoinPelanggaran} Pts</p>
                </div>
              </div>
            </div>

            {/* SECTION 3: REKAP ABSENSI BULAN INI */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Rekap Absensi Bulan Ini</h3>
                  <p className="text-[11px] text-slate-400">Diperbarui secara real-time dari sistem HRD</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1 font-medium">Hadir</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">{dataAbsensi.hadir}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Hari</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1 font-medium">Terlambat</span>
                  <span className="text-2xl font-bold text-amber-400 font-mono">{dataAbsensi.terlambat}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Kali</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1 font-medium">Izin / Sakit</span>
                  <span className="text-2xl font-bold text-sky-400 font-mono">{dataAbsensi.izin}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Hari</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1 font-medium">Alpa</span>
                  <span className="text-2xl font-bold text-rose-400 font-mono">{dataAbsensi.alpa}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Hari</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: LOG POIN KEPATUHAN & PELANGGARAN */}
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Log Poin Kepatuhan & Pelanggaran</h3>
                    <p className="text-[11px] text-slate-400">
                      Akumulasi sanksi aktif: <span className="text-amber-400 font-bold font-mono">{totalPoinPelanggaran} Poin</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Tanggal</th>
                      <th className="pb-3 font-semibold">Jenis Pelanggaran</th>
                      <th className="pb-3 font-semibold">Keterangan Detail</th>
                      <th className="pb-3 font-semibold text-right">Poin Sanksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {pelanggaranList.length > 0 ? (
                      pelanggaranList.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 font-mono text-slate-400">{item.tanggal}</td>
                          <td className="py-3 font-medium text-amber-400">{item.jenis}</td>
                          <td className="py-3 text-slate-400 max-w-xs truncate">{item.keterangan}</td>
                          <td className="py-3 text-right font-bold text-rose-400 font-mono">+{item.poin}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500/50 mb-1" />
                          <span>Tidak ada catatan pelanggaran aktif. Pertahankan kinerja Anda!</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KEAMANAN & AKSES (PASSWORD & PIN GATE)                            */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-5xl animate-in fade-in duration-200">

          {/* 1. KEBIJAKAN PASSWORD TERPUSAT (ATASAN TERTINGGI) */}
          <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-slate-900/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl shrink-0">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Kebijakan Keamanan Kredensial Terpusat</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full uppercase">
                    Audit Protected
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sesuai arahan dan standar operasional Nexora Garment ERP, fitur ubah kata sandi mandiri (*self-service*) ditiadakan guna mencegah kecurangan, pemalsuan identitas, dan penyalahgunaan wewenang. Seluruh reset kata sandi dan hak akses dioperasikan langsung secara terpusat oleh <strong className="text-white">Atasan Tertinggi (Owner / Developer)</strong> dengan pencatatan jejak audit (*Audit Trail*).
                </p>
              </div>
            </div>

            {/* Info Kredensial Saat Ini */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Username Login</span>
                <span className="font-mono font-bold text-white">{activeUser?.username || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Level Wewenang</span>
                <span className="font-bold text-indigo-400">{userRole}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status Proteksi Akun</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Aman
                </span>
              </div>
            </div>

            {/* Aksi Berdasarkan Role */}
            {isOwnerOrDev ? (
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-800/80">
                <div className="text-xs text-slate-400">
                  Sebagai <strong className="text-white">{userRole}</strong>, Anda memiliki hak penuh untuk mereset kata sandi dan memperbarui akses seluruh akun pekerja.
                </div>
                {onNavigateMenu && (
                  <button
                    type="button"
                    onClick={() => onNavigateMenu('karyawan')}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 shrink-0"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Buka Kelola Karyawan</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-200">Perlu Pembaruan Kata Sandi?</span>
                  Silakan hubungi Owner atau Developer perusahaan secara langsung. Atasan Anda akan memverifikasi identitas Anda dan menerbitkan kata sandi baru melalui konsol Kelola Karyawan.
                </div>
              </div>
            )}
          </div>

          {/* 2. PIN ACCESS GATE KEAMANAN */}
          <div className="bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">PIN Access Gate</h3>
                  <p className="text-xs text-slate-400">PIN 4–6 digit untuk otorisasi tindakan sensitif pada sistem</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                PIN Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 block font-medium">Fungsi PIN Security Gate:</span>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>Otorisasi pencairan gaji & payroll</li>
                  <li>Konfirmasi hapus & arsip data master</li>
                  <li>Verifikasi akses tindakan level tinggi</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Status Kredensial PIN:</span>
                  <p className="text-xs text-slate-200 mt-1">
                    PIN Security Gate Anda saat ini aktif dan terenkripsi menggunakan protokol keamanan standar industri.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(true)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700 hover:border-slate-600"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ubah PIN Security Gate</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. LOG AKTIVITAS SESI & PERANGKAT */}
          <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Informasi Sesi Login</h4>
                <p className="text-[11px] text-slate-400">Status koneksi aktif akun Anda pada perangkat ini</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Tipe Klien</span>
                <span className="font-semibold text-slate-200">Browser Web ERP</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Enkripsi Sesi</span>
                <span className="font-mono text-emerald-400 font-bold">JWT Bearer HS256</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[10px]">Waktu Server</span>
                <span className="font-mono text-slate-300">{new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODAL UBAH PIN SECURITY GATE */}
      <UpdatePinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        activeUser={activeUser}
      />

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-modal-pop">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Konfirmasi Keluar</h4>
              <p className="text-xs text-slate-400">
                Sesi Anda akan diakhiri. Apakah Anda yakin ingin keluar dari sistem Nexora ERP?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => { setShowLogoutModal(false); onLogout(); }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}