import React from "react";

/** Baris-baris pucat berkedip saat data sedang dimuat. */
export default function TableSkeleton({
  rows = 8,
  cols = 5,
  className = "",
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={`glass-panel rounded-2xl border border-slate-800 overflow-hidden ${className}`}
      aria-busy="true"
      aria-label="Memuat data"
    >
      <div className="divide-y divide-slate-800/70">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 rounded bg-slate-700/50 animate-pulse"
                style={{
                  width: c === 0 ? "18%" : c === cols - 1 ? "10%" : `${14 + ((r + c) % 3) * 6}%`,
                  animationDelay: `${(r * cols + c) * 40}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Grid kartu pucat — untuk modul yang tampilannya card, bukan tabel. */
export function CardSkeleton({ count = 6, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-panel h-40 rounded-2xl border border-slate-800 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
