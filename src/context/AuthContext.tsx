'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserAccount, AuthState } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import {
  getStaffUsersFromSupabase,
  saveStaffUserToSupabase,
  removeStaffUserFromSupabase,
  saveUserActiveSession,
  getUserActiveSession,
  clearUserActiveSession,
} from '@/lib/supabaseService';

interface AuthContextType extends AuthState {
  users: UserAccount[];
  sessionToken: string | null;
  sessionTerminatedReason: string | null;
  clearSessionTerminatedReason: () => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addUser: (userData: Omit<UserAccount, 'id'>) => { success: boolean; message?: string };
  updateUser: (id: string, updatedData: Partial<UserAccount>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };
  refreshUsers: () => Promise<void>;
}

// Master Accounts
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-superadmin',
    name: 'Super Admin Catra',
    username: 'superadmin',
    password: 'superadmin123',
    phone: '081234567890',
    role: 'superadmin',
    outletId: 'all',
    outletName: 'Semua Cabang',
    createdAt: '2026-11-01T00:00:00.000Z',
  },
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
const STORAGE_KEY_SESSION_TOKEN = 'catra_auth_session_token';
const STORAGE_KEY_USERS = 'catra_user_accounts_v5';
const STORAGE_KEY_TERMINATED = 'catra_session_terminated_reason';

function getDeviceSummary(): string {
  if (typeof window === 'undefined') return 'Perangkat';
  const ua = navigator.userAgent;
  let dev = 'Laptop / PC';
  if (/android/i.test(ua)) dev = 'HP Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) dev = 'iPhone / iPad';
  else if (/Macintosh/i.test(ua)) dev = 'MacBook / Mac';
  else if (/Windows/i.test(ua)) dev = 'Windows PC/Laptop';

  let browser = 'Browser';
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edge|edg/i.test(ua)) browser = 'Edge';

  return `${dev} (${browser})`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionTerminatedReason, setSessionTerminatedReason] = useState<string | null>(null);
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);
  const [isLoading, setIsLoading] = useState(true);

  // Restore users and session from localStorage
  useEffect(() => {
    try {
      const savedUsers =
        localStorage.getItem(STORAGE_KEY_USERS) ||
        localStorage.getItem('catra_user_accounts_v4') ||
        localStorage.getItem('catra_user_accounts_v3');

      if (savedUsers) {
        const parsed: UserAccount[] = JSON.parse(savedUsers);
        // Ensure default accounts exist if missing, and ensure superadmin has 'superadmin' role
        const merged = parsed.map((u) => {
          if (u.username.toLowerCase() === 'superadmin' || u.id === 'usr-superadmin') {
            return { ...u, role: 'superadmin' as const };
          }
          return u;
        });

        DEFAULT_USERS.forEach((defUser) => {
          if (!merged.some((u) => u.username.toLowerCase() === defUser.username.toLowerCase())) {
            merged.unshift(defUser);
          }
        });
        setUsers(merged);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
      } else {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
      }

      const savedTerminated = localStorage.getItem(STORAGE_KEY_TERMINATED);
      if (savedTerminated) {
        setSessionTerminatedReason(savedTerminated);
      }

      const savedSession = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
      let savedToken = localStorage.getItem(STORAGE_KEY_SESSION_TOKEN);

      if (savedSession) {
        const parsedSession: User = JSON.parse(savedSession);
        if (parsedSession.username?.toLowerCase() === 'superadmin' || parsedSession.id === 'usr-superadmin') {
          parsedSession.role = 'superadmin';
        }
        setUser(parsedSession);

        if (!savedToken) {
          savedToken = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
          localStorage.setItem(STORAGE_KEY_SESSION_TOKEN, savedToken);
          saveUserActiveSession(parsedSession.username, savedToken, getDeviceSummary()).catch(() => {});
        }
        setSessionToken(savedToken);
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

  const clearSessionTerminatedReason = useCallback(() => {
    setSessionTerminatedReason(null);
    try {
      localStorage.removeItem(STORAGE_KEY_TERMINATED);
    } catch {}
  }, []);

  const handleKickOut = useCallback((remoteDeviceInfo?: string) => {
    const reasonMsg = `Akun "${user?.name || user?.username || 'ini'}" baru saja login di perangkat lain (${
      remoteDeviceInfo || 'HP / Komputer lain'
    }). Demi keamanan, sistem Catra Laundry membatasi akses akun hanya untuk 1 perangkat pada saat bersamaan.`;

    setUser(null);
    setSessionToken(null);
    setSessionTerminatedReason(reasonMsg);

    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
      localStorage.removeItem(STORAGE_KEY_SESSION_TOKEN);
      localStorage.setItem(STORAGE_KEY_TERMINATED, reasonMsg);
    } catch {}
  }, [user]);

  // Single Device Enforcement: Supabase Realtime Broadcast & Polling
  useEffect(() => {
    if (!user || !sessionToken) return;

    let isSubscribed = true;

    // 1. Supabase Realtime Broadcast Channel (Instant Notification)
    const authChannel = supabase.channel('catra_auth_sessions', {
      config: { broadcast: { self: false } },
    });

    authChannel
      .on('broadcast', { event: 'session_replaced' }, (eventPayload) => {
        if (!isSubscribed) return;
        const data = eventPayload?.payload;
        if (!data) return;

        const currentCleanUser = user.username.trim().toLowerCase();
        const incomingCleanUser = String(data.username || '').trim().toLowerCase();

        // Check if other device logged in with the same username but different session token
        if (
          currentCleanUser === incomingCleanUser &&
          data.newSessionToken &&
          data.newSessionToken !== sessionToken
        ) {
          console.warn('[Auth] Realtime session replaced by:', data.deviceInfo);
          handleKickOut(data.deviceInfo);
        }
      })
      .subscribe();

    // 2. Database verification check (Persistent Cloud Check)
    const verifySessionWithDatabase = async () => {
      if (!isSubscribed || !user || !sessionToken) return;
      try {
        const remote = await getUserActiveSession(user.username);
        if (remote && remote.sessionToken && remote.sessionToken !== sessionToken) {
          console.warn('[Auth] Database check: session mismatch. Kicking out.');
          handleKickOut(remote.deviceInfo);
        }
      } catch {
        // Silently catch network errors
      }
    };

    // Verify on mount and periodically every 10 seconds
    const intervalId = setInterval(verifySessionWithDatabase, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySessionWithDatabase();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', verifySessionWithDatabase);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', verifySessionWithDatabase);
      supabase.removeChannel(authChannel);
    };
  }, [user, sessionToken, handleKickOut]);

  const saveUsersList = (updatedList: UserAccount[]) => {
    setUsers(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  };

  const login = async (usernameInput: string, passwordInput: string) => {
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

      const newSessionToken = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      const deviceInfo = getDeviceSummary();

      setUser(authUser);
      setSessionToken(newSessionToken);
      setSessionTerminatedReason(null);

      try {
        localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(authUser));
        localStorage.setItem(STORAGE_KEY_SESSION_TOKEN, newSessionToken);
        localStorage.removeItem(STORAGE_KEY_TERMINATED);

        if (matched.outletId && matched.outletId !== 'all') {
          localStorage.setItem('catra_laundry_active_outlet_id_v2', matched.outletId);
        }
      } catch {}

      // Save to Supabase Cloud & Broadcast to other devices
      try {
        await saveUserActiveSession(matched.username, newSessionToken, deviceInfo);

        const channel = supabase.channel('catra_auth_sessions');
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'session_replaced',
          payload: {
            username: matched.username,
            newSessionToken,
            deviceInfo,
          },
        });
      } catch (err) {
        console.warn('[AuthProvider] Cloud session registration error:', err);
      }

      return { success: true };
    }

    return {
      success: false,
      message: 'Username atau password salah! Silakan periksa kembali.',
    };
  };

  const logout = () => {
    if (user && sessionToken) {
      clearUserActiveSession(user.username, sessionToken).catch(() => {});
    }
    setUser(null);
    setSessionToken(null);
    setSessionTerminatedReason(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
      localStorage.removeItem(STORAGE_KEY_SESSION_TOKEN);
      localStorage.removeItem(STORAGE_KEY_TERMINATED);
    } catch {}
  };

  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const trimmedUsername = userData.username.trim().toLowerCase();

    // Hanya Super Admin yang boleh membuat akun dengan role superadmin
    if (user?.role !== 'superadmin' && (userData.role === 'superadmin' || trimmedUsername === 'superadmin')) {
      return { success: false, message: 'Hanya Super Admin yang berwenang membuat akun dengan role Super Admin!' };
    }

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
    const target = users.find((u) => u.id === id);

    // Proteksi: Hanya superadmin yang boleh mengubah akun superadmin
    if (
      (id === 'usr-superadmin' || target?.role === 'superadmin' || target?.username.toLowerCase() === 'superadmin') &&
      user?.role !== 'superadmin'
    ) {
      return { success: false, message: 'Hanya Super Admin yang berwenang mengubah akun Super Admin!' };
    }

    if (updatedData.username) {
      const trimmedUsername = updatedData.username.trim().toLowerCase();
      if (user?.role !== 'superadmin' && trimmedUsername === 'superadmin') {
        return { success: false, message: 'Username "superadmin" diproteksi oleh sistem!' };
      }
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
    const target = users.find((u) => u.id === id);
    if (
      (id === 'usr-superadmin' || target?.role === 'superadmin' || target?.username.toLowerCase() === 'superadmin') &&
      user?.role !== 'superadmin'
    ) {
      return { success: false, message: 'Hanya Super Admin yang berwenang menghapus akun Super Admin!' };
    }

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
        sessionToken,
        sessionTerminatedReason,
        clearSessionTerminatedReason,
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
