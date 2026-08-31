"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Search, RefreshCw, DollarSign, CheckCircle2, 
  Layers, UserCheck, Calendar, FileText, User, Scissors, AlertTriangle,
  SlidersHorizontal, LayoutGrid, List, ChevronRight, X
} from 'lucide-react';
import api from '@/services/api';

const OPERATION_PRESETS: { id: string; label: string; defaultRate: number; category: string }[] = [
  { id: "JAHIT_SEWING", label: "🧵 Jahit Sewing Internal (Celana/Kemeja)", defaultRate: 2500, category: "SEWING" },
  { id: "OBRAS", label: "🪡 Obras & Overdeck Sambung Pola", defaultRate: 800, category: "SEWING" },
  { id: "STIM", label: "♨️ Steam Uap Finishing (Johan)", defaultRate: 550, category: "FINISHING" },
  { id: "PASANG_KANCING", label: "🔘 Pasang Kancing (Dedi)", defaultRate: 200, category: "FINISHING" },
  { id: "LUBANG_KANCING", label: "🕳️ Lubang Kancing (Buttonhole)", defaultRate: 150, category: "FINISHING" },
  { id: "BUANG_BENANG", label: "✂️ Buang Benang / Trimming (Erika/Frika)", defaultRate: 150, category: "FINISHING" },
  { id: "LIPAT", label: "📐 Lipat & Pasang Hangtag", defaultRate: 250, category: "FINISHING" },
  { id: "PACKING", label: "📦 Packing Plastik & Polybag (Desti)", defaultRate: 300, category: "FINISHING" },
  { id: "PRESS_INTERLINING", label: "🏷️ Press Kain Keras & Numbering (Silma)", defaultRate: 350, category: "CUTTING_PREP" },
  { id: "POTONG_POLA", label: "📐 Potong Meja Pola (Bu Nani)", defaultRate: 800, category: "CUTTING" },
  { id: "CUSTOM", label: "⚡ Tugas Kustom Lainnya (Tarif Bebas)", defaultRate: 500, category: "OTHER" },
];

export default function FinishingWagesModule() {
  const [wages, setWages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterOp, setFilterOp] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<'TABLE' | 'COMPACT' | 'CARDS'>('TABLE');

  // Form State Lengkap
  const [formData, setFormData] = useState({
    operator_id: "",
    so_id: "",
    operation_type: "STIM",
    work_date: new Date().toISOString().split('T')[0],
    qty_completed: 250,
    qty_reject: 0,
    wage_per_piece: 550,
    notes: ""
  });

  // Size Breakdown Input State
  const [useSizeBreakdown, setUseSizeBreakdown] = useState<boolean>(false);
  const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
    "28": 50,
    "30": 100,
    "32": 100
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, oRes, eRes] = await Promise.all([
        api.get('/api/shipping/wages'),
        api.get('/api/ppic/orders'),
        api.get('/api/karyawan/list')
      ]);

      setWages(wRes.data || []);
      setOrders(oRes.data || []);
      
      const empList = eRes.data?.data || eRes.data || [];
      setEmployees(empList);

      if (oRes.data && oRes.data.length > 0 && !formData.so_id) {
        setFormData(prev => ({ ...prev, so_id: oRes.data[0].id }));
      }
      if (empList.length > 0 && !formData.operator_id) {
        const first = empList[0];
        setFormData(prev => ({
          ...prev,
          operator_id: first.id_karyawan,
          wage_per_piece: first.tipe_pay === "BORONGAN" && first.tarif_borongan_pcs > 0 ? first.tarif_borongan_pcs : prev.wage_per_piece
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil data upah borongan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOperatorChange = (empId: string) => {
    const emp = employees.find(e => e.id_karyawan === empId);
    let newRate = formData.wage_per_piece;
    if (emp && emp.tipe_pay === "BORONGAN" && emp.tarif_borongan_pcs > 0) {
      newRate = emp.tarif_borongan_pcs;
    }
    setFormData(prev => ({
      ...prev,
      operator_id: empId,
      wage_per_piece: newRate
    }));
  };

  const handleOpChange = (opId: string) => {
    const preset = OPERATION_PRESETS.find(p => p.id === opId);
    setFormData(prev => ({
      ...prev,
      operation_type: opId,
      wage_per_piece: preset ? preset.defaultRate : 500
    }));
  };

  const handleSizeQtyChange = (key: string, val: number) => {
    const updated = { ...sizeMatrix, [key]: Math.max(0, val) };
    setSizeMatrix(updated);
    const sumQty = Object.values(updated).reduce((acc, q) => acc + (Number(q) || 0), 0);
    setFormData(prev => ({ ...prev, qty_completed: sumQty }));
  };

  const handleAddSizeKey = () => {
    const key = prompt("Masukkan ukuran baru (misal: 34, 36, XL, XXL):");
    if (key && key.trim()) {
      setSizeMatrix(prev => ({ ...prev, [key.trim().toUpperCase()]: 0 }));
    }
  };

  const handleCreateWage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.operator_id) {
      alert("Silakan pilih nama pekerja terlebih dahulu.");
      return;
    }
    if (!formData.so_id) {
      alert("Silakan pilih Sales Order target.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/shipping/wages', {
        so_id: formData.so_id,
        operator_id: formData.operator_id,
        operation_type: formData.operation_type,
        work_date: formData.work_date,
        qty_completed: Number(formData.qty_completed),
        qty_reject: Number(formData.qty_reject) || 0,
        size_breakdown: useSizeBreakdown ? sizeMatrix : {},
        wage_per_piece: Number(formData.wage_per_piece),
        notes: formData.notes || null
      });

      setIsModalOpen(false);
      setFormData(prev => ({
        ...prev,
        qty_completed: 250,
        qty_reject: 0,
        notes: ""
      }));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal mencatat upah borongan.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWages = wages.filter(w => {
    const matchQuery = (w.operator_name && w.operator_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.operation_type && w.operation_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.so_id && w.so_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterOp === "ALL") return matchQuery;
    return matchQuery && w.operation_type === filterOp;
  });

  const totalFinishingPaid = wages.reduce((acc, w) => acc + (w.total_wage || 0), 0);
  const totalPcsFinished = wages.reduce((acc, w) => acc + (w.qty_completed || 0), 0);
  const totalRejects = wages.reduce((acc, w) => acc + (w.qty_reject || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Fase 5: Lini Jahit Internal, Finishing & Upah Borongan
          </div>
          <h1 className="text-2xl font-black text-white">Produksi & Upah Borongan Satuan</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Log harian hasil kerja pekerja (Jahit Sewing, Steam Johan, Pasang Kancing, Buang Benang, Lipat, Packing) — Otomatis terakumulasi ke Payroll & Gaji.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" />
            + Catat Hasil Borongan Pekerja
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Kuantitas Setoran</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{totalPcsFinished.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pcs Selesai Dikerjakan</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Akumulasi Upah</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            Rp {totalFinishingPaid.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">Otomatis Mengalir ke Payroll</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Cacat / Rijek</p>
          <p className={`text-2xl font-black mt-1 ${totalRejects > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {totalRejects.toLocaleString('id-ID')} Pcs
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Barang Perlu Diperbaiki</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Transaksi Setoran</p>
          <p className="text-2xl font-black text-white mt-1">{wages.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Log Setoran Tercatat</p>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pekerja / tugas / SO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterOp}
            onChange={(e) => setFilterOp(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Semua Jenis Pekerjaan</option>
            {OPERATION_PRESETS.map(op => (
              <option key={op.id} value={op.id}>{op.label}</option>
            ))}
          </select>
        </div>

        {/* View Mode Density Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('TABLE')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'TABLE' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Tabel Standar"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tabel</span>
          </button>
          <button
            onClick={() => setViewMode('COMPACT')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'COMPACT' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Kompak / Rapat"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kompak</span>
          </button>
          <button
            onClick={() => setViewMode('CARDS')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'CARDS' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Kartu Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kartu</span>
          </button>
          <button
            onClick={fetchData}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
          <p className="text-sm font-semibold">Memuat log setoran upah borongan...</p>
        </div>
      ) : filteredWages.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Sparkles className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-base font-bold text-slate-300">Belum ada catatan setoran borongan</p>
          <p className="text-xs text-slate-500 mt-1">Klik tombol "+ Catat Hasil Borongan Pekerja" untuk mencatatkan setoran harian karyawan.</p>
        </div>
      ) : viewMode === 'CARDS' ? (
        /* 🎴 VIEW MODE: CARDS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWages.map((w) => (
            <div key={w.id} className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-5 rounded-2xl transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                      {(w.operator_name || "P").substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{w.operator_name || "Operator"}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{w.work_date}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {w.operation_type}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sales Order:</span>
                    <span className="font-mono font-semibold text-white">{w.so_id?.substring(0, 14)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hasil Selesai:</span>
                    <span className="font-bold text-cyan-400">{w.qty_completed.toLocaleString('id-ID')} Pcs</span>
                  </div>
                  {w.qty_reject > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Rijek:</span>
                      <span className="font-bold">{w.qty_reject} Pcs</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tarif Satuan:</span>
                    <span className="text-slate-300">Rp {w.wage_per_piece?.toLocaleString('id-ID')}/pcs</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Upah:</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  Rp {w.total_wage?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 📄 VIEW MODE: TABLE & COMPACT */
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'}`}>Tgl Kerja</th>
                  <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'}`}>Pekerja / Operator</th>
                  <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'}`}>Tugas / Operasi</th>
                  <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'}`}>Sales Order</th>
                  <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'} text-right`}>Kuantitas Selesai</th>
                  <th className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'} text-right`}>Tarif / Pcs</th>
                  <th className={`${viewMode === 'COMPACT' ? 'py-2 px-4' : 'py-3.5 px-5'} text-right`}>Total Upah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredWages.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'} text-slate-400 font-mono`}>
                      {w.work_date}
                    </td>
                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold flex items-center justify-center text-[10px]">
                          {(w.operator_name || "O").substring(0, 1).toUpperCase()}
                        </div>
                        <span className="font-bold text-white text-xs">{w.operator_name || "Operator"}</span>
                      </div>
                    </td>
                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'}`}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {w.operation_type}
                      </span>
                    </td>
                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'} text-slate-300 font-mono text-[11px]`}>
                      {w.so_id?.substring(0, 12)}...
                    </td>
                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'} text-right`}>
                      <span className="font-bold text-white text-xs">{w.qty_completed?.toLocaleString('id-ID')} Pcs</span>
                      {w.qty_reject > 0 && (
                        <span className="block text-[10px] text-amber-400">Rijek: {w.qty_reject} pcs</span>
                      )}
                    </td>
                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-3' : 'py-3.5 px-4'} text-right text-slate-400 font-mono`}>
                      Rp {w.wage_per_piece?.toLocaleString('id-ID')}
                    </td>
                    <td className={`${viewMode === 'COMPACT' ? 'py-2 px-4' : 'py-3.5 px-5'} text-right font-black text-emerald-400 font-mono text-sm`}>
                      Rp {w.total_wage?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🟢 MODAL INPUT HASIL BORONGAN PEKERJA LENGKAP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Catat Hasil Borongan & Upah Pekerja</h3>
                  <p className="text-xs text-slate-400">Jahit, Steam, Pasang Kancing, Lipat, Packing & Meja Potong</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWage} className="p-6 space-y-4">
              
              {/* 1. Pilih Nama Pekerja (Wajib) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Nama Pekerja / Operator <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.operator_id}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Pilih Pekerja Pabrik --</option>
                  {employees.map(emp => (
                    <option key={emp.id_karyawan} value={emp.id_karyawan}>
                      {emp.nama} ({emp.jabatan || 'Operator'} - {emp.tipe_pay || 'BORONGAN'})
                    </option>
                  ))}
                </select>

                {(() => {
                  const emp = employees.find(e => e.id_karyawan === formData.operator_id);
                  if (!emp) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.tipe_pay === 'BORONGAN' 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : emp.tipe_pay === 'BULANAN'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {emp.tipe_pay || 'BORONGAN'}
                        </span>
                        <span className="text-slate-300 font-medium">{emp.jabatan || 'Operator'}</span>
                      </div>
                      <div>
                        {emp.tipe_pay === 'BORONGAN' && emp.tarif_borongan_pcs > 0 ? (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, wage_per_piece: emp.tarif_borongan_pcs }))}
                            className="text-[11px] text-cyan-400 hover:underline font-semibold cursor-pointer"
                          >
                            Tarif Profil: Rp {emp.tarif_borongan_pcs.toLocaleString('id-ID')}/pcs ⚡
                          </button>
                        ) : emp.tipe_pay === 'BULANAN' ? (
                          <span className="text-[11px] text-emerald-400 font-semibold">Gaji Pokok: Rp {emp.gaji_pokok?.toLocaleString('id-ID')}/bln</span>
                        ) : (
                          <span className="text-[11px] text-amber-400 font-semibold">Tarif Harian: Rp {emp.gaji_pokok?.toLocaleString('id-ID')}/hari</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <p className="text-[11px] text-slate-400 mt-1.5">
                  💡 Upah yang dicatat di sini otomatis mengalir dan menjumlah ke slip gaji pekerja di modul <b>Payroll & Gaji</b>.
                </p>
              </div>

              {/* 2. Pilih Sales Order & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Sales Order Target <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.so_id}
                    onChange={(e) => setFormData({ ...formData, so_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Pilih Sales Order --</option>
                    {orders.map(so => (
                      <option key={so.id} value={so.id}>{so.so_number} - {so.style_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tanggal Pengerjaan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.work_date}
                    onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 3. Jenis Tugas & Tarif Satuan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jenis Tugas / Operasi Borongan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.operation_type}
                  onChange={(e) => handleOpChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                >
                  {OPERATION_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
              </div>

              {/* 4. Kuantitas Selesai, Rijek & Tarif / Pcs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Qty Selesai (Pcs) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.qty_completed}
                    onChange={(e) => setFormData({ ...formData, qty_completed: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Qty Cacat / Rijek (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qty_reject}
                    onChange={(e) => setFormData({ ...formData, qty_reject: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tarif Upah (Rp/Pcs) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.wage_per_piece}
                    onChange={(e) => setFormData({ ...formData, wage_per_piece: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 5. Size Breakdown Toggle & Input */}
              <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Rincian Ukuran / Size Breakdown (Opsional)</span>
                  <button
                    type="button"
                    onClick={() => setUseSizeBreakdown(!useSizeBreakdown)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      useSizeBreakdown 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {useSizeBreakdown ? "✓ Aktif (Per Size)" : "+ Input Per Size"}
                  </button>
                </div>

                {useSizeBreakdown && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {Object.entries(sizeMatrix).map(([sz, qty]) => (
                        <div key={sz} className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-center">
                          <span className="text-[10px] text-slate-400 font-bold block">Size {sz}</span>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleSizeQtyChange(sz, Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-white font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSizeKey}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      + Tambah Size Baru
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Batch 1 selesai, lemparan ke packing..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 7. Total Upah Card */}
              <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block font-medium">Total Akumulasi Upah:</span>
                  <span className="text-[11px] text-slate-400">
                    {formData.qty_completed} Pcs × Rp {formData.wage_per_piece.toLocaleString('id-ID')}
                  </span>
                </div>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  Rp {(formData.qty_completed * formData.wage_per_piece).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan & Masukkan ke Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
