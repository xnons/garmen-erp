"use client";

import React, { useState, useEffect } from 'react';

// Sub-Modul & Komponen
import DashboardOverview from '@/app/components/dashboard/DashboardOverview';
import { KaryawanModule } from '@/app/components/karyawan/KaryawanModule';
import SettingModule from '@/app/components/karyawan/SettingModule';
import PinGateModal from '@/app/components/karyawan/PinGateModal';
import MesinModule from '@/app/components/mesin/page';
import InventarisPage from '@/app/components/inventaris/page';
import LockedView from '@/app/components/common/LockedView';

interface DashboardContentProps {
  activeMenu: string;
  activeUser: any;
  onLogout: () => void;
}

export default function DashboardContent({ activeMenu, activeUser, onLogout }: DashboardContentProps) {
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

  // 1. Dashboard Ringkasan
  if (activeMenu === 'dashboard') {
    return <DashboardOverview activeUser={activeUser} />;
  }

  // 2. Kelola Karyawan
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

  // 3. Inventaris Mesin
  if (activeMenu === 'mesin') {
    return <MesinModule activeUser={activeUser} />;
  }

  // 4. Inventaris & Stok Bahan Baku
  if (activeMenu === 'inventaris') {
    return <InventarisPage />;
  }

  // 5. Pengaturan & Akun
  if (activeMenu === 'setting') {
    return <SettingModule activeUser={activeUser} onLogout={onLogout} />;
  }

  // Fallback View
  return (
    <main className="flex-1 p-8 bg-slate-900 flex items-center justify-center text-slate-100">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2 uppercase tracking-widest text-emerald-400">
          {activeMenu} Menu
        </h2>
        <p className="text-xs text-slate-500">
          Modul operasional ini sedang dalam tahap pengembangan aktif.
        </p>
      </div>
    </main>
  );
}