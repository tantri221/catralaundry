'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Tag,
  Search,
  Sparkles,
  LogOut,
  ShieldCheck,
  User,
  Users,
  Store,
  BarChart3,
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { orders } = useLaundry();
  const { user, logout } = useAuth();
  const { activeOutlet } = useOutlet();

  const readyCount = orders.filter((o) => o.orderStatus === 'ready').length;
  const processCount = orders.filter(
    (o) => o.orderStatus !== 'ready' && o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled'
  ).length;

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      logout();
      router.push('/login');
    }
  };

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Terima Cucian (Kasir)',
      href: '/pos',
      icon: PlusCircle,
      highlight: true,
    },
    {
      label: 'Daftar Cucian',
      href: '/orders',
      icon: Clock,
      badge: readyCount > 0 ? `${readyCount} Siap` : undefined,
    },
    ...(user?.role === 'admin' || user?.role === 'superadmin'
      ? [
          {
            label: 'Laporan Transaksi',
            href: '/reports',
            icon: BarChart3,
            adminOnly: true,
          },
          {
            label: 'Daftar Harga & Tarif',
            href: '/services',
            icon: Tag,
            adminOnly: true,
          },
          {
            label: 'Kelola Pengguna',
            href: '/users',
            icon: Users,
            adminOnly: true,
          },
          {
            label: 'Outlet & Cabang',
            href: '/outlets',
            icon: Store,
            adminOnly: true,
          },
        ]
      : []),
    {
      label: 'Cek Nota Resi',
      href: '/track',
      icon: Search,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col shrink-0">
      {/* Brand & Outlet Name */}
      <div className="p-4 border-b border-slate-100 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 text-sm leading-tight truncate">Catra Laundry</h1>
            <p className="text-[11px] text-slate-400">Kasir & Tracking</p>
          </div>
        </div>

        {/* Active Outlet Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs">
          <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-semibold text-blue-900 truncate text-[11px]">
            {activeOutlet.name}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="p-3 flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.highlight && !isActive
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-white text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick summary box */}
      <div className="p-3.5 mx-3 mb-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
        <div className="flex items-center justify-between text-slate-500 text-[11px]">
          <span>Diproses:</span>
          <span className="font-bold text-slate-800">{processCount} Cucian</span>
        </div>
        <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Siap Ambil:</span>
          <span className="font-bold text-emerald-600">{readyCount} Cucian</span>
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              user?.role === 'superadmin'
                ? 'bg-purple-100 text-purple-700'
                : user?.role === 'admin'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {user?.role === 'superadmin' ? (
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            ) : user?.role === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            ) : (
              <User className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
            <p
              className={`text-[10px] uppercase font-semibold tracking-wider ${
                user?.role === 'superadmin'
                  ? 'text-purple-600'
                  : user?.role === 'admin'
                  ? 'text-blue-600'
                  : 'text-emerald-600'
              }`}
            >
              {user?.role === 'superadmin'
                ? 'Super Admin'
                : user?.role === 'admin'
                ? 'Administrator'
                : 'Kasir'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Keluar dari akun"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
