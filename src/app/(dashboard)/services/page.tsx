'use client';

import React, { useState, useMemo } from 'react';
import { useLaundry } from '@/context/LaundryContext';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah } from '@/lib/constants';
import { Service, ServiceType } from '@/types/laundry';
import {
  Shirt,
  Plus,
  Clock,
  Tag,
  ShieldAlert,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  const { user } = useAuth();
  const { services, addService, updateService, deleteService } = useLaundry();

  // Access Control: Only admin & superadmin can manage services & prices
  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
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

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'kiloan' | 'satuan'>('all');

  // Modal State (Used for both Create and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<ServiceType>('kiloan');
  const [price, setPrice] = useState<number>(0);
  const [unit, setUnit] = useState<'kg' | 'pcs' | 'meter' | 'pasang'>('kg');
  const [estimatedHours, setEstimatedHours] = useState<number>(24);
  const [description, setDescription] = useState('');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Open Create Modal
  const openAddModal = () => {
    setEditingServiceId(null);
    setName('');
    setType('kiloan');
    setPrice(0);
    setUnit('kg');
    setEstimatedHours(24);
    setDescription('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (service: Service) => {
    setEditingServiceId(service.id);
    setName(service.name);
    setType(service.type);
    setPrice(service.price);
    setUnit(service.unit);
    setEstimatedHours(service.estimatedHours);
    setDescription(service.description || '');
    setIsModalOpen(true);
  };

  // Handle Submit Form (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Nama layanan wajib diisi!' });
      return;
    }
    if (price <= 0) {
      setFeedback({ type: 'error', message: 'Tarif harga harus lebih dari Rp 0!' });
      return;
    }

    if (editingServiceId) {
      // Update existing service
      updateService({
        id: editingServiceId,
        name: name.trim(),
        type,
        price,
        unit,
        estimatedHours,
        description: description.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Paket layanan "${name.trim()}" berhasil diperbarui!`,
      });
    } else {
      // Add new service
      addService({
        name: name.trim(),
        type,
        price,
        unit,
        estimatedHours,
        description: description.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Paket layanan baru "${name.trim()}" berhasil ditambahkan!`,
      });
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDelete = (service: Service) => {
    if (confirm(`Apakah Anda yakin ingin menghapus layanan "${service.name}"?`)) {
      deleteService(service.id);
      setFeedback({
        type: 'success',
        message: `Layanan "${service.name}" berhasil dihapus.`,
      });
    }
  };

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchSearch =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (srv.description && srv.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = filterType === 'all' || srv.type === filterType;
      return matchSearch && matchType;
    });
  }, [services, searchQuery, filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Daftar Paket Layanan</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {services.length} Layanan
            </span>
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola daftar paket layanan, tarif harga, estimasi waktu pengerjaan, dan satuan hitung untuk kasir POS
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Paket Baru
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({services.length})
          </button>
          <button
            onClick={() => setFilterType('kiloan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'kiloan'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kiloan ({services.filter((s) => s.type === 'kiloan').length})
          </button>
          <button
            onClick={() => setFilterType('satuan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'satuan'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satuan ({services.filter((s) => s.type === 'satuan').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama layanan atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <Shirt className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Layanan Ditemukan</h3>
          <p className="text-xs text-slate-400">
            {searchQuery
              ? `Tidak ditemukan layanan dengan kata kunci "${searchQuery}".`
              : 'Belum ada paket layanan pada kategori ini.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      service.type === 'kiloan'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {service.type}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    ~{service.estimatedHours} Jam
                  </span>
                </div>

                {/* Service Name & Description */}
                <div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px] line-clamp-2">
                    {service.description || 'Layanan laundry profesional Catra Laundry.'}
                  </p>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Tarif</span>
                  <p className="text-lg font-black text-blue-600 font-mono tracking-tight leading-tight">
                    {formatRupiah(service.price)}
                    <span className="text-xs text-slate-400 font-normal"> / {service.unit}</span>
                  </p>
                </div>

                {/* Action Buttons: Edit and Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(service)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Ubah Tarif / Informasi Layanan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                    title="Hapus Layanan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Layanan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingServiceId ? 'Edit Paket / Tarif Layanan' : 'Tambah Paket Layanan Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingServiceId
                      ? 'Perbarui harga atau rincian layanan yang sudah terdaftar'
                      : 'Isi detail layanan dan tarif untuk kasir POS'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Nama Layanan */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Layanan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Cuci Kering Setrika Reguler"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                  />
                </div>

                {/* Tipe Layanan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Layanan</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const t = e.target.value as ServiceType;
                      setType(t);
                      if (t === 'kiloan') {
                        setUnit('kg');
                      } else if (unit === 'kg') {
                        setUnit('pcs');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                  >
                    <option value="kiloan">Kiloan</option>
                    <option value="satuan">Satuan / Dry Clean</option>
                  </select>
                </div>

                {/* Satuan Ukuran */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Ukuran</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="pcs">pcs (Buah/Potong)</option>
                    <option value="pasang">pasang (Sepatu/Sandal)</option>
                    <option value="meter">meter (Karpet/Gorden)</option>
                  </select>
                </div>

                {/* Tarif Harga */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tarif Harga (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="500"
                      placeholder="0"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Estimasi Jam */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Selesai (Jam)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      Jam
                    </span>
                  </div>
                </div>

                {/* Deskripsi Singkat */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deskripsi Singkat (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Proses cuci higienis dengan deterjen premium dan pewangi tahan lama"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
                >
                  {editingServiceId ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
