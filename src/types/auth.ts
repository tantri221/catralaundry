export type UserRole = 'admin' | 'kasir';

export interface User {
  id: string;
  name: string;
  username: string;
  phone?: string;
  role: UserRole;
  outletId?: string; // ID outlet penempatan (e.g. 'out-1' or 'all')
  outletName?: string; // Nama outlet penempatan
  avatar?: string;
  createdAt?: string;
}

export interface UserAccount extends User {
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
