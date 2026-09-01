"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle, Clock, PackageX, GitCompareArrows, ChevronRight, ShieldCheck, RefreshCw,
} from "lucide-react";
import api from "@/services/api";
import { formatQty } from "@/utils/format";

interface AttentionData {
  deadline: { so_number: string; style_name: string; status: string; deadline: string; days_left: number; severity: string }[];
  low_stock: { item_code: string; description: string; current_stock: number; min_stock_alert: number; unit: string; rack_location: string }[];
  vendor_discrepancy: { id: string; so_number: string; vendor: string; stage_name: string; qty_dispatched: number; qty_received: number; qty_reject: number; balance_discrepancy: number }[];
  counts: { deadline: number; low_stock: number; vendor_discrepancy: number; total: number };
}

const EMPTY: AttentionData = {
  deadline: [], low_stock: [], vendor_discrepancy: [],
  counts: { deadline: 0, low_stock: 0, vendor_discrepancy: 0, total: 0 },
};

export default function AttentionPanel({ onNavigate }: { onNavigate?: (menu: string) => void }) {
  const [data, setData] = useState<AttentionData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/dashboard/attention");
      setData({ ...EMPTY, ...res.data });
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const { counts } = data;

  if (loading) {
    return <div className="glass-panel h-28 rounded-2xl border border-slate-800 animate-pulse" />;
  }

  if (counts.total === 0) {
    return (
      <div className="glass-panel rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-sm text-slate-300">
          <span className="font-bold text-emerald-400">Semua aman.</span> Tidak ada deadline mepet, stok kritis, atau selisih vendor.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-black text-white">Perlu Perhatian</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
            {counts.total}
          </span>
        </div>
        <button onClick={load} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors" title="Segarkan">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800/70">
        {/* Deadline */}
        <Group
          icon={<Clock className="w-4 h-4 text-rose-400" />}
          title="Deadline mepet"
          count={counts.deadline}
          onSeeAll={() => onNavigate?.("ppic-so")}
        >
          {data.deadline.map((d) => (
            <Row key={d.so_number} onClick={() => onNavigate?.("ppic-so")}
              left={<span className="font-mono font-bold text-blue-400">{d.so_number}</span>}
              right={
                <span className={d.days_left < 0 ? "text-rose-400 font-bold" : "text-amber-400 font-semibold"}>
                  {d.days_left < 0 ? `lewat ${Math.abs(d.days_left)}h` : `${d.days_left}h lagi`}
                </span>
              }
              sub={d.style_name}
            />
          ))}
        </Group>

        {/* Low stock */}
        <Group
          icon={<PackageX className="w-4 h-4 text-amber-400" />}
          title="Stok kritis"
          count={counts.low_stock}
          onSeeAll={() => onNavigate?.("warehouse-fabric")}
        >
          {data.low_stock.map((s) => (
            <Row key={s.item_code} onClick={() => onNavigate?.("warehouse-fabric")}
              left={<span className="text-slate-200 font-semibold truncate">{s.description}</span>}
              right={<span className="text-rose-400 font-bold">{formatQty(s.current_stock)} {s.unit}</span>}
              sub={`${s.item_code} · batas ${formatQty(s.min_stock_alert)}`}
            />
          ))}
        </Group>

        {/* Vendor discrepancy */}
        <Group
          icon={<GitCompareArrows className="w-4 h-4 text-purple-400" />}
          title="Selisih vendor"
          count={counts.vendor_discrepancy}
          onSeeAll={() => onNavigate?.("wip-control-tower")}
        >
          {data.vendor_discrepancy.map((v) => (
            <Row key={v.id} onClick={() => onNavigate?.("wip-control-tower")}
              left={<span className="text-slate-200 font-semibold truncate">{v.vendor}</span>}
              right={<span className="text-rose-400 font-bold">−{v.balance_discrepancy} pcs</span>}
              sub={`${v.so_number} · ${v.stage_name.replace(/_/g, " ")}`}
            />
          ))}
        </Group>
      </div>
    </div>
  );
}

function Group({
  icon, title, count, onSeeAll, children,
}: {
  icon: React.ReactNode; title: string; count: number; onSeeAll: () => void; children: React.ReactNode;
}) {
  const rows = React.Children.toArray(children);
  return (
    <div className="p-3.5 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{title}</span>
        <span className="text-[10px] font-bold text-slate-500">({count})</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-600 py-2">— tidak ada —</p>
      ) : (
        <div className="space-y-1.5">{rows}</div>
      )}
      {count > rows.length && (
        <button onClick={onSeeAll} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300">
          Lihat semua {count} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function Row({
  left, right, sub, onClick,
}: {
  left: React.ReactNode; right: React.ReactNode; sub?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800 rounded-lg px-2.5 py-1.5 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate">{left}</span>
        <span className="shrink-0">{right}</span>
      </div>
      {sub && <p className="text-[10px] text-slate-500 truncate mt-0.5">{sub}</p>}
    </button>
  );
}
