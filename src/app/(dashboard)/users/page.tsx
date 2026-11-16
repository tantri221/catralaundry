'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import { UserAccount, UserRole } from '@/types/auth';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle,
  X,
  Phone,
  ShieldAlert,
  ArrowLeft,
  Store,
} from 'lucide-react';
import Link from 'next/link';

export default function UsersManagementPage() {
  const { user: currentUser, users, addUser, updateUser, deleteUser } = useAuth();
  const { outlets } = useOutlet();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('kasir');
  const [selectedOutletId, setSelectedOutletId] = useState<string>(outlets[0]?.id || 'out-1');
  const [password, setPassword] = useState('');

  // Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Access Control: Only admin or superadmin can view this page
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-xs text-slate-500">
          Halaman ini khusus untuk Administrator. Akun Anda saat ini memiliki peran Kasir.
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

  // Pada menu kelola akun, yang ditampilkan HANYA akun dengan wewenang Administrator dan Kasir/Staff saja.
  // Akun Super Admin tidak ditampilkan di daftar kelola akun.
  const visibleUsers = users.filter(
    (u) =>
      (u.role === 'admin' || u.role === 'kasir') &&
      u.username.toLowerCase() !== 'superadmin' &&
      u.id !== 'usr-superadmin'
  );

  const openAddModal = () => {
    setEditingUserId(null);
    setName('');
    setUsername('');
    setPhone('');
    setRole('kasir');
    setSelectedOutletId(outlets[0]?.id || 'out-1');
    setPassword('');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (targetUser: UserAccount) => {
    if (targetUser.role === 'superadmin' || targetUser.username.toLowerCase() === 'superadmin') {
      setFeedback({ type: 'error', message: 'Akun Super Admin diproteksi dan tidak dapat diubah di sini!' });
      return;
    }
    setEditingUserId(targetUser.id);
    setName(targetUser.name);
    setUsername(targetUser.username);
    setPhone(targetUser.phone || '');
    setRole(targetUser.role === 'admin' ? 'admin' : 'kasir');
    setSelectedOutletId(targetUser.outletId || outlets[0]?.id || 'out-1');
    setPassword(''); // biarkan kosong jika tidak ingin ganti password
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanUsername = username.trim().toLowerCase();

    if (!name.trim() || !cleanUsername) {
      setFeedback({ type: 'error', message: 'Nama dan username wajib diisi!' });
      return;
    }

    if (cleanUsername === 'superadmin' || role === 'superadmin') {
      setFeedback({ type: 'error', message: 'Username atau role "superadmin" diproteksi oleh sistem!' });
      return;
    }

    if (!phone.trim()) {
      setFeedback({ type: 'error', message: 'Nomor HP / WhatsApp wajib diisi!' });
      return;
    }

    if (!editingUserId && !password.trim()) {
      setFeedback({ type: 'error', message: 'Password awal wajib diisi untuk pengguna baru!' });
      return;
    }

    // Tentukan penempatan cabang
    let assignedOutletName = 'Semua Cabang';
    if (selectedOutletId !== 'all') {
      const found = outlets.find((o) => o.id === selectedOutletId);
      if (found) assignedOutletName = found.name;
    }

    if (editingUserId) {
      // Update data pengguna
      const updatePayload: Partial<UserAccount> = {
        name,
        username: cleanUsername,
        phone: phone.trim(),
        role: role === 'admin' ? 'admin' : 'kasir',
        outletId: selectedOutletId,
        outletName: assignedOutletName,
      };
      if (password.trim()) {
        updatePayload.password = password.trim();
      }

      const res = updateUser(editingUserId, updatePayload);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Data pengguna berhasil diperbarui!' });
        setIsModalOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal memperbarui pengguna.' });
      }
    } else {
      // Tambah pengguna baru (Administrator atau Kasir/Staff)
      const res = addUser({
        name,
        username: cleanUsername,
        phone: phone.trim(),
        role: role === 'admin' ? 'admin' : 'kasir',
        outletId: selectedOutletId,
        outletName: assignedOutletName,
        password: password.trim(),
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Pengguna baru "${cleanUsername}" berhasil ditambahkan!` });
        setIsModalOpen(false);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menambahkan pengguna.' });
      }
    }
  };

  const handleDelete = (target: UserAccount) => {
    if (target.role === 'superadmin' || target.username.toLowerCase() === 'superadmin') {
      setFeedback({ type: 'error', message: 'Akun Super Admin diproteksi dan tidak dapat dihapus!' });
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun "${target.name}" (@${target.username})?`)) {
      const res = deleteUser(target.id);
      if (res.success) {
        setFeedback({ type: 'success', message: `Akun "${target.username}" telah dihapus.` });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Gagal menghapus pengguna.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Kelola Pengguna & Akun Staf
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Manajemen akun Administrator dan Kasir/Staff serta penempatan cabang operasional Catra Laundry
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Pengguna Baru</span>
        </button>
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
              <CheckCircle className="w-4 h-4 text-emerald-600" />
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

      {/* Users Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-800">
            Daftar Akun Administrator & Kasir ({visibleUsers.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Login sebagai: <strong className="text-slate-700">{currentUser?.name}</strong>{' '}
            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-blue-100 text-blue-700 border border-blue-200">
              {currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role === 'admin' ? 'Administrator' : 'Kasir'}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Pengguna</th>
                <th className="py-3 px-4 font-semibold">Username</th>
                <th className="py-3 px-4 font-semibold">Wewenang / Peran</th>
                <th className="py-3 px-4 font-semibold">Penempatan Cabang</th>
                <th className="py-3 px-4 font-semibold">No. HP / WhatsApp</th>
                <th className="py-3 px-4 font-semibold text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((item) => {
                const isCurrent = currentUser?.id === item.id;
                const isAdmin = item.role === 'admin';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isAdmin ? (
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            {item.name}
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                                Akun Anda
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">ID: {item.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-4 px-4 font-mono font-semibold text-xs text-slate-700">
                      @{item.username}
                    </td>

                    {/* Role / Wewenang */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isAdmin ? 'Administrator' : 'Kasir / Staff'}
                      </span>
                    </td>

                    {/* Branch / Outlet */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {item.outletName || (item.outletId === 'all' ? 'Semua Cabang' : 'Outlet Pusat')}
                        </span>
                      </span>
                    </td>

                    {/* Phone Number */}
                    <td className="py-4 px-4 text-xs font-mono font-medium text-slate-700">
                      {item.phone || '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Pengguna / Ubah Password"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {editingUserId ? <Edit2 className="w-4 h-4 text-blue-600" /> : <UserPlus className="w-4 h-4 text-blue-600" />}
                {editingUserId ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Nama Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rina Wahyuni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username (Untuk Login) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: rina_kasir"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Hanya huruf kecil tanpa spasi
                </span>
              </div>

              {/* No HP / WhatsApp */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. HP / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">+62</span>
                  <input
                    type="tel"
                    required
                    placeholder="81234567890"
                    value={phone.startsWith('0') ? phone.slice(1) : phone.startsWith('62') ? phone.slice(2) : phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setPhone(clean ? `0${clean}` : '');
                    }}
                    className="w-full pl-11 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono font-medium"
                  />
                </div>
              </div>

              {/* Peran / Wewenang (Role Akses) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Wewenang Akun (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('kasir')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all text-xs ${
                      role === 'kasir'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🧺 Kasir / Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center transition-all text-xs ${
                      role === 'admin'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🛡️ Administrator
                  </button>
                </div>
              </div>

              {/* Penempatan Cabang / Outlet */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Penempatan Cabang / Outlet <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold bg-white"
                  >
                    {role === 'admin' && (
                      <option value="all">🌐 Semua Cabang (Akses Seluruh Outlet)</option>
                    )}
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingUserId ? 'Password Baru (Kosongkan jika tidak ingin ganti)' : 'Password Awal'}{' '}
                  {!editingUserId && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  placeholder={editingUserId ? '••••••••' : 'Masukkan kata sandi'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
