"use client";

import React from 'react';
import KaryawanModule from './modules/KaryawanModule';
import SettingModule from './modules/SettingModule';

interface DashboardContentProps {
  activeMenu: string;
  activeUser: any;
  onLogout: () => void;
}

export default function DashboardContent({ activeMenu, activeUser, onLogout }: DashboardContentProps) {
  // Cast imported modules to any to satisfy JSX typing when their props are not exported
  const Karyawan = KaryawanModule as any;
  const Setting = SettingModule as any;

  // Rute Modul Karyawan
  if (activeMenu === 'karyawan') {
    return <Karyawan activeUser={activeUser} onLogout={onLogout} />;
  }

  // Rute Modul Akun & Pengaturan
  if (activeMenu === 'setting') {
    return <Setting activeUser={activeUser} onLogout={onLogout} />;
  }

  // Tampilan Utama / Fallback Modul Lain
  return (
    <main className="flex-1 p-8 bg-slate-900 flex items-center justify-center text-slate-100">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2 uppercase tracking-widest text-emerald-400">{activeMenu} Menu</h2>
        <p className="text-xs text-slate-500">Modul operasional ini sedang dalam tahap pengembangan aktif.</p>
      </div>
    </main>
  );
}