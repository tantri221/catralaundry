import { OrderStatus, PaymentStatus, Service, Order } from '@/types/laundry';

export const ORDER_STATUS_DETAILS: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; step: number; icon: string }
> = {
  queue: {
    label: 'Siap Dikerjakan',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    step: 1,
    icon: '📋',
  },
  washing: {
    label: 'Sedang Dikerjakan',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    step: 2,
    icon: '🧺',
  },
  drying: {
    label: 'Sedang Dikerjakan',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    step: 2,
    icon: '💨',
  },
  ironing: {
    label: 'Sedang Dikerjakan',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    step: 2,
    icon: '👔',
  },
  ready: {
    label: 'Siap Diambil',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    step: 3,
    icon: '✅',
  },
  completed: {
    label: 'Sudah Diambil',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    step: 4,
    icon: '📦',
  },
  cancelled: {
    label: 'Batal',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    step: 0,
    icon: '❌',
  },
};

export const PAYMENT_STATUS_DETAILS: Record<
  PaymentStatus,
  { label: string; color: string; bg: string }
> = {
  unpaid: {
    label: 'Belum Bayar (Saat Ambil)',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
  },
  partial: {
    label: 'DP Sebagian',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  paid: {
    label: 'Lunas',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
};

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Cuci + Setrika (Komplit)',
    type: 'kiloan',
    price: 7000,
    unit: 'kg',
    estimatedHours: 48,
    description: 'Cuci bersih, kering, setrika rapi & wangi (2 hari)',
  },
  {
    id: 'srv-2',
    name: 'Cuci Komplit Express',
    type: 'kiloan',
    price: 12000,
    unit: 'kg',
    estimatedHours: 24,
    description: 'Selesai 1 hari (24 jam)',
  },
  {
    id: 'srv-3',
    name: 'Cuci Lipat (Non Setrika)',
    type: 'kiloan',
    price: 5000,
    unit: 'kg',
    estimatedHours: 24,
    description: 'Cuci, kering & lipat rapi tanpa setrika',
  },
  {
    id: 'srv-4',
    name: 'Setrika Saja',
    type: 'kiloan',
    price: 4500,
    unit: 'kg',
    estimatedHours: 24,
    description: 'Hanya setrika uap + parfum wangi',
  },
  {
    id: 'srv-5',
    name: 'Bed Cover',
    type: 'satuan',
    price: 25000,
    unit: 'pcs',
    estimatedHours: 48,
    description: 'Pembersihan mendalam & plastik zip',
  },
  {
    id: 'srv-6',
    name: 'Cuci Sepatu',
    type: 'satuan',
    price: 30000,
    unit: 'pasang',
    estimatedHours: 48,
    description: 'Deep clean sol, upper & deodorizer',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    invoice: 'CTR-PST-001',
    customer: {
      id: 'cust-1',
      name: 'Rian Pratama',
      phone: '081234567890',
      address: 'Kebayoran Baru',
      totalOrders: 5,
    },
    items: [
      {
        id: 'item-1',
        serviceId: 'srv-1',
        serviceName: 'Cuci + Setrika (Komplit)',
        quantity: 4,
        unit: 'kg',
        unitPrice: 7000,
        subtotal: 28000,
        notes: 'Parfum lavender',
      },
    ],
    totalAmount: 28000,
    discount: 0,
    finalAmount: 28000,
    paidAmount: 28000,
    paymentStatus: 'paid',
    paymentMethod: 'qris',
    orderStatus: 'ready',
    createdAt: '2026-11-15T09:00:00.000Z',
    estimatedCompletion: '2026-11-16T17:00:00.000Z',
    outletId: 'out-1',
    outletName: 'Catra Laundry - Outlet Pusat',
  },
  {
    id: 'ord-102',
    invoice: 'CTR-PST-002',
    customer: {
      id: 'cust-2',
      name: 'Dimas Anggara',
      phone: '081299887766',
      address: 'Jl. Wijaya No. 10',
      totalOrders: 1,
    },
    items: [
      {
        id: 'item-2',
        serviceId: 'srv-1',
        serviceName: 'Cuci + Setrika (Komplit)',
        quantity: 5,
        unit: 'kg',
        unitPrice: 7000,
        subtotal: 35000,
      },
    ],
    totalAmount: 35000,
    discount: 0,
    finalAmount: 35000,
    paidAmount: 0,
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    orderStatus: 'queue', // Siap Dikerjakan
    createdAt: '2026-11-16T10:00:00.000Z',
    estimatedCompletion: '2026-11-18T10:00:00.000Z',
    outletId: 'out-1',
    outletName: 'Catra Laundry - Outlet Pusat',
  },
  {
    id: 'ord-103',
    invoice: 'CTR-SDR-001',
    customer: {
      id: 'cust-3',
      name: 'Ibu Siti',
      phone: '085712348899',
      address: 'Green Lake No. 8',
      totalOrders: 2,
    },
    items: [
      {
        id: 'item-3',
        serviceId: 'srv-5',
        serviceName: 'Bed Cover',
        quantity: 1,
        unit: 'pcs',
        unitPrice: 25000,
        subtotal: 25000,
      },
    ],
    totalAmount: 25000,
    discount: 0,
    finalAmount: 25000,
    paidAmount: 0,
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    orderStatus: 'washing', // Sedang Dikerjakan
    createdAt: '2026-11-16T08:30:00.000Z',
    estimatedCompletion: '2026-11-17T17:00:00.000Z',
    outletId: 'out-2',
    outletName: 'Catra Laundry - Cabang Sudirman',
  },
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function generateWhatsAppNotification(order: Order): string {
  const isReady = order.orderStatus === 'ready';
  const isQueue = order.orderStatus === 'queue';
  const isPaid = order.paymentStatus === 'paid';

  let msg = `Halo Kak *${order.customer.name}* 😊\n\n`;
  if (isReady) {
    msg += `🧺 Cucian Anda di *Catra Laundry* sudah *SELESAI & SIAP DIAMBIL*!\n\n`;
  } else if (isQueue) {
    msg += `🧺 Cucian Anda di *Catra Laundry* sudah kami terima dan saat ini *SIAP DIKERJAKAN* dalam antrean.\n\n`;
  } else {
    msg += `🧺 Update: Cucian Anda di *Catra Laundry* saat ini *SEDANG DIKERJAKAN* (dicuci/disetrika).\n\n`;
  }

  msg += `📄 *No. Nota:* ${order.invoice}\n`;
  msg += `🏷️ *Layanan:* ${order.items.map((i) => `${i.serviceName} (${i.quantity} ${i.unit})`).join(', ')}\n`;
  msg += `💰 *Total Biaya:* ${formatRupiah(order.finalAmount)}\n`;
  msg += `💳 *Status Bayar:* ${isPaid ? 'Lunas ✅' : 'Belum Lunas (Bayar saat ambil) ⏳'}\n\n`;

  if (isReady) {
    msg += `Silakan datang ke outlet Catra Laundry untuk pengambilan. Terima kasih! 🙏✨`;
  } else {
    msg += `Estimasi selesai: ${formatDateIndo(order.estimatedCompletion)}\nTerima kasih! 🙏`;
  }

  return encodeURIComponent(msg);
}
