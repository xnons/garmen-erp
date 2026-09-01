"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, TrendingUp, Truck, RefreshCw, Download, AlertTriangle,
  CalendarRange, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import reportService, {
  ProductionSummary, FinancialSummary, VendorScorecard,
} from '@/services/reportService';
import { exportToExcel } from '@/utils/exportUtils';

type Tab = 'PRODUKSI' | 'KEUANGAN' | 'VENDOR';

const rp = (n: number) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
const iso = (d: Date) => d.toISOString().slice(0, 10);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}

interface Props {
  activeUser?: any;
}

export default function ReportsModule({ activeUser }: Props) {
  const role = (activeUser?.role || '').toUpperCase();
  const canFinance = ['OWNER', 'DEVELOPER', 'FINANCE', 'ADMIN'].includes(role);

  const [tab, setTab] = useState<Tab>('PRODUKSI');
  const [start, setStart] = useState(daysAgo(365));
  const [end, setEnd] = useState(iso(new Date()));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [prod, setProd] = useState<ProductionSummary | null>(null);
  const [fin, setFin] = useState<FinancialSummary | null>(null);
  const [vendor, setVendor] = useState<VendorScorecard | null>(null);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      if (tab === 'PRODUKSI') setProd(await reportService.productionSummary({ start, end }));
      else if (tab === 'KEUANGAN') {
        if (!canFinance) { setErr('Laporan keuangan hanya untuk Owner / Finance.'); }
        else setFin(await reportService.financialSummary({ start, end }));
      } else setVendor(await reportService.vendorScorecard());
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const tabs: { id: Tab; label: string; icon: any; hidden?: boolean }[] = [
    { id: 'PRODUKSI', label: 'Produksi', icon: BarChart3 },
    { id: 'KEUANGAN', label: 'Keuangan', icon: TrendingUp, hidden: !canFinance },
    { id: 'VENDOR', label: 'Vendor Scorecard', icon: Truck },
  ];

  return (
    <div className="space-y-5 text-slate-100">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Laporan & Analitik
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Ringkasan lintas modul — produksi, keuangan, dan performa vendor subkon.</p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:border-emerald-500/40 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
          Muat Ulang
        </button>
      </div>

      {/* TABS + DATE RANGE */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.filter((t) => !t.hidden).map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                on ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                   : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}

        {tab !== 'VENDOR' && (
          <div className="flex items-center gap-2 ml-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none" />
            <span className="text-slate-600 text-xs">–</span>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none" />
            <button onClick={load} className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer">Terapkan</button>
          </div>
        )}
      </div>

      {err && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {err}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Menghitung agregat…
        </div>
      )}

      {!loading && tab === 'PRODUKSI' && prod && <ProductionView data={prod} />}
      {!loading && tab === 'KEUANGAN' && fin && canFinance && <FinancialView data={fin} />}
      {!loading && tab === 'VENDOR' && vendor && <VendorView data={vendor} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
function Kpi({ label, value, tone = 'slate' }: { label: string; value: string; tone?: string }) {
  const tones: Record<string, string> = {
    slate: 'border-slate-800', emerald: 'border-emerald-500/30', amber: 'border-amber-500/30',
    rose: 'border-rose-500/30', indigo: 'border-indigo-500/30',
  };
  return (
    <div className={`bg-slate-900 border ${tones[tone]} rounded-2xl p-4`}>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
      <p className="text-xl font-black mt-1">{value}</p>
    </div>
  );
}

function ExportBtn({ rows, name }: { rows: any[]; name: string }) {
  return (
    <button
      onClick={() => rows.length && exportToExcel(rows, name, name.slice(0, 28))}
      disabled={!rows.length}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
    >
      <Download className="w-3.5 h-3.5" /> Export Excel
    </button>
  );
}

/* -------------------------------------------------------------------------- */
function ProductionView({ data }: { data: ProductionSummary }) {
  const chart = data.by_stage.map((s) => ({ name: s.label, Kirim: s.dispatched, Terima: s.received, Rijek: s.reject }));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Qty Potong" value={data.cutting_yield.qty_cut.toLocaleString('id-ID')} tone="amber" />
        <Kpi label="Konsumsi / Pcs" value={`${data.cutting_yield.consumption_per_pcs} yd`} />
        <Kpi label="Afval Kain" value={`${data.cutting_yield.waste_pct}%`} tone={data.cutting_yield.waste_pct > 8 ? 'rose' : 'slate'} />
        <Kpi label="On-Time Delivery" value={`${data.delivery.on_time_pct}%`} tone={data.delivery.on_time_pct >= 90 ? 'emerald' : 'amber'} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300">Output per Tahapan WIP</h3>
          <ExportBtn rows={data.by_stage} name="Laporan_Produksi_PerTahapan" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="Kirim" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Terima" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Rijek" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-300 mb-3">WIP Aging (movement belum selesai)</h3>
          <div className="space-y-2">
            {data.wip_aging.map((b) => (
              <div key={b.bucket} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{b.bucket} hari</span>
                <span className={`font-bold ${b.bucket === '>30' && b.count > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{b.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-300 mb-3">Pengiriman</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Order terkirim</span><span className="font-bold">{data.delivery.delivered_orders}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Tepat waktu</span><span className="font-bold text-emerald-400">{data.delivery.on_time}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Terlambat</span><span className="font-bold text-rose-400">{data.delivery.late}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
function FinancialView({ data }: { data: FinancialSummary }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Invoice SJP" value={rp(data.invoice_total)} tone="emerald" />
        <Kpi label="Total Upah" value={rp(data.wage_total)} tone="amber" />
        <Kpi label="Kerugian Rijek" value={rp(data.reject_loss)} tone="rose" />
        <Kpi label="Estimasi Margin Kotor" value={rp(data.gross_margin_estimate)}
          tone={data.gross_margin_estimate >= 0 ? 'emerald' : 'rose'} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300">Estimasi Margin per Sales Order</h3>
          <ExportBtn rows={data.per_sales_order} name="Laporan_Keuangan_PerSO" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <th className="text-left py-2 pr-3">SO</th>
                <th className="text-left py-2 pr-3">Style</th>
                <th className="text-right py-2 px-3">Nilai Kontrak</th>
                <th className="text-right py-2 px-3">Invoiced</th>
                <th className="text-right py-2 px-3">Upah</th>
                <th className="text-right py-2 px-3">Rugi Rijek</th>
                <th className="text-right py-2 pl-3">Est. Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.per_sales_order.map((s) => (
                <tr key={s.so_number} className="border-b border-slate-800/60">
                  <td className="py-2 pr-3 font-mono font-bold text-slate-200">{s.so_number}</td>
                  <td className="py-2 pr-3 text-slate-400 truncate max-w-[140px]">{s.style_name}</td>
                  <td className="py-2 px-3 text-right">{rp(s.contract_value)}</td>
                  <td className="py-2 px-3 text-right text-emerald-400">{rp(s.invoiced)}</td>
                  <td className="py-2 px-3 text-right text-amber-400">{rp(s.wage_cost)}</td>
                  <td className="py-2 px-3 text-right text-rose-400">{rp(s.reject_loss)}</td>
                  <td className={`py-2 pl-3 text-right font-bold ${s.est_margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rp(s.est_margin)}</td>
                </tr>
              ))}
              {!data.per_sales_order.length && (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">Tidak ada data pada rentang ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
function VendorView({ data }: { data: VendorScorecard }) {
  const chart = useMemo(
    () => data.vendors.map((v) => ({ name: v.partner_name, score: v.score })),
    [data],
  );
  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300">Skor Vendor (0–100, makin rendah makin berisiko)</h3>
          <ExportBtn rows={data.vendors} name="Vendor_Scorecard" />
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chart.map((c, i) => (
                  <Cell key={i} fill={c.score >= 80 ? '#10b981' : c.score >= 50 ? '#f59e0b' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <th className="text-left py-2 pr-3">Vendor</th>
              <th className="text-left py-2 pr-3">Kategori</th>
              <th className="text-right py-2 px-3">Kirim</th>
              <th className="text-right py-2 px-3">Terima</th>
              <th className="text-right py-2 px-3">Rijek</th>
              <th className="text-right py-2 px-3">Selisih</th>
              <th className="text-right py-2 px-3">Skor</th>
              <th className="text-center py-2 pl-3">Risiko</th>
            </tr>
          </thead>
          <tbody>
            {data.vendors.map((v) => (
              <tr key={v.partner_id} className="border-b border-slate-800/60">
                <td className="py-2 pr-3 font-bold text-slate-200">{v.partner_name}</td>
                <td className="py-2 pr-3 text-slate-400">{v.category}</td>
                <td className="py-2 px-3 text-right">{v.dispatched}</td>
                <td className="py-2 px-3 text-right text-emerald-400">{v.received}</td>
                <td className="py-2 px-3 text-right text-amber-400">{v.reject}</td>
                <td className={`py-2 px-3 text-right font-bold ${v.discrepancy > 0 ? 'text-rose-400' : 'text-slate-300'}`}>{v.discrepancy}</td>
                <td className="py-2 px-3 text-right font-bold">{v.score}</td>
                <td className="py-2 pl-3 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${v.risk === 'TINGGI' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{v.risk}</span>
                </td>
              </tr>
            ))}
            {!data.vendors.length && (
              <tr><td colSpan={8} className="py-6 text-center text-slate-500">Belum ada pergerakan subkon dengan vendor.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
