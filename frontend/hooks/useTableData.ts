"use client";

import { useMemo, useState, useEffect, useCallback } from "react";

/**
 * Satu hook untuk kebutuhan tabel/list yang selama ini di-copy-paste tiap modul:
 * pencarian teks, sortir kolom, dan pagination.
 *
 *   const t = useTableData(items, {
 *     searchKeys: ["so_number", "style_name", "buyer_name"],
 *     initialSort: { key: "order_date", dir: "desc" },
 *     initialPageSize: 25,
 *   });
 *   // t.rows        -> baris untuk dirender (sudah difilter+sortir+dipaginate)
 *   // t.search, t.setSearch
 *   // t.toggleSort("order_date"), t.sort
 *   // t.page, t.setPage, t.pageSize, t.setPageSize, t.total (setelah filter)
 */

export type SortDir = "asc" | "desc";
export interface SortState<K extends string = string> {
  key: K;
  dir: SortDir;
}

interface Options<T> {
  searchKeys?: (keyof T)[];
  /** Filter kustom tambahan (dijalankan setelah pencarian teks). */
  filterFn?: (row: T) => boolean;
  initialSort?: SortState;
  initialPageSize?: number;
  /** Nilai yang, jika berubah, mereset halaman ke 1 (mis. tab aktif). */
  resetKey?: unknown;
}

function getVal(row: unknown, key: string): unknown {
  return (row as Record<string, unknown>)?.[key];
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const as = String(a);
  const bs = String(b);
  const an = parseFloat(as);
  const bn = parseFloat(bs);
  if (!Number.isNaN(an) && !Number.isNaN(bn) && `${an}` === as && `${bn}` === bs) return an - bn;
  return as.localeCompare(bs, "id-ID", { numeric: true, sensitivity: "base" });
}

export function useTableData<T>(data: T[], opts: Options<T> = {}) {
  const {
    searchKeys,
    filterFn,
    initialSort,
    initialPageSize = 25,
    resetKey,
  } = opts;

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset ke halaman 1 saat query / data / resetKey berubah.
  useEffect(() => {
    setPage(1);
  }, [search, pageSize, resetKey, data.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = data;
    if (q && searchKeys?.length) {
      out = out.filter((row) =>
        searchKeys.some((k) => {
          const v = getVal(row, k as string);
          return v != null && String(v).toLowerCase().includes(q);
        }),
      );
    }
    if (filterFn) out = out.filter(filterFn);
    return out;
  }, [data, search, searchKeys, filterFn]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const r = compare(getVal(a, sort.key), getVal(b, sort.key));
      return sort.dir === "asc" ? r : -r;
    });
    return arr;
  }, [filtered, sort]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // klik ke-3 → matikan sortir
    });
  }, []);

  return {
    rows,
    total,
    allFiltered: sorted,
    search,
    setSearch,
    sort,
    setSort,
    toggleSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    isEmpty: total === 0,
    isFiltered: search.trim().length > 0 || !!filterFn,
  };
}

export default useTableData;
