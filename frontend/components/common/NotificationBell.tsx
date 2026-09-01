"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Info } from 'lucide-react';
import notificationService, { NotificationItem } from '@/services/notificationService';

interface Props {
  activeUser?: any;
  onNavigate?: (menu: string) => void;
}

const POLL_MS = 60_000;

const sevStyle: Record<string, { dot: string; icon: any; text: string }> = {
  CRITICAL: { dot: 'bg-rose-500', icon: AlertTriangle, text: 'text-rose-400' },
  WARNING: { dot: 'bg-amber-500', icon: AlertTriangle, text: 'text-amber-400' },
  INFO: { dot: 'bg-sky-500', icon: Info, text: 'text-sky-400' },
};

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

export default function NotificationBell({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list(false);
      setItems(data.items);
      setUnread(data.unread_count);
    } catch {
      /* diam — jangan ganggu UI kalau backend belum siap */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // klik di luar panel -> tutup
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleClickItem = async (n: NotificationItem) => {
    if (!n.is_read) {
      try { await notificationService.markRead(n.id); } catch { /* noop */ }
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.menu_hint && onNavigate) {
      onNavigate(n.menu_hint);
      setOpen(false);
    }
  };

  const markAll = async () => {
    setLoading(true);
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  return (
    <div ref={panelRef} className="fixed right-6 bottom-24 z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifikasi"
        className="relative w-12 h-12 rounded-2xl bg-slate-900/95 border border-slate-700/80 text-slate-300 hover:text-white hover:border-indigo-500/50 shadow-xl backdrop-blur flex items-center justify-center transition-all active:scale-95 cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-14 right-0 w-[92vw] sm:w-96 max-h-[70vh] bg-slate-900/97 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-pop">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-white tracking-wide">Notifikasi</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/15 text-rose-400 rounded">{unread} baru</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={markAll} disabled={loading || unread === 0}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-emerald-400 disabled:opacity-40 px-2 py-1 rounded-lg cursor-pointer">
                <CheckCheck className="w-3.5 h-3.5" /> Tandai semua
              </button>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/70">
            {items.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-xs">Tidak ada notifikasi.</div>
            )}
            {items.map((n) => {
              const st = sevStyle[n.severity] || sevStyle.INFO;
              const Icon = st.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${n.is_read ? 'opacity-55' : ''}`}
                >
                  <div className="pt-0.5 shrink-0">
                    <span className={`block w-2 h-2 rounded-full ${n.is_read ? 'bg-slate-600' : st.dot}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${st.text}`} />
                      <span className="truncate">{n.title}</span>
                    </p>
                    {n.body && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[9px] text-slate-600 mt-1 font-mono">{timeAgo(n.created_at)}{n.menu_hint ? ' • klik untuk buka' : ''}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
