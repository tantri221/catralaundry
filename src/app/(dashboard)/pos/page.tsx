'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLaundry } from '@/context/LaundryContext';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import { formatRupiah } from '@/lib/constants';
import { PaymentStatus, Service, Order, ServiceType } from '@/types/laundry';
import { ReceiptModal } from '@/components/ReceiptModal';
import { PackagingTagModal } from '@/components/PackagingTagModal';
import {
  ShoppingBag,
  Plus,
  Minus,
  Printer,
  Store,
  Trash2,
  PlusCircle,
  Receipt,
  User,
  Phone,
  Check,
  Layers,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CartItem {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  estimatedHours: number;
  notes?: string;
}

export default function PosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { outlets, activeOutlet } = useOutlet();
  const { orders, services, addOrder } = useLaundry();

  const isCashier = user?.role === 'kasir';
  const cashierOutletId = user?.outletId || 'out-1';
  const [adminSelectedOutletId, setAdminSelectedOutletId] = useState<string>(activeOutlet.id);

  const operatingOutletId = isCashier ? cashierOutletId : adminSelectedOutletId;
  const operatingOutlet = outlets.find((o) => o.id === operatingOutletId) || activeOutlet;

  // Category filter for service selector
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'kiloan' | 'satuan'>('all');

  // Currently selected service to configure
  const [selectedService, setSelectedService] = useState<Service>(services[0]);
  const [quantity, setQuantity] = useState<number>(services[0]?.unit === 'kg' ? 3 : 1);
  const [itemNotes, setItemNotes] = useState('');

  // Cart for items in 1 Nota
  const [cart, setCart] = useState<CartItem[]>([]);
  const [justAddedAlert, setJustAddedAlert] = useState<string | null>(null);

  // Customer Data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Customer Directory / References extracted from order history
  interface CustomerRef {
    name: string;
    phone: string;
    address?: string;
    totalOrders: number;
  }

  const customerReferences = useMemo(() => {
    const map = new Map<string, CustomerRef>();
    const sorted = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((o) => {
      // Filter per cabang yang sedang aktif saja!
      if (operatingOutletId && o.outletId && o.outletId !== operatingOutletId) {
        return;
      }

      const rawName = o.customer?.name?.trim();
      if (!rawName) return;
      const key = rawName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.totalOrders += 1;
        if (o.customer.phone?.trim()) existing.phone = o.customer.phone.trim();
        if (o.customer.address?.trim()) existing.address = o.customer.address.trim();
      } else {
        map.set(key, {
          name: rawName,
          phone: o.customer?.phone?.trim() || '',
          address: o.customer?.address?.trim() || '',
          totalOrders: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalOrders - a.totalOrders);
  }, [orders, operatingOutletId]);

  const matchedCustomerSuggestions = useMemo(() => {
    if (!customerName.trim()) {
      return customerReferences.slice(0, 5);
    }
    const q = customerName.toLowerCase().trim();
    return customerReferences
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 6);
  }, [customerName, customerReferences]);

  const handleSelectCustomer = (cust: CustomerRef) => {
    setCustomerName(cust.name);
    if (cust.phone) setCustomerPhone(cust.phone);
    if (cust.address) setCustomerAddress(cust.address);
    setShowCustomerSuggestions(false);
  };

  // Payment
  const [isPaidNow, setIsPaidNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');

  // Receipt & Tag Modals
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [packagingTagOrder, setPackagingTagOrder] = useState<Order | null>(null);

  // Filtered services based on category tab
  const filteredServices = services.filter((srv) => {
    if (categoryFilter === 'all') return true;
    return srv.type === categoryFilter;
  });

  // Quantity stepper for selected service
  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => {
      if (selectedService?.unit === 'kg') {
        const nextVal = prev + delta;
        return Math.max(0.1, Math.round(nextVal * 10) / 10);
      } else {
        const nextVal = Math.round(prev) + delta;
        return Math.max(1, nextVal);
      }
    });
  };

  // Preview subtotal for the current service tool
  const currentItemSubtotal = Math.round(quantity * (selectedService?.price || 0));

  // Add configured service into cart
  const handleAddToCart = () => {
    if (!selectedService) return;
    if (quantity <= 0) {
      alert('Jumlah atau berat cucian harus lebih dari 0!');
      return;
    }
    if (selectedService.unit !== 'kg' && quantity < 1) {
      alert(`Minimal order untuk satuan ${selectedService.unit} adalah 1!`);
      return;
    }

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceType: selectedService.type,
      quantity: quantity,
      unit: selectedService.unit,
      unitPrice: selectedService.price,
      subtotal: currentItemSubtotal,
      estimatedHours: selectedService.estimatedHours || 24,
      notes: itemNotes.trim() || undefined,
    };

    setCart((prev) => [...prev, newItem]);
    setItemNotes('');
    setQuantity(selectedService.unit === 'kg' ? 3 : 1);

    // Feedback alert
    setJustAddedAlert(`Berhasil menambahkan "${newItem.serviceName}" ke nota!`);
    setTimeout(() => {
      setJustAddedAlert(null);
    }, 2500);
  };

  // Remove item from cart
  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  // Total amount from cart
  const cartTotalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const activeOrderTotal = cart.length > 0 ? cartTotalAmount : currentItemSubtotal;
  const currentLeadtimeHours =
    cart.length > 0
      ? Math.max(...cart.map((i) => i.estimatedHours || 24))
      : (selectedService?.estimatedHours || 24);

  // Submit order & print receipt
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Mohon masukkan nama pelanggan!');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Mohon masukkan nomor WhatsApp pelanggan!');
      return;
    }

    // Determine final items for the order
    let finalItems = [...cart];

    // If cart is empty, auto-include the configured service from the tool
    if (finalItems.length === 0) {
      if (selectedService && quantity > 0) {
        if (selectedService.unit !== 'kg' && quantity < 1) {
          alert(`Minimal order untuk satuan ${selectedService.unit} adalah 1!`);
          return;
        }
        finalItems.push({
          id: `item-${Date.now()}`,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          serviceType: selectedService.type,
          quantity: quantity,
          unit: selectedService.unit,
          unitPrice: selectedService.price,
          subtotal: currentItemSubtotal,
          estimatedHours: selectedService.estimatedHours || 24,
          notes: itemNotes.trim() || undefined,
        });
      } else {
        alert('Mohon tambahkan minimal 1 paket layanan ke dalam nota!');
        return;
      }
    }

    const orderTotal = finalItems.reduce((sum, item) => sum + item.subtotal, 0);
    const maxEstimatedHours = Math.max(...finalItems.map((i) => i.estimatedHours || 24));

    const orderData = {
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim() || undefined,
        notes: orderNotes.trim() || undefined,
      },
      items: finalItems.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        notes: item.notes,
      })),
      totalAmount: orderTotal,
      discount: 0,
      finalAmount: orderTotal,
      paidAmount: isPaidNow ? orderTotal : 0,
      paymentStatus: (isPaidNow ? 'paid' : 'unpaid') as PaymentStatus,
      paymentMethod: paymentMethod,
      estimatedHours: maxEstimatedHours,
      notes: orderNotes.trim() || undefined,
      outletId: operatingOutlet.id,
      outletName: operatingOutlet.name,
      outletCode: operatingOutlet.code,
    };

    const newOrder = addOrder(orderData);
    setCreatedOrder(newOrder);

    // Reset form & cart for next order
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setItemNotes('');
    setOrderNotes('');
    setQuantity(selectedService.unit === 'kg' ? 3 : 1);
  };

  const handleCloseReceipt = () => {
    setCreatedOrder(null);
    router.push('/');
  };

  const handleClosePackagingTag = () => {
    setPackagingTagOrder(null);
    router.push('/');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Branch Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Terima Cucian (Kasir POS)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              1 Nota Gabungan
            </span>
          </div>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Pilih paket layanan (kiloan maupun satuan), atur berat/jumlah, dan cetak menjadi 1 nota resmi.
          </p>
        </div>

        {/* Operating Outlet Indicator */}
        <div className="flex items-center gap-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs">
          <Store className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="text-left">
            <span className="text-[10px] text-slate-500 block leading-tight font-medium">Cabang Transaksi:</span>
            {!isCashier ? (
              <select
                value={adminSelectedOutletId}
                onChange={(e) => setAdminSelectedOutletId(e.target.value)}
                className="font-bold text-blue-900 bg-transparent focus:outline-none cursor-pointer text-xs"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-blue-900 text-xs">{operatingOutlet.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Inputs & Service Tool) vs Right (Cart & Nota Summary) */}
      <form onSubmit={handleSaveOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Data + Add Service Package Tool */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Data Pelanggan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Identitas Pelanggan
                </label>
              </div>
              {customerReferences.length > 0 && (
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  ✨ {customerReferences.length} Pelanggan Cabang {operatingOutlet.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nama Pelanggan dengan Smart Autocomplete Popover (Model 1) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama pelanggan..."
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowCustomerSuggestions(false), 200);
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                {/* Dropdown Popover Saran Pelanggan Lama (Model 1) */}
                {showCustomerSuggestions && matchedCustomerSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span className="truncate pr-2">Pelanggan {operatingOutlet.name} ({matchedCustomerSuggestions.length})</span>
                      <span className="text-[9px] text-blue-600 font-semibold shrink-0">Klik untuk auto-fill</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {matchedCustomerSuggestions.map((cust) => (
                        <button
                          key={cust.name + cust.phone}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCustomer(cust);
                          }}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                {cust.totalOrders}x Cuci
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {cust.phone} {cust.address ? `• ${cust.address}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            Pilih ↵
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* No WhatsApp / HP */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  No. WhatsApp / HP <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Alamat Pelanggan */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Alamat Pelanggan <span className="text-slate-400 font-normal">(Opsional / Alamat Antar-Jemput)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Melati No. 12, Banjar (atau patokan lokasi)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tool Penambah Paket Layanan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Pilih & Tambah Paket Layanan
                </label>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({services.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('kiloan')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === 'kiloan'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kiloan
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('satuan')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === 'satuan'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Satuan
                </button>
              </div>
            </div>

            {/* Service Selection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredServices.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <button
                    type="button"
                    key={srv.id}
                    onClick={() => {
                      setSelectedService(srv);
                      setQuantity(srv.unit === 'kg' ? 3 : 1);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/30 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            srv.type === 'kiloan' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {srv.type}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          • {srv.timeUnit === 'minutes' || (srv.estimatedHours > 0 && srv.estimatedHours < 1)
                            ? `${srv.estimatedDuration || Math.round(srv.estimatedHours * 60)}m`
                            : `${srv.estimatedDuration || srv.estimatedHours}j`}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-xs mt-1.5 leading-snug line-clamp-2">
                        {srv.name}
                      </p>
                    </div>
                    <p className="font-extrabold text-blue-600 text-xs mt-2 font-mono">
                      {formatRupiah(srv.price)}
                      <span className="text-[10px] font-normal text-slate-500">/{srv.unit}</span>
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected Service Tool Configuration Box */}
            {selectedService && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Atur Jumlah / Berat: <span className="text-blue-600">{selectedService.name}</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Tarif: {formatRupiah(selectedService.price)} / {selectedService.unit}
                  </span>
                </div>

                {/* Stepper + Manual Input */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(-1)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-center transition-all active:scale-90 shadow-xs"
                      title="Kurangi"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <input
                        type="number"
                        step={selectedService.unit === 'kg' ? '0.1' : '1'}
                        min={selectedService.unit === 'kg' ? '0.1' : '1'}
                        value={quantity === 0 ? '' : quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setQuantity(0);
                            return;
                          }
                          const parsed =
                            selectedService.unit === 'kg' ? parseFloat(val) : parseInt(val, 10);
                          setQuantity(isNaN(parsed) ? 0 : parsed);
                        }}
                        className="w-24 text-center text-2xl font-black text-slate-900 bg-white border border-slate-300 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-xs"
                      />
                      <span className="absolute right-2 bottom-1.5 text-[10px] font-bold text-slate-400 uppercase pointer-events-none">
                        {selectedService.unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustQuantity(1)}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-center transition-all active:scale-90 shadow-xs"
                      title="Tambah"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(selectedService.unit === 'kg' ? [3, 5, 7, 10] : [1, 2, 3, 5]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuantity(preset)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-all ${
                          quantity === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset} {selectedService.unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan Khusus Item */}
                <div>
                  <input
                    type="text"
                    placeholder={`Catatan untuk ${selectedService.name} (opsional: misal "pisahkan pakaian putih", "noda saus", "parfum ocean")...`}
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Action: Add to Cart Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-200">
                  <div className="text-left w-full sm:w-auto">
                    <span className="text-[11px] text-slate-500 block">Subtotal Paket Ini:</span>
                    <span className="text-base font-black text-slate-800 font-mono">
                      {formatRupiah(currentItemSubtotal)}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1.5">
                      ({quantity} {selectedService.unit})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Masukkan ke Nota</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notification alert on adding item */}
            {justAddedAlert && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{justAddedAlert}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Cart / Nota Items List + Payment & Print */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Nota Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Daftar Paket pada Nota</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {cart.length > 0 ? `${cart.length} Paket` : '1 Paket Siap'}
              </span>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                <ShoppingBag className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Paket di Nota</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Pilih paket layanan di sebelah kiri lalu klik tombol <strong className="text-blue-600 font-semibold">&ldquo;+ Masukkan ke Nota&rdquo;</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs transition-all hover:bg-slate-100/60"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-500 text-[10px] w-4">{idx + 1}.</span>
                        <span className="font-bold text-slate-800 text-xs">{item.serviceName}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            item.serviceType === 'kiloan' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.serviceType}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2 pl-5">
                        <span>
                          {item.quantity} {item.unit} x {formatRupiah(item.unitPrice)}
                        </span>
                        <span className="font-black text-blue-600 font-mono">
                          = {formatRupiah(item.subtotal)}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[10px] text-slate-500 italic pl-5 line-clamp-1">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus paket ini dari nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total Section */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Total 1 Nota ({cart.length > 0 ? cart.length : 1} Paket)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Cabang: <strong className="text-slate-600">{operatingOutlet.name}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 font-mono">
                    {formatRupiah(activeOrderTotal)}
                  </span>
                </div>
              </div>

              {/* Leadtime & Status Info */}
              <div className="flex items-center justify-between p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Leadtime: ~{currentLeadtimeHours < 1 && currentLeadtimeHours > 0 ? `${Math.round(currentLeadtimeHours * 60)} Menit` : `${currentLeadtimeHours} Jam`}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                  🧺 Langsung Dikerjakan
                </span>
              </div>

              {/* Status Pembayaran */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Status Pembayaran:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaidNow(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      isPaidNow
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Bayar Sekarang (Lunas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaidNow(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      !isPaidNow
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Bayar Nanti (Saat Ambil)
                  </button>
                </div>
              </div>

              {/* Payment Method (if paid now) */}
              {isPaidNow && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Metode Bayar:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['cash', 'qris', 'transfer'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {m === 'cash' ? '💵 Tunai' : m === 'qris' ? '📱 QRIS' : '🏦 Transfer'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan Keseluruhan Nota */}
              <div>
                <input
                  type="text"
                  placeholder="Catatan umum nota (opsional, misal 'diambil besok sore')..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Big Print & Save Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-98 cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                <span>Simpan & Cetak 1 Nota ({operatingOutlet.code})</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Cetak Struk / Nota */}
      <ReceiptModal
        order={createdOrder}
        onClose={handleCloseReceipt}
        onOpenTagModal={(ord) => {
          setPackagingTagOrder(ord);
          setCreatedOrder(null);
        }}
      />

      {/* Modal Cetak Label TAG Kemasan */}
      <PackagingTagModal
        order={packagingTagOrder}
        onClose={handleClosePackagingTag}
      />
    </div>
  );
}
