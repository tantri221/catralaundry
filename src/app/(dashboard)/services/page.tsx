'use client';

import React, { useState } from 'react';
import { useLaundry } from '@/context/LaundryContext';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah } from '@/lib/constants';
import { ServiceType } from '@/types/laundry';
import { Shirt, Plus, Clock, Tag, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  const { user } = useAuth();
  const { services, addService } = useLaundry();

  // Access Control: Only admin can manage services & prices
  if (user?.role !== 'admin') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-xs text-slate-500">
          Pengaturan daftar harga dan tarif layanan hanya dapat diakses oleh Administrator.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Add Service Form
  const [name, setName] = useState('');
  const [type, setType] = useState<ServiceType>('kiloan');
  const [price, setPrice] = useState<number>(0);
  const [unit, setUnit] = useState<'kg' | 'pcs' | 'meter' | 'pasang'>('kg');
  const [estimatedHours, setEstimatedHours] = useState<number>(24);
  const [description, setDescription] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;

    addService({
      name,
      type,
      price,
      unit,
      estimatedHours,
      description,
    });

    // Reset
    setName('');
    setPrice(0);
    setDescription('');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Paket & Tarif Layanan
          </h1>
          <p className="text-slate-500 text-sm">
            Daftar harga layanan laundry kiloan dan satuan untuk kasir POS
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          {isFormOpen ? 'Tutup Form' : 'Tambah Paket Baru'}
        </button>
      </div>

      {/* Modal / Form Add Service */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">
            Tambah Paket Layanan Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nama Layanan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Cuci Karpet Tebal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Tipe Layanan</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as ServiceType;
                  setType(t);
                  setUnit(t === 'kiloan' ? 'kg' : 'pcs');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="kiloan">Kiloan</option>
                <option value="satuan">Satuan / Dry Clean</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Harga (Rp)</label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Satuan Ukuran</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="pcs">pcs (Buah/Potong)</option>
                <option value="pasang">pasang (Sepatu/Kaos Kaki)</option>
                <option value="meter">meter (Karpet/Gorden)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Estimasi Pengerjaan (Jam)</label>
              <input
                type="number"
                min="1"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 24)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Deskripsi Singkat</label>
              <input
                type="text"
                placeholder="Penjelasan proses atau keunggulan"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Simpan Layanan
            </button>
          </div>
        </form>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    service.type === 'kiloan'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  {service.type}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  ~{service.estimatedHours} Jam
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{service.name}</h3>
              {service.description && (
                <p className="text-xs text-slate-500 mt-1">{service.description}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Tarif</span>
                <p className="text-lg font-black text-blue-600 font-mono">
                  {formatRupiah(service.price)}
                  <span className="text-xs text-slate-400 font-normal"> / {service.unit}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
