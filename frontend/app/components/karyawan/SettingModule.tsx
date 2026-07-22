import React, { useState } from 'react';

interface SettingModuleProps {
  activeUser: any;
  onLogout: () => void;
}

export default function SettingModule({ activeUser, onLogout }: SettingModuleProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const dataAbsensi = { 
    hadir: activeUser?.total_hadir ?? 0, 
    izin: activeUser?.total_izin ?? 0, 
    alpa: activeUser?.total_alpa ?? 0, 
    terlambat: activeUser?.total_terlambat ?? 0 
  };
  
  const dataPelanggaran = [
    { tanggal: "12-07-2026", jenis: "Terlambat", poin: 5, keterangan: "Terlambat > 15 menit tanpa kabar" },
    { tanggal: "05-07-2026", jenis: "SOP Produksi", poin: 10, keterangan: "Tidak menggunakan masker di ruang cutting" }
  ];

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-slate-900 text-slate-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white">Pengaturan & Informasi Akun</h2>
        <p className="text-sm text-slate-400">Pantau profil data diri, kehadiran, dan kepatuhan kerja Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DATA DIRI */}
        <div className="lg:col-span-1 bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-xl font-bold border border-emerald-500/25">
              {activeUser?.nama?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{activeUser?.nama || "Nama Pengguna"}</h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                {activeUser?.role || "PRODUKSI"}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider">ID Karyawan</span>
              <span className="font-mono text-slate-200">{activeUser?.id_karyawan || "KRY-XXXX"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider">Username Sistem</span>
              <span className="text-slate-200">@{activeUser?.username || "username"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider">Status Hubungan Kerja</span>
              <span className="text-slate-200">Karyawan Aktif</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition-all font-semibold text-sm flex items-center justify-center gap-2"
            >
              🚪 Keluar dari Aplikasi
            </button>
          </div>
        </div>

        {/* ABSENSI & PELANGGARAN */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-6">
          <div>
            <h3 className="font-bold text-white text-base">📊 Rekap Absensi Bulan Ini</h3>
            <p className="text-xs text-slate-500">Data diperbarui otomatis oleh sistem HRD</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-xs text-slate-500 block mb-1">Hadir</span>
              <span className="text-2xl font-bold text-emerald-400">{dataAbsensi.hadir}</span>
              <span className="text-[10px] text-slate-600 block">Hari</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-xs text-slate-500 block mb-1">Terlambat</span>
              <span className="text-2xl font-bold text-amber-400">{dataAbsensi.terlambat}</span>
              <span className="text-[10px] text-slate-600 block">Kali</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-xs text-slate-500 block mb-1">Izin/Sakit</span>
              <span className="text-2xl font-bold text-blue-400">{dataAbsensi.izin}</span>
              <span className="text-[10px] text-slate-600 block">Hari</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-xs text-slate-500 block mb-1">Alpa</span>
              <span className="text-2xl font-bold text-rose-400">{dataAbsensi.alpa}</span>
              <span className="text-[10px] text-slate-600 block">Hari</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <div className="mb-4">
              <h3 className="font-bold text-white text-base">⚠️ Log Poin Kepatuhan & Pelanggaran</h3>
              <p className="text-xs text-slate-500">Total akumulasi poin pelanggaran aktif: <span className="text-amber-400 font-bold">{activeUser?.poin_pelanggaran ?? 0} Poin</span></p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Tanggal</th>
                    <th className="pb-3 font-semibold">Jenis</th>
                    <th className="pb-3 font-semibold">Keterangan</th>
                    <th className="pb-3 font-semibold text-right">Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {dataPelanggaran.map((item, index) => (
                    <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono text-xs">{item.tanggal}</td>
                      <td className="py-3 font-medium text-amber-400">{item.jenis}</td>
                      <td className="py-3 text-xs text-slate-400 max-w-xs truncate">{item.keterangan}</td>
                      <td className="py-3 text-right font-bold text-rose-400">+{item.poin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="text-3xl">⚠️</div>
              <h4 className="text-lg font-bold text-white">Konfirmasi Keluar</h4>
              <p className="text-xs text-slate-400">Apakah Anda yakin ingin keluar dari sistem Nexora ERP?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 bg-white/5 text-slate-300 rounded-xl text-sm">Batal</button>
              <button onClick={() => { setShowLogoutModal(false); onLogout(); }} className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-sm shadow-lg shadow-rose-500/20">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}