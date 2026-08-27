"use client";

import React from 'react';
import { Menu, User } from 'lucide-react';

// Sub-Modul & Komponen
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { KaryawanModule } from '@/components/karyawan/KaryawanModule';
import SettingModule from '@/components/setting/SettingModule';
import MesinModule from '@/components/mesin/MesinModule';
import InventarisModule from '@/components/inventaris/InventarisModule';
import ProduksiPage from '@/components/produksi/ProduksiPage';
import TabAuditLog from '@/components/audit/TabAuditLog';
import PayrollModule from '@/components/payroll/PayrollModule';

interface DashboardContentProps {
  activeMenu: string;
  setActiveMenu?: (menu: string) => void;
  activeUser: any;
  onLogout: () => void;
  onOpenMobileMenu?: () => void;
}

export default function DashboardContent({
  activeMenu,
  setActiveMenu,
  activeUser,
  onLogout,
  onOpenMobileMenu
}: DashboardContentProps) {
  const userRole = activeUser?.role?.toUpperCase() || 'GUEST';

  const getMenuTitle = (menu: string) => {
    switch (menu) {
      case 'dashboard': return 'Ringkasan Dashboard';
      case 'karyawan': return 'Kelola Karyawan';
      case 'inventaris': return 'Inventaris & Stok';
      case 'mesin': return 'Inventaris Mesin';
      case 'produksi': return 'Produksi Borongan';
      case 'payroll': return 'Payroll & Gaji';
      case 'audit-log': return 'Log Keamanan';
      case 'setting': return 'Akun Saya';
      default: return 'Master Garment ERP';
    }
  };

  // Helper untuk memilih modul yang ditampilkan berdasarkan RBAC
  const renderActiveModule = () => {
    // 1. Dashboard Ringkasan
    if (activeMenu === 'dashboard') {
      return (
        <DashboardOverview
          activeUser={activeUser}
          onNavigate={(targetMenu) => {
            if (setActiveMenu) setActiveMenu(targetMenu);
          }}
        />
      );
    }

    // 2. Produksi & Borongan
    if (activeMenu === 'produksi') {
      return <ProduksiPage currentUser={activeUser} />;
    }

    // 3. Kelola Karyawan
    if (activeMenu === 'karyawan') {
      return <KaryawanModule activeUser={activeUser} />;
    }

    // 4. Inventaris Mesin
    if (activeMenu === 'mesin') {
      return <MesinModule activeUser={activeUser} />;
    }

    // 5. Inventaris & Stok Bahan Baku
    if (activeMenu === 'inventaris') {
      return <InventarisModule activeUser={activeUser} />;
    }

    // 6. Payroll & Penggajian (🔒 Dibatasi hanya untuk OWNER, FINANCE, DEVELOPER)
    if (activeMenu === 'payroll') {
      if (userRole !== 'OWNER' && userRole !== 'FINANCE' && userRole !== 'DEVELOPER') {
        return (
          <div className="flex items-center justify-center h-full p-4 sm:p-8 text-slate-100">
            <div className="text-center bg-slate-900 p-6 rounded-2xl border border-rose-500/30 shadow-xl max-w-md">
              <h2 className="text-base font-bold mb-1 text-rose-400">Akses Ditolak (Unauthorized)</h2>
              <p className="text-xs text-slate-400">
                Modul Payroll & Penggajian bersifat rahasia dan hanya dapat diakses oleh hak akses Owner dan Finance.
              </p>
            </div>
          </div>
        );
      }
      return <PayrollModule />;
    }

    // 7. Log Keamanan & Audit Trail (🔒 Dibatasi hanya untuk OWNER & DEVELOPER)
    if (activeMenu === 'audit-log') {
      if (userRole !== 'OWNER' && userRole !== 'DEVELOPER') {
        return (
          <div className="flex items-center justify-center h-full p-4 sm:p-8 text-slate-100">
            <div className="text-center bg-slate-900 p-6 rounded-2xl border border-rose-500/30 shadow-xl max-w-md">
              <h2 className="text-base font-bold mb-1 text-rose-400">Akses Ditolak (Unauthorized)</h2>
              <p className="text-xs text-slate-400">
                Log Keamanan sistem hanya dapat diakses oleh Administrator Utama / Owner.
              </p>
            </div>
          </div>
        );
      }
      return <TabAuditLog />;
    }

    // 8. Pengaturan & Akun
    if (activeMenu === 'setting') {
      return <SettingModule activeUser={activeUser} onLogout={onLogout} />;
    }

    // Fallback View
    return (
      <div className="flex items-center justify-center h-full p-4 sm:p-8 text-slate-100">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 uppercase tracking-widest text-emerald-400">
            {activeMenu} Menu
          </h2>
          <p className="text-xs text-slate-500">
            Modul operasional ini sedang dalam tahap pengembangan aktif.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full">
      {/* 🟢 TOP MOBILE NAVBAR (HANYA MUNCUL DI HP / TABLET <md) */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm flex items-center justify-center"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5 text-indigo-400" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-extrabold text-xs tracking-wider">MASTER_GARMENT</span>
              <span className="text-[8px] font-bold px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
                ERP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[170px]">
              {getMenuTitle(activeMenu)}
            </p>
          </div>
        </div>

        {/* Profil Mini Button */}
        <button
          type="button"
          onClick={() => setActiveMenu && setActiveMenu('setting')}
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
          title="Buka Akun Saya"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs uppercase shadow-inner">
            {activeUser?.nama?.charAt(0) || "U"}
          </div>
        </button>
      </header>

      {/* 🟢 KONTEN UTAMA MODUL (PADDING RESPONSIF: p-3 di HP, p-6 di PC) */}
      <main className="flex-1 h-full overflow-y-auto min-h-0 bg-slate-950 text-slate-100 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent p-3 sm:p-4 md:p-6">
        {renderActiveModule()}
      </main>
    </div>
  );
}