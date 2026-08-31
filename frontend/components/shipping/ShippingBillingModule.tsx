"use client";

import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, RefreshCw, Printer, FileText, 
  CheckCircle2, DollarSign, ArrowUpRight, CheckCheck, Eye
} from 'lucide-react';
import api from '@/services/api';
import PrintSuratJalanModal from '../common/PrintSuratJalanModal';
import FormWIModal from './FormWIModal';

export default function ShippingBillingModule() {
  const [activeTab, setActiveTab] = useState<'SHIPMENTS' | 'FORM_WI'>('SHIPMENTS');
  const [shipments, setShipments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isNewSJPOpen, setIsNewSJPOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<any>(null);
  const [selectedSoIdForFormWI, setSelectedSoIdForFormWI] = useState<string | null>(null);

  // New SJP Form State
  const [newSJP, setNewSJP] = useState({
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
      if (oRes.data && oRes.data.length > 0 && !newSJP.so_id) {
        setNewSJP(prev => ({ ...prev, so_id: oRes.data[0].id, unit_price: oRes.data[0].unit_price || 35000 }));
      }
    } catch (err) {
      console.error("Gagal mengambil data pengiriman:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSizeChange = (key: string, val: number) => {
    const updated = { ...sizeMatrix, [key]: Math.max(0, val) };
    setSizeMatrix(updated);
    const sum = Object.values(updated).reduce((acc, q) => acc + (Number(q) || 0), 0);
    setNewSJP(prev => ({ ...prev, total_qty_shipped: sum }));
  };

  const handleCreateSJP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/shipping/shipments', {
        so_id: newSJP.so_id,
        shipment_date: newSJP.shipment_date,
        surat_jalan_no: newSJP.surat_jalan_no.toUpperCase(),
        driver_name: newSJP.driver_name,
        vehicle_plate_no: newSJP.vehicle_plate_no.toUpperCase(),
        carton_box_count: Number(newSJP.carton_box_count) || 0,
        destination_address: newSJP.destination_address,
        total_qty_shipped: Number(newSJP.total_qty_shipped),
        size_breakdown_shipped: sizeMatrix,
        unit_price: Number(newSJP.unit_price),
        invoice_number: newSJP.invoice_number ? newSJP.invoice_number.toUpperCase() : null,
        remarks: newSJP.remarks
      });
      setIsNewSJPOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal membuat SJP.");
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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5" />
            Fase 6: Ekspedisi Pengiriman & Form WI
          </div>
          <h1 className="text-2xl font-black text-white">Shipping & Billing Form WI</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Penerbitan Surat Jalan Pengiriman (SJP Sandi) ke Buyer dan Rekapitulasi Tagihan CMT Form WI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewSJPOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            + Buat Surat Jalan Pengiriman (SJP)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('SHIPMENTS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'SHIPMENTS'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Surat Jalan Pengiriman SJP ({shipments.length})
          </button>
          <button
            onClick={() => setActiveTab('FORM_WI')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'FORM_WI'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rekap Form WI & Billing CMT ({orders.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* TAB 1: SHIPMENTS LIST */}
      {activeTab === 'SHIPMENTS' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Nomor SJP & Tgl</th>
                <th className="py-3 px-3">Driver / Supir</th>
                <th className="py-3 px-3 text-right">Kuantitas Kirim</th>
                <th className="py-3 px-3 text-right">Harga CMT</th>
                <th className="py-3 px-3 text-right">Total Nilai SJP</th>
                <th className="py-3 px-3">No. Invoice</th>
                <th className="py-3 px-4 text-center">Cetak SJP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Memuat daftar pengiriman...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data Surat Jalan Pengiriman (SJP).
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">{s.surat_jalan_no}</div>
                      <div className="text-[11px] text-slate-500">{s.shipment_date}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{s.driver_name || "Sandi"}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400">
                      {s.total_qty_shipped.toLocaleString('id-ID')} Pcs
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      Rp {(s.unit_price || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-white">
                      Rp {(s.total_invoice_amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3">
                      {s.invoice_number ? (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {s.invoice_number}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handlePrintSJP(s)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-400" /> Cetak SJP
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: FORM WI SETTLEMENT LIST */}
      {activeTab === 'FORM_WI' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((so) => (
            <div key={so.id} className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-all group">
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

              <div className="text-xs text-slate-400 p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>Ongkos Jahit CMT:</span>
                <span className="font-black text-emerald-400 text-sm">
                  Rp {(so.unit_price || 0).toLocaleString('id-ID')} / Pcs
                </span>
              </div>

              <button
                onClick={() => setSelectedSoIdForFormWI(so.id)}
                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> Buka Rekap Form WI
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Quick Create SJP */}
      {isNewSJPOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleCreateSJP} className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl my-8">
            <h3 className="text-base font-bold text-white">Terbitkan Surat Jalan Pengiriman (SJP)</h3>
            
            <div>
              <label className="block text-xs text-slate-300 mb-1">Pilih Sales Order</label>
              <select
                required
                value={newSJP.so_id}
                onChange={(e) => {
                  const sId = e.target.value;
                  const found = orders.find(o => o.id === sId);
                  setNewSJP({ 
                    ...newSJP, 
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
                  value={newSJP.surat_jalan_no}
                  onChange={(e) => setNewSJP({ ...newSJP, surat_jalan_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Tanggal Kirim</label>
                <input
                  type="date"
                  value={newSJP.shipment_date}
                  onChange={(e) => setNewSJP({ ...newSJP, shipment_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Breakdown Ukuran Kirim */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Breakdown Ukuran SJP (Pcs):</span>
                <span className="font-black text-emerald-400">Total: {newSJP.total_qty_shipped} Pcs</span>
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
                  value={newSJP.driver_name}
                  onChange={(e) => setNewSJP({ ...newSJP, driver_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Plat Nomor Truk</label>
                <input
                  type="text"
                  value={newSJP.vehicle_plate_no}
                  onChange={(e) => setNewSJP({ ...newSJP, vehicle_plate_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Jml Dus (Koli)</label>
                <input
                  type="number"
                  value={newSJP.carton_box_count}
                  onChange={(e) => setNewSJP({ ...newSJP, carton_box_count: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Alamat Gudang Tujuan</label>
              <input
                type="text"
                value={newSJP.destination_address}
                onChange={(e) => setNewSJP({ ...newSJP, destination_address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Harga CMT (Rp/Pcs)</label>
                <input
                  type="number"
                  value={newSJP.unit_price}
                  onChange={(e) => setNewSJP({ ...newSJP, unit_price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Nomor Invoice (Opsional)</label>
                <input
                  type="text"
                  placeholder="INV-2026/08/001"
                  value={newSJP.invoice_number}
                  onChange={(e) => setNewSJP({ ...newSJP, invoice_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewSJPOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20"
              >
                {submitting ? "Menerbitkan..." : "Terbitkan SJP"}
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
