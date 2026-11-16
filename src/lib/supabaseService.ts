import { supabase } from './supabase';
import { Order, Service } from '@/types/laundry';
import { Outlet } from '@/types/outlet';
import { UserAccount } from '@/types/auth';

// ========================
// OUTLETS
// ========================
export async function getOutletsFromSupabase(): Promise<Outlet[] | null> {
  try {
    const { data, error } = await supabase.from('outlets').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('[Supabase] getOutlets error:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      address: row.address,
      phone: row.phone,
      isPrimary: !!row.is_headquarters,
      status: row.is_active ? 'active' : 'inactive',
      footerNote: row.footer_note || '',
    }));
  } catch (err) {
    console.warn('[Supabase] getOutlets exception:', err);
    return null;
  }
}

export async function saveOutletToSupabase(outlet: Outlet): Promise<boolean> {
  try {
    const { error } = await supabase.from('outlets').upsert({
      id: outlet.id,
      name: outlet.name,
      code: outlet.code,
      address: outlet.address,
      phone: outlet.phone,
      is_headquarters: outlet.isPrimary,
      is_active: outlet.status === 'active',
      footer_note: outlet.footerNote || null,
    });
    if (error) {
      console.warn('[Supabase] saveOutlet error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] saveOutlet exception:', err);
    return false;
  }
}

export async function removeOutletFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('outlets').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] removeOutlet error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] removeOutlet exception:', err);
    return false;
  }
}

// ========================
// SERVICES
// ========================
export async function getServicesFromSupabase(): Promise<Service[] | null> {
  try {
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('[Supabase] getServices error:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      price: Number(row.price),
      unit: row.unit,
      estimatedHours: Number(row.estimated_hours || 24),
      description: row.description || '',
    }));
  } catch (err) {
    console.warn('[Supabase] getServices exception:', err);
    return null;
  }
}

export async function saveServiceToSupabase(service: Service): Promise<boolean> {
  try {
    const { error } = await supabase.from('services').upsert({
      id: service.id,
      name: service.name,
      type: service.type,
      price: service.price,
      unit: service.unit,
      estimated_hours: service.estimatedHours,
      description: service.description || null,
    });
    if (error) {
      console.warn('[Supabase] saveService error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] saveService exception:', err);
    return false;
  }
}

export async function removeServiceFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] removeService error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] removeService exception:', err);
    return false;
  }
}

// ========================
// ORDERS
// ========================
export function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    invoice: row.invoice,
    customer: {
      id: `cust-${row.id}`,
      name: row.customer_name,
      phone: row.customer_phone,
      address: row.customer_address || undefined,
      notes: row.customer_notes || undefined,
      totalOrders: 1,
    },
    items: Array.isArray(row.items) ? row.items : [],
    totalAmount: Number(row.total_amount || 0),
    discount: Number(row.discount || 0),
    finalAmount: Number(row.final_amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    paymentStatus: row.payment_status || 'unpaid',
    paymentMethod: row.payment_method || 'cash',
    orderStatus: row.order_status || 'queue',
    createdAt: row.created_at || new Date().toISOString(),
    estimatedCompletion: row.estimated_completion || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    notes: row.notes || undefined,
    outletId: row.outlet_id || undefined,
    outletName: row.outlet_name || undefined,
  };
}

export async function getOrdersFromSupabase(): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('[Supabase] getOrders error:', error.message);
      return null;
    }
    if (!data) return null;

    return data.map(mapRowToOrder);
  } catch (err) {
    console.warn('[Supabase] getOrders exception:', err);
    return null;
  }
}

export async function saveOrderToSupabase(order: Order): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      invoice: order.invoice,
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      items: order.items,
      total_amount: order.totalAmount,
      discount: order.discount,
      final_amount: order.finalAmount,
      paid_amount: order.paidAmount,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod || 'cash',
      order_status: order.orderStatus,
      estimated_completion: order.estimatedCompletion,
      completed_at: order.completedAt || null,
      notes: order.notes || null,
      outlet_id: order.outletId || null,
      outlet_name: order.outletName || null,
      created_at: order.createdAt,
    });
    if (error) {
      console.warn('[Supabase] saveOrder error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] saveOrder exception:', err);
    return false;
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: string,
  options?: { estimatedCompletion?: string; notes?: string; completedAt?: string }
): Promise<boolean> {
  try {
    const updatePayload: any = {
      order_status: status,
    };
    if (options?.estimatedCompletion) updatePayload.estimated_completion = options.estimatedCompletion;
    if (options?.notes !== undefined) updatePayload.notes = options.notes;
    if (options?.completedAt !== undefined) updatePayload.completed_at = options.completedAt;

    const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
    if (error) {
      console.warn('[Supabase] updateOrderStatus error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] updateOrderStatus exception:', err);
    return false;
  }
}

export async function updatePaymentStatusInSupabase(
  orderId: string,
  status: string,
  paidAmount: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: status,
        paid_amount: paidAmount,
      })
      .eq('id', orderId);
    if (error) {
      console.warn('[Supabase] updatePaymentStatus error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] updatePaymentStatus exception:', err);
    return false;
  }
}

export async function removeOrderFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] removeOrder error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] removeOrder exception:', err);
    return false;
  }
}

// ========================
// USERS / STAF
// ========================
export async function getStaffUsersFromSupabase(): Promise<UserAccount[] | null> {
  try {
    const { data, error } = await supabase.from('staff_users').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('[Supabase] getStaffUsers error:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    // Filter out session and login request records that are prefixed with sess_ or login_req_ or __
    const actualUsers = data.filter(
      (row: any) =>
        !String(row.id || '').startsWith('sess_') &&
        !String(row.id || '').startsWith('login_req_') &&
        !String(row.username || '').startsWith('__')
    );

    return actualUsers.map((row: any) => ({
      id: row.id,
      username: row.username,
      password: row.password,
      name: row.full_name,
      phone: row.phone,
      role: (row.role === 'superadmin' || row.username === 'superadmin' ? 'superadmin' : row.role) as UserAccount['role'],
      outletId: row.outlet_id || 'all',
      outletName: row.outlet_id === 'out-2' ? 'Catra Laundry - Cabang Sudirman' : 'Catra Laundry - Outlet Pusat',
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[Supabase] getStaffUsers exception:', err);
    return null;
  }
}

export async function saveStaffUserToSupabase(user: UserAccount): Promise<boolean> {
  try {
    const payload = {
      id: user.id,
      username: user.username,
      password: user.password,
      full_name: user.name,
      phone: user.phone || '',
      role: user.role,
      outlet_id: user.outletId === 'all' ? null : user.outletId,
      is_active: true,
      created_at: user.createdAt || new Date().toISOString(),
    };

    let { error } = await supabase.from('staff_users').upsert(payload);

    // Fallback if DB CHECK constraint still only allows ('admin', 'kasir')
    if (error && error.code === '23514' && user.role === 'superadmin') {
      const fallbackPayload = { ...payload, role: 'admin' };
      const res = await supabase.from('staff_users').upsert(fallbackPayload);
      error = res.error;
    }

    if (error) {
      console.warn('[Supabase] saveStaffUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] saveStaffUser exception:', err);
    return false;
  }
}

export async function removeStaffUserFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('staff_users').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] removeStaffUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] removeStaffUser exception:', err);
    return false;
  }
}

// ========================
// SINGLE DEVICE SESSION MANAGEMENT
// ========================
export async function saveUserActiveSession(
  username: string,
  sessionToken: string,
  deviceInfo: string = 'Perangkat'
): Promise<boolean> {
  try {
    const cleanUser = username.trim().toLowerCase();
    const payload = {
      id: `sess_${cleanUser}`,
      username: `__sess_${cleanUser}`,
      password: sessionToken,
      full_name: deviceInfo,
      phone: '',
      role: 'kasir',
      outlet_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('staff_users').upsert(payload);
    if (error) {
      console.warn('[Supabase] saveUserActiveSession error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] saveUserActiveSession exception:', err);
    return false;
  }
}

export async function getUserActiveSession(
  username: string
): Promise<{ sessionToken: string; deviceInfo?: string } | null> {
  try {
    const cleanUser = username.trim().toLowerCase();
    const { data, error } = await supabase
      .from('staff_users')
      .select('password, full_name')
      .eq('id', `sess_${cleanUser}`)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      sessionToken: data.password,
      deviceInfo: data.full_name,
    };
  } catch {
    return null;
  }
}

export async function clearUserActiveSession(username: string, currentSessionToken?: string): Promise<boolean> {
  try {
    const cleanUser = username.trim().toLowerCase();
    if (currentSessionToken) {
      // Only clear if the remote session token matches our current token (don't clear if another device has already logged in!)
      const remote = await getUserActiveSession(cleanUser);
      if (remote && remote.sessionToken !== currentSessionToken) {
        return true; // Already taken over by newer session
      }
    }

    const { error } = await supabase.from('staff_users').delete().eq('id', `sess_${cleanUser}`);
    return !error;
  } catch {
    return false;
  }
}

// ========================
// LOGIN APPROVAL HANDSHAKE (PERANGKAT PERTAMA & PERANGKAT BARU)
// ========================
export interface LoginApprovalRequest {
  requestId: string;
  username: string;
  requestingDevice: string;
  status: 'pending' | 'approved' | 'rejected';
  newSessionToken: string;
  createdAt: number;
}

export async function createLoginApprovalRequest(
  username: string,
  requestingDevice: string,
  newSessionToken: string
): Promise<LoginApprovalRequest | null> {
  try {
    const cleanUser = username.trim().toLowerCase();
    const requestId = `req_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const reqPayload: LoginApprovalRequest = {
      requestId,
      username: cleanUser,
      requestingDevice,
      status: 'pending',
      newSessionToken,
      createdAt: Date.now(),
    };

    const dbPayload = {
      id: `login_req_${cleanUser}`,
      username: `__login_req_${cleanUser}`,
      password: JSON.stringify(reqPayload),
      full_name: requestingDevice,
      phone: '',
      role: 'kasir',
      outlet_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('staff_users').upsert(dbPayload);
    if (error) {
      console.warn('[Supabase] createLoginApprovalRequest error:', error.message);
      return null;
    }
    return reqPayload;
  } catch (err) {
    console.warn('[Supabase] createLoginApprovalRequest exception:', err);
    return null;
  }
}

export async function getLoginApprovalRequest(
  username: string
): Promise<LoginApprovalRequest | null> {
  try {
    const cleanUser = username.trim().toLowerCase();
    const { data, error } = await supabase
      .from('staff_users')
      .select('password')
      .eq('id', `login_req_${cleanUser}`)
      .single();

    if (error || !data || !data.password) return null;
    return JSON.parse(data.password) as LoginApprovalRequest;
  } catch {
    return null;
  }
}

export async function respondLoginApprovalRequest(
  username: string,
  requestId: string,
  status: 'approved' | 'rejected',
  newSessionToken?: string
): Promise<boolean> {
  try {
    const cleanUser = username.trim().toLowerCase();
    const current = await getLoginApprovalRequest(cleanUser);
    if (!current || current.requestId !== requestId) return false;

    current.status = status;
    if (newSessionToken) {
      current.newSessionToken = newSessionToken;
    }

    const { error } = await supabase
      .from('staff_users')
      .update({ password: JSON.stringify(current) })
      .eq('id', `login_req_${cleanUser}`);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteLoginApprovalRequest(username: string): Promise<boolean> {
  try {
    const cleanUser = username.trim().toLowerCase();
    const { error } = await supabase
      .from('staff_users')
      .delete()
      .eq('id', `login_req_${cleanUser}`);
    return !error;
  } catch {
    return false;
  }
}
