"use client";

import React from 'react';

// Sub-Modul & Komponen
import DashboardOverview from '@/app/components/dashboard/DashboardOverview';
import { KaryawanModule } from '@/app/components/karyawan/KaryawanModule';
import SettingModule from '@/app/components/karyawan/SettingModule';
import MesinModule from '@/app/components/mesin/page';
import InventarisPage from '@/app/components/inventaris/page';
import ProduksiPage from '@/app/components/produksi/ProduksiPage';
import TabAuditLog from '@/app/components/audit/TabAuditLog';
import PayrollModule from '@/app/components/payroll/PayrollModule';

interface DashboardContentProps {
  activeMenu: string;
  setActiveMenu?: (menu: string) => void;
  activeUser: any;
  onLogout: () => void;
}

export default function DashboardContent({
  activeMenu,
  setActiveMenu,
  activeUser,
  onLogout
}: DashboardContentProps) {
  const userRole = activeUser?.role?.toUpperCase() || 'GUEST';

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
      return <InventarisPage activeUser={activeUser} />;
    }

    // 6. Payroll & Penggajian (🔒 Dibatasi hanya untuk OWNER, FINANCE, DEVELOPER)
    if (activeMenu === 'payroll') {
      if (userRole !== 'OWNER' && userRole !== 'FINANCE' && userRole !== 'DEVELOPER') {
        return (
          <div className="flex items-center justify-center h-full p-8 text-slate-100">
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
          <div className="flex items-center justify-center h-full p-8 text-slate-100">
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
      <div className="flex items-center justify-center h-full p-8 text-slate-100">
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
    <main className="flex-1 h-full overflow-y-auto min-h-0 bg-slate-950 text-slate-100 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent p-6">
      {renderActiveModule()}
    </main>
  );
}