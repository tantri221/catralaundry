'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLaundry } from '@/context/LaundryContext';
import {
  formatRupiah,
  ORDER_STATUS_DETAILS,
  PAYMENT_STATUS_DETAILS,
} from '@/lib/constants';
import { FormattedDate } from '@/components/FormattedDate';
import { EstimatedCompletionBadge } from '@/components/EstimatedCompletionBadge';
import { OrderStatus } from '@/types/laundry';
import {
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Shirt,
  ArrowLeft,
  Phone,
  FileText,
} from 'lucide-react';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialInvoice = searchParams.get('invoice') || '';
  const { getOrderByIdOrInvoice } = useLaundry();

  const [searchQuery, setSearchQuery] = useState(initialInvoice);
  const [searchedOrder, setSearchedOrder] = useState(() =>
    initialInvoice ? getOrderByIdOrInvoice(initialInvoice) : null
  );
  const [hasSearched, setHasSearched] = useState(Boolean(initialInvoice));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = getOrderByIdOrInvoice(searchQuery);
    setSearchedOrder(found || null);
    setHasSearched(true);
  };

  const steps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'queue', label: 'Antrean Masuk', desc: 'Pesanan diterima di kasir' },
    { status: 'washing', label: 'Proses Pencucian', desc: 'Dibersihkan dengan deterjen & pelembut' },
    { status: 'drying', label: 'Pengeringan', desc: 'Pengeringan higienis suhu terkontrol' },
    { status: 'ironing', label: 'Setrika & Finishing', desc: 'Setrika uap rapi & parfum pilihan' },
    { status: 'ready', label: 'Siap Diambil', desc: 'Sudah di-packing rapi dan wangi' },
    { status: 'completed', label: 'Selesai', desc: 'Sudah diserahkan ke pelanggan' },
  ];

  const getStepState = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
    const currentStepNum = ORDER_STATUS_DETAILS[currentStatus]?.step || 0;
    const stepNum = ORDER_STATUS_DETAILS[stepStatus]?.step || 0;

    if (currentStepNum > stepNum) return 'done';
    if (currentStepNum === stepNum) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white py-4 px-6 border-b border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Catra Laundry</span>
          </div>
        </div>
      </header>

      {/* Main Track Section */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Search Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Cek Status Laundry</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Masukkan Nomor Invoice (misal: CLB-2611-001) atau Nomor WhatsApp yang terdaftar
          </p>

          <form onSubmit={handleSearch} className="mt-5 max-w-md mx-auto flex gap-2">
            <input
              type="text"
              required
              placeholder="Contoh: CLB-2611-001 / 081234..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              Lacak
            </button>
          </form>
        </div>

        {/* Tracking Result */}
        {hasSearched && (
          <div>
            {!searchedOrder ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                <p className="text-slate-700 font-semibold text-sm">Pesanan Tidak Ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">
                  Pastikan nomor invoice atau nomor HP yang Anda masukkan sudah benar.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
                {/* Status Hero */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Nomor Resi / Invoice
                    </span>
                    <h2 className="text-xl font-black text-slate-800 font-mono">
                      {searchedOrder.invoice}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atas Nama: <strong className="text-slate-700">{searchedOrder.customer.name}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400">Status Terkini:</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          ORDER_STATUS_DETAILS[searchedOrder.orderStatus].bg
                        } ${ORDER_STATUS_DETAILS[searchedOrder.orderStatus].color} border ${
                          ORDER_STATUS_DETAILS[searchedOrder.orderStatus].border
                        }`}
                      >
                        {ORDER_STATUS_DETAILS[searchedOrder.orderStatus].label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div>
                  <h3 className="font-bold text-sm text-slate-800 mb-4">Tahapan Pengerjaan</h3>
                  <div className="space-y-4">
                    {steps.map((step, idx) => {
                      const state = getStepState(step.status, searchedOrder.orderStatus);

                      return (
                        <div key={idx} className="flex items-start gap-4">
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                state === 'done'
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : state === 'current'
                                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {state === 'done' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            {idx < steps.length - 1 && (
                              <div
                                className={`w-0.5 h-10 mt-1 ${
                                  state === 'done' ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                              />
                            )}
                          </div>

                          <div className="pt-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-xs font-bold ${
                                  state === 'done'
                                    ? 'text-slate-800'
                                    : state === 'current'
                                    ? 'text-blue-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </p>
                              {state === 'current' && (
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                  Sedang Berjalan
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Items & Summary */}
                <div className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50 p-4 rounded-xl">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Rincian Cucian
                  </h4>
                  <div className="space-y-1 text-xs">
                    {searchedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span>
                          {item.serviceName} ({item.quantity} {item.unit})
                        </span>
                        <span className="font-mono font-medium">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-xs font-bold text-slate-800">
                    <span>Total Pembayaran:</span>
                    <span className="font-mono text-blue-600">
                      {formatRupiah(searchedOrder.finalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Status Bayar:</span>
                    <span className="font-semibold text-slate-700">
                      {PAYMENT_STATUS_DETAILS[searchedOrder.paymentStatus].label}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <EstimatedCompletionBadge order={searchedOrder} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat data pelacakan...</div>}>
      <TrackContent />
    </Suspense>
  );
}
