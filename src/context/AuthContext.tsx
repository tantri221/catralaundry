'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserAccount, AuthState } from '@/types/auth';
import {
  getStaffUsersFromSupabase,
  saveStaffUserToSupabase,
  removeStaffUserFromSupabase,
} from '@/lib/supabaseService';

interface AuthContextType extends AuthState {
  users: UserAccount[];
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (userData: Omit<UserAccount, 'id'>) => { success: boolean; message?: string };
  updateUser: (id: string, updatedData: Partial<UserAccount>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };
  refreshUsers: () => Promise<void>;
}

// Master Accounts
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-admin',
    name: 'Administrator Catra',
    username: 'admin',
    password: 'admin123',
    phone: '081234567890',
    role: 'admin',
    outletId: 'all',
    outletName: 'Semua Cabang',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'usr-kasir',
    name: 'Kasir Outlet Pusat',
    username: 'kasir',
    password: 'kasir123',
    phone: '085712345678',
    role: 'kasir',
    outletId: 'out-1',
    outletName: 'Catra Laundry - Outlet Pusat',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY_AUTH_SESSION = 'catra_auth_user_session';
const STORAGE_KEY_USERS = 'catra_user_accounts_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);
  const [isLoading, setIsLoading] = useState(true);

  // Restore users and session from localStorage
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
      }

      const savedSession = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      }
    } catch (e) {
      console.warn('Failed to parse auth data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync users with Supabase Cloud
  const refreshUsers = async () => {
    try {
      const cloudUsers = await getStaffUsersFromSupabase();
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(cloudUsers));
      }
    } catch (err) {
      console.warn('[AuthProvider] Supabase sync error, using local fallback:', err);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const saveUsersList = (updatedList: UserAccount[]) => {
    setUsers(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  };

  const login = (usernameInput: string, passwordInput: string) => {
    const trimmedUser = usernameInput.trim().toLowerCase();
    const matched = users.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === passwordInput
    );

    if (matched) {
      const authUser: User = {
        id: matched.id,
        name: matched.name,
        username: matched.username,
        phone: matched.phone,
        role: matched.role,
        outletId: matched.outletId,
        outletName: matched.outletName,
        createdAt: matched.createdAt,
      };

      setUser(authUser);
      localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(authUser));

      if (matched.outletId && matched.outletId !== 'all') {
        try {
          localStorage.setItem('catra_laundry_active_outlet_id_v2', matched.outletId);
        } catch {}
      }

      return { success: true };
    }

    return {
      success: false,
      message: 'Username atau password salah! Silakan periksa kembali.',
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
  };

  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const trimmedUsername = userData.username.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      return { success: false, message: `Username "${userData.username}" sudah digunakan!` };
    }

    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      username: trimmedUsername,
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    saveUsersList(updated);
    saveStaffUserToSupabase(newUser).catch((e) => console.warn(e));
    return { success: true };
  };

  const updateUser = (id: string, updatedData: Partial<UserAccount>) => {
    if (updatedData.username) {
      const trimmedUsername = updatedData.username.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.username.toLowerCase() === trimmedUsername)) {
        return { success: false, message: `Username "${updatedData.username}" sudah digunakan oleh pengguna lain!` };
      }
    }

    let modifiedUser: UserAccount | null = null;
    const updated = users.map((u) => {
      if (u.id === id) {
        const merged = { ...u, ...updatedData };
        if (updatedData.username) merged.username = updatedData.username.trim().toLowerCase();
        if (user && user.id === id) {
          const updatedSessionUser: User = {
            id: merged.id,
            name: merged.name,
            username: merged.username,
            phone: merged.phone,
            role: merged.role,
            outletId: merged.outletId,
            outletName: merged.outletName,
            createdAt: merged.createdAt,
          };
          setUser(updatedSessionUser);
          localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(updatedSessionUser));
        }
        modifiedUser = merged;
        return merged;
      }
      return u;
    });

    saveUsersList(updated);
    if (modifiedUser) {
      saveStaffUserToSupabase(modifiedUser).catch((e) => console.warn(e));
    }
    return { success: true };
  };

  const deleteUser = (id: string) => {
    if (user && user.id === id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!' };
    }

    const updated = users.filter((u) => u.id !== id);
    saveUsersList(updated);
    removeStaffUserFromSupabase(id).catch((e) => console.warn(e));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
