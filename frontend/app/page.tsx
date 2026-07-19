"use client";

import React, { useState } from 'react';
// Jalur diatur menggunakan satu titik karena folder components ada di dalam folder app
import Sidebar from './components/layout/Sidebar';
import DashboardContent from './components/dashboard/DashboardContent';

export default function DashboardPage() {
  // Kita set default ke 'karyawan' agar langsung memuat halaman kelola karyawan
  const [activeMenu, setActiveMenu] = useState('karyawan');
  const [activeUser, setActiveUser] = useState<any>({
    id_karyawan: "KRY-2026-001",
    nama: "Bapak Owner Nexora",
    username: "admin.nexora",
    role: "OWNER", // Ubah ke 'ADMIN' untuk tes hilangnya tombol sanksi
    total_hadir: 25,
    total_terlambat: 1,
    poin_pelanggaran: 0
  });

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.reload();
  };

  return (
    // Pembungkus Utama (Layout dasar Flexbox Horizontal)
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden m-0 p-0">
      
      {/* SISI KIRI: Navigasi Menu */}
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        activeUser={activeUser} 
      />

      {/* SISI KANAN: Konten Dinamis */}
      <DashboardContent 
        activeMenu={activeMenu} 
        activeUser={activeUser} 
        onLogout={handleLogout} 
      />

    </div>
  );
}