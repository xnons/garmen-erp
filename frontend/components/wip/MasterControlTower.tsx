"use client";

import React, { useState, useEffect } from 'react';
import { 
  Layers, Search, RefreshCw, AlertTriangle, CheckCircle2, 
  Clock, Scissors, Sparkles, Shirt, Droplets, CheckCheck, 
  Truck, AlertOctagon, TrendingUp, BarChart3, Eye, Printer, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { errMsg } from '@/utils/format';
import Pagination from '@/components/common/Pagination';
import { clampPage } from '@/utils/pagination';

export interface WIPMatrixRow {
  so_id: string;
  so_number: string;
  buyer_name: string;
  style_name: string;
  item_category: string;
  order_qty: number;
  qty_cutting: number;
  qty_print_mentah: number;
  qty_bordir_mentah: number;
  qty_kirim_jahit: number;
  qty_setor_jahit: number;
  qty_washing: number;
  qty_finishing: number;
  qty_shipped: number;
  qty_reject_total: number;
  balance_discrepancy_total: number;
  status_wip: string;
}

interface MasterControlTowerProps {
  onSelectSO?: (soId: string) => void;
}

export default function MasterControlTower({ onSelectSO }: MasterControlTowerProps) {
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [matrixData, setMatrixData] = useState<WIPMatrixRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [reseeding, setReseeding] = useState<boolean>(false);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/wip/monitoring-matrix');
      setMatrixData(res.data || []);
    } catch (err) {
      console.error("Gagal mengambil data Live WIP Matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    const ok = await confirm({
      title: "Injeksi ulang data pipeline?",
      message: "20 Master Sales Order + seluruh data pipeline produksi 6 fase akan disuntikkan ke database.",
      confirmText: "Ya, injeksi",
    });
    if (!ok) return;
    setReseeding(true);
    try {
      const res = await api.post('/api/dashboard/reseed-production-pipeline');
      toast.success(res.data?.message || "Berhasil seeding data produksi!");
      await fetchMatrix();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal seeding data produksi."));
    } finally {
      setReseeding(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  // Filtered rows
  const filteredRows = matrixData.filter(row => {
    const matchQuery = 
      row.so_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.style_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.buyer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "ALL") return matchQuery;
    if (statusFilter === "DISCREPANCY") return matchQuery && (row.balance_discrepancy_total > 0 || row.status_wip === "DISCREPANCY_FLAG");
    if (statusFilter === "REGISTERED") return matchQuery && (row.status_wip === "REGISTERED" || row.status_wip === "DRAFT");
    return matchQuery && row.status_wip === statusFilter;
  });

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter, pageSize]);
  const safePage = clampPage(page, filteredRows.length, pageSize);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Telemetry Aggregates
  const totalOrders = matrixData.length;
  const totalTargetPcs = matrixData.reduce((acc, r) => acc + r.order_qty, 0);
  const totalCuttingPcs = matrixData.reduce((acc, r) => acc + r.qty_cutting, 0);
  const totalShippedPcs = matrixData.reduce((acc, r) => acc + r.qty_shipped, 0);
  const totalRejects = matrixData.reduce((acc, r) => acc + r.qty_reject_total, 0);
  const totalDiscrepancies = matrixData.reduce((acc, r) => acc + r.balance_discrepancy_total, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">DRAFT SO</span>;
      case 'CUTTING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">CUTTING</span>;
      case 'WIP_SUBCON':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">SUBCON</span>;
      case 'SEWING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">SEWING</span>;
      case 'WASHING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">WASHING</span>;
      case 'FINISHING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">FINISHING</span>;
      case 'SHIPPED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SHIPPED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" />
              Live Telemetry Streams
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Master Control Tower — WIP Matrix
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Pusat komando pemantauan pergerakan alur garmen terintegrasi dari meja potong, sablon, bordir, jahit perakitan, washing, hingga pengiriman barang jadi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReseed}
              disabled={reseeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Layers className={`w-4 h-4 ${reseeding ? 'animate-spin' : ''}`} />
              {reseeding ? 'Menginjeksi...' : '⚡ Injeksi 20 Master SO'}
            </button>
            <button
              onClick={fetchMatrix}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total SO Aktif</p>
          <p className="text-2xl font-black text-white mt-1">{totalOrders}</p>
          <p className="text-[11px] text-indigo-400 mt-1">Batch Produksi</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Target Order</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{totalTargetPcs.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total Pcs</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Hasil Cutting</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{totalCuttingPcs.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Yield Meja Potong</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Shipped (SJP)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{totalShippedPcs.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-emerald-400/80 mt-1">Terkirim ke Buyer</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Rijek</p>
          <p className={`text-2xl font-black mt-1 ${totalRejects > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {totalRejects.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Defect Semua Lini</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs font-medium text-slate-400">Total Selisih Subkon</p>
          <p className={`text-2xl font-black mt-1 ${totalDiscrepancies > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {totalDiscrepancies.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Kirim vs Terima</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari SO Number, Style, Buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 mr-1 shrink-0">Filter:</span>
          {['ALL', 'REGISTERED', 'CUTTING', 'SEWING', 'WASHING', 'FINISHING', 'SHIPPED', 'DISCREPANCY'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {st === 'DISCREPANCY' ? '⚠️ Ada Selisih' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Live WIP Matrix Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Sales Order & Buyer</th>
                <th className="py-3.5 px-3">Style & Item</th>
                <th className="py-3.5 px-3 text-right">Target</th>
                <th className="py-3.5 px-3 text-right">Potong</th>
                <th className="py-3.5 px-3 text-right">Print M</th>
                <th className="py-3.5 px-3 text-right">Bordir M</th>
                <th className="py-3.5 px-3 text-right">Kirim Jahit</th>
                <th className="py-3.5 px-3 text-right">Setor Jahit</th>
                <th className="py-3.5 px-3 text-right">Washing</th>
                <th className="py-3.5 px-3 text-right">Finish</th>
                <th className="py-3.5 px-3 text-right">SJP Kirim</th>
                <th className="py-3.5 px-3 text-right">Rijek</th>
                <th className="py-3.5 px-3 text-right">Selisih</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    Memuat matriks telemetri WIP real-time...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    Tidak ada Sales Order yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const isCuttingUnder = row.qty_cutting > 0 && row.qty_cutting < row.order_qty;
                  const hasDiscrepancy = row.balance_discrepancy_total > 0;

                  return (
                    <tr 
                      key={row.so_id} 
                      className={`transition-colors group cursor-pointer ${
                        hasDiscrepancy 
                          ? 'bg-rose-950/20 hover:bg-rose-950/35 border-l-2 border-l-rose-500' 
                          : 'hover:bg-indigo-950/20'
                      }`}
                      onClick={() => onSelectSO && onSelectSO(row.so_id)}
                    >
                      {/* SO & Buyer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                          <span>{row.so_number}</span>
                          {hasDiscrepancy && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-rose-500 text-white rounded font-mono animate-pulse">
                              SELISIH
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{row.buyer_name}</div>
                      </td>

                      {/* Style & Category */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-200 font-semibold">{row.style_name}</div>
                        <div className="text-[11px] text-slate-500">{row.item_category}</div>
                      </td>

                      {/* Order Target */}
                      <td className="py-3.5 px-3 text-right font-bold text-white">
                        {row.order_qty.toLocaleString('id-ID')}
                      </td>

                      {/* Cutting Done */}
                      <td className="py-3.5 px-3 text-right">
                        <span className={`font-bold ${isCuttingUnder ? 'text-amber-400' : 'text-slate-200'}`}>
                          {row.qty_cutting.toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Print Mentah */}
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        {row.qty_print_mentah > 0 ? row.qty_print_mentah.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Bordir Mentah */}
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        {row.qty_bordir_mentah > 0 ? row.qty_bordir_mentah.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kirim Jahit */}
                      <td className="py-3.5 px-3 text-right text-blue-400 font-semibold">
                        {row.qty_kirim_jahit > 0 ? row.qty_kirim_jahit.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Setor Jahit */}
                      <td className="py-3.5 px-3 text-right text-emerald-400 font-semibold">
                        {row.qty_setor_jahit > 0 ? row.qty_setor_jahit.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Washing */}
                      <td className="py-3.5 px-3 text-right text-cyan-300">
                        {row.qty_washing > 0 ? row.qty_washing.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Finishing */}
                      <td className="py-3.5 px-3 text-right text-indigo-300 font-semibold">
                        {row.qty_finishing > 0 ? row.qty_finishing.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* SJP Shipped */}
                      <td className="py-3.5 px-3 text-right text-emerald-400 font-bold">
                        {row.qty_shipped > 0 ? row.qty_shipped.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Reject Total */}
                      <td className="py-3.5 px-3 text-right">
                        {row.qty_reject_total > 0 ? (
                          <span className="font-bold text-rose-400">
                            {row.qty_reject_total}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>

                      {/* Discrepancy Total (Menyala Merah Saat Ada Selisih) */}
                      <td className="py-3.5 px-3 text-right">
                        {hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 font-extrabold text-xs text-rose-300 bg-rose-500/25 px-2 py-0.5 rounded-lg border border-rose-500/50 shadow-sm animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>+{row.balance_discrepancy_total} Pcs</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(row.status_wip)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[25, 50, 100, 200]}
        />
      </div>

    </div>
  );
}
