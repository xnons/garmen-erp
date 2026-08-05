"use client";

import React, { useState, useEffect } from 'react';

// Sub-Modul & Komponen
import DashboardOverview from '@/app/components/dashboard/DashboardOverview';
import { KaryawanModule } from '@/app/components/karyawan/KaryawanModule';
import SettingModule from '@/app/components/karyawan/SettingModule';
import PinGateModal from '@/app/components/karyawan/PinGateModal';
import MesinModule from '@/app/components/mesin/page';
import InventarisPage from '@/app/components/inventaris/page';
import ProduksiPage from '@/app/components/produksi/ProduksiPage';
import LockedView from '@/app/components/common/LockedView';

interface DashboardContentProps {
  activeMenu: string;
  setActiveMenu?: (menu: string) => void; // 🟢 Prop opsional agar DashboardOverview bisa berpindah tab
  activeUser: any;
  onLogout: () => void;
}

export default function DashboardContent({
  activeMenu,
  setActiveMenu,
  activeUser,
  onLogout
}: DashboardContentProps) {
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Reset status verifikasi PIN saat berpindah menu
  useEffect(() => {
    if (activeMenu === 'karyawan') {
      setShowPinModal(true);
    } else {
      setIsPinVerified(false);
      setShowPinModal(false);
    }
  }, [activeMenu]);

  // Helper untuk memilih modul yang ditampilkan
  const renderActiveModule = () => {
    // 1. Dashboard Ringkasan (🟢 FIX: oper activeUser & onNavigate callback)
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
      if (isPinVerified) {
        return <KaryawanModule activeUser={activeUser} />;
      }

      return (
        <>
          <LockedView
            title="Akses Kelola Karyawan Terkunci"
            onOpenPinModal={() => setShowPinModal(true)}
          />
          <PinGateModal
            isOpen={showPinModal}
            onClose={() => setShowPinModal(false)}
            onSuccess={() => {
              setIsPinVerified(true);
              setShowPinModal(false);
            }}
          />
        </>
      );
    }

    // 4. Inventaris Mesin
    if (activeMenu === 'mesin') {
      return <MesinModule activeUser={activeUser} />;
    }

    // 5. Inventaris & Stok Bahan Baku
    if (activeMenu === 'inventaris') {
      return <InventarisPage />;
    }

    // 6. Pengaturan & Akun
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
    <main className="flex-1 h-full overflow-y-auto min-h-0 bg-slate-950 text-slate-100 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      {renderActiveModule()}
    </main>
  );
}