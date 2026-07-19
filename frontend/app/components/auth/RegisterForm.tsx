// app/components/auth/RegisterForm.tsx
"use client";

export default function RegisterForm({ onRegister, onBack, setRegId, setRegNama, setRegUsername, setRegPassword }: any) {
  return (
    <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-3xl shadow-2xl">
      <h1 className="text-xl font-bold mb-6 text-white">Registrasi Karyawan</h1>
      <form onSubmit={onRegister} className="space-y-3">
        {['ID', 'Nama', 'Username', 'Password'].map((field) => (
          <input 
            key={field}
            type={field === 'Password' ? 'password' : 'text'}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 outline-none focus:border-emerald-500" 
            placeholder={field} 
            onChange={(e) => {
              if (field === 'ID') setRegId(e.target.value);
              if (field === 'Nama') setRegNama(e.target.value);
              if (field === 'Username') setRegUsername(e.target.value);
              if (field === 'Password') setRegPassword(e.target.value);
            }} 
          />
        ))}
        <button className="w-full bg-slate-800 hover:bg-emerald-600 py-4 rounded-xl font-bold transition-all mt-4">Simpan Data</button>
        <button type="button" onClick={onBack} className="w-full text-slate-500 text-sm hover:underline">Kembali</button>
      </form>
    </div>
  );
}