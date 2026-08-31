"use client";

import React, { useState, useEffect } from 'react';
import { 
  Scissors, Sparkles, Plus, Search, RefreshCw, Calculator, 
  BarChart2, Layers, CheckCircle2, FileText, Pencil, Trash2
} from 'lucide-react';
import api from '@/services/api';
import CuttingModal from './CuttingModal';
import PrepWagesModal from './PrepWagesModal';

export default function CuttingPrepModule() {
  const [activeTab, setActiveTab] = useState<'CUTTING' | 'PREP'>('CUTTING');
  const [cuttingRecords, setCuttingRecords] = useState<any[]>([]);
  const [prepTasks, setPrepTasks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Selected items for edit
  const [isCuttingOpen, setIsCuttingOpen] = useState(false);
  const [selectedCutting, setSelectedCutting] = useState<any>(null);

  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [selectedPrep, setSelectedPrep] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'CUTTING') {
        const res = await api.get('/api/cutting/records');
        setCuttingRecords(res.data || []);
      } else {
        const res = await api.get('/api/cutting/prep-tasks');
        setPrepTasks(res.data || []);
      }
      const oRes = await api.get('/api/ppic/orders');
      setOrders(oRes.data || []);
    } catch (err) {
      console.error("Gagal mengambil data cutting & prep:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateCutting = () => {
    setSelectedCutting(null);
    setIsCuttingOpen(true);
  };

  const handleOpenEditCutting = (cr: any) => {
    setSelectedCutting(cr);
    setIsCuttingOpen(true);
  };

  const handleDeleteCutting = async (cr: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data potong ini (${cr.qty_cut} pcs)? Aksi ini akan dicatat di Log Audit.`)) return;
    try {
      await api.delete(`/api/cutting/records/${cr.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal menghapus data potong.");
    }
  };

  const handleOpenCreatePrep = () => {
    setSelectedPrep(null);
    setIsPrepOpen(true);
  };

  const handleOpenEditPrep = (t: any) => {
    setSelectedPrep(t);
    setIsPrepOpen(true);
  };

  const handleDeletePrep = async (t: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus upah borongan persiapan ini (${t.task_type} - Rp ${t.total_wage?.toLocaleString('id-ID')})?`)) return;
    try {
      await api.delete(`/api/cutting/prep-tasks/${t.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal menghapus upah borongan persiapan.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Scissors className="w-3.5 h-3.5" />
            Fase 3: Cutting & Preparation
          </div>
          <h1 className="text-2xl font-black text-white">Meja Potong & Persiapan</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Pencatatan hasil potong lembaran pola (Bu Nani), kalkulasi yield konsumsi (Yard/Pcs), dan borongan Silma.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateCutting}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            + Input Hasil Potong
          </button>
          <button
            onClick={handleOpenCreatePrep}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            + Upah Persiapan (Press/Num)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('CUTTING')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'CUTTING'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log Meja Potong & Consumption ({cuttingRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('PREP')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'PREP'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upah Borongan Persiapan ({prepTasks.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* TAB 1: CUTTING LOG */}
      {activeTab === 'CUTTING' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuttingRecords.map((cr) => {
              const breakdown = cr.size_breakdown_cut || {};
              return (
                <div key={cr.id} className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          MEJA POTONG
                        </span>
                        <h4 className="text-base font-black text-white mt-1">
                          {cr.qty_cut.toLocaleString('id-ID')} Pcs Terpotong
                        </h4>
                        <p className="text-xs text-slate-400">Operator: {cr.operator_name || "Bu Nani"}</p>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{cr.cutting_date}</span>
                    </div>

                    {/* Consumption Metrics */}
                    <div className="grid grid-cols-2 gap-2 p-3 my-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Kain Utama Terpakai:</span>
                        <span className="font-bold text-slate-200">{cr.main_fabric_used} Yd</span>
                        <span className="block text-[11px] font-black text-amber-400 mt-0.5">
                          {cr.main_consumption_rate} Yd/Pcs
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Puring Terpakai:</span>
                        <span className="font-bold text-slate-200">{cr.puring_used || 0} Yd</span>
                        <span className="block text-[11px] font-black text-amber-400 mt-0.5">
                          {cr.puring_consumption_rate || 0} Yd/Pcs
                        </span>
                      </div>
                    </div>

                    {/* Size Breakdown */}
                    {Object.keys(breakdown).length > 0 && (
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">HASIL PER UKURAN:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(breakdown).map(([sz, qty]: any) => (
                            <span key={sz} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300">
                              {sz}: <strong className="text-white">{qty}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-800/60">
                    <button
                      onClick={() => handleOpenEditCutting(cr)}
                      title="Edit Log Potong"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCutting(cr)}
                      title="Hapus Log Potong"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PREP WAGES */}
      {activeTab === 'PREP' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tgl Kerja</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Jenis Pekerjaan</th>
                <th className="py-3 px-3 text-right">Kuantitas</th>
                <th className="py-3 px-3 text-right">Tarif (Rp)</th>
                <th className="py-3 px-4 text-right">Total Upah</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {prepTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono">{t.task_date}</td>
                  <td className="py-3 px-3 font-semibold text-white">{t.operator_name || "Silma"}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {t.task_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-white">{t.qty_done.toLocaleString('id-ID')} Pcs</td>
                  <td className="py-3 px-3 text-right text-slate-400">Rp {t.piece_rate}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-400">
                    Rp {t.total_wage.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPrep(t)}
                        title="Edit Upah Borongan"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePrep(t)}
                        title="Hapus Upah Borongan"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CuttingModal
        isOpen={isCuttingOpen}
        onClose={() => {
          setIsCuttingOpen(false);
          setSelectedCutting(null);
        }}
        onSuccess={fetchData}
        orders={orders}
        initialData={selectedCutting}
      />

      <PrepWagesModal
        isOpen={isPrepOpen}
        onClose={() => {
          setIsPrepOpen(false);
          setSelectedPrep(null);
        }}
        onSuccess={fetchData}
        orders={orders}
        initialData={selectedPrep}
      />

    </div>
  );
}

