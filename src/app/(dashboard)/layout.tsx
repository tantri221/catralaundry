'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Menu, X, Plus, LogOut, ShieldCheck, User, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, sessionTerminatedReason, clearSessionTerminatedReason } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Route protection: redirect to login if not authenticated and not showing session terminated dialog
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !sessionTerminatedReason) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, sessionTerminatedReason, router]);

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      logout();
      router.push('/login');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-white z-10 shadow-2xl">
            <div className="absolute top-4 right-4 text-slate-500">
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800">Catra Laundry</p>
              <p className="text-[11px] text-slate-500">Sistem Kasir Harian</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Terima Cucian</span>
            </Link>

            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{user?.name || 'Administrator'}</p>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase ${
                    user?.role === 'superadmin'
                      ? 'text-purple-600 bg-purple-50 border-purple-200'
                      : user?.role === 'admin'
                      ? 'text-blue-600 bg-blue-50 border-blue-100'
                      : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                  }`}
                >
                  {user?.role === 'superadmin'
                    ? 'Super Admin'
                    : user?.role === 'admin'
                    ? 'Administrator'
                    : 'Kasir'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Modal Notifikasi Sesi Diambil Alih oleh Perangkat Lain */}
      {sessionTerminatedReason && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sesi Login Berakhir</h3>
              <p className="text-xs text-slate-500 mt-1">Perangkat Lain Telah Mengakses Akun Ini</p>
            </div>
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-left text-xs text-amber-900 space-y-1.5">
              <p className="font-semibold leading-relaxed">{sessionTerminatedReason}</p>
              <p className="text-[11px] text-amber-700">
                Sistem Catra Laundry membatasi akses 1 perangkat aktif per akun guna menjaga keakuratan kas & pencatatan nota kasir.
              </p>
            </div>
            <button
              onClick={() => {
                clearSessionTerminatedReason();
                router.push('/login');
              }}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
