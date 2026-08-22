"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import DashboardContent from './components/dashboard/DashboardContent';
import api from './components/services/api';

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // STATE AWAL USER
  const [activeUser, setActiveUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Input Internal untuk Login
  const [loginInput, setLoginInput] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // CEK STATUS LOGIN SETIAP KALI WEB DIBUKA
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setActiveUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // FUNGSI UNTUK MENEMBAK API LOGIN BACKEND
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await api.post("/api/auth/login", loginInput);
      const data = response.data;

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setActiveUser(data.user);
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || "Gagal masuk ke sistem.";
      setLoginError(errMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  // FUNGSI LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setActiveUser(null);
  };

  // Tampilan buffering
  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs tracking-widest font-mono">
        MENYELARASKAN KEAMANAN NEXORA ERP...
      </div>
    );
  }

  // JIKA BELUM LOGIN
  if (!activeUser) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-emerald-400 tracking-wider">
              NEXORA <span className="text-white text-xs px-1.5 py-0.5 bg-slate-950 rounded border border-white/10 ml-0.5">ERP</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2">Internal Engine & Operational Control Platform</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Username Sistem</label>
              <input
                type="text" required placeholder="Masukkan username penjahit/staff"
                value={loginInput.username}
                onChange={(e) => setLoginInput({ ...loginInput, username: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wide">Kata Sandi (Password)</label>
              <input
                type="password" required placeholder="••••••••"
                value={loginInput.password}
                onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit" disabled={loginLoading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50 mt-2"
            >
              {loginLoading ? "Memverifikasi Kredensial..." : "Masuk ke Sistem ERP"}
            </button>
          </form>

          <div className="text-[10px] text-center text-slate-600 font-mono">
            Secured via Bcrypt Hash & HS256 JWT Authorization Standard
          </div>
        </div>
      </div>
    );
  }

  // JIKA SUDAH SUKSES LOGIN
  return (
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