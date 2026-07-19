"use client";

import React, { useState, useEffect } from 'react';

interface KaryawanModuleProps {
  activeUser: any;
}

export default function KaryawanModule({ activeUser }: KaryawanModuleProps) {
  const [daftarKaryawan, setDaftarKaryawan] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Baru untuk Manajemen Pelanggaran Komplit
  const [selectedKaryawan, setSelectedKaryawan] = useState<any>(null);
  const [riwayatPelanggaran, setRiwayatPelanggaran] = useState<any[]>([]);
  const [violationForm, setViolationForm] = useState({ jenis: "Ringan", poin: 5, keterangan: "" });

  const [formInput, setFormInput] = useState({
    id_karyawan: "", nama: "", username: "", password: "",
    role: "PRODUKSI", tipe_pay: "BORONGAN", tarif_borongan_pcs: 0
  });

  const fetchKaryawan = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/karyawan");
      if (res.ok) {
        const data = await res.json();
        setDaftarKaryawan(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data karyawan:", err);
    }
  };

  // Fungsi untuk menarik riwayat pelanggaran spesifik 1 karyawan
  const fetchRiwayatPelanggaran = async (idKaryawan: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://127.0.0.1:8000/api/karyawan/${idKaryawan}/pelanggaran`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRiwayatPelanggaran(data);
      }
    } catch (err) {
      console.error("Gagal memuat log sanksi:", err);
    }
  };

  useEffect(() => {
    fetchKaryawan();
  }, []);

  // Setiap kali Owner memilih karyawan, langsung load riwayat terkininya
  useEffect(() => {
    if (selectedKaryawan) {
      fetchRiwayatPelanggaran(selectedKaryawan.id_karyawan);
    }
  }, [selectedKaryawan]);

  // Handler otomatis set poin default berdasarkan tingkat yang dipilih Owner
  const handleJenisChange = (jenis: string) => {
    let poin = 5;
    if (jenis === "Sedang") poin = 10;
    if (jenis === "Berat") poin = 25;
    setViolationForm({ ...violationForm, jenis, poin });
  };

  const filteredKaryawan = daftarKaryawan.filter((k) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      k.nama.toLowerCase().includes(searchLower) ||
      k.id_karyawan.toLowerCase().includes(searchLower) ||
      k.role.toLowerCase().includes(searchLower)
    );
  });

  const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$";
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = "";
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    for (let i = 0; i < 5; i++) { password += allChars.charAt(Math.floor(Math.random() * allChars.length)); }
    const shuffledPassword = password.split('').sort(() => 0.5 - Math.random()).join('');
    setFormInput(prev => ({ ...prev, password: shuffledPassword }));
  };

  const handleSubmitKaryawan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formInput),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Gagal mendaftarkan karyawan.");
      alert(data.message || "Karyawan baru berhasil ditambahkan!");
      setFormInput({
        id_karyawan: "", nama: "", username: "", password: "",
        role: "PRODUKSI", tipe_pay: "BORONGAN", tarif_borongan_pcs: 0
      });
      fetchKaryawan(); 
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HANDLER ACTION: OWNER INPUT SANKSI BARU
  const handleTambahPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://127.0.0.1:8000/api/karyawan/${selectedKaryawan.id_karyawan}/pelanggaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(violationForm)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Gagal menambah pelanggaran.");
      }
      setViolationForm({ jenis: "Ringan", poin: 5, keterangan: "" }); // reset form
      fetchRiwayatPelanggaran(selectedKaryawan.id_karyawan); // reload history modal
      fetchKaryawan(); // reload angka poin di tabel luar
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // HANDLER ACTION: OWNER MENGHAPUS / MENCABUT SANKSI (PEMUTIHAN)
  const handleHapusPelanggaran = async (idLog: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan sanksi ini? Poin karyawan akan dikembalikan.")) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://127.0.0.1:8000/api/pelanggaran/${idLog}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Gagal menghapus.");
      }
      fetchRiwayatPelanggaran(selectedKaryawan.id_karyawan); // reload history modal
      fetchKaryawan(); // reload angka poin di tabel luar
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-slate-900 text-slate-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white">Manajemen & Kelola Karyawan</h2>
        <p className="text-sm text-slate-400">Daftarkan staff baru, cari tim produksi, dan kontrol histori kedisiplinan lantai kerja.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* FORM REGISTRASI KARYAWAN */}
        <div className="xl:col-span-1 bg-slate-950 p-6 rounded-2xl border border-white/5 h-fit">
          <h3 className="font-bold text-white text-base mb-4">➕ Tambah Karyawan Baru</h3>
          <form onSubmit={handleSubmitKaryawan} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">ID KARYAWAN</label>
              <input 
                type="text" required placeholder="Contoh: KRY-2026-002"
                value={formInput.id_karyawan}
                onChange={(e) => setFormInput({...formInput, id_karyawan: e.target.value})}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">NAMA LENGKAP</label>
              <input 
                type="text" required placeholder="Nama Karyawan"
                value={formInput.nama}
                onChange={(e) => setFormInput({...formInput, nama: e.target.value})}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">USERNAME</label>
                <input 
                  type="text" required placeholder="username"
                  value={formInput.username}
                  onChange={(e) => setFormInput({...formInput, username: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">PASSWORD KARYAWAN</label>
                <div className="flex gap-2">
                  <input 
                    type="text" required placeholder="Klik Acak"
                    value={formInput.password}
                    onChange={(e) => setFormInput({...formInput, password: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs font-mono tracking-wide"
                  />
                  <button 
                    type="button" onClick={generateRandomPassword}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-white/5 rounded-xl font-bold text-xs"
                  >
                    ⚡ Acak
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">DIVISI (ROLE)</label>
                <select 
                  value={formInput.role}
                  onChange={(e) => setFormInput({...formInput, role: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="PRODUKSI">PRODUKSI (PENJAHIT)</option>
                  <option value="GUDANG">GUDANG / LOGISTIK</option>
                  <option value="FINANCE">FINANCE / PAYROLL</option>
                  <option value="ADMIN">ADMIN APLIKASI</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">TIPE GAJI</label>
                <select 
                  value={formInput.tipe_pay}
                  onChange={(e) => setFormInput({...formInput, tipe_pay: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="BORONGAN">BORONGAN / PCS</option>
                  <option value="BULANAN">BULANAN TETAP</option>
                </select>
              </div>
            </div>
            {formInput.tipe_pay === "BORONGAN" && (
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">TARIF BORONGAN (PER PCS)</label>
                <input 
                  type="number" min="0" placeholder="Rupiah per pakaian"
                  value={formInput.tarif_borongan_pcs}
                  onChange={(e) => setFormInput({...formInput, tarif_borongan_pcs: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            )}
            <button 
              type="submit" disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50 mt-2"
            >
              {isSubmitting ? "Menyimpan ke Database..." : "Daftarkan Akun Karyawan"}
            </button>
          </form>
        </div>

        {/* TABEL DATA UTAMA */}
        <div className="xl:col-span-2 bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-white text-base">👥 Karyawan Terdaftar di Sistem</h3>
            <div className="relative max-w-xs w-full">
              <input 
                type="text" placeholder="Cari karyawan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
              <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Nama</th>
                  <th className="pb-3 font-semibold">Divisi</th>
                  <th className="pb-3 font-semibold text-center">Poin Pelanggaran</th>
                  <th className="pb-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredKaryawan.map((k) => (
                  <tr key={k.id_karyawan} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 font-mono text-slate-400">{k.id_karyawan}</td>
                    <td className="py-3">
                      <div className="font-medium text-white">{k.nama}</div>
                      <div className="text-[10px] text-slate-500">@{k.username}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-white/5">{k.role}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                        (k.poin_pelanggaran ?? 0) > 20 ? 'bg-rose-500/20 text-rose-400' :
                        (k.poin_pelanggaran ?? 0) > 0 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-900 text-slate-500'
                      }`}>
                        {k.poin_pelanggaran ?? 0} Poin
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {activeUser?.role === 'OWNER' && k.role !== 'OWNER' ? (
                        <button
                          onClick={() => setSelectedKaryawan(k)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg transition-all font-semibold text-[10px]"
                        >
                          ⚠️ Sanksi & Log
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🛠️ UPGRADED DASHBOARD MODAL: PANEL LOG & INPUT HAPUS PELANGGARAN */}
      {selectedKaryawan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <h4 className="text-lg font-bold text-white">Manajemen Kedisiplinan Karyawan</h4>
                <p className="text-xs text-slate-400">Nama: <span className="text-white font-semibold">{selectedKaryawan.nama}</span> | ID: <span className="font-mono text-emerald-400">{selectedKaryawan.id_karyawan}</span></p>
              </div>
              <button onClick={() => setSelectedKaryawan(null)} className="text-slate-500 hover:text-white text-sm">✕ Tutup</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KIRI: TABEL HISTORI & AKTIVITAS HAPUS SANKSI */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📜 Riwayat Pelanggaran Aktif</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {riwayatPelanggaran.map((log) => (
                    <div key={log.id} className="bg-slate-900 p-3 rounded-xl border border-white/5 relative group text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          log.jenis === 'Berat' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          log.jenis === 'Sedang' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-800 text-slate-400'
                        }`}>{log.jenis.toUpperCase()} ({log.poin} Poin)</span>
                        <span className="text-[9px] text-slate-500 font-mono">{log.tanggal}</span>
                      </div>
                      <p className="text-slate-300 pr-8">{log.keterangan}</p>
                      
                      {/* ACTION: TOMBOL PEMUTIHAN / HAPUS LOG */}
                      <button
                        onClick={() => handleHapusPelanggaran(log.id)}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                        title="Cabut Sanksi (Pemutihan)"
                      >
                        ❌ Cabut
                      </button>
                    </div>
                  ))}
                  {riwayatPelanggaran.length === 0 && (
                    <p className="text-slate-500 text-xs italic text-center py-4 bg-slate-900/40 rounded-xl border border-dashed border-white/5">Karyawan ini bersih, belum ada catatan pelanggaran.</p>
                  )}
                </div>
              </div>

              {/* KANAN: FORM INPUT SANKSI INSIDEN BARU */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 h-fit">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">⚠️ Input Insiden Baru</h5>
                <form onSubmit={handleTambahPelanggaran} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">TINGKAT PELANGGARAN</label>
                    <select
                      value={violationForm.jenis}
                      onChange={(e) => handleJenisChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                    >
                      <option value="Ringan">Ringan (5 Poin - Terlambat / Atribut Luput)</option>
                      <option value="Sedang">Sedang (10 Poin - Salah Potong / Keluar Pabrik)</option>
                      <option value="Berat">Berat (25 Poin - Merusak Inventaris / Mangkir)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">KETERANGAN ALASAN (BERITA ACARA)</label>
                    <textarea
                      required placeholder="Contoh: Terlambat >30 menit tanpa konfirmasi ke koordinator divisi."
                      value={violationForm.keterangan}
                      onChange={(e) => setViolationForm({...violationForm, keterangan: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white h-20 text-xs resize-none focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-rose-500/10">
                    Terapkan & Gandakan Poin
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}