"use client";

import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Users,
  Package,
  Cpu,
  Scissors,
  User,
  ShieldAlert,
  Wallet,
  X
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  activeUser: any;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  activeUser,
  isCollapsed: externalCollapsed,
  setIsCollapsed: externalSetIsCollapsed,
  mobileOpen = false,
  setMobileOpen
}: SidebarProps) {
  // Support state internal & external (controlled / uncontrolled)
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleSidebar = () => {
    if (externalSetIsCollapsed) {
      externalSetIsCollapsed(!isCollapsed);
    } else {
      setInternalCollapsed(!isCollapsed);
    }
  };

  // 🛡️ RBAC & Lucide Icons Navigation
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'FINANCE', 'PRODUKSI'] },
    { id: 'karyawan', label: 'Kelola Karyawan', icon: Users, roles: ['OWNER', 'ADMIN'] },
    { id: 'inventaris', label: 'Inventaris & Stok', icon: Package, roles: ['OWNER', 'ADMIN'] },
    { id: 'mesin', label: 'Inventaris Mesin', icon: Cpu, roles: ['OWNER', 'ADMIN', 'PRODUKSI'] },
    { id: 'produksi', label: 'Produksi Borongan', icon: Scissors, roles: ['OWNER', 'ADMIN', 'PRODUKSI'] },
    { id: 'payroll', label: 'Payroll & Penggajian', icon: Wallet, roles: ['OWNER', 'FINANCE'] },
    { id: 'audit-log', label: 'Log Keamanan', icon: ShieldAlert, roles: ['OWNER'] },
    { id: 'setting', label: 'Akun Saya', icon: User, roles: ['OWNER', 'ADMIN', 'FINANCE', 'PRODUKSI'] },
  ];

  // Normalisasi string role ke UPPERCASE
  const userRole = activeUser?.role?.toUpperCase() || 'GUEST';

  const handleSelectMenu = (id: string) => {
    setActiveMenu(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* 🟢 BACKDROP KHUSUS HP (TAMPIL SAAT DRAWER MOBILE DIBUKA) */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 🟢 SIDEBAR UTAMA (RESPONSIF: DRAWER PADA HP, STATIS PADA PC) */}
      <aside
        className={`h-full bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0 transition-all duration-300 ease-in-out select-none
          /* HP (Mobile): Fixed slide-out drawer */
          fixed inset-y-0 left-0 z-50 w-72 md:static md:z-30
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          /* PC (Desktop): Tetap persis seperti sebelumnya */
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Ambient Lighting FX */}
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-600/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-emerald-600/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full justify-between overflow-y-auto custom-scrollbar">
          <div>
            {/* LOGO ERP & TOGGLE / CLOSE BUTTON */}
            <div className={`p-4 border-b border-slate-800/80 flex items-center justify-between ${isCollapsed ? 'md:flex-col md:gap-4 md:py-5' : ''}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative group shrink-0">
                  {/* Glowing Logo Aura */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-xl blur opacity-40 group-hover:opacity-100 transition duration-500 animate-pulse" />
                  <div className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 text-indigo-400 font-black flex items-center justify-center text-base shadow-inner">
                    N
                  </div>
                </div>

                {/* Teks Logo (Tampil di Mobile selalu, atau di PC jika tidak collapsed) */}
                <div className={`transition-all duration-300 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  <h1 className="text-white font-extrabold text-base tracking-wider leading-none flex items-center gap-1.5">
                    MASTER_GARMENT
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20 shadow-sm">
                      ERP
                    </span>
                  </h1>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Garment System
                  </p>
                </div>
              </div>

              {/* Tombol Close untuk Mobile */}
              <button
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className="md:hidden p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 active:scale-95 transition-all cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Toggle Sidebar Button untuk PC Desktop */}
              <button
                onClick={toggleSidebar}
                title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
                className="hidden md:block p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all active:scale-95 shrink-0 hover:border-indigo-500/40 shadow-sm cursor-pointer"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-indigo-400 animate-pulse" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* LIST NAVIGASI RBAC */}
            <nav className="p-3 space-y-1.5">
              {menuItems.map((item) => {
                // Bypass akses DEVELOPER atau cek role di dalam array roles
                const hasAccess = userRole === 'DEVELOPER' || item.roles.includes(userRole);
                if (!hasAccess) return null;

                const isActive = activeMenu === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMenu(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-3 cursor-pointer group ${
                      isCollapsed ? 'md:justify-center md:px-0' : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    {/* Glowing Active Line Accent */}
                    {isActive && (
                      <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-300 rounded-r-full shadow-sm ${isCollapsed ? 'md:hidden' : 'block'}`} />
                    )}

                    <IconComponent
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                      }`}
                    />

                    <span className={`truncate tracking-wide ${isCollapsed ? 'md:hidden' : 'block'}`}>
                      {item.label}
                    </span>

                    {/* Active Indicator Pulse Dot */}
                    {isActive && (
                      <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-indigo-200 shadow-sm animate-pulse ${isCollapsed ? 'md:hidden' : 'block'}`} />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* USER PROFILE INFO */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 text-xs space-y-2.5">
            <div
              title={isCollapsed ? `${activeUser?.nama || "User"} (${userRole})` : undefined}
              className={`flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 relative overflow-hidden group ${
                isCollapsed ? 'md:justify-center md:p-2' : ''
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs uppercase shadow-inner">
                  {activeUser?.nama?.charAt(0) || "U"}
                </div>
                {/* Online Indicator Dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>

              <div className={`truncate min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                <p className="font-bold text-white text-[11px] truncate group-hover:text-indigo-300 transition-colors">
                  {activeUser?.nama || "User Garment"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-indigo-400 uppercase tracking-wider font-extrabold font-mono">
                    {userRole}
                  </span>
                  <span className="text-[9px] text-slate-500">•</span>
                  <span className="text-[9px] text-slate-400 truncate">
                    {activeUser?.jabatan || "Staff"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}