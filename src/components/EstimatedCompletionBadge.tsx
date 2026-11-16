'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types/laundry';
import { FormattedDate } from './FormattedDate';
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Hourglass,
} from 'lucide-react';

interface EstimatedCompletionBadgeProps {
  order: Order;
  className?: string;
}

export const EstimatedCompletionBadge: React.FC<EstimatedCompletionBadgeProps> = ({
  order,
  className = '',
}) => {
  const [now, setNow] = useState(Date.now());

  // Update relative countdown every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isProcessing =
    order.orderStatus === 'washing' ||
    order.orderStatus === 'drying' ||
    order.orderStatus === 'ironing' ||
    order.orderStatus === 'queue';
  const isReady = order.orderStatus === 'ready';
  const isCompleted = order.orderStatus === 'completed';
  const isCancelled = order.orderStatus === 'cancelled';

  // 1. Status Dibatalkan
  if (isCancelled) {
    return (
      <span
        className={`font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-rose-700 bg-rose-50 border-rose-200 text-xs ${className}`}
      >
        <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
        <span>Pengerjaan Dibatalkan ❌</span>
      </span>
    );
  }

  // 2. Status Sudah Diambil / Selesai
  if (isCompleted) {
    return (
      <span
        className={`font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-slate-700 bg-slate-100 border-slate-200 text-xs ${className}`}
      >
        <PackageCheck className="w-3.5 h-3.5 shrink-0 text-slate-500" />
        <span>Cucian Telah Diserahkan ke Pelanggan 📦</span>
      </span>
    );
  }

  // 3. Status Siap Diambil (Pengerjaan Telah Selesai)
  if (isReady) {
    return (
      <span
        className={`font-semibold inline-flex items-center flex-wrap gap-1 px-2.5 py-1 rounded-lg border text-emerald-800 bg-emerald-50 border-emerald-200 text-xs ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        <span>Pengerjaan Selesai: Siap Diambil ✅</span>
        {order.estimatedCompletion && (
          <span className="text-[11px] text-emerald-700/80 font-normal">
            (Target: <FormattedDate date={order.estimatedCompletion} />)
          </span>
        )}
      </span>
    );
  }

  // 4. Status Sedang Dikerjakan (Proses Berlangsung)
  if (isProcessing && order.estimatedCompletion) {
    const targetMs = new Date(order.estimatedCompletion).getTime();
    const diffMs = targetMs - now;

    let remainingInfo = '';
    let isUrgent = false;
    let isOverdue = false;

    if (!isNaN(targetMs)) {
      if (diffMs > 0) {
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours >= 24) {
          const days = Math.floor(hours / 24);
          const remH = hours % 24;
          remainingInfo = `Sisa ~${days} hari ${remH > 0 ? `${remH} jam` : ''}`;
        } else if (hours > 0) {
          remainingInfo = `Sisa ~${hours} jam ${minutes > 0 ? `${minutes} mnt` : ''}`;
          if (hours <= 2) isUrgent = true;
        } else {
          remainingInfo = `Sisa ~${Math.max(1, minutes)} menit`;
          isUrgent = true;
        }
      } else {
        isOverdue = true;
        const overdueMinutes = Math.floor(Math.abs(diffMs) / 60000);
        const overdueHours = Math.floor(overdueMinutes / 60);
        if (overdueHours > 0) {
          remainingInfo = `Lewat target (${overdueHours} jam lalu)`;
        } else {
          remainingInfo = 'Waktu target tercapai';
        }
      }
    }

    return (
      <span
        className={`font-semibold inline-flex items-center flex-wrap gap-1 px-2.5 py-1 rounded-lg border text-xs ${
          isOverdue
            ? 'text-rose-900 bg-rose-50 border-rose-200'
            : isUrgent
            ? 'text-amber-900 bg-amber-100 border-amber-300'
            : 'text-amber-800 bg-amber-50 border-amber-200'
        } ${className}`}
      >
        <Clock
          className={`w-3.5 h-3.5 shrink-0 ${
            isOverdue ? 'text-rose-600 animate-pulse' : 'text-amber-600'
          }`}
        />
        <span>Estimasi Selesai:</span>
        <strong className="underline decoration-dotted">
          <FormattedDate date={order.estimatedCompletion} />
        </strong>
        {remainingInfo && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-0.5 ${
              isOverdue
                ? 'bg-rose-200 text-rose-900'
                : isUrgent
                ? 'bg-amber-200 text-amber-900'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {remainingInfo}
          </span>
        )}
      </span>
    );
  }

  // Fallback jika tidak ada tanggal estimasi
  return (
    <span
      className={`font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-slate-600 bg-slate-50 border-slate-200 text-xs ${className}`}
    >
      <Hourglass className="w-3.5 h-3.5 text-slate-400" />
      <span>Dalam Antrean Proses</span>
    </span>
  );
};
