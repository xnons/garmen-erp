"use client";

import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  activeUser: any;
  onOpenPinModal?: () => void;
  isCollapsed?: boolean; // 👈 Optional: jika ingin dikontrol dari luar (Parent)
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['OWNER', 'ADMIN', 'FINANCE', 'PRODUKSI'] },
    { id: 'karyawan', label: 'Kelola Karyawan', icon: '👥', roles: ['OWNER', 'ADMIN'] },
    { id: 'inventaris', label: 'Inventaris & Stok', icon: '📦', roles: ['OWNER', 'ADMIN', 'PRODUKSI'] },
    { id: 'mesin', label: 'Inventaris Mesin', icon: '⚙️', roles: ['OWNER', 'ADMIN', 'PRODUKSI'] },
    { id: 'produksi', label: 'Produksi Borongan', icon: '🧵', roles: ['OWNER', 'ADMIN', 'PRODUKSI'] },
    { id: 'setting', label: 'Akun Saya', icon: '👤', roles: ['OWNER', 'ADMIN', 'FINANCE', 'PRODUKSI'] },
  ];

  // Normalisasi string role ke UPPERCASE
  const userRole = activeUser?.role?.toUpperCase();
  const isOwnerOrDev = ['OWNER', 'DEVELOPER'].includes(userRole);

  return (
    <aside
      className={`h-full bg-slate-950 border-r border-white/5 flex flex-col justify-between flex-shrink-0 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div>
        {/* LOGO ERP & TOGGLE BUTTON */}
        <div className={`p-4 border-b border-white/5 flex items-center justify-between ${isCollapsed ? 'flex-col gap-3 py-5' : ''}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm shrink-0 shadow-lg shadow-emerald-500/10">
              N
            </div>
            {!isCollapsed && (
              <div className="transition-opacity duration-200">
                <h1 className="text-emerald-400 font-black text-lg tracking-wider leading-none flex items-center gap-1">
                  NEXORA <span className="text-white text-[9px] font-medium px-1.5 py-0.5 bg-slate-900 rounded border border-white/10">ERP</span>
                </h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-1">
                  Garment System
                </p>
              </div>
            )}
          </div>

          {/* Tombol Toggle Tutup/Buka Sidebar */}
          <button
            onClick={toggleSidebar}
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-all active:scale-95 shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
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
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : ''
                  } ${isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
                  }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE INFO & PIN GATE QUICK ACCESS */}
      <div className="p-3 border-t border-white/5 bg-slate-900/30 text-xs space-y-2.5">

        {/* 🔑 TOMBOL QUICK ACTION MASTER PIN GATE */}
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
            className={`w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-[11px] transition-all flex items-center justify-between group ${isCollapsed ? 'justify-center' : ''
              }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">🔑</span>
              {!isCollapsed && <span>Master PIN Gate</span>}
            </span>
            {!isCollapsed && userRole === 'DEVELOPER' && (
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">
                DEV
              </span>
            )}
          </button>
        )}

        {/* KARTU PROFIL USER */}
        <div
          title={isCollapsed ? `${activeUser?.nama || "User"} (${activeUser?.role || "GUEST"})` : undefined}
          className={`flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-white/5 ${isCollapsed ? 'justify-center p-2' : ''
            }`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm uppercase shrink-0">
            {activeUser?.nama?.charAt(0) || "U"}
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="font-bold text-white text-[11px] truncate">{activeUser?.nama || "User"}</p>
              <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-extrabold mt-0.5">
                {activeUser?.role || "GUEST"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}