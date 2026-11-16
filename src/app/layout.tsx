import type { Metadata } from 'next';
import './globals.css';
import { LaundryProvider } from '@/context/LaundryContext';
import { AuthProvider } from '@/context/AuthContext';
import { OutletProvider } from '@/context/OutletContext';

export const metadata: Metadata = {
  title: 'Catra Laundry - Sistem Manajemen & Kasir POS',
  description: 'Aplikasi manajemen operasional dan kasir POS modern untuk Catra Laundry',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased font-sans" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <OutletProvider>
            <LaundryProvider>{children}</LaundryProvider>
          </OutletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
