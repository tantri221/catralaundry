export type OrderStatus =
  | 'queue'       // Menunggu Antrean
  | 'washing'     // Sedang Dicuci
  | 'drying'      // Pengeringan
  | 'ironing'     // Sedang Disetrika
  | 'ready'       // Siap Diambil / Diantar
  | 'completed'   // Selesai (Sudah Diterima)
  | 'cancelled';  // Dibatalkan

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type ServiceType = 'kiloan' | 'satuan';

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  price: number;
  unit: 'kg' | 'pcs' | 'meter' | 'pasang';
  estimatedHours: number;
  description?: string;
  iconName?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  totalOrders?: number;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number; // kg or pcs
  unit: string;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  invoice: string;
  customer: Customer;
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'qris' | 'transfer' | 'bon';
  orderStatus: OrderStatus;
  createdAt: string;
  estimatedCompletion: string;
  completedAt?: string;
  notes?: string;
  outletId?: string;
  outletName?: string;
}

export interface LaundryStats {
  todayRevenue: number;
  activeOrders: number;
  readyToPickup: number;
  completedToday: number;
}
