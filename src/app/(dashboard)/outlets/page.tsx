'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import { Outlet } from '@/types/outlet';
import {
  Store,
  Plus,
  MapPin,
  Phone,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
  ArrowLeft,
  Check,
  Zap,
  Power,
} from 'lucide-react';
import Link from 'next/link';

export default function OutletsPage() {
  const { user } = useAuth();
  const {
    outlets,
    activeOutlet,
    setActiveOutletId,
    addOutlet,
    updateOutlet,
    deleteOutlet,
    toggleOutletStatus,
    activateAllOutlets,
  } = useOutlet();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [footerNote, setFooterNote] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Feedback Alert
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Access Control: Only admin can manage outlets
  if (user?.role !== 'admin') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-xs text-slate-500">
          Pengaturan outlet dan cabang hanya dapat diakses oleh Administrator.
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

  const handleActivateAll = () => {
    activateAllOutlets();
    setFeedback({ type: 'success', message: 'Semua cabang outlet berhasil diaktifkan!' });
  };

  const openAddModal = () => {
    setEditingOutletId(null);
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
    setFooterNote('Harap bawa nota ini saat pengambilan cucian.');
    setStatus('active');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (outlet: Outlet) => {
    setEditingOutletId(outlet.id);
    setName(outlet.name);
    setCode(outlet.code);
    setAddress(outlet.address);
    setPhone(outlet.phone);
    setFooterNote(outlet.footerNote || '');
    setStatus(outlet.status);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim() || !code.trim() || !address.trim() || !phone.trim()) {
      setFeedback({ type: 'error', message: 'Nama, kode cabang, alamat, dan nomor telepon wajib diisi!' });
      return;
    }

    if (editingOutletId) {
      const res = updateOutlet(editingOutletId, {
        name,
        code: code.trim().toUpperCase(),
        address,
        phone,
        footerNote,
        status,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Data outlet berhasil diperbarui!' });
        setIsModalOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal memperbarui outlet.' });
      }
    } else {
      const res = addOutlet({
        name,
        code: code.trim().toUpperCase(),
        address,
        phone,
        footerNote,
        status: 'active',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Outlet baru "${name}" berhasil ditambahkan dan langsung aktif!` });
        setIsModalOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menambahkan outlet.' });
      }
    }
  };

  const handleDelete = (outlet: Outlet) => {
    if (confirm(`Apakah Anda yakin ingin menghapus outlet "${outlet.name}"?`)) {
      const res = deleteOutlet(outlet.id);
      if (res.success) {
        setFeedback({ type: 'success', message: `Outlet "${outlet.name}" telah dihapus.` });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menghapus outlet.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            Pengaturan Outlet & Cabang
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Semua cabang laundry dapat beroperasi secara bersamaan dan aktif melayani pelanggan
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleActivateAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all shadow-xs"
            title="Aktifkan operasional semua cabang"
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Aktifkan Semua Cabang</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Cabang</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs underline">
            Tutup
          </button>
        </div>
      )}

      {/* Top Info: Cashier Station Location */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full inline-block border border-blue-400/30">
            Cabang Operasional Kasir Saat Ini
          </span>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>{activeOutlet.name}</span>
            <span className="text-xs font-mono bg-blue-600 px-2 py-0.5 rounded">
              {activeOutlet.code}
            </span>
          </h2>
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{activeOutlet.address} • Telp: {activeOutlet.phone}</span>
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-800/80 p-3 rounded-xl border border-slate-700 max-w-sm">
          <p className="text-slate-300 font-semibold mb-0.5">💡 Informasi Multi-Cabang:</p>
          <p className="text-[11px] leading-relaxed">
            Semua cabang dapat berstatus <strong>Aktif Beroperasi</strong> secara bersamaan. Pilihan cabang di atas menentukan outlet mana yang saat ini sedang Anda layani di kasir POS & nota struk.
          </p>
        </div>
      </div>

      {/* Outlets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Daftar Seluruh Cabang ({outlets.length} Outlet)
          </h2>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {outlets.filter((o) => o.status === 'active').length} dari {outlets.length} Cabang Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {outlets.map((item) => {
            const isStationSelected = activeOutlet.id === item.id;
            const isOperationalActive = item.status === 'active';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white ${
                  isStationSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                        {item.code}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {item.name}
                          {item.isPrimary && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                              Pusat
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">Kode Cabang: {item.code}</p>
                      </div>
                    </div>

                    {/* Operational Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      {isOperationalActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Aktif Beroperasi
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          Tutup Sementara
                        </span>
                      )}

                      {isStationSelected && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Dipilih di Kasir Ini
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>{item.address}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{item.phone}</span>
                    </p>
                    {item.footerNote && (
                      <p className="flex items-start gap-2 text-[11px] text-slate-500 italic mt-1 pt-1 border-t border-slate-200/60">
                        <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span>&quot;{item.footerNote}&quot;</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  {/* Select Cashier Station */}
                  {!isStationSelected ? (
                    <button
                      onClick={() => setActiveOutletId(item.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200"
                    >
                      Pilih Melayani di Cabang Ini
                    </button>
                  ) : (
                    <span className="text-xs text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      <Check className="w-3.5 h-3.5" /> Sedang Digunakan Kasir
                    </span>
                  )}

                  {/* Status Toggle & Edit/Delete */}
                  <div className="flex items-center gap-1.5">
                    {/* Toggle Operational Status */}
                    <button
                      onClick={() => toggleOutletStatus(item.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors flex items-center gap-1 ${
                        isOperationalActive
                          ? 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={isOperationalActive ? 'Klik untuk nonaktifkan sementara' : 'Klik untuk aktifkan cabang'}
                    >
                      <Power className="w-3 h-3" />
                      <span>{isOperationalActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Cabang"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {!item.isPrimary && outlets.length > 1 && (
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Cabang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Tambah / Edit Outlet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingOutletId ? 'Ubah Data Outlet / Cabang' : 'Tambah Cabang Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Nama Outlet */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Outlet / Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Catra Laundry - Cabang Tebet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Kode Cabang */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Cabang (Singkatan 3-4 Karakter) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="Contoh: TBT / SDR / PST"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
                />
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap (Dicetak di Nota) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jl. Raya Tebet Barat No. 12, Jakarta Selatan"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* No. Telepon / WhatsApp */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812-3456-7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Catatan Kaki Nota */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Kaki Struk Nota (Footer Struk)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Harap bawa nota ini saat pengambilan. Terima kasih."
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-colors"
                >
                  {editingOutletId ? 'Simpan Perubahan' : 'Tambah Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
