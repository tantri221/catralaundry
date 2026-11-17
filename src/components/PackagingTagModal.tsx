'use client';

import React, { useState } from 'react';
import { Order } from '@/types/laundry';
import { Printer, X, Tag, Plus, Minus } from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';

interface PackagingTagModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PackagingTagModal: React.FC<PackagingTagModalProps> = ({ order, onClose }) => {
  const { outlets, activeOutlet } = useOutlet();

  // Number of copies / tags to print
  const [packCount, setPackCount] = useState<number>(1);

  if (!order) return null;

  const orderOutlet = (order.outletId ? outlets.find((o) => o.id === order.outletId) : null) || activeOutlet;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cetak Label TAG Kemasan</h3>
              <p className="text-[11px] text-slate-500">Format simpel dengan bingkai nama</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Counter Jumlah Label (Hidden on Print) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 print:hidden text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-700 block">Jumlah Cetak Label:</span>
            <span className="text-[11px] text-slate-500">Berapa lembar label yang ingin dicetak?</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={() => setPackCount((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-90 transition-transform cursor-pointer"
              title="Kurangi"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-bold text-sm font-mono text-blue-600">
              {packCount}
            </span>
            <button
              type="button"
              onClick={() => setPackCount((prev) => Math.min(20, prev + 1))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-90 transition-transform cursor-pointer"
              title="Tambah"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Printable TAG Body - Format Pilihan B */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-100">
          <div className="max-w-[280px] mx-auto space-y-3" id="printable-packaging-tag">
            {Array.from({ length: packCount }).map((_, idx) => {
              const packIndex = idx + 1;
              return (
                <div
                  key={packIndex}
                  className="bg-white p-4 rounded-xl border-2 border-slate-900 font-mono text-slate-900 shadow-sm relative text-center space-y-3"
                >
                  {/* Kop: Nama Cabang Laundry */}
                  <div className="pb-2 border-b-2 border-dashed border-slate-400">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
                      {orderOutlet.name}
                    </p>
                  </div>

                  {/* Bingkai Nama Pelanggan (Ukuran Besar) */}
                  <div className="py-4 px-2.5 border-2 border-slate-900 rounded-lg bg-slate-50 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900 break-words leading-tight">
                      {order.customer.name}
                    </span>
                  </div>

                  {/* No. Nota */}
                  <div className="pt-2 border-t-2 border-dashed border-slate-400">
                    <p className="text-xs font-bold text-slate-700 uppercase">
                      NO. NOTA : <strong className="text-base font-black text-slate-900 tracking-wider font-mono">{order.invoice}</strong>
                    </p>
                  </div>

                  {/* Cut Separator if multiple labels */}
                  {packIndex < packCount && (
                    <div className="pt-3 text-center text-[9px] text-slate-400 font-bold border-t border-dashed border-slate-300">
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
