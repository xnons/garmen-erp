"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, ShieldCheck, Scissors, Plus, Search, RefreshCw, 
  Printer, AlertOctagon, CheckCircle2, FileText, ArrowDownLeft, ArrowUpRight,
  Pencil, Trash2, LayoutGrid, List, Filter, AlertTriangle, Layers, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { errMsg, formatRp, formatQty } from '@/utils/format';
import Pagination from '@/components/common/Pagination';
import { clampPage } from '@/utils/pagination';
import FabricInspectionModal from './FabricInspectionModal';
import FabricAllocationModal from './FabricAllocationModal';
import PrintSuratJalanModal from '../common/PrintSuratJalanModal';

export default function WarehouseFabricModule() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'RECEIPTS' | 'INSPECTION' | 'ALLOCATIONS'>('STOCK');
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(24);
  const [items, setItems] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Layout & Filtering State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Modals
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isAllocationOpen, setIsAllocationOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<any>(null);

  // New & Edit Item State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    item_code: "",
    description: "",
    item_type: "FABRIC_MAIN",
    unit: "YARD",
    unit_price: 25000,
    current_stock: 0,
    color_shade_lot: "",
    width_inch: 58.0,
    gramasi_gsm: 0,
    min_stock_alert: 50.0,
    rack_location: "GUDANG_UTAMA"
  });

  // New & Edit Receipt State
  const [isAddReceiptOpen, setIsAddReceiptOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<any>(null);
  const [receiptForm, setReceiptForm] = useState({
    item_id: "",
    supplier_id: "",
    receipt_date: new Date().toISOString().split('T')[0],
    roll_number: "ROLL-01",
    qty_received: 100,
    unit: "YARD",
    contract_type: "FOB"
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'STOCK') {
        const res = await api.get('/api/warehouse/items');
        setItems(res.data || []);
      } else if (activeTab === 'RECEIPTS') {
        const res = await api.get('/api/warehouse/receipts');
        setReceipts(res.data || []);
        const iRes = await api.get('/api/warehouse/items');
        setItems(iRes.data || []);
      } else if (activeTab === 'INSPECTION') {
        const res = await api.get('/api/warehouse/inspections');
        setInspections(res.data || []);
        const rRes = await api.get('/api/warehouse/receipts');
        setReceipts(rRes.data || []);
      } else if (activeTab === 'ALLOCATIONS') {
        const res = await api.get('/api/warehouse/allocations');
        setAllocations(res.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data gudang bahan:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (i.item_code && i.item_code.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.rack_location && i.rack_location.toLowerCase().includes(q)) ||
        (i.color_shade_lot && i.color_shade_lot.toLowerCase().includes(q));

      const matchCategory = categoryFilter === "ALL" || i.item_type === categoryFilter;
      const matchLowStock = !showLowStockOnly || (Number(i.current_stock) <= Number(i.min_stock_alert || 50));

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [items, searchQuery, categoryFilter, showLowStockOnly]);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => { setStockPage(1); }, [searchQuery, categoryFilter, showLowStockOnly, stockPageSize]);

  const safeStockPage = clampPage(stockPage, filteredItems.length, stockPageSize);
  const pagedItems = useMemo(() => {
    const start = (safeStockPage - 1) * stockPageSize;
    return filteredItems.slice(start, start + stockPageSize);
  }, [filteredItems, safeStockPage, stockPageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSKU = items.length;
    const totalYardage = items.reduce((acc, i) => acc + (Number(i.current_stock) || 0), 0);
    const totalValuation = items.reduce((acc, i) => acc + ((Number(i.current_stock) || 0) * (Number(i.unit_price) || 0)), 0);
    const lowStockCount = items.filter(i => (Number(i.current_stock) || 0) <= (Number(i.min_stock_alert) || 50)).length;
    return { totalSKU, totalYardage, totalValuation, lowStockCount };
  }, [items]);

  // Item Handlers
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemForm({
      item_code: "",
      description: "",
      item_type: "FABRIC_MAIN",
      unit: "YARD",
      unit_price: 25000,
      current_stock: 0,
      color_shade_lot: "",
      width_inch: 58.0,
      gramasi_gsm: 0,
      min_stock_alert: 50.0,
      rack_location: "GUDANG_UTAMA"
    });
    setIsAddItemOpen(true);
  };

  const handleOpenEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      item_code: item.item_code || "",
      description: item.description || "",
      item_type: item.item_type || "FABRIC_MAIN",
      unit: item.unit || "YARD",
      unit_price: item.unit_price || 25000,
      current_stock: item.current_stock || 0,
      color_shade_lot: item.color_shade_lot || "",
      width_inch: item.width_inch || 58.0,
      gramasi_gsm: item.gramasi_gsm || 0,
      min_stock_alert: item.min_stock_alert || 50.0,
      rack_location: item.rack_location || "GUDANG_UTAMA"
    });
    setIsAddItemOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/api/warehouse/items/${editingItem.id}`, itemForm);
      } else {
        await api.post('/api/warehouse/items', itemForm);
      }
      setIsAddItemOpen(false);
      toast.success(editingItem ? "Item bahan diperbarui." : "Item bahan ditambahkan.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal menyimpan item bahan."));
    }
  };

  const handleDeleteItem = async (item: any) => {
    const ok = await confirm({
      title: "Hapus item bahan?",
      message: `${item.description} (${item.item_code}) akan dihapus permanen.`,
      confirmText: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/warehouse/items/${item.id}`);
      toast.success("Item bahan dihapus.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal menghapus item bahan."));
    }
  };

  // Receipt Handlers
  const handleOpenCreateReceipt = () => {
    setEditingReceipt(null);
    setReceiptForm({
      item_id: items.length > 0 ? items[0].id : "",
      supplier_id: "",
      receipt_date: new Date().toISOString().split('T')[0],
      roll_number: `ROLL-${Date.now().toString().slice(-4)}`,
      qty_received: 100,
      unit: "YARD",
      contract_type: "FOB"
    });
    setIsAddReceiptOpen(true);
  };

  const handleOpenEditReceipt = (rec: any) => {
    setEditingReceipt(rec);
    setReceiptForm({
      item_id: rec.item_id || "",
      supplier_id: rec.supplier_id || "",
      receipt_date: rec.receipt_date ? rec.receipt_date.split('T')[0] : new Date().toISOString().split('T')[0],
      roll_number: rec.roll_number || "",
      qty_received: rec.qty_received || 0,
      unit: rec.unit || "YARD",
      contract_type: rec.contract_type || "FOB"
    });
    setIsAddReceiptOpen(true);
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReceipt) {
        await api.put(`/api/warehouse/receipts/${editingReceipt.id}`, receiptForm);
      } else {
        await api.post('/api/warehouse/receipts', receiptForm);
      }
      setIsAddReceiptOpen(false);
      toast.success(editingReceipt ? "Log roll diperbarui." : "Log roll masuk dicatat.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal mencatat log roll masuk."));
    }
  };

  const handleDeleteReceipt = async (rec: any) => {
    const ok = await confirm({
      title: "Hapus roll masuk?",
      message: `Pencatatan roll #${rec.roll_number} akan dihapus.`,
      confirmText: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/warehouse/receipts/${rec.id}`);
      toast.success("Roll masuk dihapus.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal menghapus roll masuk."));
    }
  };

  const handleDeleteAllocation = async (alloc: any) => {
    const ok = await confirm({
      title: "Batalkan penyerahan bahan?",
      message: `Surat Jalan '${alloc.surat_jalan_no}' (${formatQty(alloc.qty_issued, " yd")}) dibatalkan — stok bahan dikembalikan ke gudang.`,
      confirmText: "Batalkan",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/api/warehouse/allocations/${alloc.id}`);
      toast.success("Alokasi bahan dibatalkan, stok dikembalikan.");
      fetchData();
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal membatalkan alokasi bahan."));
    }
  };

  const handlePrintSuratJalan = (alloc: any) => {
    setPrintDoc({
      title: "SURAT JALAN PENGELUARAN BAHAN BAKU (SJ-MATERIAL)",
      suratJalanNo: alloc.surat_jalan_no || `SJ-MAT-${alloc.id.slice(0, 6)}`,
      dateStr: alloc.dispatch_date,
      senderName: "Gudang Bahan Baku CJM",
      senderRole: "Petugas Gudang Kain",
      recipientName: "Meja Potong - Workshop Utama",
      recipientCategory: "Divisi Cutting",
      driverName: "—",
      soNumber: alloc.so_number || 'SO-UNASSIGNED',
      styleName: alloc.item_description || 'Kain Utama',
      itemCategory: "Bahan Baku / Kain",
      totalQty: alloc.qty_issued || 0,
      unit: "YARD",
      remarks: "Pengeluaran kain dari gudang untuk kebutuhan produksi meja potong.",
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Package className="w-3.5 h-3.5" />
            Fase 2: Gudang Bahan Baku & QC 4-Point
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">Warehouse & Fabric Inspection</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Manajemen log roll kain masuk, Uji Mutu 4-Point ASTM (Safety Gate), dan Alokasi Meja Potong.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenCreateReceipt}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            + Log Roll Masuk
          </button>
          
          <button
            onClick={() => {
              api.get('/api/warehouse/receipts').then(res => setReceipts(res.data || []));
              setIsInspectionOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 rounded-xl text-xs font-semibold border border-indigo-700/50 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            + Input Uji QC 4-Point
          </button>

          <button
            onClick={() => {
              api.get('/api/warehouse/items').then(res => setItems(res.data || []));
              setIsAllocationOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            + Alokasi ke Potong (Sheet25)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'STOCK'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Saldo Stok ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('RECEIPTS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'RECEIPTS'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Barang Masuk ({receipts.length})
          </button>
          <button
            onClick={() => setActiveTab('INSPECTION')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'INSPECTION'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log Uji Mutu QC ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('ALLOCATIONS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'ALLOCATIONS'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Penyerahan Bahan Sheet25 ({allocations.length})
          </button>
        </div>

        <button
          onClick={fetchData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* TAB 1: SALDO STOK BAHAN */}
      {activeTab === 'STOCK' && (
        <div className="space-y-5">
          {/* 📊 SUMMARY METRICS RIBBON */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                Total SKU Bahan
              </span>
              <p className="text-xl font-black text-white mt-1">{metrics.totalSKU} <span className="text-xs text-slate-500 font-normal">Item</span></p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Total Stok Fisik
              </span>
              <p className="text-xl font-black text-emerald-400 mt-1">{formatQty(metrics.totalYardage)} <span className="text-xs text-slate-400 font-normal">Yard</span></p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Estimasi Nilai Aset
              </span>
              <p className="text-xl font-black text-amber-300 mt-1">{formatRp(metrics.totalValuation)}</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Perlu Re-Order
              </span>
              <p className={`text-xl font-black mt-1 ${metrics.lowStockCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {metrics.lowStockCount} <span className="text-xs text-slate-500 font-normal">Item Kritis</span>
              </p>
            </div>
          </div>

          {/* 🎛️ CUSTOMIZATION TOOLBAR: SEARCH, CATEGORY PILLS & VIEW MODE SWITCHER */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama kain, kode item, lot, lokasi rak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Category Pills & Low Stock Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setCategoryFilter("ALL")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    categoryFilter === "ALL" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setCategoryFilter("FABRIC_MAIN")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    categoryFilter === "FABRIC_MAIN" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Kain Utama
                </button>
                <button
                  onClick={() => setCategoryFilter("PURING")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    categoryFilter === "PURING" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Puring
                </button>
              </div>

              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showLowStockOnly
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Stok Rendah</span>
              </button>

              {/* 🔄 VIEW MODE SWITCHER (GRID VS TABLE) */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 ml-auto">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'GRID' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tampilan Grid Card"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('TABLE')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'TABLE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tampilan Tabel Spreadsheet"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleOpenCreateItem}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Master Item
              </button>
            </div>
          </div>

          {/* 📦 CONTENT VIEW: GRID CARDS OR SPREADSHEET TABLE */}
          {viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedItems.map((i) => {
                const isLow = Number(i.current_stock || 0) <= Number(i.min_stock_alert || 50);
                return (
                  <div 
                    key={i.id} 
                    className={`bg-slate-900/80 border p-5 rounded-2xl space-y-3 flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-xl ${
                      isLow ? 'border-rose-500/30' : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {i.item_type}
                            </span>
                            {isLow && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" /> REORDER
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-white mt-1.5">{i.description}</h4>
                          <p className="text-xs font-mono text-slate-500">{i.item_code}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`block text-xl font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {(i.current_stock || 0).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">{i.unit}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 pt-2.5 mt-2.5 border-t border-slate-800 flex justify-between">
                        <span>Estimasi Harga/Satuan:</span>
                        <span className="font-semibold text-slate-200">Rp {(i.unit_price || 0).toLocaleString('id-ID')}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2">
                        <div>
                          <span className="text-slate-500">Rak:</span> <span className="font-mono text-slate-300 font-semibold">{i.rack_location || "GUDANG_UTAMA"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500">Min Alert:</span> <span className="font-mono text-amber-400 font-semibold">{i.min_stock_alert || 50} {i.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 flex items-center justify-between border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Valuasi: <span className="text-slate-300 font-bold">Rp {((i.current_stock || 0) * (i.unit_price || 0)).toLocaleString('id-ID')}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditItem(i)}
                          title="Edit Item Bahan"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(i)}
                          title="Hapus Item Bahan"
                          className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Kode Item</th>
                    <th className="py-3 px-3">Deskripsi Kain</th>
                    <th className="py-3 px-3">Jenis</th>
                    <th className="py-3 px-3">Lokasi Rak</th>
                    <th className="py-3 px-3 text-right">Stok Fisik</th>
                    <th className="py-3 px-3 text-right">Min Alert</th>
                    <th className="py-3 px-3 text-right">Harga / Unit</th>
                    <th className="py-3 px-3 text-right">Total Valuasi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {pagedItems.map((i) => {
                    const isLow = Number(i.current_stock || 0) <= Number(i.min_stock_alert || 50);
                    return (
                      <tr key={i.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400 font-bold">{i.item_code}</td>
                        <td className="py-3 px-3 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{i.description}</span>
                            {isLow && (
                              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                REORDER
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {i.item_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{i.rack_location || "GUDANG_UTAMA"}</td>
                        <td className="py-3 px-3 text-right font-black">
                          <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                            {(i.current_stock || 0).toLocaleString('id-ID')} {i.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {i.min_stock_alert || 50} {i.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          Rp {(i.unit_price || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          Rp {((i.current_stock || 0) * (i.unit_price || 0)).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditItem(i)}
                              title="Edit Item Bahan"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(i)}
                              title="Hapus Item Bahan"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-50" />
              <p className="text-sm font-semibold">Tidak ada data item bahan yang cocok dengan filter pencarian.</p>
            </div>
          )}

          <Pagination
            page={safeStockPage}
            pageSize={stockPageSize}
            total={filteredItems.length}
            onPageChange={setStockPage}
            onPageSizeChange={setStockPageSize}
            pageSizeOptions={[12, 24, 48, 96]}
          />
        </div>
      )}

      {/* TAB 2: BARANG MASUK */}
      {activeTab === 'RECEIPTS' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tgl Masuk</th>
                <th className="py-3 px-3">Item Kain</th>
                <th className="py-3 px-3">Roll Number</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3 text-right">Kuantitas</th>
                <th className="py-3 px-3">Kontrak</th>
                <th className="py-3 px-3 text-center">Status QC</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono">{r.receipt_date}</td>
                  <td className="py-3 px-3 font-bold text-white">{r.item_description}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{r.roll_number || "-"}</td>
                  <td className="py-3 px-3 text-slate-300">{r.supplier_name || "SUPPLIER UMUM"}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-400">{r.qty_received} {r.unit}</td>
                  <td className="py-3 px-3 text-slate-400 font-semibold">{r.contract_type}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.inspection_status === 'PASSED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : r.inspection_status === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.inspection_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditReceipt(r)}
                        title="Edit Log Masuk"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReceipt(r)}
                        title="Hapus Roll Masuk"
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

      {/* TAB 3: FABRIC INSPECTION (4-POINT ASTM) */}
      {activeTab === 'INSPECTION' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tgl Uji</th>
                <th className="py-3 px-3">Inspector</th>
                <th className="py-3 px-3 text-right">SJ vs Aktual</th>
                <th className="py-3 px-3 text-right">Lebar (Inch)</th>
                <th className="py-3 px-3 text-right">Defect Points</th>
                <th className="py-3 px-3 text-right">Score ASTM</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-4">Catatan Cacat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {inspections.map((fi) => (
                <tr key={fi.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono">{fi.inspection_date}</td>
                  <td className="py-3 px-3 font-semibold text-white">{fi.inspector_name || "Fitrah (QC)"}</td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {fi.length_before} Yd <span className="text-slate-500">➔</span> {fi.length_after} Yd
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">{fi.width_inch}"</td>
                  <td className="py-3 px-3 text-right font-bold text-amber-400">{fi.total_defect_points} Pt</td>
                  <td className="py-3 px-3 text-right font-black text-indigo-300">{fi.summary_point}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      fi.grade === 'GRADE_A'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : fi.grade === 'GRADE_B'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {fi.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{fi.defect_remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: ALLOCATIONS (SHEET25) */}
      {activeTab === 'ALLOCATIONS' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tgl Pengeluaran</th>
                <th className="py-3 px-3">Surat Jalan (Sheet25)</th>
                <th className="py-3 px-3">Sales Order Target</th>
                <th className="py-3 px-3">Item Kain</th>
                <th className="py-3 px-3 text-right">Yard Dikeluarkan</th>
                <th className="py-3 px-4 text-center">Aksi / Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono">{a.dispatch_date}</td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">{a.surat_jalan_no}</td>
                  <td className="py-3 px-3 font-bold text-white">{a.so_number}</td>
                  <td className="py-3 px-3 text-slate-300">{a.item_description}</td>
                  <td className="py-3 px-3 text-right font-black text-emerald-400">{a.qty_issued} YARD</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePrintSuratJalan(a)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-400" /> Cetak SJ
                      </button>
                      <button
                        onClick={() => handleDeleteAllocation(a)}
                        title="Hapus / Batalkan Alokasi"
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal Quick Create / Edit Item */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveItem} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingItem ? `Edit Item Bahan: ${editingItem.item_code}` : 'Tambah Master Item Bahan'}
            </h3>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Kode Item</label>
              <input
                type="text"
                required
                placeholder="MG-2604-BH0001"
                value={itemForm.item_code}
                onChange={(e) => setItemForm({ ...itemForm, item_code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Deskripsi Kain</label>
              <input
                type="text"
                required
                placeholder="DENIM 13 OZ STRETCH / PURING PUTIH"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Tipe</label>
                <select
                  value={itemForm.item_type}
                  onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="FABRIC_MAIN">FABRIC MAIN</option>
                  <option value="PURING">PURING</option>
                  <option value="INTERLINING">INTERLINING</option>
                  <option value="TRIMS_ACCESSORY">TRIMS / AKSESORIS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Satuan</label>
                <input
                  type="text"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Lot Warna / Shade</label>
                <input
                  type="text"
                  placeholder="LOT-A / JET BLACK"
                  value={itemForm.color_shade_lot}
                  onChange={(e) => setItemForm({ ...itemForm, color_shade_lot: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Lebar (Inch)</label>
                <input
                  type="number"
                  step="0.5"
                  value={itemForm.width_inch}
                  onChange={(e) => setItemForm({ ...itemForm, width_inch: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Gramasi (GSM)</label>
                <input
                  type="number"
                  value={itemForm.gramasi_gsm}
                  onChange={(e) => setItemForm({ ...itemForm, gramasi_gsm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Lokasi Rak Gudang</label>
                <input
                  type="text"
                  placeholder="RAK-A1-04"
                  value={itemForm.rack_location}
                  onChange={(e) => setItemForm({ ...itemForm, rack_location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Estimasi Harga (Rp)</label>
                <input
                  type="number"
                  value={itemForm.unit_price}
                  onChange={(e) => setItemForm({ ...itemForm, unit_price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddItemOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {editingItem ? "Simpan Perubahan" : "Simpan Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Quick Create / Edit Receipt */}
      {isAddReceiptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveReceipt} className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingReceipt ? `Edit Roll Masuk: ${editingReceipt.roll_number}` : 'Log Roll Kain Masuk'}
            </h3>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Pilih Item Kain</label>
              <select
                required
                value={receiptForm.item_id}
                onChange={(e) => setReceiptForm({ ...receiptForm, item_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">-- Pilih Item --</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.item_code} - {i.description}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nomor Roll</label>
                <input
                  type="text"
                  value={receiptForm.roll_number}
                  onChange={(e) => setReceiptForm({ ...receiptForm, roll_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Yard Diterima</label>
                <input
                  type="number"
                  step="0.1"
                  value={receiptForm.qty_received}
                  onChange={(e) => setReceiptForm({ ...receiptForm, qty_received: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddReceiptOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {editingReceipt ? "Simpan Koreksi" : "Catat Masuk"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fabric Inspection Modal */}
      <FabricInspectionModal
        isOpen={isInspectionOpen}
        onClose={() => setIsInspectionOpen(false)}
        onSuccess={fetchData}
        receipts={receipts}
      />

      {/* Fabric Allocation Modal */}
      <FabricAllocationModal
        isOpen={isAllocationOpen}
        onClose={() => setIsAllocationOpen(false)}
        onSuccess={fetchData}
        items={items}
      />

      {/* Print Modal */}
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
