import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Kontrol pagination seragam. Stateless — semua state (page, pageSize)
 * dipegang pemanggil, biasanya lewat hook useTableData.
 */
export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2 text-xs text-slate-400 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span>
          <span className="font-semibold text-slate-200">{from}–{to}</span> dari{" "}
          <span className="font-semibold text-slate-200">{total.toLocaleString("id-ID")}</span>
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n} / hal</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 font-semibold text-slate-200">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
