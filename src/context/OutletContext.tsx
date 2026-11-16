'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Outlet } from '@/types/outlet';

interface OutletContextType {
  outlets: Outlet[];
  activeOutlet: Outlet;
  setActiveOutletId: (id: string) => void;
  addOutlet: (outletData: Omit<Outlet, 'id' | 'isPrimary'>) => { success: boolean; message?: string };
  updateOutlet: (id: string, updatedData: Partial<Outlet>) => { success: boolean; message?: string };
  deleteOutlet: (id: string) => { success: boolean; message?: string };
  toggleOutletStatus: (id: string) => void;
  activateAllOutlets: () => void;
}

export const DEFAULT_OUTLETS: Outlet[] = [
  {
    id: 'out-1',
    name: 'Catra Laundry - Outlet Pusat',
    code: 'PST',
    address: 'Jl. Melati No. 45, Kebayoran Baru, Jakarta Selatan',
    phone: '0812-3456-7890',
    footerNote: 'Harap bawa nota ini saat pengambilan cucian. Garansi cuci bersih & wangi.',
    isPrimary: true,
    status: 'active',
  },
  {
    id: 'out-2',
    name: 'Catra Laundry - Cabang Sudirman',
    code: 'SDR',
    address: 'Jl. Jend. Sudirman Kav. 21, Gedung Wisma Lt. 1, Jakarta Pusat',
    phone: '0857-9876-5432',
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

  useEffect(() => {
    try {
      const savedOutlets = localStorage.getItem(STORAGE_KEY_OUTLETS);
      if (savedOutlets) {
        // Ensure all loaded outlets have status: 'active'
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
        return {
          ...o,
          status: (o.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive',
        };
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
      status: 'active', // Selalu aktif secara default
      isPrimary: outlets.length === 0,
    };

    const updated = [...outlets, newOutlet];
    saveOutlets(updated);
    return { success: true };
  };

  const updateOutlet = (id: string, updatedData: Partial<Outlet>) => {
    if (updatedData.code) {
      const trimmedCode = updatedData.code.trim().toUpperCase();
      if (outlets.some((o) => o.id !== id && o.code.toUpperCase() === trimmedCode)) {
        return { success: false, message: `Kode outlet "${trimmedCode}" sudah digunakan oleh cabang lain!` };
      }
    }

    const updated = outlets.map((o) => {
      if (o.id === id) {
        return {
          ...o,
          ...updatedData,
          code: updatedData.code ? updatedData.code.trim().toUpperCase() : o.code,
        };
      }
      return o;
    });

    saveOutlets(updated);
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
