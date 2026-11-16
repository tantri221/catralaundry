'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types/laundry';
import { formatDateIndo } from '@/lib/constants';
import {
  Clock,
  Play,
  X,
  Store,
} from 'lucide-react';

interface StartProcessingModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (options: { estimatedCompletion: string; notes?: string }) => void;
}

export const StartProcessingModal: React.FC<StartProcessingModalProps> = ({
  order,
  onClose,
  onConfirm,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(24);
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [processNotes, setProcessNotes] = useState<string>('');

  // Initialize default date based on selectedHours
  useEffect(() => {
    if (!order) return;
    const now = new Date();
    const target = new Date(now.getTime() + selectedHours * 60 * 60 * 1000);

    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');
    setCustomDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);

    if (order.notes) {
      setProcessNotes(order.notes);
    } else {
      setProcessNotes('');
    }
  }, [order, selectedHours]);

  if (!order) return null;

  const handleSelectPreset = (hours: number) => {
    setSelectedHours(hours);
    setIsCustomMode(false);
    const now = new Date();
    const target = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    setCustomDateTime(`${year}-${month}-${day}T${h}:${m}`);
  };

  const handleCustomDateTimeChange = (val: string) => {
    setCustomDateTime(val);
    setIsCustomMode(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDateTime) {
      alert('Mohon tentukan estimasi waktu selesai!');
      return;
    }

    const isoDate = new Date(customDateTime).toISOString();
    onConfirm({
      estimatedCompletion: isoDate,
      notes: processNotes.trim() || undefined,
    });
  };

  const presets = [
    { label: '⚡ 3 Jam (Kilat)', hours: 3 },
    { label: '🚀 6 Jam (Express)', hours: 6 },
    { label: '⏳ 24 Jam (1 Hari)', hours: 24 },
    { label: '📅 48 Jam (2 Hari)', hours: 48 },
    { label: '📆 72 Jam (3 Hari)', hours: 72 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Play className="w-4 h-4 fill-current text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Mulai Pengerjaan Cucian</h3>
              <p className="text-[11px] text-blue-200">Tentukan estimasi waktu cucian selesai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Order Details Brief */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200">
                {order.invoice}
              </span>
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.outletName || 'Outlet Pusat'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <div>
                <p className="font-bold text-slate-800">{order.customer.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{order.customer.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[11px]">Total Cucian:</p>
                <p className="font-bold text-blue-600">
                  {order.items.map((i) => `${i.serviceName} (${i.quantity} ${i.unit})`).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs">
              1. Pilih Durasi Pengerjaan Cepat:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p) => {
                const isSelected = !isCustomMode && selectedHours === p.hours;
                return (
                  <button
                    type="button"
                    key={p.hours}
                    onClick={() => handleSelectPreset(p.hours)}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date & Time Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs">
                2. Tanggal & Jam Estimasi Selesai:
              </label>
              <span className="text-[10px] text-slate-400">Bisa diubah manual</span>
            </div>

            <div className="relative">
              <input
                type="datetime-local"
                required
                value={customDateTime}
                onChange={(e) => handleCustomDateTimeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {customDateTime && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Dijanjikan selesai:{' '}
                  <strong>{formatDateIndo(new Date(customDateTime).toISOString())}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Catatan Pengerjaan (Mesin/Operator) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 text-xs">
              3. Catatan Pengerjaan (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Mesin No. 2, Cuci lembut, Parfum Lavender..."
              value={processNotes}
              onChange={(e) => setProcessNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
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
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simpan & Mulai Kerjakan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
