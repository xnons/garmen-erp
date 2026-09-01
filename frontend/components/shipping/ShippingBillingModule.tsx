"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Plus, Search, RefreshCw, Printer, FileText, 
  CheckCircle2, DollarSign, ArrowUpRight, CheckCheck, Eye,
  Pencil, Trash2, X, LayoutGrid, List, Layers, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { errMsg } from '@/utils/format';
import PrintSuratJalanModal from '../common/PrintSuratJalanModal';
import FormWIModal from './FormWIModal';
import Pagination from '@/components/common/Pagination';

export default function ShippingBillingModule() {
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [activeTab, setActiveTab] = useState<'SHIPMENTS' | 'FORM_WI'>('SHIPMENTS');
  const [shipments, setShipments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Customization & Filtering
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Modals
  const [isNewSJPOpen, setIsNewSJPOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [printDoc, setPrintDoc] = useState<any>(null);
  const [selectedSoIdForFormWI, setSelectedSoIdForFormWI] = useState<string | null>(null);

  // SJP Form State
  const [sjpForm, setSjpForm] = useState({
    so_id: "",
    shipment_date: new Date().toISOString().split('T')[0],
    surat_jalan_no: `SJP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}.0001`,
    driver_name: "Sandi (Ekspedisi)",
    vehicle_plate_no: "B 9821 CJM",
    carton_box_count: 15,
    destination_address: "Gudang Pusat Buyer (Jakarta Barat)",
    total_qty_shipped: 300,
    unit_price: 35000,
    invoice_number: "",
    remarks: "Pengiriman barang jadi ke gudang distributor"
  });

  const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
    "28": 60,
    "30": 90,
    "32": 90,
    "34": 60
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sRes = await api.get('/api/shipping/shipments');
      setShipments(sRes.data || []);
      const oRes = await api.get('/api/ppic/orders');
      setOrders(oRes.data || []);
      if (oRes.data && oRes.data.length > 0 && !sjpForm.so_id) {
        setSjpForm(prev => ({ ...prev, so_id: oRes.data[0].id, unit_price: oRes.data[0].unit_price || 35000 }));
      }
    } catch (err) {
      console.error("Gagal mengambil data pengiriman:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateSJP = () => {
    setEditingShipment(null);
    setSjpForm({
      so_id: orders.length > 0 ? orders[0].id : "",
      shipment_date: new Date().toISOString().split('T')[0],
      surat_jalan_no: `SJP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}.${Math.floor(Math.random() * 900 + 100)}`,
      driver_name: "Sandi (Ekspedisi)",
      vehicle_plate_no: "B 9821 CJM",
      carton_box_count: 15,
      destination_address: "Gudang Pusat Buyer (Jakarta Barat)",
      total_qty_shipped: 300,
      unit_price: orders.length > 0 ? orders[0].unit_price || 35000 : 35000,
      invoice_number: "",
      remarks: "Pengiriman barang jadi ke gudang distributor"
    });
    setSizeMatrix({ "28": 60, "30": 90, "32": 90, "34": 60 });
    setIsNewSJPOpen(true);
  };

  const handleOpenEditSJP = (s: any) => {
    setEditingShipment(s);
    setSjpForm({
      so_id: s.so_id || "",
      shipment_date: s.shipment_date || new Date().toISOString().split('T')[0],
      surat_jalan_no: s.surat_jalan_no || "",
      driver_name: s.driver_name || "",
      vehicle_plate_no: s.vehicle_plate_no || "",
      carton_box_count: s.carton_box_count || 0,
      destination_address: s.destination_address || "",
      total_qty_shipped: s.total_qty_shipped || 0,
      unit_price: s.unit_price || 35000,
      invoice_number: s.invoice_number || "",
      remarks: s.remarks || ""
    });
    if (s.size_breakdown_shipped && Object.keys(s.size_breakdown_shipped).length > 0) {
      setSizeMatrix(s.size_breakdown_shipped);
    }
    setIsNewSJPOpen(true);
  };

  const handleDeleteShipment = async (s: any) => {
    const ok = await confirm({
      title: "Hapus Surat Jalan Pengiriman?",
      message: `SJP '${s.surat_jalan_no}' (${s.total_qty_shipped} pcs) dihapus. Dicatat di Log Audit.`,
      confirmText: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/shipping/shipments/${s.id}`);
      toast.success("Data pengiriman dihapus.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal menghapus data pengiriman."));
    }
  };

  const handleSizeChange = (key: string, val: number) => {
    const updated = { ...sizeMatrix, [key]: Math.max(0, val) };
    setSizeMatrix(updated);
    const sum = Object.values(updated).reduce((acc, q) => acc + (Number(q) || 0), 0);
    setSjpForm(prev => ({ ...prev, total_qty_shipped: sum }));
  };

  const handleSaveSJP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        so_id: sjpForm.so_id,
        shipment_date: sjpForm.shipment_date,
        surat_jalan_no: sjpForm.surat_jalan_no.toUpperCase(),
        driver_name: sjpForm.driver_name,
        vehicle_plate_no: sjpForm.vehicle_plate_no.toUpperCase(),
        carton_box_count: Number(sjpForm.carton_box_count) || 0,
        destination_address: sjpForm.destination_address,
        total_qty_shipped: Number(sjpForm.total_qty_shipped),
        size_breakdown_shipped: sizeMatrix,
        unit_price: Number(sjpForm.unit_price),
        invoice_number: sjpForm.invoice_number ? sjpForm.invoice_number.toUpperCase() : null,
        remarks: sjpForm.remarks
      };

      if (editingShipment) {
        await api.put(`/api/shipping/shipments/${editingShipment.id}`, payload);
      } else {
        await api.post('/api/shipping/shipments', payload);
      }

      setIsNewSJPOpen(false);
      setEditingShipment(null);
      toast.success(editingShipment ? "SJP diperbarui." : "SJP disimpan.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal menyimpan SJP."));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSJP = (s: any) => {
    setPrintDoc({
      title: "SURAT JALAN PENGIRIMAN PRODUK JADI (SJP)",
      suratJalanNo: s.surat_jalan_no,
      dateStr: s.shipment_date,
      senderName: "PT. Chikal Jaya Makmur",
      senderRole: "Gudang Pengiriman & Ekspedisi",
      recipientName: "Buyer / Distributor Utama",
      recipientCategory: "Customer",
      driverName: s.driver_name || "Sandi (Driver Ekspedisi)",
      soNumber: s.so_id || "-",
      styleName: "Pakaian Jadi (Selesai Finishing)",
      itemCategory: "Garment Ready for Market",
      totalQty: s.total_qty_shipped,
      unit: "PCS",
      sizeBreakdown: s.size_breakdown_shipped || {},
      remarks: s.remarks || "Barang telah melewati Quality Control 100% lolos.",
      customDetails: s.invoice_number ? [{ label: "Invoice No", value: s.invoice_number }] : []
    });
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (s.surat_jalan_no && s.surat_jalan_no.toLowerCase().includes(q)) ||
        (s.invoice_number && s.invoice_number.toLowerCase().includes(q)) ||
        (s.driver_name && s.driver_name.toLowerCase().includes(q)) ||
        (s.destination_address && s.destination_address.toLowerCase().includes(q))
      );
    });
  }, [shipments, searchQuery]);

  useEffect(() => { setPage(1); }, [searchQuery, pageSize, activeTab]);
  const pagedShipments = useMemo(
    () => filteredShipments.slice((page - 1) * pageSize, page * pageSize),
    [filteredShipments, page, pageSize],
  );

  const shippingMetrics = useMemo(() => {
    const totalSJP = shipments.length;
    const totalQty = shipments.reduce((acc, s) => acc + (Number(s.total_qty_shipped) || 0), 0);
    const totalVal = shipments.reduce((acc, s) => acc + (Number(s.total_billing_amount) || ((Number(s.total_qty_shipped) || 0) * (Number(s.unit_price) || 0))), 0);
    const totalCartons = shipments.reduce((acc, s) => acc + (Number(s.carton_box_count) || 0), 0);
    return { totalSJP, totalQty, totalVal, totalCartons };
  }, [shipments]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5" />
            Fase 6: Ekspedisi Pengiriman & Form WI
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">Shipping & Billing Form WI</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Penerbitan Surat Jalan Pengiriman (SJP Sandi) ke Buyer dan Rekapitulasi Tagihan CMT Form WI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateSJP}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Buat Surat Jalan Pengiriman (SJP)
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Total SJP Terbit
          </span>
          <p className="text-xl font-black text-white mt-1">{shippingMetrics.totalSJP} <span className="text-xs text-slate-500 font-normal">Surat Jalan</span></p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Total Qty Terkirim
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">{shippingMetrics.totalQty.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">Pcs</span></p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            Total Nilai Tagihan
          </span>
          <p className="text-xl font-black text-amber-300 mt-1">Rp {shippingMetrics.totalVal.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-indigo-400" />
            Total Dus / Karton
          </span>
          <p className="text-xl font-black text-indigo-400 mt-1">{shippingMetrics.totalCartons} <span className="text-xs text-slate-500 font-normal">Koli</span></p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('SHIPMENTS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'SHIPMENTS'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar SJP Pengiriman ({shipments.length})
          </button>
          <button
            onClick={() => setActiveTab('FORM_WI')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'FORM_WI'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Billing CMT / Rekap Form WI ({orders.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SJP, Invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'TABLE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'GRID' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
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
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: SHIPMENTS LIST (TABLE VS GRID) */}
      {activeTab === 'SHIPMENTS' && (
        viewMode === 'TABLE' ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Surat Jalan (SJP) & Tgl</th>
                  <th className="py-3 px-3">Driver / Ekspedisi</th>
                  <th className="py-3 px-3 text-right">Kuantitas Kirim</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-right">Nilai Tagihan</th>
                  <th className="py-3 px-3">No. Invoice</th>
                  <th className="py-3 px-4 text-center">Aksi / Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                      Memuat daftar Surat Jalan Pengiriman...
                    </td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Belum ada data pengiriman SJP yang cocok.
                    </td>
                  </tr>
                ) : (
                  pagedShipments.map((s) => {
                    const billVal = s.total_billing_amount || ((s.total_qty_shipped || 0) * (s.unit_price || 0));
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-white">{s.surat_jalan_no}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.shipment_date}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">{s.driver_name || "Sandi (Ekspedisi)"}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.vehicle_plate_no || "-"}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono">
                          {(s.total_qty_shipped || 0).toLocaleString('id-ID')} Pcs
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          Rp {(s.unit_price || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-300 font-mono">
                          Rp {billVal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3">
                          {s.invoice_number ? (
                            <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                              {s.invoice_number}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handlePrintSJP(s)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                              title="Cetak SJP Fisik"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => handleOpenEditSJP(s)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors cursor-pointer"
                              title="Edit SJP"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteShipment(s)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Hapus SJP"
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
            {pagedShipments.map((s) => {
              const billVal = s.total_billing_amount || ((s.total_qty_shipped || 0) * (s.unit_price || 0));
              return (
                <div key={s.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          SJP EKSPEDISI
                        </span>
                        <h4 className="text-base font-black text-white mt-1">{s.surat_jalan_no}</h4>
                        <p className="text-xs text-slate-400 font-mono">Tgl: {s.shipment_date}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-black text-emerald-400">
                          {(s.total_qty_shipped || 0).toLocaleString('id-ID')} Pcs
                        </span>
                        <span className="text-[10px] text-slate-500">{s.carton_box_count || 0} Dus</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs my-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Driver & Plat:</span>
                        <span className="font-semibold text-slate-200">{s.driver_name || "Sandi"} ({s.vehicle_plate_no || "-"})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tujuan:</span>
                        <span className="font-semibold text-slate-300 truncate max-w-[150px]" title={s.destination_address}>{s.destination_address || "Gudang Buyer"}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-500">Nilai Tagihan:</span>
                        <span className="font-bold text-amber-300 font-mono">Rp {billVal.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-blue-400 font-semibold">{s.invoice_number ? `INV: ${s.invoice_number}` : 'Belum Ada Invoice'}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handlePrintSJP(s)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer" title="Cetak SJP">
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button onClick={() => handleOpenEditSJP(s)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg cursor-pointer" title="Edit SJP">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteShipment(s)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg cursor-pointer" title="Hapus SJP">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'SHIPMENTS' && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredShipments.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* TAB 2: FORM WI SETTLEMENT LIST */}
      {activeTab === 'FORM_WI' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((so) => (
            <div key={so.id} className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {so.buyer_name || "BUYER"}
                    </span>
                    <h3 className="text-base font-black text-white mt-1 group-hover:text-emerald-300 transition-colors">
                      {so.so_number}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">{so.style_name}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-300">
                    Target: {so.order_qty} Pcs
                  </span>
                </div>

                <div className="text-xs text-slate-400 p-3 my-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span>Ongkos Jahit CMT:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    Rp {(so.unit_price || 0).toLocaleString('id-ID')} / Pcs
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSoIdForFormWI(so.id)}
                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Buka Rekap Form WI
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Quick Create / Edit SJP */}
      {isNewSJPOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveSJP} className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingShipment ? `Edit SJP: ${editingShipment.surat_jalan_no}` : 'Terbitkan Surat Jalan Pengiriman (SJP)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsNewSJPOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <label className="block text-xs text-slate-300 mb-1">Pilih Sales Order</label>
              <select
                required
                value={sjpForm.so_id}
                onChange={(e) => {
                  const sId = e.target.value;
                  const found = orders.find(o => o.id === sId);
                  setSjpForm({ 
                    ...sjpForm, 
                    so_id: sId, 
                    unit_price: found ? found.unit_price : 35000 
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {orders.map(so => (
                  <option key={so.id} value={so.id}>{so.so_number} - {so.style_name} ({so.order_qty} Pcs)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nomor SJP</label>
                <input
                  type="text"
                  value={sjpForm.surat_jalan_no}
                  onChange={(e) => setSjpForm({ ...sjpForm, surat_jalan_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Tanggal Kirim</label>
                <input
                  type="date"
                  value={sjpForm.shipment_date}
                  onChange={(e) => setSjpForm({ ...sjpForm, shipment_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Breakdown Ukuran Kirim */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Breakdown Ukuran SJP (Pcs):</span>
                <span className="font-black text-emerald-400">Total: {sjpForm.total_qty_shipped} Pcs</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(sizeMatrix).map(([sz, qty]) => (
                  <div key={sz} className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="block text-[10px] text-slate-400 font-bold">{sz}</span>
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(e) => handleSizeChange(sz, Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded py-0.5 text-center text-xs font-bold text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Nama Supir Ekspedisi</label>
                <input
                  type="text"
                  value={sjpForm.driver_name}
                  onChange={(e) => setSjpForm({ ...sjpForm, driver_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Plat Nomor Truk</label>
                <input
                  type="text"
                  value={sjpForm.vehicle_plate_no}
                  onChange={(e) => setSjpForm({ ...sjpForm, vehicle_plate_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Jml Dus (Koli)</label>
                <input
                  type="number"
                  value={sjpForm.carton_box_count}
                  onChange={(e) => setSjpForm({ ...sjpForm, carton_box_count: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Alamat Gudang Tujuan</label>
              <input
                type="text"
                value={sjpForm.destination_address}
                onChange={(e) => setSjpForm({ ...sjpForm, destination_address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Harga CMT (Rp/Pcs)</label>
                <input
                  type="number"
                  value={sjpForm.unit_price}
                  onChange={(e) => setSjpForm({ ...sjpForm, unit_price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Nomor Invoice (Opsional)</label>
                <input
                  type="text"
                  placeholder="INV-2026/08/001"
                  value={sjpForm.invoice_number}
                  onChange={(e) => setSjpForm({ ...sjpForm, invoice_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewSJPOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {submitting ? "Menyimpan..." : editingShipment ? "Simpan Koreksi" : "Terbitkan SJP"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Form WI Settlement Modal */}
      {selectedSoIdForFormWI && (
        <FormWIModal
          isOpen={true}
          onClose={() => setSelectedSoIdForFormWI(null)}
          soId={selectedSoIdForFormWI}
        />
      )}

      {/* Print Document Modal */}
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
