'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getLoginApprovalRequest,
  deleteLoginApprovalRequest,
  LoginApprovalRequest,
} from '@/lib/supabaseService';
import { User } from '@/types/auth';
import {
  Sparkles,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Search,
  ShieldAlert,
  Loader2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    completeApprovedLogin,
    isAuthenticated,
    isLoading,
    sessionTerminatedReason,
    clearSessionTerminatedReason,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pending approval from Device 1
  const [pendingApproval, setPendingApproval] = useState<{
    activeDevice: string;
    request: LoginApprovalRequest;
    approvedUser: User;
  } | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && !pendingApproval) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, pendingApproval, router]);

  // Handle Login Approval Listener (Realtime Broadcast & Polling)
  useEffect(() => {
    if (!pendingApproval) return;

    let isSubscribed = true;
    const cleanUser = username.trim().toLowerCase();

    // 1. Supabase Realtime broadcast listener
    const channel = supabase.channel('catra_auth_sessions');
    channel
      .on('broadcast', { event: 'login_approval_response' }, async (eventPayload) => {
        if (!isSubscribed) return;
        const data = eventPayload?.payload;
        if (!data || data.requestId !== pendingApproval.request.requestId) return;

        if (data.status === 'approved') {
          console.log('[Login] Request approved via realtime broadcast');
          await completeApprovedLogin(
            pendingApproval.approvedUser,
            data.newSessionToken || pendingApproval.request.newSessionToken
          );
          setPendingApproval(null);
          router.push('/');
        } else if (data.status === 'rejected') {
          setErrorMessage('Permintaan login ditolak oleh perangkat yang sedang aktif.');
          setPendingApproval(null);
        }
      })
      .subscribe();

    // 2. Database polling check every 2 seconds
    const interval = setInterval(async () => {
      if (!isSubscribed) return;
      try {
        const req = await getLoginApprovalRequest(cleanUser);
        if (req && req.requestId === pendingApproval.request.requestId) {
          if (req.status === 'approved') {
            console.log('[Login] Request approved via database poll');
            clearInterval(interval);
            await completeApprovedLogin(pendingApproval.approvedUser, req.newSessionToken);
            setPendingApproval(null);
            router.push('/');
          } else if (req.status === 'rejected') {
            clearInterval(interval);
            setErrorMessage('Permintaan login ditolak oleh perangkat yang sedang aktif.');
            setPendingApproval(null);
          }
        }
      } catch {
        // ignore network error
      }
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [pendingApproval, username, completeApprovedLogin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    clearSessionTerminatedReason();
    setIsSubmitting(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        router.push('/');
      } else if (res.isUsedOnOtherDevice && res.request && res.user) {
        setPendingApproval({
          activeDevice: res.activeDevice || 'Perangkat Lain',
          request: res.request,
          approvedUser: res.user,
        });
      } else {
        setErrorMessage(res.message || 'Login gagal.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await login(username, password, { force: true });
      if (res.success) {
        setPendingApproval(null);
        router.push('/');
      } else {
        setErrorMessage(res.message || 'Gagal mengambil alih sesi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelApproval = async () => {
    if (pendingApproval) {
      deleteLoginApprovalRequest(username).catch(() => {});
    }
    setPendingApproval(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Memeriksa sesi login...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Catra Laundry</h1>
          <p className="text-xs text-blue-200">
            Masuk ke sistem manajemen & kasir operasional laundry
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
          {pendingApproval ? (
            /* ============================================================ */
            /* PEMBERITAHUAN: USER AKUN SEDANG DIGUNAKAN DI PERANGKAT LAIN  */
            /* ============================================================ */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-7 h-7 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-rose-700 uppercase tracking-tight leading-snug">
                  User Akun Ini Sedang Digunakan Di Perangkat Lain !!!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Akun <strong className="text-slate-900">@{username}</strong> saat ini sedang aktif di:{' '}
                  <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 inline-block mt-1">
                    {pendingApproval.activeDevice}
                  </span>
                </p>
              </div>

              {/* Waiting status box */}
              <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Menunggu Konfirmasi Persetujuan...</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Silakan buka perangkat aktif Anda (<strong className="text-amber-950">{pendingApproval.activeDevice}</strong>) dan tekan tombol{' '}
                  <strong className="text-emerald-700 font-bold">&quot;Izinkan Masuk&quot;</strong> pada pop-up konfirmasi yang muncul di layarnya.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleForceLogin}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                  title="Gunakan jika perangkat lama tidak merespons atau tertinggal"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Ambil Alih Sesi (Force Login)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelApproval}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all active:scale-98 cursor-pointer"
                >
                  Batalkan & Kembali
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* FORM LOGIN NORMAL                                            */
            /* ============================================================ */
            <>
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-lg text-slate-800">Login Petugas</h2>
                <p className="text-xs text-slate-500">Masukkan username dan kata sandi Anda</p>
              </div>

              {sessionTerminatedReason && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="flex-1 space-y-0.5">
                    <span className="font-bold text-amber-950 block">Sesi Login Dialihkan</span>
                    <span className="text-amber-800 leading-snug block">{sessionTerminatedReason}</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username / ID Pengguna
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-98 disabled:opacity-70 mt-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Memproses...' : 'Masuk ke Sistem'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Public customer link */}
        <div className="text-center">
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pelanggan ingin cek status resi? Klik di sini</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
