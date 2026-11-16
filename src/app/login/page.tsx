'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Search,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = login(username, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.message || 'Login gagal.');
    }
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
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-bold text-lg text-slate-800">Login Petugas</h2>
            <p className="text-xs text-slate-500">Masukkan username dan kata sandi Anda</p>
          </div>

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
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-98 disabled:opacity-70 mt-2"
            >
              <span>{isSubmitting ? 'Memproses...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
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
