'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLaundry } from '@/context/LaundryContext';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import { FormattedDate } from '@/components/FormattedDate';
import {
  formatRupiah,
  ORDER_STATUS_DETAILS,
  PAYMENT_STATUS_DETAILS,
  generateWhatsAppNotification,
} from '@/lib/constants';
import { Order } from '@/types/laundry';
import { ReceiptModal } from '@/components/ReceiptModal';
import { StartProcessingModal } from '@/components/StartProcessingModal';
import { HandoverModal } from '@/components/HandoverModal';
import {
  Plus,
  Search,
  MessageCircle,
  Printer,
  Shirt,
  Store,
  Filter,
  Play,
  Check,
  Package,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { outlets } = useOutlet();
  const { orders, updateOrderStatus, updatePaymentStatus } = useLaundry();
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'queue' | 'process' | 'ready'>('all');
  const [search, setSearch] = useState('');
  const [selectedProcessOrder, setSelectedProcessOrder] = useState<Order | null>(null);
  const [selectedHandoverOrder, setSelectedHandoverOrder] = useState<Order | null>(null);

  const handleConfirmHandover = (options: {
    paymentMethod: 'cash' | 'qris' | 'transfer';
    cashReceived?: number;
  }) => {
    if (!selectedHandoverOrder) return;

    // 1. Mark status as completed
    updateOrderStatus(selectedHandoverOrder.id, 'completed');

    // 2. Mark payment as paid
    updatePaymentStatus(selectedHandoverOrder.id, 'paid', selectedHandoverOrder.finalAmount);

    setSelectedHandoverOrder(null);
  };

  const handleConfirmStartProcess = (options: {
    estimatedCompletion: string;
    notes?: string;
  }) => {
    if (!selectedProcessOrder) return;

    updateOrderStatus(selectedProcessOrder.id, 'washing', {
      estimatedCompletion: options.estimatedCompletion,
      notes: options.notes,
    });

    setSelectedProcessOrder(null);
  };

  // Outlet Filter logic
  const isCashier = user?.role === 'kasir';
  const cashierOutletId = user?.outletId || 'out-1';
  const [adminOutletFilter, setAdminOutletFilter] = useState<string>('all');

  const effectiveOutletFilter = isCashier ? cashierOutletId : adminOutletFilter;

  // Filter orders by outlet first
  const scopedOrders = orders.filter((order) => {
    if (effectiveOutletFilter === 'all') return true;
    const orderBranch = order.outletId || 'out-1';
    return orderBranch === effectiveOutletFilter;
  });

  // Counts based on scoped orders
  const queueOrders = scopedOrders.filter((o) => o.orderStatus === 'queue');
  const processingOrders = scopedOrders.filter(
    (o) => o.orderStatus === 'washing' || o.orderStatus === 'drying' || o.orderStatus === 'ironing'
  );
  const readyOrders = scopedOrders.filter((o) => o.orderStatus === 'ready');
  const completedOrders = scopedOrders.filter((o) => o.orderStatus === 'completed');

  // Filter list by status tab and search
  const displayOrders = scopedOrders.filter((order) => {
    if (activeTab === 'queue') {
      if (order.orderStatus !== 'queue') return false;
    } else if (activeTab === 'process') {
      if (order.orderStatus !== 'washing' && order.orderStatus !== 'drying' && order.orderStatus !== 'ironing') return false;
    } else if (activeTab === 'ready') {
      if (order.orderStatus !== 'ready') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchInvoice = order.invoice.toLowerCase().includes(q);
      const matchName = order.customer.name.toLowerCase().includes(q);
      const matchPhone = order.customer.phone.includes(q);
      return matchInvoice || matchName || matchPhone;
    }

    return true;
  });

  const currentOutletName = isCashier
    ? user?.outletName || outlets.find((o) => o.id === cashierOutletId)?.name || 'Outlet Kasir'
    : adminOutletFilter === 'all'
    ? 'Semua Cabang (Global)'
    : outlets.find((o) => o.id === adminOutletFilter)?.name || 'Cabang Terpilih';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Action */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Selamat Datang, {user?.name} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
              <Store className="w-3 h-3" />
              <span>{currentOutletName}</span>
            </span>
          </div>
          <p className="text-slate-500 text-xs md:text-sm">
            {isCashier
              ? `Anda sedang melayani operasional cucian khusus untuk cabang ${currentOutletName}.`
              : 'Pantau dan kelola operasional seluruh cabang laundry Anda secara terpusat.'}
          </p>
        </div>

        <Link
          href="/pos"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>+ Terima Cucian Baru</span>
        </Link>
      </div>

      {/* 2. Admin Outlet Filter Selector (Only for Admin) */}
      {!isCashier && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Tampilan Berdasarkan Cabang:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setAdminOutletFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                adminOutletFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌐 Semua Cabang ({orders.length})
            </button>
            {outlets.map((o) => {
              const branchOrderCount = orders.filter((ord) => (ord.outletId || 'out-1') === o.id).length;
              return (
                <button
                  key={o.id}
                  onClick={() => setAdminOutletFilter(o.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    adminOutletFilter === o.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🏪 {o.code} ({branchOrderCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Siap Dikerjakan */}
        <button
          onClick={() => setActiveTab('queue')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'queue'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📋</span>
              <p className={`text-xs font-semibold ${activeTab === 'queue' ? 'text-indigo-100' : 'text-slate-500'}`}>
                Siap Dikerjakan
              </p>
            </div>
            <p className="text-2xl font-black mt-1">{queueOrders.length}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
          }`}>
            Lihat
          </span>
        </button>

        {/* Sedang Dikerjakan */}
        <button
          onClick={() => setActiveTab('process')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'process'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🧺</span>
              <p className={`text-xs font-semibold ${activeTab === 'process' ? 'text-amber-100' : 'text-slate-500'}`}>
                Sedang Dikerjakan
              </p>
            </div>
            <p className="text-2xl font-black mt-1">{processingOrders.length}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            activeTab === 'process' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
          }`}>
            Lihat
          </span>
        </button>

        {/* Siap Diambil */}
        <button
          onClick={() => setActiveTab('ready')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'ready'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">✅</span>
              <p className={`text-xs font-semibold ${activeTab === 'ready' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Siap Diambil
              </p>
            </div>
            <p className="text-2xl font-black mt-1">{readyOrders.length}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            activeTab === 'ready' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
          }`}>
            Lihat
          </span>
        </button>

        {/* Semua Cucian */}
        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📋</span>
              <p className={`text-xs font-semibold ${activeTab === 'all' ? 'text-blue-100' : 'text-slate-500'}`}>
                Semua Cucian
              </p>
            </div>
            <p className="text-2xl font-black mt-1">{scopedOrders.length}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            Lihat
          </span>
        </button>
      </div>

      {/* 4. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Cari cucian berdasarkan nomor nota (CTR-...) atau nama pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* 5. Orders List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800">
            {activeTab === 'queue'
              ? 'Cucian Siap Dikerjakan (Antrean Baru)'
              : activeTab === 'ready'
              ? 'Cucian Siap Diambil Pelanggan'
              : activeTab === 'process'
              ? 'Cucian Sedang Dikerjakan'
              : 'Daftar Cucian'}
            <span className="text-slate-400 font-normal ml-1">({displayOrders.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Cabang: <strong className="text-slate-700">{currentOutletName}</strong>
          </span>
        </div>

        {displayOrders.length === 0 ? (
          <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <Shirt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada cucian di status ini</p>
            <p className="text-xs text-slate-400 mt-0.5">Tekan tombol "+ Terima Cucian Baru" untuk mencatat pesanan</p>
          </div>
        ) : (
          displayOrders.map((order) => {
            const isQueue = order.orderStatus === 'queue';
            const isProcessing =
              order.orderStatus === 'washing' || order.orderStatus === 'drying' || order.orderStatus === 'ironing';
            const isReady = order.orderStatus === 'ready';
            const isCompleted = order.orderStatus === 'completed';
            const isPaid = order.paymentStatus === 'paid';
            const branchName = order.outletName || (order.outletId === 'out-2' ? 'Cabang Sudirman' : 'Outlet Pusat');

            return (
              <div
                key={order.id}
                className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Info Utama */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      {order.invoice}
                    </span>
                    <span className="font-bold text-slate-800 text-base">{order.customer.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({order.customer.phone})</span>

                    {/* Outlet Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Store className="w-3 h-3 text-blue-600" />
                      <span>{branchName}</span>
                    </span>

                    {/* Badge Status */}
                    {isQueue && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        📋 Siap Dikerjakan
                      </span>
                    )}
                    {isProcessing && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        🧺 Sedang Dikerjakan
                      </span>
                    )}
                    {isReady && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✅ Siap Diambil
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        📦 Selesai / Sudah Diambil
                      </span>
                    )}

                    {/* Badge Pembayaran */}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isPaid ? 'Lunas' : 'Belum Bayar'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-700">Layanan:</strong>{' '}
                    {order.items.map((i) => `${i.serviceName} (${i.quantity} ${i.unit})`).join(', ')}
                    {order.notes && <span className="text-amber-700 italic ml-2">Note: {order.notes}</span>}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
                    <p className="font-semibold text-slate-800">
                      Total: <span className="font-bold text-blue-600">{formatRupiah(order.finalAmount)}</span>
                    </p>
                    <p className="text-slate-400">
                      Masuk: <FormattedDate date={order.createdAt} />
                    </p>
                    {order.estimatedCompletion && (
                      <p
                        className={`font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                          isReady
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Estimasi Selesai: <FormattedDate date={order.estimatedCompletion} /></span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi Cepat */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  {/* Action 1: Kirim WA Pelanggan */}
                  <a
                    href={`https://wa.me/${order.customer.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${generateWhatsAppNotification(order)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
                    title="Kirim pesan WhatsApp otomatis"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Kirim WA</span>
                  </a>

                  {/* Action 2: Cetak Nota */}
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Cetak Nota Struk"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Nota</span>
                  </button>

                  {/* Workflow Advancement Buttons */}
                  {isQueue && (
                    <button
                      onClick={() => setSelectedProcessOrder(order)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Mulai Kerjakan 🧺</span>
                    </button>
                  )}

                  {isProcessing && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Cucian Selesai ✅</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => setSelectedHandoverOrder(order)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Serahkan ke Pelanggan 📦</span>
                    </button>
                  )}

                  {isCompleted && (
                    <span className="text-xs text-slate-400 font-medium px-2 py-1">
                      Sudah Selesai
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Cetak Nota */}
      <ReceiptModal
        order={selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />

      {/* Modal Input Estimasi Pengerjaan */}
      <StartProcessingModal
        order={selectedProcessOrder}
        onClose={() => setSelectedProcessOrder(null)}
        onConfirm={handleConfirmStartProcess}
      />

      {/* Modal Pengingat Pelunasan Pembayaran & Penyerahan */}
      <HandoverModal
        order={selectedHandoverOrder}
        onClose={() => setSelectedHandoverOrder(null)}
        onConfirm={handleConfirmHandover}
      />
    </div>
  );
}
