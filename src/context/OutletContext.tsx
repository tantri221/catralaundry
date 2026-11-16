'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Outlet } from '@/types/outlet';
import {
  getOutletsFromSupabase,
  saveOutletToSupabase,
  removeOutletFromSupabase,
} from '@/lib/supabaseService';

interface OutletContextType {
  outlets: Outlet[];
  activeOutlet: Outlet;
  setActiveOutletId: (id: string) => void;
  addOutlet: (outletData: Omit<Outlet, 'id' | 'isPrimary'>) => { success: boolean; message?: string };
  updateOutlet: (id: string, updatedData: Partial<Outlet>) => { success: boolean; message?: string };
  deleteOutlet: (id: string) => { success: boolean; message?: string };
  toggleOutletStatus: (id: string) => void;
  activateAllOutlets: () => void;
  refreshOutlets: () => Promise<void>;
}

export const DEFAULT_OUTLETS: Outlet[] = [
  {
    id: 'out-1',
    name: 'Catra Laundry - Outlet Pusat',
    code: 'PST',
    address: 'Jl. Merdeka No. 10, Jakarta Pusat',
    phone: '081234567890',
    footerNote: 'Harap membawa nota ini saat pengambilan cucian.',
    isPrimary: true,
    status: 'active',
  },
  {
    id: 'out-2',
    name: 'Catra Laundry - Cabang Sudirman',
    code: 'SDR',
    address: 'Jl. Jend. Sudirman Kav. 25, Jakarta Selatan',
    phone: '081298765432',
    footerNote: 'Layanan cepat dan higienis. Terima kasih atas kunjungan Anda.',
    isPrimary: false,
    status: 'active',
  },
];

const OutletContext = createContext<OutletContextType | undefined>(undefined);

const STORAGE_KEY_OUTLETS = 'catra_laundry_outlets_v2';
const STORAGE_KEY_ACTIVE_OUTLET = 'catra_laundry_active_outlet_id_v2';

export const OutletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [outlets, setOutlets] = useState<Outlet[]>(DEFAULT_OUTLETS);
  const [activeOutletId, setActiveOutletIdState] = useState<string>('out-1');
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Load from localStorage
  useEffect(() => {
    try {
      const savedOutlets = localStorage.getItem(STORAGE_KEY_OUTLETS);
      if (savedOutlets) {
        const parsed: Outlet[] = JSON.parse(savedOutlets);
        const allActive = parsed.map((o) => ({ ...o, status: 'active' as const }));
        setOutlets(allActive);
      } else {
        localStorage.setItem(STORAGE_KEY_OUTLETS, JSON.stringify(DEFAULT_OUTLETS));
      }

      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_OUTLET);
      if (savedActiveId) {
        setActiveOutletIdState(savedActiveId);
      }
    } catch (e) {
      console.warn('Failed to parse outlets data', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Fetch from Supabase Cloud on mount
  const refreshOutlets = async () => {
    try {
      const cloudOutlets = await getOutletsFromSupabase();
      if (cloudOutlets && cloudOutlets.length > 0) {
        setOutlets(cloudOutlets);
        localStorage.setItem(STORAGE_KEY_OUTLETS, JSON.stringify(cloudOutlets));
      }
    } catch (err) {
      console.warn('[OutletProvider] Supabase sync error, using local fallback:', err);
    }
  };

  useEffect(() => {
    refreshOutlets();
  }, []);

  const saveOutlets = (list: Outlet[]) => {
    setOutlets(list);
    try {
      localStorage.setItem(STORAGE_KEY_OUTLETS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save outlets', e);
    }
  };

  const setActiveOutletId = (id: string) => {
    setActiveOutletIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_OUTLET, id);
    } catch (e) {
      console.error('Failed to save active outlet id', e);
    }
  };

  const activateAllOutlets = () => {
    const updated = outlets.map((o) => ({ ...o, status: 'active' as const }));
    saveOutlets(updated);
  };

  const toggleOutletStatus = (id: string) => {
    const updated = outlets.map((o) => {
      if (o.id === id) {
        const newStatus = (o.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive';
        const changed = { ...o, status: newStatus };
        saveOutletToSupabase(changed).catch((e) => console.warn(e));
        return changed;
      }
      return o;
    });
    saveOutlets(updated);
  };

  const activeOutlet =
    outlets.find((o) => o.id === activeOutletId) ||
    outlets.find((o) => o.isPrimary) ||
    outlets[0] ||
    DEFAULT_OUTLETS[0];

  const addOutlet = (outletData: Omit<Outlet, 'id' | 'isPrimary'>) => {
    const trimmedCode = outletData.code.trim().toUpperCase();

    if (outlets.some((o) => o.code.toUpperCase() === trimmedCode)) {
      return { success: false, message: `Kode outlet "${trimmedCode}" sudah digunakan!` };
    }

    const newOutlet: Outlet = {
      ...outletData,
      id: `out-${Date.now()}`,
      code: trimmedCode,
      status: 'active',
      isPrimary: outlets.length === 0,
    };

    const updated = [...outlets, newOutlet];
    saveOutlets(updated);
    saveOutletToSupabase(newOutlet).catch((e) => console.warn(e));
    return { success: true };
  };

  const updateOutlet = (id: string, updatedData: Partial<Outlet>) => {
    if (updatedData.code) {
      const trimmedCode = updatedData.code.trim().toUpperCase();
      if (outlets.some((o) => o.id !== id && o.code.toUpperCase() === trimmedCode)) {
        return { success: false, message: `Kode outlet "${trimmedCode}" sudah digunakan oleh cabang lain!` };
      }
    }

    let modifiedOutlet: Outlet | null = null;
    const updated = outlets.map((o) => {
      if (o.id === id) {
        modifiedOutlet = {
          ...o,
          ...updatedData,
          code: updatedData.code ? updatedData.code.trim().toUpperCase() : o.code,
        };
        return modifiedOutlet;
      }
      return o;
    });

    saveOutlets(updated);
    if (modifiedOutlet) {
      saveOutletToSupabase(modifiedOutlet).catch((e) => console.warn(e));
    }
    return { success: true };
  };

  const deleteOutlet = (id: string) => {
    if (outlets.length <= 1) {
      return { success: false, message: 'Tidak dapat menghapus satu-satunya outlet yang tersisa!' };
    }

    const target = outlets.find((o) => o.id === id);
    if (target?.isPrimary) {
      return { success: false, message: 'Tidak dapat menghapus outlet utama (pusat)!' };
    }

    const updated = outlets.filter((o) => o.id !== id);
    saveOutlets(updated);
    removeOutletFromSupabase(id).catch((e) => console.warn(e));

    if (activeOutletId === id) {
      const fallbackId = updated[0]?.id || 'out-1';
      setActiveOutletId(fallbackId);
    }

    return { success: true };
  };

  return (
    <OutletContext.Provider
      value={{
        outlets,
        activeOutlet,
        setActiveOutletId,
        addOutlet,
        updateOutlet,
        deleteOutlet,
        toggleOutletStatus,
        activateAllOutlets,
        refreshOutlets,
      }}
    >
      {children}
    </OutletContext.Provider>
  );
};

export const useOutlet = () => {
  const context = useContext(OutletContext);
  if (!context) {
    throw new Error('useOutlet must be used within an OutletProvider');
  }
  return context;
};
