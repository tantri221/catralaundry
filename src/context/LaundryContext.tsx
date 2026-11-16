'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Service, OrderStatus, PaymentStatus } from '@/types/laundry';
import { INITIAL_ORDERS, INITIAL_SERVICES } from '@/lib/constants';

interface LaundryContextType {
  orders: Order[];
  services: Service[];
  addOrder: (newOrderData: {
    customer: { name: string; phone: string; address?: string; notes?: string };
    items: {
      serviceId: string;
      serviceName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      subtotal: number;
      notes?: string;
    }[];
    totalAmount: number;
    discount: number;
    finalAmount: number;
    paidAmount: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: 'cash' | 'qris' | 'transfer';
    estimatedHours: number;
    notes?: string;
    outletId?: string;
    outletName?: string;
    outletCode?: string;
  }) => Order;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: { estimatedCompletion?: string; notes?: string }
  ) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus, paidAmount?: number) => void;
  getOrderByIdOrInvoice: (query: string) => Order | undefined;
  addService: (service: Omit<Service, 'id'>) => void;
  deleteOrder: (orderId: string) => void;
}

const LaundryContext = createContext<LaundryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_ORDERS = 'catra_laundry_orders_v2';
const LOCAL_STORAGE_KEY_SERVICES = 'catra_laundry_services_v2';

export const LaundryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
      const savedServices = localStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);

      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
      if (savedServices) {
        setServices(JSON.parse(savedServices));
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Failed to save services to localStorage', e);
    }
  }, [services, isInitialized]);

  const addOrder: LaundryContextType['addOrder'] = (data) => {
    const timestamp = Date.now();
    const orderCount = orders.length + 1;
    const prefix = data.outletCode ? `CTR-${data.outletCode}` : 'CTR';
    const invoice = `${prefix}-${String(orderCount).padStart(3, '0')}`;

    const now = new Date();
    const estimatedCompletionDate = new Date(now.getTime() + data.estimatedHours * 60 * 60 * 1000);

    const newOrder: Order = {
      id: `ord-${timestamp}`,
      invoice,
      customer: {
        id: `cust-${timestamp}`,
        name: data.customer.name,
        phone: data.customer.phone,
        address: data.customer.address,
        notes: data.customer.notes,
        totalOrders: 1,
      },
      items: data.items.map((item, idx) => ({
        ...item,
        id: `item-${timestamp}-${idx}`,
      })),
      totalAmount: data.totalAmount,
      discount: data.discount,
      finalAmount: data.finalAmount,
      paidAmount: data.paidAmount,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      orderStatus: 'queue', // Default masuk ke 'Siap Dikerjakan'
      createdAt: now.toISOString(),
      estimatedCompletion: estimatedCompletionDate.toISOString(),
      notes: data.notes,
      outletId: data.outletId,
      outletName: data.outletName,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    options?: { estimatedCompletion?: string; notes?: string }
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.invoice === orderId) {
          return {
            ...order,
            orderStatus: status,
            estimatedCompletion: options?.estimatedCompletion || order.estimatedCompletion,
            notes: options?.notes !== undefined ? options.notes : order.notes,
            completedAt: status === 'completed' ? new Date().toISOString() : order.completedAt,
          };
        }
        return order;
      })
    );
  };

  const updatePaymentStatus = (orderId: string, status: PaymentStatus, paidAmount?: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.invoice === orderId) {
          return {
            ...order,
            paymentStatus: status,
            paidAmount:
              paidAmount !== undefined
                ? paidAmount
                : status === 'paid'
                ? order.finalAmount
                : order.paidAmount,
          };
        }
        return order;
      })
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId && o.invoice !== orderId));
  };

  const getOrderByIdOrInvoice = (query: string): Order | undefined => {
    const q = query.trim().toLowerCase();
    return orders.find(
      (order) =>
        order.id.toLowerCase() === q ||
        order.invoice.toLowerCase() === q ||
        order.customer.phone.replace(/[^0-9]/g, '') === q.replace(/[^0-9]/g, '')
    );
  };

  const addService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
  };

  return (
    <LaundryContext.Provider
      value={{
        orders,
        services,
        addOrder,
        updateOrderStatus,
        updatePaymentStatus,
        getOrderByIdOrInvoice,
        addService,
        deleteOrder,
      }}
    >
      {children}
    </LaundryContext.Provider>
  );
};

export const useLaundry = () => {
  const context = useContext(LaundryContext);
  if (!context) {
    throw new Error('useLaundry must be used within a LaundryProvider');
  }
  return context;
};
