'use client';

import React from 'react';
import { Order } from '@/types/laundry';
import { formatRupiah, ORDER_STATUS_DETAILS, PAYMENT_STATUS_DETAILS } from '@/lib/constants';
import { FormattedDate } from '@/components/FormattedDate';
import { Printer, X } from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
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

        {/* Printable Struk Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-gray-800 bg-white" id="printable-receipt">
          <div className="text-center pb-3 border-b border-dashed border-gray-400">
            <h2 className="font-bold text-base tracking-wider uppercase text-slate-900">{orderOutlet.name}</h2>
            <p className="text-[11px] text-gray-600">{orderOutlet.address}</p>
            <p className="text-[11px] text-gray-600">No. WA / Telp: {orderOutlet.phone}</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">No. Invoice:</span>
              <span className="font-bold">{order.invoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal:</span>
              <span><FormattedDate date={order.createdAt} /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pelanggan:</span>
              <span className="font-semibold">{order.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">No. Telp/WA:</span>
              <span>{order.customer.phone}</span>
            </div>
            {order.customer.address && (
              <div className="flex justify-between text-left gap-2">
                <span className="text-gray-500 shrink-0">Alamat:</span>
                <span className="font-normal text-right truncate max-w-[180px]">{order.customer.address}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>{item.serviceName}</span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>
                    {item.quantity} {item.unit} x {formatRupiah(item.unitPrice)}
                  </span>
                </div>
                {item.notes && <div className="text-[10px] italic text-gray-500">Catatan: {item.notes}</div>}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span>{formatRupiah(order.totalAmount)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon:</span>
                <span>-{formatRupiah(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
              <span>TOTAL:</span>
              <span>{formatRupiah(order.finalAmount)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">Dibayar:</span>
              <span>{formatRupiah(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-500">Status Bayar:</span>
              <span className={order.paymentStatus === 'paid' ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                {PAYMENT_STATUS_DETAILS[order.paymentStatus].label}
              </span>
            </div>
          </div>

          {/* Estimates & QR Code placeholder */}
          <div className="pt-3 text-center space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-700">
              Estimasi Selesai: <FormattedDate date={order.estimatedCompletion} />
            </p>
            <div className="p-2 border border-gray-200 rounded bg-gray-50 inline-block my-1">
              <p className="text-[9px] text-gray-500 uppercase">Cek Status Cucian:</p>
              <p className="text-[10px] font-bold text-blue-600">catralaundry.com/track/{order.invoice}</p>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              {activeOutlet.footerNote || 'Harap bawa nota ini saat pengambilan cucian.'}
              <br />
              Terima Kasih atas Kunjungan Anda!
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Nota
          </button>
        </div>
      </div>
    </div>
  );
};
