"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Lock, ShieldCheck, User, MapPin, Loader2, Navigation } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import DashboardContent from '@/components/dashboard/DashboardContent';
import api from '@/services/api';
import { getPreciseLocation, getBrowserCoordinates, reverseGeocodeCoords } from '@/utils/geoUtils';

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

  // State Deteksi Lokasi Presisi (GPS)
  const [locationData, setLocationData] = useState<{
    latitude?: number;
    longitude?: number;
    locationName?: string;
    status: 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';
  }>({ status: 'idle' });

  // 📍 Handler Meminta Izin & Mengambil Lokasi GPS Browser
  const triggerLocationDetection = useCallback(async () => {
    setLocationData(prev => ({ ...prev, status: 'loading' }));
    try {
      const res = await getPreciseLocation(4000);
      if (res.status === 'granted' && res.latitude && res.longitude) {
        setLocationData({
          latitude: res.latitude,
          longitude: res.longitude,
          locationName: res.locationName,
          status: 'granted'
        });
      } else {
        setLocationData({ status: res.status === 'denied' ? 'denied' : 'unavailable' });
      }
    } catch {
      setLocationData({ status: 'unavailable' });
    }
  }, []);

  // Proaktif minta deteksi lokasi saat halaman login dimuat
  useEffect(() => {
    if (!activeUser) {
      triggerLocationDetection();
    }
  }, [activeUser, triggerLocationDetection]);

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

  // 1B. BACKGROUND SYNC LOKASI SETELAH LOGIN SUKSES
  useEffect(() => {
    if (activeUser) {
      const syncGPS = async () => {
        try {
          const coords = await getBrowserCoordinates(3500);
          if (coords) {
            const locName = await reverseGeocodeCoords(coords.latitude, coords.longitude);
            await api.post("/api/auth/update-location", {
              latitude: coords.latitude,
              longitude: coords.longitude,
              device_location: locName
            });
          }
        } catch (err) {
          console.debug("Silent GPS background sync notice:", err);
        }
      };
      syncGPS();
    }
  }, [activeUser]);

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

  // 3. FUNGSI UNTUK LOGIN KE BACKEND (Dilengkapi data GPS)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      // Jika lokasi belum sempat terdeteksi, coba ambil cepat (timeout 2s)
      let currentLoc = { ...locationData };
      if (currentLoc.status !== 'granted') {
        const fastCoords = await getBrowserCoordinates(2000);
        if (fastCoords) {
          const fastName = await reverseGeocodeCoords(fastCoords.latitude, fastCoords.longitude);
          currentLoc = {
            latitude: fastCoords.latitude,
            longitude: fastCoords.longitude,
            locationName: fastName,
            status: 'granted'
          };
          setLocationData(currentLoc);
        }
      }

      const payload = {
        ...loginInput,
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
        device_location: currentLoc.locationName
      };

      const response = await api.post("/api/auth/login", payload);
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

            {/* 📍 DETEKSI & STATUS IZIN LOKASI PRESISI (GPS) */}
            <div className="pt-1 pb-1">
              {locationData.status === 'loading' ? (
                <div className="flex items-center justify-center gap-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="truncate font-medium">Mendeteksi koordinat lokasi fisik (GPS)...</span>
                </div>
              ) : locationData.status === 'granted' && locationData.locationName ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate font-semibold">{locationData.locationName}</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 font-mono font-bold shrink-0">
                    GPS AKTIF
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={triggerLocationDetection}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 rounded-xl text-[11px] transition-all cursor-pointer group"
                  title="Klik untuk mengizinkan akses lokasi presisi untuk audit keamanan"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Navigation className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">Izin Lokasi Presisi: Belum Aktif</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-bold group-hover:underline shrink-0">
                    Aktifkan GPS
                  </span>
                </button>
              )}
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