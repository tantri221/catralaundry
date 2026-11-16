export interface Outlet {
  id: string;
  name: string;
  code: string; // e.g. "PST", "KBY", "SDR"
  address: string;
  phone: string;
  footerNote?: string;
  isPrimary: boolean;
  status: 'active' | 'inactive';
}
