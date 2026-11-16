# Catra Laundry - Sistem Manajemen & Kasir POS

Aplikasi manajemen operasional laundry modern dan kasir POS berbasis **Next.js (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS v4**.

---

## 🚀 Fitur Utama

1. **Dashboard Operasional Real-Time (`/`)**
   - KPI Harian: Total Omset Lunas, Jumlah Pesanan Aktif, Siap Diambil, dan Selesai.
   - Pipeline Operasional: Visualisasi antrean (Antrean ➔ Cuci ➔ Kering ➔ Setrika ➔ Siap Ambil).
   - Tabel transaksi terkini dengan akses cepat cetak struk dan notifikasi WhatsApp.

2. **Kasir POS Cepat (`/pos`)**
   - Input data pelanggan (Nama, WhatsApp, Alamat).
   - Kalkulasi otomatis kiloan (timbangan desimal) & satuan (pcs/pasang/meter).
   - Catatan pakaian khusus (misal: noda di kerah, luntur, dll).
   - Pilihan metode bayar: Lunas, Bayar Nanti (saat ambil), atau DP.
   - Pembayaran: Tunai (Cash), QRIS, Transfer Bank.
   - Langsung terbit nomor Invoice otomatis (`CTR-YYYYMMDD-XXX`).

3. **Cetak Nota Struk Thermal (Modal Component)**
   - Format standar thermal 58mm / 80mm.
   - Menampilkan rincian cucian, total biaya, status pembayaran, dan link cek resi.
   - Siap cetak via dialog browser / printer thermal Bluetooth & USB.

4. **Tracking & Manajemen Pesanan (`/orders`)**
   - Filter pesanan berdasarkan status: *Semua, Antrean, Cuci, Kering, Setrika, Siap Ambil, Selesai*.
   - Tombol 1-klik untuk memajukan status pengerjaan (Workflow).
   - Integrasi WhatsApp Generator: Klik ikon WA untuk langsung membuka chat WhatsApp ke pelanggan dengan pesan status cucian yang terformat rapi.

5. **Katalog Paket & Tarif (`/services`)**
   - Manajemen paket layanan Kiloan & Satuan (Reguler, Express, Kilat, Bed Cover, Sepatu, dll).
   - Pengaturan estimasi durasi jam dan harga satuan.

6. **Halaman Publik Cek Resi Pelanggan (`/track`)**
   - Pelanggan dapat melacak status cucian secara mandiri cukup dengan memasukkan Nomor Invoice atau Nomor WhatsApp.
   - Tampilan timeline pengerjaan yang bersih dan ramah smartphone.

---

## 📁 Struktur Direktori

```text
catralaundry/
├── src/
│   ├── app/
│   │   ├── (dashboard)/            # Area dashboard kasir & admin
│   │   │   ├── layout.tsx          # Layout dashboard dengan Sidebar navigasi
│   │   │   ├── page.tsx            # Halaman Dashboard Utama (KPI & Pipeline)
│   │   │   ├── pos/page.tsx        # Halaman Kasir POS
│   │   │   ├── orders/page.tsx     # Manajemen Pesanan & WhatsApp Action
│   │   │   └── services/page.tsx   # Pengaturan Layanan & Tarif
│   │   ├── track/page.tsx          # Halaman Publik Cek Status Laundry
│   │   ├── globals.css             # Konfigurasi Tailwind & Style Print Nota
│   │   └── layout.tsx              # Root Layout & State Provider
│   ├── components/
│   │   ├── Sidebar.tsx             # Navigasi utama
│   │   └── ReceiptModal.tsx        # Preview & Cetak Nota Struk Thermal
│   ├── context/
│   │   └── LaundryContext.tsx      # State management terpusat (LocalStorage sync)
│   ├── lib/
│   │   └── constants.ts            # Master data default, helper Rupiah & WA message
│   └── types/
│       └── laundry.ts              # Definisi interface TypeScript
├── package.json
└── README.md
```

---

## 💻 Cara Menjalankan

### 1. Mode Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000)

### 2. Build Produksi
```bash
npm run build
npm start
```
