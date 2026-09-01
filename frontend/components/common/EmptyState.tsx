import React from "react";
import { Inbox, LucideIcon } from "lucide-react";

/**
 * Tampilan kosong seragam. Pakai saat list/tabel tidak ada data
 * (bukan saat loading — untuk loading pakai <TableSkeleton/>).
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "Belum ada data",
  message,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass-panel p-12 text-center rounded-2xl border border-slate-800 ${className}`}
    >
      <Icon className="w-12 h-12 text-slate-600 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-base font-bold text-white">{title}</p>
      {message && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
