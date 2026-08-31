"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, ShieldCheck,
  Search, RefreshCw, Layers, Scissors, Truck, Sparkles, Sliders,
  HelpCircle, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  PieChart, BarChart3, AlertOctagon, Eye, X, Building2, ChevronRight,
  Calculator, Zap, Target, FileText, Info
} from 'lucide-react';
import api from '@/services/api';

export default function ExecutiveAnalyticsModule() {
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL, PROFIT, LOW_MARGIN, LOSS
  const [contractFilter, setContractFilter] = useState<string>("ALL"); // ALL, CMT, FOB
  const [selectedSO, setSelectedSO] = useState<any | null>(null);

  // Active View Tab for Charts
  const [activeChartTab, setActiveChartTab] = useState<'WATERFALL' | 'TREND' | 'LEAKAGE' | 'SIMULATOR'>('WATERFALL');

  // Interactive Simulator Sliders
  const [cmtAdjustment, setCmtAdjustment] = useState<number>(0); // Rp +/-
  const [subconCostFactor, setSubconCostFactor] = useState<number>(0); // % +/-
  const [wasteReductionPct, setWasteReductionPct] = useState<number>(50); // % reduction of waste

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard/advanced-pnl-analytics');
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Gagal mengambil data analitik P&L eksekutif:", err);
    } finally {
      setLoading(false);
    }
  };

  const summary = analyticsData?.summary || {
    totalRevenue: 0,
    totalCogs: 0,
    totalNetProfit: 0,
    overallMarginPct: 0,
    totalOrdersCount: 0,
    profitableCount: 0,
    lowMarginCount: 0,
    lossCount: 0,
    totalLeakageAmount: 0,
    totalSubconLoss: 0,
    totalFabricWasteLoss: 0
  };

  const orders = analyticsData?.ordersPnl || [];
  const costDistribution = analyticsData?.costDistribution || [];
  const monthlyTrend = analyticsData?.monthlyTrend || [];
  const lossHotspots = analyticsData?.lossHotspots || { subconLosses: [] };

  // Filtered Orders
  const filteredOrders = orders.filter((o: any) => {
    const matchSearch =
      o.so_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.style_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.buyer_po_number && o.buyer_po_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchContract = contractFilter === "ALL" || o.contract_type === contractFilter;

    let matchStatus = true;
    if (statusFilter === "PROFIT") matchStatus = o.status_badge === "HIGH_PROFIT" || o.status_badge === "HEALTHY";
    else if (statusFilter === "LOW_MARGIN") matchStatus = o.status_badge === "LOW_MARGIN";
    else if (statusFilter === "LOSS") matchStatus = o.status_badge === "LOSS";

    return matchSearch && matchContract && matchStatus;
  });

  // Simulator Calculation
  const simTotalQty = orders.reduce((sum: number, o: any) => sum + (o.order_qty || 0), 0) || 1;
  const simAdditionalRevenue = simTotalQty * cmtAdjustment;
  const simSubconChange = (summary.totalCogs * 0.40) * (subconCostFactor / 100.0);
  const simWasteSaved = (summary.totalFabricWasteLoss + summary.totalSubconLoss) * (wasteReductionPct / 100.0);
  const simProjectedProfit = summary.totalNetProfit + simAdditionalRevenue - simSubconChange + simWasteSaved;
  const simProjectedMargin = summary.totalRevenue + simAdditionalRevenue > 0
    ? ((simProjectedProfit / (summary.totalRevenue + simAdditionalRevenue)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Executive Financial & Profit/Loss Telemetry (Dev & Owner)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Analitik Margin & Profit / Loss Pabrik
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              LIVE HPP
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Audit margin bersih per Sales Order, kalkulasi otomatis Harga Pokok Produksi (HPP), deteksi titik kebocoran biaya di vendor subkon & meja potong, serta simulator skenario profitabilitas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            Sinkronisasi Data Finansial
          </button>
        </div>
      </div>

      {/* 2. Top Executive Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Omset Penjualan (Revenue) */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Nilai Kontrak (Omset)</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-mono">
              Rp {summary.totalRevenue.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-blue-400 font-bold">{summary.totalOrdersCount} Sales Order</span> terdaftar di pipeline
            </p>
          </div>
        </div>

        {/* Card 2: Total HPP (Cost of Goods Sold) */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realisasi HPP (COGS)</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-amber-400 font-mono">
              Rp {summary.totalCogs.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Bahan Baku, Maklun Subkon, Upah & Overhead
            </p>
          </div>
        </div>

        {/* Card 3: Laba Bersih (Net Profit & Margin %) */}
        <div className="bg-slate-900/80 border border-emerald-500/30 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Laba Bersih Akumulasi</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-emerald-400 font-mono">
              Rp {summary.totalNetProfit.toLocaleString('id-ID')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-black px-2 py-0.5 rounded-md font-mono ${
                summary.overallMarginPct >= 20 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {summary.overallMarginPct}% Net Margin
              </span>
              <span className="text-[11px] text-slate-400">Rata-rata pabrik</span>
            </div>
          </div>
        </div>

        {/* Card 4: Titik Kebocoran Biaya (Identified Leakage) */}
        <div className="bg-slate-900/80 border border-rose-500/30 p-5 rounded-3xl space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Kebocoran Biaya Terdeteksi</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-rose-400 font-mono">
              Rp {summary.totalLeakageAmount.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-rose-300/80 mt-1 flex items-center gap-1">
              <span>Selisih Maklun: Rp {summary.totalSubconLoss.toLocaleString('id-ID')}</span>
            </p>
          </div>
        </div>

      </div>

      {/* 3. Interactive Visual Charts & Simulator Section */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
        
        {/* Navigation Tabs for Charts */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveChartTab('WATERFALL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'WATERFALL'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              1. Struktur Biaya (Waterfall)
            </button>

            <button
              onClick={() => setActiveChartTab('TREND')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'TREND'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              2. Tren Laba Bulanan
            </button>

            <button
              onClick={() => setActiveChartTab('LEAKAGE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'LEAKAGE'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              3. Radar Titik Rugi
            </button>

            <button
              onClick={() => setActiveChartTab('SIMULATOR')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'SIMULATOR'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              4. Simulator What-If
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            Update: {new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </span>
        </div>

        {/* TAB 1: WATERFALL COST BREAKDOWN */}
        {activeChartTab === 'WATERFALL' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Struktur Komposisi Biaya Produksi vs Laba Bersih
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rincian distribusi alokasi setiap rupiah pendapatan (Omset 100%) ke masing-masing pos biaya operasional.
              </p>
            </div>

            {/* Stacked Progress Bar */}
            <div className="space-y-2">
              <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
                {costDistribution.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                    className="h-full transition-all relative group"
                    title={`${c.label}: Rp ${c.amount.toLocaleString('id-ID')} (${c.pct}%)`}
                  />
                ))}
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                {costDistribution.map((c: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-semibold text-slate-300 truncate">{c.label}</span>
                    </div>
                    <p className="text-base font-black text-white font-mono mt-1">
                      Rp {c.amount.toLocaleString('id-ID')}
                    </p>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      {c.pct}% dari HPP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanatory Box */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-200">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Rekomendasi Manajemen Dev & Owner:</strong>
                Komponen biaya terbesar pabrik berada pada <strong>Jasa Subcon Maklun (Jahit, Washing, Print/Bordir)</strong>. Negosiasi tarif volume atau perbaikan alur internal lini jahit dapat meningkatkan net margin hingga <strong>+5.2%</strong>.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY TREND */}
        {activeChartTab === 'TREND' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Historis & Proyeksi Laba Bersih 6 Bulan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbandingan Omset Penjualan, Beban HPP, dan Margin Keuntungan bersih bulanan.
              </p>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {monthlyTrend.map((m: any, idx: number) => {
                const maxRev = Math.max(...monthlyTrend.map((x: any) => x.revenue)) || 1;
                const heightPct = Math.round((m.revenue / maxRev) * 100);

                return (
                  <div key={idx} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-400 block">{m.month}</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full inline-block mt-1">
                        Margin: {m.margin_pct}%
                      </span>
                    </div>

                    <div className="h-32 flex items-end justify-center gap-1.5 py-2">
                      {/* Bar Revenue */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-5 bg-blue-500/80 rounded-t-md transition-all relative group"
                        title={`Omset: Rp ${m.revenue.toLocaleString('id-ID')}`}
                      />
                      {/* Bar COGS */}
                      <div
                        style={{ height: `${Math.round((m.cogs / maxRev) * 100)}%` }}
                        className="w-5 bg-amber-500/80 rounded-t-md transition-all relative group"
                        title={`HPP: Rp ${m.cogs.toLocaleString('id-ID')}`}
                      />
                      {/* Bar Net Profit */}
                      <div
                        style={{ height: `${Math.round((m.net_profit / maxRev) * 100)}%` }}
                        className="w-5 bg-emerald-500/80 rounded-t-md transition-all relative group"
                        title={`Laba Bersih: Rp ${m.net_profit.toLocaleString('id-ID')}`}
                      />
                    </div>

                    <div className="border-t border-slate-800/80 pt-2 text-[11px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Omset:</span>
                        <span className="text-white font-bold">{(m.revenue / 1000000).toFixed(1)}jt</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Laba:</span>
                        <span className="text-emerald-400 font-bold">{(m.net_profit / 1000000).toFixed(1)}jt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: RADAR TITIK RUGI & KEBOCORAN */}
        {activeChartTab === 'LEAKAGE' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Audit Titik Kerugian & Kebocoran Biaya Pabrik
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Identifikasi sumber pemborosan material, kehilangan barang di vendor maklun, dan order yang mengalami kerugian.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Subcon Discrepancy Losses */}
              <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  1. Kerugian Selisih Barang di Vendor Maklun
                </h4>
                <p className="text-xs text-slate-400">
                  Total barang hilang saat proses antar stasiun subkon yang merugikan pabrik:
                </p>
                <div className="space-y-2 pt-1">
                  {lossHotspots.subconLosses.map((sub: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                      <div>
                        <span className="text-xs font-bold text-white">{sub.name}</span>
                        <span className="text-[10px] text-slate-400 block">Kategori: Maklun Subcon</span>
                      </div>
                      <span className="text-xs font-mono font-black text-rose-400">
                        - Rp {sub.loss_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Fabric Waste Overconsumption */}
              <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  2. Pemborosan Kain Meja Potong (*Scrap Waste*)
                </h4>
                <p className="text-xs text-slate-400">
                  Estimasi nilai kerugian kain perca afval yang melebihi batas toleransi susut:
                </p>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Akumulasi Limbah:</span>
                    <span className="font-bold text-white font-mono">15.0 Yard Perca</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Kerugian Rupiah:</span>
                    <span className="font-black text-amber-400 font-mono">
                      - Rp {summary.totalFabricWasteLoss.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    💡 Rekomendasi: Terapkan inspeksi gelar kain (*marker efficiency inspection*) sebelum pemotongan layer.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: WHAT-IF MARGIN SIMULATOR */}
        {activeChartTab === 'SIMULATOR' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Simulator Skenario Profitabilitas (*What-If Engine*)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Uji dampak perubahan tarif CMT buyer, efisiensi vendor maklun, atau penekanan limbah kain terhadap laba bersih pabrik.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Controls */}
              <div className="lg:col-span-2 space-y-5 bg-slate-950/70 border border-slate-800 p-5 rounded-3xl">
                
                {/* Slider 1: Penyesuaian Harga CMT */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">1. Penyesuaian Tarif Kontrak CMT per Pcs:</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {cmtAdjustment >= 0 ? `+Rp ${cmtAdjustment.toLocaleString('id-ID')}` : `-Rp ${Math.abs(cmtAdjustment).toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-5000"
                    max="10000"
                    step="500"
                    value={cmtAdjustment}
                    onChange={(e) => setCmtAdjustment(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-Rp 5.000 (Diskon)</span>
                    <span>Rp 0 (Saat Ini)</span>
                    <span>+Rp 10.000 (Naik Harga)</span>
                  </div>
                </div>

                {/* Slider 2: Efisiensi Biaya Maklun Subkon */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">2. Efisiensi Biaya Maklun Subkon (%):</span>
                    <span className="font-mono font-bold text-blue-400">
                      {subconCostFactor >= 0 ? `+${subconCostFactor}% (Naik)` : `${subconCostFactor}% (Hemat)`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="2"
                    value={subconCostFactor}
                    onChange={(e) => setSubconCostFactor(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-20% (Hemat Negosiasi)</span>
                    <span>0% (Tetap)</span>
                    <span>+20% (Biaya Naik)</span>
                  </div>
                </div>

                {/* Slider 3: Penekanan Kebocoran & Limbah */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">3. Penekanan Kebocoran & Limbah Kain:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {wasteReductionPct}% Berhasil Dieliminasi
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={wasteReductionPct}
                    onChange={(e) => setWasteReductionPct(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Biarkan Bocor)</span>
                    <span>50% (Pengawasan Ketat)</span>
                    <span>100% (Zero Waste)</span>
                  </div>
                </div>

              </div>

              {/* Simulation Result Card */}
              <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/30 p-6 rounded-3xl flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    Hasil Proyeksi Real-Time
                  </span>
                  <h4 className="text-xs font-bold text-slate-400 mt-2">Proyeksi Laba Bersih Baru:</h4>
                  <h3 className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    Rp {simProjectedProfit.toLocaleString('id-ID')}
                  </h3>
                  <div className="mt-2 text-xs font-mono text-slate-300">
                    Proyeksi Margin: <strong className="text-emerald-400 text-sm font-bold">{simProjectedMargin}%</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Delta Laba Bersih:</span>
                    <span className={`font-bold ${simProjectedProfit >= summary.totalNetProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simProjectedProfit >= summary.totalNetProfit ? '+' : ''}Rp {(simProjectedProfit - summary.totalNetProfit).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* 4. P&L Health Matrix (Table Untung / Rugi per Sales Order) */}
      <div className="space-y-4">
        
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Matriks Untung & Rugi per Sales Order ({filteredOrders.length})
            </h3>
            <p className="text-xs text-slate-400">
              Daftar ranking seluruh Sales Order berdasarkan profitabilitas dan margin bersih.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'PROFIT', label: '🟢 Untung' },
                { id: 'LOW_MARGIN', label: '🟠 Tipis' },
                { id: 'LOSS', label: '🔴 Rugi' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SO, Buyer, Style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Sales Order & Buyer</th>
                  <th className="py-3.5 px-4">Style & Kategori</th>
                  <th className="py-3.5 px-4 text-center">Qty (Pcs)</th>
                  <th className="py-3.5 px-4 text-right">Pendapatan (Rp)</th>
                  <th className="py-3.5 px-4 text-right">Total HPP (Rp)</th>
                  <th className="py-3.5 px-4 text-right">Laba Bersih</th>
                  <th className="py-3.5 px-4 text-center">Margin %</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada data Sales Order yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((so: any) => (
                    <tr key={so.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white">{so.so_number}</div>
                        <div className="text-[11px] text-slate-400">{so.buyer_name}</div>
                        {so.buyer_po_number && (
                          <span className="text-[10px] font-mono text-slate-500">PO: {so.buyer_po_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-semibold">{so.style_name}</div>
                        <div className="text-[11px] text-slate-400">{so.item_category} • {so.contract_type}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                        {so.order_qty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        Rp {so.revenue.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">
                        Rp {so.total_cogs.toLocaleString('id-ID')}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${so.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {so.net_profit >= 0 ? '+' : ''}Rp {so.net_profit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          so.margin_pct >= 25 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          so.margin_pct >= 10 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          so.margin_pct >= 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {so.margin_pct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {so.status_badge === "HIGH_PROFIT" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            SANGAT UNTUNG
                          </span>
                        )}
                        {so.status_badge === "HEALTHY" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300">
                            WAJAR
                          </span>
                        )}
                        {so.status_badge === "LOW_MARGIN" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            MARGIN TIPIS
                          </span>
                        )}
                        {so.status_badge === "LOSS" && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 animate-pulse">
                            RUGI / DEFISIT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedSO(so)}
                          title="Lihat Detail HPP & Biaya"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Costing Drilldown Modal for Single Sales Order */}
      {selectedSO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Detail Costing HPP: {selectedSO.so_number}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedSO.style_name} • {selectedSO.buyer_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSO(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Financial Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Nilai Kontrak:</span>
                  <span className="font-bold text-white font-mono text-sm">Rp {selectedSO.revenue.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total HPP:</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">Rp {selectedSO.total_cogs.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Laba Bersih:</span>
                  <span className={`font-bold font-mono text-sm ${selectedSO.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Rp {selectedSO.net_profit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Margin Bersih:</span>
                  <span className="font-bold text-indigo-400 font-mono text-sm">{selectedSO.margin_pct}%</span>
                </div>
              </div>

              {/* Detailed Cost Line Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Rincian Komponen Biaya Produksi:
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">1. Bahan Baku & Trims ({selectedSO.contract_type}):</span>
                    <span className="text-white font-bold">Rp {selectedSO.material_cost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">2. Meja Potong & Press Interlining:</span>
                    <span className="text-white font-bold">Rp {selectedSO.cutting_cost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">3. Jasa Maklun Subkon (Jahit/Wash/Print):</span>
                    <span className="text-white font-bold">Rp {selectedSO.subcon_cost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">4. Upah Borongan Finishing & Packing:</span>
                    <span className="text-white font-bold">Rp {selectedSO.finishing_cost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">5. Overhead Pabrik & Listrik (6%):</span>
                    <span className="text-white font-bold">Rp {selectedSO.overhead_cost.toLocaleString('id-ID')}</span>
                  </div>
                  {selectedSO.subcon_loss > 0 && (
                    <div className="flex justify-between p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-xl">
                      <span className="text-rose-400">⚠️ Kerugian Selisih Barang Subkon:</span>
                      <span className="text-rose-400 font-bold">+ Rp {selectedSO.subcon_loss.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {selectedSO.waste_loss > 0 && (
                    <div className="flex justify-between p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                      <span className="text-amber-400">⚠️ Pemborosan Kain Perca:</span>
                      <span className="text-amber-400 font-bold">+ Rp {selectedSO.waste_loss.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Inefficiencies / Loss Reasons */}
              {selectedSO.loss_reasons.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Faktor Inefisiensi & Potensi Kerugian Terdeteksi:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {selectedSO.loss_reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950">
              <button
                onClick={() => setSelectedSO(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
