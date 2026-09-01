"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, ArrowDownLeft, Plus, Search, RefreshCw, AlertTriangle, 
  CheckCircle2, Printer, Layers, Filter, ShieldAlert, CheckCheck,
  Pencil, Trash2, X, LayoutGrid, List, Activity, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { errMsg } from '@/utils/format';
import SubconDispatcherModal from './SubconDispatcherModal';
import WIPReceiveModal from './WIPReceiveModal';
import PrintSuratJalanModal from '../common/PrintSuratJalanModal';
import Pagination from '@/components/common/Pagination';
import StatusBadge from '@/components/common/StatusBadge';

export default function WIPSubconModule() {
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [movements, setMovements] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtering & View Customization
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Modals
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [selectedMovementForReceive, setSelectedMovementForReceive] = useState<any>(null);
  const [editingMovement, setEditingMovement] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    qty_dispatched: 0,
    qty_received: 0,
    qty_reject: 0,
    partner_id: "",
    remarks: ""
  });
  const [printDoc, setPrintDoc] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [stageFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/wip/movements';
      if (stageFilter !== 'ALL') {
        url += `?stage_name=${stageFilter}`;
      }
      const res = await api.get(url);
      setMovements(res.data || []);

      const oRes = await api.get('/api/ppic/orders');
      setOrders(oRes.data || []);

      const pRes = await api.get('/api/ppic/partners');
      setPartners(pRes.data || []);
    } catch (err) {
      console.error("Gagal mengambil data pergerakan WIP:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (m: any) => {
    setEditingMovement(m);
    setEditForm({
      qty_dispatched: m.qty_dispatched || 0,
      qty_received: m.qty_received || 0,
      qty_reject: m.qty_reject || 0,
      partner_id: m.partner_id || "",
      remarks: m.remarks || ""
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;
    try {
      await api.put(`/api/wip/movements/${editingMovement.id}`, editForm);
      setEditingMovement(null);
      toast.success("Surat Jalan dikoreksi.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal mengoreksi Surat Jalan."));
    }
  };

  const handleDeleteMovement = async (m: any) => {
    const ok = await confirm({
      title: "Hapus Surat Jalan WIP?",
      message: `SJ '${m.surat_jalan_no}' (${m.qty_dispatched} pcs) dihapus. Dicatat di Audit Log.`,
      confirmText: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/wip/movements/${m.id}`);
      toast.success("Surat Jalan dihapus.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal menghapus Surat Jalan."));
    }
  };

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (m.surat_jalan_no && m.surat_jalan_no.toLowerCase().includes(q)) ||
        (m.so_number && m.so_number.toLowerCase().includes(q)) ||
        (m.partner_name && m.partner_name.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [movements, searchQuery, statusFilter]);

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, pageSize]);
  const pagedMovements = useMemo(
    () => filteredMovements.slice((page - 1) * pageSize, page * pageSize),
    [filteredMovements, page, pageSize],
  );

  const wipMetrics = useMemo(() => {
    const totalKirim = movements.reduce((acc, m) => acc + (Number(m.qty_dispatched) || 0), 0);
    const totalTerima = movements.reduce((acc, m) => acc + (Number(m.qty_received) || 0), 0);
    const totalReject = movements.reduce((acc, m) => acc + (Number(m.qty_reject) || 0), 0);
    const totalSelisih = movements.reduce((acc, m) => acc + (Number(m.balance_discrepancy) || 0), 0);
    return { totalKirim, totalTerima, totalReject, totalSelisih };
  }, [movements]);

  const handlePrintSJ = (m: any) => {
    setPrintDoc({
      title: `SURAT JALAN PENGIRIMAN SUBCON (${m.stage_name})`,
      suratJalanNo: m.surat_jalan_no || "SJ-SUBCON-001",
      dateStr: m.dispatch_date,
      senderName: m.supervisor_name || "Supervisor Produksi",
      senderRole: "Pemberi Maklun / QC CJM",
      recipientName: m.partner_name || "Lini Internal",
      recipientCategory: m.stage_name,
      driverName: "Logistik Subcon",
      soNumber: m.so_number || "-",
      styleName: m.style_name || "-",
      itemCategory: "Potongan Pola / Baju WIP",
      totalQty: m.qty_dispatched,
      unit: "PCS",
      sizeBreakdown: m.size_breakdown_dispatched || {},
      remarks: m.remarks || "Harap dikerjakan sesuai standar toleransi kualitas."
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5" />
            Fase 4: Sequential WIP & Subcon Pipeline
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">Distribusi Subcon & Lini Jahit</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Surat jalan distribusi, pelacakan proses (Print, Bordir, Jahit, Washing), dan rekonsiliasi selisih maklun.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDispatchOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Terbitkan Surat Jalan Kirim
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-purple-400" />
            Total Qty Terkirim
          </span>
          <p className="text-xl font-black text-purple-400 mt-1">{wipMetrics.totalKirim.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">Pcs</span></p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Total Qty Diterima
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">{wipMetrics.totalTerima.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">Pcs</span></p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Total Rijek / BS
          </span>
          <p className="text-xl font-black text-rose-400 mt-1">{wipMetrics.totalReject.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">Pcs</span></p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Selisih WIP Belum Kembali
          </span>
          <p className="text-xl font-black text-amber-400 mt-1">{wipMetrics.totalSelisih.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">Pcs</span></p>
        </div>
      </div>

      {/* Filter Stages & View Mode Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-3xl">
          {[
            { id: 'ALL', label: 'Semua Tahapan' },
            { id: 'PRINT_MENTAH', label: '1. Print M' },
            { id: 'EMBROIDERY_MENTAH', label: '2. Bordir M' },
            { id: 'SEWING_INTERNAL', label: '3. Jahit Anis' },
            { id: 'SEWING_MAKLUN', label: '3. Maklun Pa Ato' },
            { id: 'WASHING', label: '4. Washing' },
            { id: 'EMBROIDERY_JADI', label: '5. Bordir Jadi' },
            { id: 'FINISHING', label: '6. Finishing' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStageFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                stageFilter === st.id
                  ? 'bg-slate-800 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SJ, SO, Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'TABLE' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'GRID' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchData}
            title="Segarkan Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Movements View: Table vs Grid Cards */}
      {viewMode === 'TABLE' ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Surat Jalan & Tgl</th>
                <th className="py-3 px-3">Tahapan Lini</th>
                <th className="py-3 px-3">Sales Order</th>
                <th className="py-3 px-3">Vendor Subcon</th>
                <th className="py-3 px-3 text-right">Kirim</th>
                <th className="py-3 px-3 text-right">Terima</th>
                <th className="py-3 px-3 text-right">Rijek</th>
                <th className="py-3 px-3 text-right">Selisih</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                    Memuat log pergerakan WIP Subcon...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Belum ada pergerakan pada tahapan ini.
                  </td>
                </tr>
              ) : (
                pagedMovements.map((m) => {
                  const hasDisc = m.balance_discrepancy > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white">{m.surat_jalan_no || "-"}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{m.dispatch_date}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {m.stage_name}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200">{m.so_number}</div>
                        <div className="text-[11px] text-slate-500">{m.style_name}</div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-300">
                        {m.partner_name || "Internal Garment"}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-purple-400">
                        {m.qty_dispatched.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {m.qty_received > 0 ? m.qty_received.toLocaleString('id-ID') : '-'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {m.qty_reject > 0 ? (
                          <span className="font-bold text-rose-400">{m.qty_reject}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {hasDisc ? (
                          <span className="font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {m.balance_discrepancy} Pcs
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={m.status} />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {m.status === 'IN_PROCESS' && (
                            <button
                              onClick={() => setSelectedMovementForReceive(m)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
                            >
                              Terima Setoran
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintSJ(m)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Surat Jalan Fisik"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="Koreksi Data Surat Jalan"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovement(m)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Surat Jalan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedMovements.map((m) => {
            const hasDisc = m.balance_discrepancy > 0;
            return (
              <div key={m.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {m.stage_name}
                      </span>
                      <h4 className="text-base font-black text-white mt-1">{m.surat_jalan_no}</h4>
                      <p className="text-xs text-slate-400 font-mono">Tgl: {m.dispatch_date}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs my-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sales Order:</span>
                      <span className="font-bold text-white font-mono">{m.so_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vendor:</span>
                      <span className="font-semibold text-slate-300">{m.partner_name || "Internal"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">KIRIM</span>
                        <span className="font-bold text-purple-400">{m.qty_dispatched}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">TERIMA</span>
                        <span className="font-bold text-emerald-400">{m.qty_received || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">SELISIH</span>
                        <span className={`font-bold ${hasDisc ? 'text-amber-400' : 'text-slate-500'}`}>{m.balance_discrepancy || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  {m.status === 'IN_PROCESS' ? (
                    <button
                      onClick={() => setSelectedMovementForReceive(m)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Terima Setoran
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">Selesai</span>
                  )}
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePrintSJ(m)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer" title="Cetak SJ">
                      <Printer className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button onClick={() => handleOpenEdit(m)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg cursor-pointer" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteMovement(m)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg cursor-pointer" title="Hapus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredMovements.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modal Edit / Koreksi Surat Jalan */}
      {editingMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveEdit} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Koreksi SJ: {editingMovement.surat_jalan_no}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMovement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Qty Kirim</label>
                <input
                  type="number"
                  required
                  value={editForm.qty_dispatched}
                  onChange={(e) => setEditForm({ ...editForm, qty_dispatched: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Qty Terima</label>
                <input
                  type="number"
                  value={editForm.qty_received}
                  onChange={(e) => setEditForm({ ...editForm, qty_received: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold text-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Qty Rijek</label>
                <input
                  type="number"
                  value={editForm.qty_reject}
                  onChange={(e) => setEditForm({ ...editForm, qty_reject: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold text-rose-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Vendor / Partner Subcon</label>
              <select
                value={editForm.partner_id}
                onChange={(e) => setEditForm({ ...editForm, partner_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">-- Internal Garment --</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Catatan / Keterangan Koreksi</label>
              <textarea
                rows={2}
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMovement(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Simpan Koreksi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      <SubconDispatcherModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onSuccess={fetchData}
        orders={orders}
        partners={partners}
      />

      {selectedMovementForReceive && (
        <WIPReceiveModal
          isOpen={true}
          onClose={() => setSelectedMovementForReceive(null)}
          onSuccess={fetchData}
          movement={selectedMovementForReceive}
        />
      )}

      {printDoc && (
        <PrintSuratJalanModal
          isOpen={true}
          onClose={() => setPrintDoc(null)}
          {...printDoc}
        />
      )}

    </div>
  );
}

