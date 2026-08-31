"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Plus, Search, RefreshCw, Users, Layers, 
  Calendar, CheckCircle2, ChevronRight, Phone, MapPin, Tag, ArrowUpRight,
  Pencil, Trash2, Building2, User, Mail, DollarSign, Clock, Scissors,
  FileText, Eye, X, MessageSquare, ExternalLink, ShieldAlert
} from 'lucide-react';
import api from '@/services/api';
import SalesOrderModal from './SalesOrderModal';
import PartnerModal from './PartnerModal';

export default function PPICModule() {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PARTNERS'>('ORDERS');
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [isSOModalOpen, setIsSOModalOpen] = useState<boolean>(false);
  const [selectedSO, setSelectedSO] = useState<any>(null);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState<boolean>(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  // Detail Modal State
  const [detailSO, setDetailSO] = useState<any | null>(null);

  // Filter partner category
  const [partnerCategory, setPartnerCategory] = useState<string>("ALL");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ORDERS') {
        const res = await api.get('/api/ppic/orders');
        setOrders(res.data || []);
      } else {
        const res = await api.get('/api/ppic/partners');
        setPartners(res.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data PPIC:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditSO = (so: any) => {
    setSelectedSO(so);
    setIsSOModalOpen(true);
  };

  const handleOpenCreateSO = () => {
    setSelectedSO(null);
    setIsSOModalOpen(true);
  };

  const handleDeleteSO = async (so: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Sales Order '${so.so_number}'? Aksi ini akan dicatat di Log Audit Keamanan.`)) return;
    try {
      await api.delete(`/api/ppic/orders/${so.id}`);
      fetchData();
      if (detailSO?.id === so.id) setDetailSO(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal menghapus Sales Order.");
    }
  };

  const handleOpenEditPartner = (partner: any) => {
    setSelectedPartner(partner);
    setIsPartnerModalOpen(true);
  };

  const handleOpenCreatePartner = () => {
    setSelectedPartner(null);
    setIsPartnerModalOpen(true);
  };

  const handleDeletePartner = async (partner: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Rekanan '${partner.name}'?`)) return;
    try {
      await api.delete(`/api/ppic/partners/${partner.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Gagal menghapus rekanan.");
    }
  };

  const filteredOrders = orders.filter(o =>
    o.so_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.style_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.buyer_po_number && o.buyer_po_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.customer_pic_name && o.customer_pic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.buyer_name && o.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPartners = partners.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
    if (partnerCategory === "ALL") return matchQuery;
    return matchQuery && p.category === partnerCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Fase 1: PPIC & Planning
          </div>
          <h1 className="text-2xl font-black text-white">Sales Order & Master Mitra</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Registrasi Code SO, No. PO Buyer, Data Finansial Kontrak, Bill of Materials (BOM), Breakdown Ukuran, dan Spesifikasi Bahan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'ORDERS' ? (
            <button
              onClick={handleOpenCreateSO}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Buat Sales Order Baru
            </button>
          ) : (
            <button
              onClick={handleOpenCreatePartner}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Tambah Master Rekanan
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Sales Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('PARTNERS')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'PARTNERS'
                ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Master Rekanan & Subcon ({partners.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SO, PO Buyer, PIC, Style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchData}
            title="Muat Ulang Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: SALES ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
              Memuat daftar Sales Order...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
              Belum ada data Sales Order yang sesuai. Klik tombol "+ Buat Sales Order Baru" di atas.
            </div>
          ) : (
            filteredOrders.map((so) => {
              const breakdown = so.size_breakdown_target || {};
              const contractType = so.contract_type || 'CMT';
              const totalVal = so.total_order_value || ((so.order_qty || 0) * (so.unit_price || 0));

              return (
                <div key={so.id} className="bg-slate-900/80 border border-slate-800/90 p-5 rounded-3xl space-y-4 hover:border-slate-700 transition-all group flex flex-col justify-between shadow-lg">
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                            {so.buyer_name || "BUYER UMUM"}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            contractType === 'FOB'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          }`}>
                            {contractType}
                          </span>
                          {so.buyer_po_number && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              PO: {so.buyer_po_number}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-white mt-1.5 group-hover:text-blue-300 transition-colors font-mono">
                          {so.so_number}
                        </h3>
                        <p className="text-xs text-slate-300 font-bold">{so.style_name}</p>
                      </div>
                      
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-800 text-emerald-400 border border-slate-700 block font-mono">
                          {(so.order_qty || 0).toLocaleString('id-ID')} Pcs
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400/90 font-mono block mt-1">
                          Rp {totalVal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Grid Meta Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2.5 my-3 border-y border-slate-800/80 text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Kategori & Warna:</span>
                        <span className="font-semibold">{so.item_category} • {so.color || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Harga Satuan:</span>
                        <span className="font-semibold text-emerald-400">Rp {(so.unit_price || 0).toLocaleString('id-ID')}/pcs</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Kain Utama:</span>
                        <span className="font-semibold truncate block max-w-[140px]" title={so.fabric_type || 'Denim'}>
                          {so.fabric_type || 'Denim 13.5 Oz'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">PIC Merchandiser:</span>
                        <span className="font-semibold truncate block max-w-[140px]" title={so.customer_pic_name || '-'}>
                          {so.customer_pic_name || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Size Breakdown Pills */}
                    {Object.keys(breakdown).length > 0 && (
                      <div className="mb-3">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">BREAKDOWN SIZE:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(breakdown).map(([sz, qty]: any) => (
                            <div key={sz} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px]">
                              <span className="text-slate-400 mr-1 font-mono">{sz}:</span>
                              <span className="font-bold text-white font-mono">{qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Card */}
                  <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
                    <div className="space-y-0.5">
                      <span>Tgl: {so.order_date || "-"}</span>
                      {so.deadline && (
                        <span className="block text-amber-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> DL: {so.deadline}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDetailSO(so)}
                        title="Lihat Detail Lengkap PO"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditSO(so)}
                        title="Edit / Koreksi Sales Order"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSO(so)}
                        title="Hapus Sales Order"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: MASTER REKANAN & SUBCON */}
      {activeTab === 'PARTNERS' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['ALL', 'BUYER', 'SUPPLIER_FABRIC', 'MAKLUN_SEWING', 'SUBCON_WASHING', 'SUBCON_PRINT', 'SUBCON_EMBROIDERY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setPartnerCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  partnerCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map((p) => (
              <div key={p.id} className="bg-slate-900/80 border border-slate-800/90 p-5 rounded-3xl space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {p.category.replace('_', ' ')}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{p.name}</h3>
                    </div>
                    {p.code && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{p.code}</span>
                    )}
                  </div>
                  <div className="space-y-1.5 mt-3 text-xs">
                    <p className="text-slate-400 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{p.address || "Bandung, Jawa Barat"}</span>
                    </p>
                    <p className="text-slate-400 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono">{p.phone || "-"}</span>
                      {p.phone && (
                        <a
                          href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] ml-auto font-bold"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 flex items-center justify-end gap-1.5 border-t border-slate-800/60">
                  <button
                    onClick={() => handleOpenEditPartner(p)}
                    title="Edit Data Rekanan"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePartner(p)}
                    title="Hapus Rekanan"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL DRAWER FOR SALES ORDER */}
      {detailSO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Detail Sales Order: {detailSO.so_number}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {detailSO.style_name} • {detailSO.buyer_name || 'Buyer Umum'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailSO(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* 1. Komersial & Finansial */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" />
                  Ringkasan Nilai Kontrak & Finansial
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Skema Kontrak:</span>
                    <span className="font-bold text-white text-sm">{detailSO.contract_type || 'CMT'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Harga Satuan:</span>
                    <span className="font-bold text-emerald-400 text-sm font-mono">
                      Rp {(detailSO.unit_price || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Nilai Order:</span>
                    <span className="font-black text-emerald-400 text-sm font-mono">
                      Rp {(detailSO.total_order_value || ((detailSO.order_qty || 0) * (detailSO.unit_price || 0))).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Uang Muka (DP):</span>
                    <span className="font-bold text-amber-400 text-sm font-mono">
                      Rp {(detailSO.dp_amount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Termin Pembayaran: <strong className="text-slate-200">{detailSO.payment_terms || 'NET_30'}</strong></span>
                  <span>PPN: <strong className="text-slate-200">{detailSO.tax_ppn_pct || 0}%</strong></span>
                  <span>Diskon: <strong className="text-slate-200">Rp {(detailSO.discount_amount || 0).toLocaleString('id-ID')}</strong></span>
                </div>
              </div>

              {/* 2. Customer & Delivery Address */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  Informasi Buyer & Kontak PIC
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[11px]">No. PO Buyer:</span>
                    <span className="font-bold text-white font-mono">{detailSO.buyer_po_number || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">PIC Merchandiser:</span>
                    <span className="font-bold text-white">{detailSO.customer_pic_name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Telepon / WhatsApp:</span>
                    <span className="font-mono text-white flex items-center gap-2">
                      {detailSO.customer_pic_phone || "-"}
                      {detailSO.customer_pic_phone && (
                        <a
                          href={`https://wa.me/${detailSO.customer_pic_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold"
                        >
                          <MessageSquare className="w-3 h-3" /> Chat WA
                        </a>
                      )}
                    </span>
                  </div>
                </div>
                {detailSO.delivery_address && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 block text-[11px]">Alamat Pengiriman Gudang:</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{detailSO.delivery_address}</p>
                  </div>
                )}
              </div>

              {/* 3. Matriks Ukuran & BOM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                    <Scissors className="w-4 h-4" />
                    Breakdown Matriks Ukuran
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(detailSO.size_breakdown_target || {}).map(([sz, q]: any) => (
                      <div key={sz} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
                        <span className="text-slate-400 block text-[10px] font-mono">{sz}</span>
                        <span className="text-white font-bold text-xs font-mono">{q} Pcs</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    Bill of Materials (BOM Trims)
                  </h4>
                  <div className="space-y-1.5">
                    {(detailSO.bom_accessories || []).map((b: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-white font-medium">{b.item}</span>
                        <span className="text-amber-300 font-mono font-bold">{b.qty_per_pcs} pcs/baju</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Spesifikasi Teknis */}
              {(detailSO.fabric_type || detailSO.special_instructions) && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    Spesifikasi Teknis & SOP Jahit
                  </h4>
                  <div className="space-y-1">
                    {detailSO.fabric_type && (
                      <p className="text-slate-300">
                        <strong className="text-slate-500">Bahan Kain:</strong> {detailSO.fabric_type} (Susut: {detailSO.target_shrinkage_pct || 0}%)
                      </p>
                    )}
                    {detailSO.special_instructions && (
                      <p className="text-slate-300">
                        <strong className="text-slate-500">Instruksi:</strong> {detailSO.special_instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950">
              <button
                onClick={() => setDetailSO(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialogs */}
      <SalesOrderModal
        isOpen={isSOModalOpen}
        onClose={() => {
          setIsSOModalOpen(false);
          setSelectedSO(null);
        }}
        onSuccess={fetchData}
        initialData={selectedSO}
      />

      <PartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => {
          setIsPartnerModalOpen(false);
          setSelectedPartner(null);
        }}
        onSuccess={fetchData}
        initialData={selectedPartner}
      />

    </div>
  );
}
