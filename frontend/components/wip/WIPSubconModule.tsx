"use client";

import React, { useState, useEffect } from 'react';
import { 
  Truck, ArrowDownLeft, Plus, Search, RefreshCw, AlertTriangle, 
  CheckCircle2, Printer, Layers, Filter, ShieldAlert, CheckCheck
} from 'lucide-react';
import api from '@/services/api';
import SubconDispatcherModal from './SubconDispatcherModal';
import WIPReceiveModal from './WIPReceiveModal';
import PrintSuratJalanModal from '../common/PrintSuratJalanModal';

export default function WIPSubconModule() {
  const [movements, setMovements] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  // Modals
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [selectedMovementForReceive, setSelectedMovementForReceive] = useState<any>(null);
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

  const filteredMovements = movements.filter(m =>
    (m.surat_jalan_no && m.surat_jalan_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.so_number && m.so_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.partner_name && m.partner_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5" />
            Fase 4: Sequential WIP & Subcon Pipeline
          </div>
          <h1 className="text-2xl font-black text-white">Distribusi Subcon & Lini Jahit</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Surat jalan distribusi, pelacakan proses (Print, Bordir, Jahit, Washing), dan rekonsiliasi selisih maklun.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDispatchOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            + Terbitkan Surat Jalan Kirim
          </button>
        </div>
      </div>

      {/* Filter Stages */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Movements Table */}
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
              filteredMovements.map((m) => {
                const isCompleted = m.status === 'COMPLETED';
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : hasDisc
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {m.status === 'IN_PROCESS' && (
                          <button
                            onClick={() => setSelectedMovementForReceive(m)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                          >
                            Terima Setoran
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintSJ(m)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="Cetak Surat Jalan Fisik"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-400" />
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
