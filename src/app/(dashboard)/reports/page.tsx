'use client';

import React, { useState, useMemo } from 'react';
import { useLaundry } from '@/context/LaundryContext';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import {
  formatRupiah,
  ORDER_STATUS_DETAILS,
  PAYMENT_STATUS_DETAILS,
} from '@/lib/constants';
import { Order, OrderStatus, PaymentStatus } from '@/types/laundry';
import {
  BarChart3,
  Calendar,
  Download,
  Search,
  Store,
  Filter,
  CreditCard,
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const { user } = useAuth();
  const { orders } = useLaundry();
  const { outlets } = useOutlet();

  // Helper date formatted YYYY-MM-DD
  const formatDateInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Default: Awal bulan ini sampai hari ini
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState<string>(formatDateInput(firstDayOfMonth));
  const [endDate, setEndDate] = useState<string>(formatDateInput(today));
  const [selectedOutletId, setSelectedOutletId] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [customerNameFilter, setCustomerNameFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Daftar nama unik pelanggan untuk opsi autocomplete/dropdown
  const uniqueCustomerNames = useMemo(() => {
    const setNames = new Set<string>();
    orders.forEach((o) => {
      if (o.customer?.name?.trim()) {
        setNames.add(o.customer.name.trim());
      }
    });
    return Array.from(setNames).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  // Access Control: Only admin & superadmin
  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-xs text-slate-500">
          Menu Laporan Keuangan & Transaksi hanya dapat diakses oleh Administrator dan Super Admin.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Quick preset dates
  const setPresetPeriod = (preset: 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      const d = formatDateInput(now);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      setStartDate(formatDateInput(past));
      setEndDate(formatDateInput(now));
    } else if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDateInput(start));
      setEndDate(formatDateInput(now));
    } else if (preset === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatDateInput(start));
      setEndDate(formatDateInput(end));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Date filter
      if (startDate) {
        const orderDateStr = order.createdAt.split('T')[0];
        if (orderDateStr < startDate) return false;
      }
      if (endDate) {
        const orderDateStr = order.createdAt.split('T')[0];
        if (orderDateStr > endDate) return false;
      }

      // Outlet filter
      if (selectedOutletId !== 'all') {
        if (order.outletId && order.outletId !== selectedOutletId) return false;
      }

      // Payment Status filter
      if (paymentStatusFilter !== 'all') {
        if (order.paymentStatus !== paymentStatusFilter) return false;
      }

      // Order Status filter
      if (orderStatusFilter !== 'all') {
        if (orderStatusFilter === 'process') {
          if (!['washing', 'drying', 'ironing'].includes(order.orderStatus)) return false;
        } else if (order.orderStatus !== orderStatusFilter) {
          return false;
        }
      }

      // Filter by Customer Name khusus
      if (customerNameFilter.trim()) {
        const nameQ = customerNameFilter.toLowerCase().trim();
        if (!order.customer.name.toLowerCase().includes(nameQ)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInvoice = order.invoice.toLowerCase().includes(q);
        const matchCustName = order.customer.name.toLowerCase().includes(q);
        const matchCustPhone = order.customer.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        if (!matchInvoice && !matchCustName && !matchCustPhone) return false;
      }

      return true;
    });
  }, [orders, startDate, endDate, selectedOutletId, paymentStatusFilter, orderStatusFilter, customerNameFilter, searchQuery]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let cashRevenue = 0;
    let qrisRevenue = 0;
    let transferRevenue = 0;
    let totalKg = 0;
    let totalPcs = 0;

    filteredOrders.forEach((o) => {
      totalRevenue += o.finalAmount;
      totalCollected += o.paidAmount;
      const pending = Math.max(0, o.finalAmount - o.paidAmount);
      totalPending += pending;

      if (o.paymentMethod === 'cash') cashRevenue += o.paidAmount;
      else if (o.paymentMethod === 'qris') qrisRevenue += o.paidAmount;
      else if (o.paymentMethod === 'transfer') transferRevenue += o.paidAmount;

      o.items.forEach((item) => {
        if (item.unit === 'kg') totalKg += item.quantity;
        else totalPcs += item.quantity;
      });
    });

    return {
      totalRevenue,
      totalCollected,
      totalPending,
      cashRevenue,
      qrisRevenue,
      transferRevenue,
      totalKg: Math.round(totalKg * 10) / 10,
      totalPcs,
      count: filteredOrders.length,
    };
  }, [filteredOrders]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor!');
      return;
    }

    const headers = [
      'No. Nota / Invoice',
      'Tanggal Transaksi',
      'Cabang / Outlet',
      'Nama Pelanggan',
      'No. Telepon',
      'Rincian Cucian',
      'Status Cucian',
      'Metode Bayar',
      'Status Bayar',
      'Total Tagihan (Rp)',
      'Sudah Dibayar (Rp)',
      'Sisa Piutang (Rp)',
      'Catatan',
    ];

    const rows = filteredOrders.map((o) => {
      const itemsSummary = o.items
        .map((it) => `${it.serviceName} (${it.quantity} ${it.unit})`)
        .join('; ');

      const pending = Math.max(0, o.finalAmount - o.paidAmount);
      const outletName = o.outletName || (o.outletId === 'out-2' ? 'Cabang Sudirman' : 'Outlet Pusat');

      return [
        o.invoice,
        new Date(o.createdAt).toLocaleString('id-ID'),
        `"${outletName}"`,
        `"${o.customer.name}"`,
        `'${o.customer.phone}`,
        `"${itemsSummary}"`,
        `"${ORDER_STATUS_DETAILS[o.orderStatus]?.label || o.orderStatus}"`,
        o.paymentMethod ? o.paymentMethod.toUpperCase() : 'CASH',
        o.paymentStatus === 'paid' ? 'Lunas' : o.paymentStatus === 'partial' ? 'Sebagian' : 'Belum Lunas',
        o.finalAmount,
        o.paidAmount,
        pending,
        `"${o.notes || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const customerSuffix = customerNameFilter.trim()
      ? `_${customerNameFilter.trim().replace(/[^a-zA-Z0-9]/g, '_')}`
      : '';
    link.setAttribute('download', `Laporan_Transaksi_CatraLaundry${customerSuffix}_${startDate || 'all'}_sd_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Laporan Transaksi & Keuangan
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Rekapitulasi omset, pembayaran, status pengerjaan, dan audit transaksi operasional Catra Laundry
          </p>
        </div>

        {/* Action Button: Ekspor Excel */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            title="Ekspor ke format Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Preset Periode Cepat */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Pilih Rentang Periode:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setPresetPeriod('today')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPresetPeriod('7days')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setPresetPeriod('thisMonth')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPresetPeriod('lastMonth')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => {
                setPresetPeriod('all');
                setCustomerNameFilter('');
                setSearchQuery('');
              }}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Semua Data
            </button>
          </div>
        </div>

        {/* Form Filter Baris: Tanggal Mulai, Tanggal Selesai, Cabang, Status Bayar, Status Pengerjaan, Filter Nama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Dari Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Dari Tanggal (Mulai)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs bg-slate-50"
            />
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Sampai Tanggal (Selesai)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs bg-slate-50"
            />
          </div>

          {/* Cabang / Outlet */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Cabang / Outlet
            </label>
            <div className="relative">
              <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs bg-slate-50"
              >
                <option value="all">🌐 Semua Cabang</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Pembayaran */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Status Pembayaran
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs bg-slate-50"
            >
              <option value="all">Semua Status Bayar</option>
              <option value="paid">✅ Lunas (Paid)</option>
              <option value="unpaid">⏳ Belum Bayar (Unpaid)</option>
              <option value="partial">⚠️ Sebagian (Partial)</option>
            </select>
          </div>

          {/* Status Pengerjaan Cucian */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Status Pengerjaan
            </label>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs bg-slate-50"
            >
              <option value="all">Semua Status Cucian</option>
              <option value="queue">📋 Siap Dikerjakan</option>
              <option value="process">🧺 Sedang Diproses</option>
              <option value="ready">✨ Siap Diambil</option>
              <option value="completed">📦 Selesai / Diambil</option>
              <option value="cancelled">❌ Dibatalkan</option>
            </select>
          </div>

          {/* Filter Nama Pelanggan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Filter Nama Pelanggan
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                list="customer-names-datalist"
                placeholder="Pilih / ketik nama..."
                value={customerNameFilter}
                onChange={(e) => setCustomerNameFilter(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs bg-slate-50 placeholder:text-slate-400 placeholder:font-normal"
              />
              {customerNameFilter && (
                <button
                  type="button"
                  onClick={() => setCustomerNameFilter('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                  title="Hapus filter nama"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <datalist id="customer-names-datalist">
                {uniqueCustomerNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Baris Pencarian Cepat */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Pencarian cepat No. Nota / Invoice, No. Telepon, atau keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Keuangan (KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Omset */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Omset
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-slate-800">
            {formatRupiah(stats.totalRevenue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            {stats.count} Total Transaksi
          </p>
        </div>

        {/* Uang Masuk / Terbayar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Uang Diterima
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-emerald-600">
            {formatRupiah(stats.totalCollected)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            Pembayaran Lunas & Uang Muka
          </p>
        </div>

        {/* Piutang / Belum Lunas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Belum Lunas (Piutang)
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-amber-600">
            {formatRupiah(stats.totalPending)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            Tagihan Belum Diterima
          </p>
        </div>

        {/* Volume Cucian */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Volume Cucian
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-base sm:text-xl font-black text-slate-800">
              {stats.totalKg} <span className="text-xs font-semibold text-slate-400">kg</span>
            </p>
            <span className="text-slate-300">/</span>
            <p className="text-base sm:text-xl font-black text-slate-800">
              {stats.totalPcs} <span className="text-xs font-semibold text-slate-400">pcs</span>
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
            Kiloan & Satuan
          </p>
        </div>
      </div>

      {/* Rincian Metode Bayar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-slate-700">Rincian Pembayaran Masuk:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Tunai (Cash):</span>
            <strong className="text-slate-800 font-mono">{formatRupiah(stats.cashRevenue)}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-500">QRIS:</span>
            <strong className="text-slate-800 font-mono">{formatRupiah(stats.qrisRevenue)}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-slate-500">Transfer Bank:</span>
            <strong className="text-slate-800 font-mono">{formatRupiah(stats.transferRevenue)}</strong>
          </div>
        </div>
      </div>

      {/* Tabel Rinci Setiap Transaksi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-sm text-slate-800">
                Rincian Transaksi ({filteredOrders.length} Data)
              </h2>
              {customerNameFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <User className="w-3 h-3 text-blue-600" />
                  <span>Pelanggan: <strong>{customerNameFilter}</strong></span>
                  <button
                    type="button"
                    onClick={() => setCustomerNameFilter('')}
                    className="hover:text-blue-900 ml-0.5 p-0.5 rounded"
                    title="Hapus filter nama"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftar seluruh transaksi sesuai rentang tanggal dan kriteria filter yang dipilih
            </p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada transaksi ditemukan</p>
            <p className="text-xs text-slate-400">
              Silakan sesuaikan kembali rentang tanggal atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3.5 font-semibold">No. Nota & Waktu</th>
                  <th className="py-3 px-3.5 font-semibold">Pelanggan</th>
                  <th className="py-3 px-3.5 font-semibold">Cabang</th>
                  <th className="py-3 px-3.5 font-semibold">Rincian Cucian</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Status Cucian</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Status Bayar</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Tagihan (Rp)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Dibayar (Rp)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Sisa (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const pending = Math.max(0, order.finalAmount - order.paidAmount);
                  const isPaid = order.paymentStatus === 'paid';
                  const isPartial = order.paymentStatus === 'partial';
                  const statusInfo = ORDER_STATUS_DETAILS[order.orderStatus] || {
                    label: order.orderStatus,
                    bg: 'bg-slate-100',
                    color: 'text-slate-700',
                  };

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Invoice & Date */}
                      <td className="py-3.5 px-3.5">
                        <span className="font-mono font-bold text-slate-800 block text-xs">
                          {order.invoice}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3.5">
                        <strong className="text-slate-800 font-bold block">
                          {order.customer.name}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {order.customer.phone}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-3.5">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                          {order.outletName || (order.outletId === 'out-2' ? 'Cabang Sudirman' : 'Outlet Pusat')}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3.5 max-w-[220px]">
                        <div className="space-y-0.5">
                          {order.items.map((it, idx) => (
                            <p key={idx} className="text-[11px] text-slate-700 truncate">
                              • {it.serviceName}{' '}
                              <span className="text-slate-400 font-semibold">
                                ({it.quantity} {it.unit})
                              </span>
                            </p>
                          ))}
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Payment Status & Method */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPartial
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? 'Lunas' : isPartial ? 'Sebagian' : 'Belum Lunas'}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                          {order.paymentMethod || 'cash'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(order.finalAmount)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-600">
                        {formatRupiah(order.paidAmount)}
                      </td>

                      {/* Pending Amount */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-amber-600">
                        {pending > 0 ? formatRupiah(pending) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Footer Row */}
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={6} className="py-3.5 px-3.5 text-right uppercase tracking-wider text-xs">
                    TOTAL KESELURUHAN:
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono text-xs">
                    {formatRupiah(stats.totalRevenue)}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono text-xs text-emerald-700">
                    {formatRupiah(stats.totalCollected)}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono text-xs text-amber-700">
                    {formatRupiah(stats.totalPending)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
