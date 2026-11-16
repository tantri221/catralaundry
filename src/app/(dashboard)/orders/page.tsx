'use client';

import React, { useState } from 'react';
import { useLaundry } from '@/context/LaundryContext';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import { FormattedDate } from '@/components/FormattedDate';
import {
  formatRupiah,
  formatDateIndo,
  ORDER_STATUS_DETAILS,
  PAYMENT_STATUS_DETAILS,
  generateWhatsAppNotification,
} from '@/lib/constants';
import { Order } from '@/types/laundry';
import { ReceiptModal } from '@/components/ReceiptModal';
import { HandoverModal } from '@/components/HandoverModal';
import {
  Search,
  MessageCircle,
  Printer,
  Shirt,
  Trash2,
  Store,
  Filter,
  Check,
  Package,
  Clock,
} from 'lucide-react';

export default function OrdersPage() {
  const { user } = useAuth();
  const { outlets } = useOutlet();
  const { orders, updateOrderStatus, updatePaymentStatus, deleteOrder } = useLaundry();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'process' | 'ready' | 'completed'>('all');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [selectedHandoverOrder, setSelectedHandoverOrder] = useState<Order | null>(null);

  const handleConfirmHandover = (options: {
    paymentMethod: 'cash' | 'qris' | 'transfer';
    cashReceived?: number;
  }) => {
    if (!selectedHandoverOrder) return;

    // 1. Update status to completed
    updateOrderStatus(selectedHandoverOrder.id, 'completed');

    // 2. Mark payment as paid
    updatePaymentStatus(selectedHandoverOrder.id, 'paid', selectedHandoverOrder.finalAmount);

    setSelectedHandoverOrder(null);
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

  const filteredOrders = scopedOrders.filter((order) => {
    if (filterTab === 'process') {
      if (
        order.orderStatus !== 'washing' &&
        order.orderStatus !== 'drying' &&
        order.orderStatus !== 'ironing' &&
        order.orderStatus !== 'queue'
      ) {
        return false;
      }
    } else if (filterTab === 'ready') {
      if (order.orderStatus !== 'ready') return false;
    } else if (filterTab === 'completed') {
      if (order.orderStatus !== 'completed') return false;
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
    ? 'Semua Cabang'
    : outlets.find((o) => o.id === adminOutletFilter)?.name || 'Cabang Terpilih';

  // Counts for each tab
  const processCount = scopedOrders.filter(
    (o) =>
      o.orderStatus === 'washing' ||
      o.orderStatus === 'drying' ||
      o.orderStatus === 'ironing' ||
      o.orderStatus === 'queue'
  ).length;
  const readyCount = scopedOrders.filter((o) => o.orderStatus === 'ready').length;
  const completedCount = scopedOrders.filter((o) => o.orderStatus === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Daftar Status Cucian
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              <span>{currentOutletName}</span>
            </span>
          </div>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            {isCashier
              ? `Kelola alur tahapan cucian khusus untuk cabang ${currentOutletName}`
              : 'Pantau cucian mulai dari proses cuci/setrika hingga siap diambil'}
          </p>
        </div>
      </div>

      {/* Admin Outlet Filter Tabs (Only for Admin) */}
      {!isCashier && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Pilih Cabang:</span>
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

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua', count: scopedOrders.length },
            { id: 'process', label: '🧺 Sedang Dikerjakan', count: processCount, badgeColor: 'bg-amber-100 text-amber-700' },
            { id: 'ready', label: '✅ Siap Diambil', count: readyCount, badgeColor: 'bg-emerald-100 text-emerald-700' },
            { id: 'completed', label: '📦 Sudah Diambil', count: completedCount, badgeColor: 'bg-slate-100 text-slate-600' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTab === tab.id ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nota atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <Shirt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">Tidak ada cucian di status ini</p>
            <p className="text-xs text-slate-400 mt-0.5">Cabang: {currentOutletName}</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isProcessing =
              order.orderStatus === 'washing' ||
              order.orderStatus === 'drying' ||
              order.orderStatus === 'ironing' ||
              order.orderStatus === 'queue';
            const isReady = order.orderStatus === 'ready';
            const isCompleted = order.orderStatus === 'completed';
            const isPaid = order.paymentStatus === 'paid';
            const branchName = order.outletName || (order.outletId === 'out-2' ? 'Cabang Sudirman' : 'Outlet Pusat');

            return (
              <div
                key={order.id}
                className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                      {order.invoice}
                    </span>
                    <span className="font-bold text-slate-900 text-base">{order.customer.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({order.customer.phone})</span>

                    {/* Outlet Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Store className="w-3 h-3 text-blue-600" />
                      <span>{branchName}</span>
                    </span>

                    {/* Status Badge */}
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

                    {/* Payment Badge */}
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
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
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

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${order.customer.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${generateWhatsAppNotification(order)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
                    title="Kirim pesan WhatsApp otomatis"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Kirim WA</span>
                  </a>

                  {/* Print */}
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                    title="Cetak Nota"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Nota</span>
                  </button>

                  {/* Workflow Advancement Buttons */}
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
                      Sudah Diambil
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Hapus nota ${order.invoice}?`)) {
                        deleteOrder(order.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

      {/* Modal Pengingat Pelunasan Pembayaran & Penyerahan */}
      <HandoverModal
        order={selectedHandoverOrder}
        onClose={() => setSelectedHandoverOrder(null)}
        onConfirm={handleConfirmHandover}
      />
    </div>
  );
}
