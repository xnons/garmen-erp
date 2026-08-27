"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, ShieldCheck, User } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import api from '@/services/api';

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // STATE AWAL USER
  const [activeUser, setActiveUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Input Internal untuk Login
  const [loginInput, setLoginInput] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // 1. CEK & VALIDASI TOKEN SETIAP KALI WEB DIBUKA
  useEffect(() => {
    const checkAuthSession = async () => {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Validasi keaslian & masa aktif token JWT ke backend endpoint /api/auth/me
          const res = await api.get("/api/auth/me");
          if (res.data) {
            setActiveUser(res.data);
          } else {
            setActiveUser(JSON.parse(savedUser));
          }
        } catch (err: any) {
          console.warn("Token JWT kedaluwarsa saat inisialisasi aplikasi:", err);
          // Bersihkan sesi yang sudah mati
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setActiveUser(null);
          setLoginError("Sesi login Anda telah berakhir. Silakan masukkan kembali username dan kata sandi.");
        }
      } else {
        setActiveUser(null);
      }
      setLoading(false);
    };

    checkAuthSession();
  }, []);

  // 2. LISTENER EVENT TOKEN EXPIRED (DITRIGER SAAT API MENDAPAT 401 UNAUTHORIZED)
  useEffect(() => {
    const handleSessionExpired = (e: any) => {
      setActiveUser(null);
      setLoginError(e.detail || "Sesi login Anda telah berakhir. Silakan masukkan username dan kata sandi kembali.");
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, []);

  // 3. FUNGSI UNTUK LOGIN KE BACKEND
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

  // 4. FUNGSI LOGOUT MANUAL
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_role");
    setActiveUser(null);
    setLoginInput({ username: "", password: "" });
    setLoginError("");
  };

  // Tampilan buffering saat verifikasi awal
  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs tracking-widest font-mono gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <span>MEMVERIFIKASI KEAMANAN SESI NEXORA ERP...</span>
      </div>
    );
  }

  // JIKA BELUM LOGIN / TOKEN SUDAH HABIS
  if (!activeUser) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-modal-pop backdrop-blur-xl">
          <div className="text-center">
            <h1 className="text-2xl font-black text-emerald-400 tracking-wider">
              NEXORA <span className="text-white text-xs px-1.5 py-0.5 bg-slate-950 rounded border border-white/10 ml-0.5">ERP</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2">Internal Engine & Operational Control Platform</p>
          </div>

          {loginError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span className="leading-relaxed">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Username Sistem</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan username penjahit/staff"
                value={loginInput.username}
                onChange={(e) => setLoginInput({ ...loginInput, username: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kata Sandi (Password)</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginInput.password}
                onChange={(e) => setLoginInput({ ...loginInput, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 mt-2 cursor-pointer active:scale-95"
            >
              {loginLoading ? "Memverifikasi Kredensial..." : "Masuk ke Sistem ERP"}
            </button>
          </form>

          <div className="text-[10px] text-center text-slate-500 font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secured via Bcrypt Hash & HS256 JWT Token Standard</span>
          </div>
        </div>
      </div>
    );
  }

  // JIKA SUDAH SUKSES LOGIN
  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden m-0 p-0 relative">
      {/* SISI KIRI: Navigasi Menu (Statis di PC, Drawer di HP) */}
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        activeUser={activeUser}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* SISI KANAN: Konten Dinamis */}
      <DashboardContent
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        activeUser={activeUser}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />
    </div>
  );
}