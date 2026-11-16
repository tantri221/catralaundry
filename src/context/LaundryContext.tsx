'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Service, OrderStatus, PaymentStatus } from '@/types/laundry';
import { INITIAL_ORDERS, INITIAL_SERVICES } from '@/lib/constants';
import {
  getOrdersFromSupabase,
  saveOrderToSupabase,
  updateOrderStatusInSupabase,
  updatePaymentStatusInSupabase,
  removeOrderFromSupabase,
  getServicesFromSupabase,
  saveServiceToSupabase,
  removeServiceFromSupabase,
  mapRowToOrder,
} from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';

interface LaundryContextType {
  orders: Order[];
  services: Service[];
  isCloudSynced: boolean;
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
  updateService: (service: Service) => void;
  deleteService: (serviceId: string) => void;
  deleteOrder: (orderId: string) => void;
  refreshFromCloud: () => Promise<void>;
}

const LaundryContext = createContext<LaundryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_ORDERS = 'catra_laundry_orders_v3';
const LOCAL_STORAGE_KEY_SERVICES = 'catra_laundry_services_v3';

export const LaundryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // 1. Initial local restore
  useEffect(() => {
    try {
      // Clear legacy v2 cache that contained dummy orders
      localStorage.removeItem('catra_laundry_orders_v2');

      const savedOrders = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
      const savedServices = localStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);

      if (savedOrders !== null) {
        setOrders(JSON.parse(savedOrders));
      }
      if (savedServices !== null) {
        setServices(JSON.parse(savedServices));
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Fetch from Supabase Cloud on mount
  const refreshFromCloud = async () => {
    try {
      const [cloudOrders, cloudServices] = await Promise.all([
        getOrdersFromSupabase(),
        getServicesFromSupabase(),
      ]);

      // If cloudOrders is returned (even empty array [] when all orders deleted), sync with cloud
      if (cloudOrders !== null) {
        setOrders(cloudOrders);
        localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(cloudOrders));
        setIsCloudSynced(true);
      }
      if (cloudServices !== null && cloudServices.length > 0) {
        setServices(cloudServices);
        localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(cloudServices));
      }
    } catch (err) {
      console.warn('[LaundryProvider] Supabase sync error, using local fallback:', err);
    }
  };

  useEffect(() => {
    refreshFromCloud();
  }, []);

  // 3. Realtime subscription on orders
  useEffect(() => {
    const channel = supabase
      .channel('realtime:catra_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = mapRowToOrder(payload.new);
            setOrders((prev) => {
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              const next = [newOrder, ...prev];
              localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(next));
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapRowToOrder(payload.new);
            setOrders((prev) => {
              const next = prev.map((o) => (o.id === updated.id ? updated : o));
              localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(next));
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setOrders((prev) => {
                const next = prev.filter((o) => o.id !== oldId);
                localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(next));
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync to localStorage as offline cache
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
      orderStatus: 'queue',
      createdAt: now.toISOString(),
      estimatedCompletion: estimatedCompletionDate.toISOString(),
      notes: data.notes,
      outletId: data.outletId,
      outletName: data.outletName,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Save to Supabase Cloud asynchronously
    saveOrderToSupabase(newOrder).catch((err) => {
      console.warn('Failed to upload order to Supabase:', err);
    });

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    options?: { estimatedCompletion?: string; notes?: string }
  ) => {
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.invoice === orderId) {
          return {
            ...order,
            orderStatus: status,
            estimatedCompletion: options?.estimatedCompletion || order.estimatedCompletion,
            notes: options?.notes !== undefined ? options.notes : order.notes,
            completedAt: completedAt || order.completedAt,
          };
        }
        return order;
      })
    );

    // Update in Supabase
    updateOrderStatusInSupabase(orderId, status, {
      ...options,
      completedAt,
    }).catch((err) => console.warn('Supabase updateOrderStatus error:', err));
  };

  const updatePaymentStatus = (orderId: string, status: PaymentStatus, paidAmount?: number) => {
    let resolvedPaidAmount = paidAmount;
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId || order.invoice === orderId) {
          const finalPaid =
            paidAmount !== undefined
              ? paidAmount
              : status === 'paid'
              ? order.finalAmount
              : order.paidAmount;
          resolvedPaidAmount = finalPaid;
          return {
            ...order,
            paymentStatus: status,
            paidAmount: finalPaid,
          };
        }
        return order;
      })
    );

    // Update in Supabase
    if (resolvedPaidAmount !== undefined) {
      updatePaymentStatusInSupabase(orderId, status, resolvedPaidAmount).catch((err) =>
        console.warn('Supabase updatePaymentStatus error:', err)
      );
    }
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId && o.invoice !== orderId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(next));
      } catch {}
      return next;
    });
    removeOrderFromSupabase(orderId).catch((err) =>
      console.warn('Supabase removeOrder error:', err)
    );
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
    saveServiceToSupabase(newService).catch((err) =>
      console.warn('Supabase saveService error:', err)
    );
  };

  const updateService = (updatedService: Service) => {
    setServices((prev) => {
      const next = prev.map((s) => (s.id === updatedService.id ? updatedService : s));
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(next));
      } catch {}
      return next;
    });
    saveServiceToSupabase(updatedService).catch((err) =>
      console.warn('Supabase saveService update error:', err)
    );
  };

  const deleteService = (serviceId: string) => {
    setServices((prev) => {
      const next = prev.filter((s) => s.id !== serviceId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(next));
      } catch {}
      return next;
    });
    removeServiceFromSupabase(serviceId).catch((err) =>
      console.warn('Supabase removeService error:', err)
    );
  };

  return (
    <LaundryContext.Provider
      value={{
        orders,
        services,
        isCloudSynced,
        addOrder,
        updateOrderStatus,
        updatePaymentStatus,
        getOrderByIdOrInvoice,
        addService,
        updateService,
        deleteService,
        deleteOrder,
        refreshFromCloud,
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
