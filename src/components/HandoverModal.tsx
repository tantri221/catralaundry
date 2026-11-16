'use client';

import React, { useState } from 'react';
import { Order } from '@/types/laundry';
import { formatRupiah } from '@/lib/constants';
import {
  Package,
  X,
  AlertTriangle,
  CheckCircle2,
  Banknote,
  QrCode,
  CreditCard,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface HandoverModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (options: {
    paymentMethod: 'cash' | 'qris' | 'transfer';
    cashReceived?: number;
  }) => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  order,
  onClose,
  onConfirm,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [cashAmount, setCashAmount] = useState<number>(0);

  if (!order) return null;

  const isAlreadyPaid = order.paymentStatus === 'paid';
  const remainingAmount = Math.max(0, order.finalAmount - order.paidAmount);

  // Initialize cash amount to remaining amount if not set
  const currentCash = cashAmount || remainingAmount;
  const changeAmount = Math.max(0, currentCash - remainingAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAlreadyPaid && selectedMethod === 'cash' && currentCash < remainingAmount) {
      alert(`Uang tunai yang diterima kurang! Sisa tagihan adalah ${formatRupiah(remainingAmount)}`);
      return;
    }

    onConfirm({
      paymentMethod: selectedMethod,
      cashReceived: selectedMethod === 'cash' ? currentCash : remainingAmount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            isAlreadyPaid
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : 'bg-gradient-to-r from-amber-600 to-rose-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Penyerahan Cucian ke Pelanggan</h3>
              <p className="text-[11px] text-white/80">Konfirmasi status pelunasan pembayaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Order Info Brief */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                {order.invoice}
              </span>
              <p className="font-bold text-slate-800 text-sm mt-1">{order.customer.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">{order.customer.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Total Biaya:</span>
              <p className="text-base font-black text-slate-900 font-mono">
                {formatRupiah(order.finalAmount)}
              </p>
            </div>
          </div>

          {/* Conditional Payment Reminder Alert */}
          {!isAlreadyPaid ? (
            /* Warning: Belum Lunas */
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900 leading-tight">
                    Pengingat: Tagihan Belum Lunas!
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Pastikan pelanggan telah melakukan pembayaran sebelum membawa pakaian.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Sisa Tagihan yang Wajib Diterima:</span>
                <span className="text-lg font-black text-rose-600 font-mono">
                  {formatRupiah(remainingAmount)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-slate-800 text-xs">
                  Pilih Cara Pembayaran Pelunasan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cash')}
                    className={`py-2 px-2 rounded-xl border font-bold text-center transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === 'cash'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[11px]">Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('qris')}
                    className={`py-2 px-2 rounded-xl border font-bold text-center transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === 'qris'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[11px]">QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('transfer')}
                    className={`py-2 px-2 rounded-xl border font-bold text-center transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === 'transfer'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px]">Transfer</span>
                  </button>
                </div>
              </div>

              {/* Cash Calculator if cash is chosen */}
              {selectedMethod === 'cash' && (
                <div className="space-y-2 pt-1 border-t border-amber-200">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Uang Diterima dari Pelanggan:</label>
                    <div className="relative w-36">
                      <span className="absolute left-2 top-1.5 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        min={remainingAmount}
                        step={1000}
                        value={currentCash}
                        onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-2 py-1 text-right rounded-lg border border-slate-300 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {changeAmount > 0 && (
                    <div className="flex items-center justify-between text-xs bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-800">
                      <span className="font-semibold">Uang Kembalian Pelanggan:</span>
                      <span className="font-mono font-bold text-sm">{formatRupiah(changeAmount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Success: Sudah Lunas */
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Pembayaran Sudah Lunas ✅</h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Cucian ini telah lunas ({formatRupiah(order.finalAmount)} via{' '}
                  <span className="uppercase font-semibold">{order.paymentMethod || 'Tunai'}</span>).
                  Silakan periksa kelengkapan cucian dan serahkan pakaian ke pelanggan.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md transition-all text-xs active:scale-95 ${
                isAlreadyPaid
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>
                {isAlreadyPaid ? 'Serahkan Cucian 📦' : 'Uang Diterima & Serahkan 📦'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
