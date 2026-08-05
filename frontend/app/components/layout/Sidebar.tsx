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
  KeyRound
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  activeUser: any;
  onOpenPinModal?: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  activeUser,
  onOpenPinModal,
  isCollapsed: externalCollapsed,
  setIsCollapsed: externalSetIsCollapsed
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
    { id: 'setting', label: 'Akun Saya', icon: User, roles: ['OWNER', 'ADMIN', 'FINANCE', 'PRODUKSI'] },
  ];

  // Normalisasi string role ke UPPERCASE
  const userRole = activeUser?.role?.toUpperCase() || 'GUEST';
  const isOwnerOrDev = ['OWNER', 'DEVELOPER'].includes(userRole);

  return (
    <aside
      className={`h-full bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0 transition-all duration-300 ease-in-out relative z-30 shadow-2xl select-none ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Ambient Lighting FX */}
      <div className="absolute top-0 left-0 w-full h-32 bg-indigo-600/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-emerald-600/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* LOGO ERP & TOGGLE BUTTON */}
          <div className={`p-4 border-b border-slate-800/80 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4 py-5' : ''}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative group shrink-0">
                {/* Glowing Logo Aura */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-xl blur opacity-40 group-hover:opacity-100 transition duration-500 animate-pulse" />
                <div className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 text-indigo-400 font-black flex items-center justify-center text-base shadow-inner">
                  N
                </div>
              </div>

              {!isCollapsed && (
                <div className="transition-all duration-300">
                  <h1 className="text-white font-extrabold text-base tracking-wider leading-none flex items-center gap-1.5">
                    NEXORA
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20 shadow-sm">
                      ERP
                    </span>
                  </h1>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Garment System
                  </p>
                </div>
              )}
            </div>

            {/* Toggle Sidebar Button */}
            <button
              onClick={toggleSidebar}
              title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all active:scale-95 shrink-0 hover:border-indigo-500/40 shadow-sm cursor-pointer"
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
              // Bypass akses DEVELOPER
              const hasAccess = userRole === 'DEVELOPER' || item.roles.includes(userRole);
              if (!hasAccess) return null;

              const isActive = activeMenu === item.id;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`relative w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-3 cursor-pointer group ${isCollapsed ? 'justify-center px-0' : ''
                    } ${isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                >
                  {/* Glowing Active Line Accent */}
                  {isActive && !isCollapsed && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-300 rounded-r-full shadow-sm" />
                  )}

                  <IconComponent
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                      }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate tracking-wide">{item.label}</span>
                  )}

                  {/* Active Indicator Pulse Dot */}
                  {isActive && !isCollapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-200 shadow-sm animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* USER PROFILE INFO & MASTER PIN GATE ACCESS */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 text-xs space-y-2.5">

          {/* QUICK ACTION MASTER PIN GATE */}
          {isOwnerOrDev && (
            <button
              onClick={() => {
                if (onOpenPinModal) {
                  onOpenPinModal();
                } else {
                  setActiveMenu('setting');
                }
              }}
              title={isCollapsed ? "Master PIN Gate" : undefined}
              className={`w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-[11px] transition-all flex items-center justify-between group cursor-pointer shadow-sm active:scale-95 ${isCollapsed ? 'justify-center' : ''
                }`}
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 shrink-0 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                {!isCollapsed && <span>Master PIN Gate</span>}
              </span>
              {!isCollapsed && userRole === 'DEVELOPER' && (
                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  DEV
                </span>
              )}
            </button>
          )}

          {/* KARTU PROFIL USER (WITH ONLINE STATUS DOT) */}
          <div
            title={isCollapsed ? `${activeUser?.nama || "User"} (${userRole})` : undefined}
            className={`flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 relative overflow-hidden group ${isCollapsed ? 'justify-center p-2' : ''
              }`}
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs uppercase shadow-inner">
                {activeUser?.nama?.charAt(0) || "U"}
              </div>
              {/* Online Indicator Dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>

            {!isCollapsed && (
              <div className="truncate min-w-0 flex-1">
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
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}