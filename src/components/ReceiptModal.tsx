'use client';

import React from 'react';
import { Order } from '@/types/laundry';
import { formatRupiah, ORDER_STATUS_DETAILS, PAYMENT_STATUS_DETAILS } from '@/lib/constants';
import { FormattedDate } from '@/components/FormattedDate';
import { Printer, X, Tag } from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenTagModal?: (order: Order) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose, onOpenTagModal }) => {
  const { outlets, activeOutlet } = useOutlet();

  if (!order) return null;

  const orderOutlet = (order.outletId ? outlets.find((o) => o.id === order.outletId) : null) || activeOutlet;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-semibold text-slate-800 text-sm">Nota Struk Laundry</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Struk Body - Model Simpel Kompak (Contoh 1) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs text-slate-900 bg-white" id="printable-receipt">
          {/* Kop Toko / Cabang */}
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <h2 className="font-black text-sm tracking-wider uppercase text-slate-900">CATRA LAUNDRY</h2>
            <p className="text-[11px] font-bold text-slate-800 uppercase">{orderOutlet.name}</p>
            {orderOutlet.phone && (
              <p className="text-[10px] text-slate-500">WA/Telp: {orderOutlet.phone}</p>
            )}
          </div>

          {/* Info Transaksi & Pelanggan */}
          <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">No. Nota</span>
              <span className="font-bold text-slate-900 font-mono">{order.invoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Tanggal</span>
              <span className="text-slate-800"><FormattedDate date={order.createdAt} /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Pelanggan</span>
              <span className="font-bold text-slate-900 uppercase truncate max-w-[190px]">
                {order.customer.name} {order.customer.phone ? `(${order.customer.phone})` : ''}
              </span>
            </div>
            {order.customer.address && (
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-semibold shrink-0">Alamat</span>
                <span className="text-slate-700 text-right truncate max-w-[170px]">{order.customer.address}</span>
              </div>
            )}
          </div>

          {/* Rincian Pesanan (Kompak 1 Baris per Item) */}
          <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-baseline gap-2">
                <span className="truncate text-slate-800">
                  {item.serviceName} ({item.quantity} {item.unit})
                </span>
                <span className="font-mono font-bold shrink-0">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Ringkasan Biaya & Status Bayar */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon</span>
                <span>-{formatRupiah(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xs text-slate-900 pt-0.5">
              <span>TOTAL TAGIHAN</span>
              <span className="font-mono text-sm">{formatRupiah(order.finalAmount)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-xs pt-1">
              <span className="text-slate-600">STATUS BAYAR</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {order.paymentStatus === 'paid' ? '[ LUNAS ]' : '[ BELUM LUNAS / BON ]'}
              </span>
            </div>
            {order.paymentStatus !== 'paid' && order.paidAmount > 0 && (
              <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                <span>Sudah Bayar (DP)</span>
                <span>{formatRupiah(order.paidAmount)}</span>
              </div>
            )}
          </div>

          {/* Estimasi Selesai & Footer Simpel */}
          <div className="pt-2 text-center text-[10px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">
              Estimasi Selesai: <FormattedDate date={order.estimatedCompletion} />
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              {activeOutlet.footerNote || 'Bawa nota ini saat pengambilan. Terima kasih!'}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="py-2 px-3 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          {onOpenTagModal && (
            <button
              onClick={() => onOpenTagModal(order)}
              className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Cetak Label Penanda Kemasan Cucian"
            >
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Label TAG</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Nota</span>
          </button>
        </div>
      </div>
    </div>
  );
};
