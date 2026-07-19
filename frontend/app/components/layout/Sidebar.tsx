"use client";

import React from 'react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  activeUser: any;
}

export default function Sidebar({ activeMenu, setActiveMenu, activeUser }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard', roles: ['OWNER', 'ADMIN', 'FINANCE', 'PRODUKSI'] },
    { id: 'karyawan', label: '👥 Kelola Karyawan', roles: ['OWNER', 'ADMIN'] },
    { id: 'produksi', label: '🧵 Produksi Borongan', roles: ['OWNER', 'ADMIN', 'PRODUKSI'] },
    { id: 'setting', label: '⚙️ Akun Saya', roles: ['OWNER', 'ADMIN', 'FINANCE', 'PRODUKSI'] },
  ];

  return (
    // w-64 & flex-shrink-0 menjamin sidebar memiliki ruang 256px dan tidak bisa terjepit
    <aside className="w-64 h-full bg-slate-950 border-r border-white/5 flex flex-col justify-between flex-shrink-0">
      <div>
        {/* LOGO ERP */}
        <div className="p-6 border-b border-white/5">
          <h1 className="text-emerald-400 font-black text-xl tracking-wider">NEXORA <span className="text-white text-xs font-medium px-1.5 py-0.5 bg-slate-900 rounded border border-white/10 ml-1">ERP</span></h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Garment Internal System</p>
        </div>

        {/* LIST NAVIGASI RBAC */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            // Saring menu berdasarkan Hak Akses (Role)
            if (!item.roles.includes(activeUser?.role)) return null;

            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                  isActive 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10 scale-[1.02]' 
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE INFO DI POJOK BAWAH SIDEBAR */}
      <div className="p-4 border-t border-white/5 bg-slate-900/30 text-xs">
        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-white/5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm uppercase">
            {activeUser?.nama?.charAt(0) || "U"}
          </div>
          <div className="truncate">
            <p className="font-bold text-white text-[11px] truncate">{activeUser?.nama}</p>
            <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-extrabold mt-0.5">{activeUser?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}