"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Plus, Search, RefreshCw, Users, Layers, 
  Calendar, CheckCircle2, ChevronRight, Phone, MapPin, Tag, ArrowUpRight
} from 'lucide-react';
import api from '@/services/api';
import SalesOrderModal from './SalesOrderModal';

export default function PPICModule() {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PARTNERS'>('ORDERS');
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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

  const filteredOrders = orders.filter(o =>
    o.so_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.style_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            Registrasi Code SO, Bill of Materials (BOM), Breakdown Ukuran dan Database Rekanan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            + Buat Sales Order Baru
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Sales Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('PARTNERS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'PARTNERS'
                ? 'bg-slate-800 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Master Rekanan & Subcon ({partners.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
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
            <div className="col-span-full py-12 text-center text-slate-400">
              Belum ada data Sales Order. Klik tombol "+ Buat Sales Order Baru" di atas.
            </div>
          ) : (
            filteredOrders.map((so) => {
              const breakdown = so.size_breakdown_target || {};
              return (
                <div key={so.id} className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-700 transition-all group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {so.buyer_name || "BUYER UMUM"}
                      </span>
                      <h3 className="text-lg font-black text-white mt-1 group-hover:text-blue-300 transition-colors">
                        {so.so_number}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">{so.style_name}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-800 text-emerald-400 border border-slate-700">
                      {so.order_qty.toLocaleString('id-ID')} Pcs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Kategori:</span>
                      <span className="font-semibold">{so.item_category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Warna:</span>
                      <span className="font-semibold">{so.color || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Harga CMT:</span>
                      <span className="font-semibold text-emerald-400">Rp {(so.unit_price || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Status Lini:</span>
                      <span className="font-bold text-indigo-400">{so.status}</span>
                    </div>
                  </div>

                  {/* Size Breakdown Pills */}
                  {Object.keys(breakdown).length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">BREAKDOWN SIZE:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(breakdown).map(([sz, qty]: any) => (
                          <div key={sz} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px]">
                            <span className="text-slate-400 mr-1">{sz}:</span>
                            <span className="font-bold text-white">{qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
                    <span>Tgl: {so.order_date || "-"}</span>
                    {so.deadline && <span className="text-amber-400 font-semibold">DL: {so.deadline}</span>}
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
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['ALL', 'BUYER', 'MAKLUN_SEWING', 'SUBCON_WASHING', 'SUBCON_PRINT', 'SUBCON_EMBROIDERY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setPartnerCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  partnerCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map((p) => (
              <div key={p.id} className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {p.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{p.name}</h3>
                  </div>
                  {p.code && (
                    <span className="text-xs font-mono text-slate-500">{p.code}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {p.address || "Bandung, Jawa Barat"}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {p.phone || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <SalesOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

    </div>
  );
}
