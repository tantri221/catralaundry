'use client';

import React, { useState } from 'react';
import { Order } from '@/types/laundry';
import { formatRupiah, formatDateIndo } from '@/lib/constants';
import { FormattedDate } from '@/components/FormattedDate';
import { Printer, X, Tag, Plus, Minus, MapPin, Check } from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';

interface PackagingTagModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PackagingTagModal: React.FC<PackagingTagModalProps> = ({ order, onClose }) => {
  const { outlets, activeOutlet } = useOutlet();

  // Number of packaging bags / packs for this order
  const [packCount, setPackCount] = useState<number>(1);
  const [rackLocation, setRackLocation] = useState<string>('');

  if (!order) return null;

  const orderOutlet = (order.outletId ? outlets.find((o) => o.id === order.outletId) : null) || activeOutlet;
  const isPaid = order.paymentStatus === 'paid';

  const itemsSummary = order.items
    .map((i) => `${i.serviceName} (${i.quantity} ${i.unit})`)
    .join(', ');

  const handlePrint = () => {
    window.print();
  };

  const rackPresets = ['Rak A-1', 'Rak A-2', 'Rak B-1', 'Rak B-2', 'Gantungan', 'Box'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cetak Label TAG Kemasan</h3>
              <p className="text-[11px] text-slate-500">Penanda kantong & bundling cucian di rak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Section (Hidden on Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 print:hidden text-xs">
          {/* Jumlah Kemasan / Kantong Stepper */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-700 block">Jumlah Kantong / Kemasan:</span>
              <span className="text-[11px] text-slate-500">Berapa plastik kemasan untuk nota ini?</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-300 shadow-2xs">
              <button
                type="button"
                onClick={() => setPackCount((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-90 transition-transform"
                title="Kurangi kantong"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-sm font-mono text-blue-600">
                {packCount}
              </span>
              <button
                type="button"
                onClick={() => setPackCount((prev) => Math.min(20, prev + 1))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-90 transition-transform"
                title="Tambah kantong"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lokasi / Nomor Rak */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Lokasi / Nomor Rak Simpan <span className="text-slate-400 font-normal">(Opsional)</span>:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Contoh: Rak A-02 / Hanger"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {rackPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRackLocation(preset)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    rackLocation === preset
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
              {rackLocation && (
                <button
                  type="button"
                  onClick={() => setRackLocation('')}
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Printable TAG Preview Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-100">
          <div className="max-w-[300px] mx-auto space-y-4" id="printable-packaging-tag">
            {Array.from({ length: packCount }).map((_, idx) => {
              const packIndex = idx + 1;
              return (
                <div
                  key={packIndex}
                  className="bg-white p-4 rounded-xl border-2 border-slate-800 font-mono text-xs text-slate-900 shadow-sm relative space-y-2"
                >
                  {/* Tag Header */}
                  <div className="text-center pb-2 border-b-2 border-dashed border-slate-400">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                      CATRA LAUNDRY
                    </p>
                    <p className="text-[9px] text-slate-600 uppercase font-semibold">
                      {orderOutlet.name}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-900 text-white text-[9px] font-bold tracking-widest uppercase">
                      TAG PENANDA KEMASAN
                    </span>
                  </div>

                  {/* Pack Indicator (Big Highlight) */}
                  <div className="py-1.5 px-2 bg-amber-100 border-2 border-amber-500 rounded-lg text-center text-amber-950 font-black tracking-wide text-xs">
                    ★ KANTONG {packIndex} DARI {packCount} ★
                  </div>

                  {/* Order & Customer Info */}
                  <div className="space-y-1 text-[11px] leading-tight pt-1">
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500 font-semibold">NO. NOTA:</span>
                      <span className="font-black text-sm text-blue-700">{order.invoice}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500 font-semibold">PELANGGAN:</span>
                      <span className="font-black text-sm uppercase text-slate-900 text-right truncate max-w-[150px]">
                        {order.customer.name}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500 font-semibold">NO. WA:</span>
                      <span className="font-semibold text-slate-700">{order.customer.phone}</span>
                    </div>

                    {order.customer.address && (
                      <div className="flex justify-between border-b border-slate-200 pb-1 text-[10px]">
                        <span className="text-slate-500 font-semibold shrink-0">ALAMAT:</span>
                        <span className="font-medium text-slate-700 text-right truncate max-w-[140px]">
                          {order.customer.address}
                        </span>
                      </div>
                    )}

                    {rackLocation && (
                      <div className="flex justify-between border-b border-slate-200 pb-1 bg-amber-50 px-1 py-0.5 rounded">
                        <span className="text-amber-800 font-bold">LOKASI RAK:</span>
                        <span className="font-black text-amber-900">{rackLocation.toUpperCase()}</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <span className="text-slate-500 font-semibold block text-[10px]">RINCIAN CUCIAN:</span>
                      <p className="font-bold text-slate-800 text-[11px] line-clamp-2">
                        {itemsSummary}
                      </p>
                    </div>

                    {order.notes && (
                      <div className="pt-1 text-[10px] text-purple-900">
                        <span className="font-semibold text-slate-500">CATATAN:</span> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Payment Status Highlight Box */}
                  <div className="pt-1">
                    <div
                      className={`p-1.5 rounded-lg border-2 text-center text-xs font-black uppercase tracking-wider ${
                        isPaid
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-rose-600 bg-rose-50 text-rose-800'
                      }`}
                    >
                      {isPaid ? (
                        <span>✓ LUNAS (PAID)</span>
                      ) : (
                        <span>! BELUM LUNAS / BON ! ({formatRupiah(order.finalAmount)})</span>
                      )}
                    </div>
                  </div>

                  {/* Dates & Footer Reminder */}
                  <div className="pt-1 border-t border-dashed border-slate-300 text-[9px] text-slate-500 text-center leading-snug">
                    <p>
                      Masuk: <FormattedDate date={order.createdAt} />
                    </p>
                    <p className="font-bold text-slate-700">
                      Estimasi: <FormattedDate date={order.estimatedCompletion} />
                    </p>
                    <p className="text-[8px] text-slate-400 mt-1 italic">
                      * Pastikan seluruh {packCount} kantong diserahkan saat pengambilan *
                    </p>
                  </div>

                  {/* Cut Separator between multiple tags */}
                  {packIndex < packCount && (
                    <div className="print:block pt-3 text-center text-[9px] text-slate-400 font-bold border-t border-dashed border-slate-300">
                      ✂ - - - - - - POTONG DISINI - - - - - - ✂
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak {packCount} Label TAG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
