/**
 * Halaman yang di-clamp ke rentang valid untuk sebuah list.
 *
 * Dipakai di modul-modul list yang paginasi-nya di sisi klien. Tanpa ini,
 * menghapus / memfilter baris selagi berada di halaman > 1 membuat
 * `list.slice(...)` mengembalikan `[]` -> badan tabel kosong sampai user
 * menekan Prev, sementara footer menampilkan hitungan yang salah.
 *
 *   const safePage = clampPage(page, filtered.length, pageSize);
 *   const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
 *   // teruskan `safePage` juga ke <Pagination page={safePage} />
 */
export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / (pageSize || 1)));
  return Math.min(Math.max(1, page || 1), totalPages);
}
