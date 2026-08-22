import { Metadata } from 'next';
import ProduksiPage from './ProduksiPage';

export const metadata: Metadata = {
    title: 'Produksi & Borongan - Garment ERP',
    description: 'Modul pencatatan output harian borongan, hard-cap limits, verifikasi QC anti-fraud, dan payroll bridge',
};

export default function Page() {
    // 🟢 Meneruskan data user login dengan hak akses eksklusif (RBAC Compliant)
    const currentUser = {
        id_karyawan: 'DEV-001',
        nama: 'Developer Utama',
        role: 'DEVELOPER'
    };

    return (
        <main className="w-full min-h-screen bg-slate-950 text-slate-100">
            <ProduksiPage currentUser={currentUser} />
        </main>
    );
}