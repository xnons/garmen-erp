"use client";

import React from 'react';
import { Lock } from 'lucide-react';

interface LoginFormProps {
  onLogin: (e: React.FormEvent) => void;
  setLoginUsername: (value: string) => void;
  setLoginPassword: (value: string) => void;
  loading: boolean;
}

export default function LoginForm({ 
  onLogin, 
  setLoginUsername, 
  setLoginPassword, 
  loading 
}: LoginFormProps) {
  return (
    <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-white/5 shadow-2xl backdrop-blur-sm">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight">Nexora <span className="text-emerald-500">ERP</span></h2>
        <p className="text-sm text-slate-400 mt-2">Sistem Informasi Internal Pabrik Garmen</p>
      </div>

      <form onSubmit={onLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Username
          </label>
          <input 
            type="text" 
            onChange={(e) => setLoginUsername(e.target.value)}
            placeholder="Masukkan username Anda" 
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Password
          </label>
          <input 
            type="password" 
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="••••••••" 
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-slate-950 font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/15 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Memproses Verifikasi..." : "Masuk ke Sistem"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Lock className="w-3.5 h-3.5 text-slate-500" />
        <span>Koneksi terenkripsi. Hak Akses Terbatas Internal.</span>
      </div>
    </div>
  );
}