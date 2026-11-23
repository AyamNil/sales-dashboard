# Sales Performance Dashboard

Dashboard lokal berbasis Next.js untuk analisis data penjualan invoice-line September–Oktober 2026.

---

## Cara menjalankan

### Langkah 1 — Pastikan Node.js terinstal

```bash
node --version  # harus v18 atau lebih baru
npm --version
```

### Langkah 2 — Install dependencies

```bash
cd sales-dashboard
npm install
```

### Langkah 3 — Pastikan file data ada

```bash
# Jalankan dari root direktori (dk/)
cp sample_data.csv sales-dashboard/public/sample_data.csv
```

File harus ada di:
```
sales-dashboard/public/sample_data.csv
```

### Langkah 4 — Jalankan development server

```bash
cd sales-dashboard
npm run dev
```

Buka: **http://localhost:3000**

### Langkah 5 — Build untuk produksi (opsional)

```bash
npm run build
npm start
```

---

## Prasyarat

| Kebutuhan | Versi |
|---|---|
| Node.js | v18 atau lebih baru |
| npm | v9 atau lebih baru |
| Browser | Chrome, Firefox, Edge, Safari versi terbaru |

Tidak perlu: cloud hosting, database, API key berbayar.

---

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React + Tailwind CSS v4 |
| State & persistence | Zustand + `localStorage` |
| Visualisasi | Recharts |
| CSV parsing | PapaParse |
| Icons | Lucide React |

---

## Persistence

State yang disimpan otomatis ke `localStorage` browser (key: `sales-dashboard`):

- Filter aktif (tanggal, region, brand, outlet)
- Preferensi sort tabel
- Search tabel
- Konfigurasi Telegram (bot token + chat ID)

Data CSV **tidak** disimpan ke localStorage — dimuat ulang dari `public/sample_data.csv` setiap kali halaman dibuka.

---

## Pengaturan Telegram

1. Klik **⚙ Pengaturan** di bagian Ringkasan Manajemen
2. Isi **Bot API Token** (dari [@BotFather](https://t.me/BotFather))
3. Isi **Chat ID** (dari [@userinfobot](https://t.me/userinfobot), atau ID grup/channel)
4. Klik **Simpan** — tersimpan di `localStorage`, tidak dikirim ke server lain
5. Klik **✈️ Kirim ke Telegram** untuk mengirim ringkasan

Indikator hijau (●) di tombol Pengaturan menunjukkan bot sudah terkonfigurasi.

---

## Menjalankan test data layer

Test tidak bergantung pada browser/Next.js:

```bash
node dashboard/data.test.js   # dari root direktori (dk/)
```

Output: **29 passed, 0 failed**

---

## Format data

Kolom wajib: `date`, `invoice_no`, `region`, `outlet_id`, `outlet_name`, `brand`, `net_sales_idr`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `date` | YYYY-MM-DD | Tanggal invoice |
| `invoice_no` | string | ID invoice |
| `region` | string | Region (dinormalisasi) |
| `outlet_id` | string | ID outlet unik |
| `outlet_name` | string | Nama outlet (di-trim) |
| `brand` | string | Brand produk |
| `net_sales_idr` | number | **Metrik utama**: penjualan bersih |

---

## Metrik dan asumsi

| Metrik | Definisi |
|---|---|
| **Total Net Sales** | `SUM(net_sales_idr)` pada baris yang difilter |
| **Jumlah Invoice** | `COUNT DISTINCT invoice_no` |
| **Jumlah Outlet** | `COUNT DISTINCT outlet_id` |
| **5 Outlet Terendah** | `SUM(net_sales_idr) ASC` per outlet; tie-break `outlet_id` alphabetical |

Nilai negatif (retur/kredit) **dipertahankan** dalam semua agregasi.

---

## Struktur file

```
sales-dashboard/
  app/
    layout.tsx          # Root layout
    page.tsx            # Halaman utama
    globals.css         # Tailwind v4 import
  components/
    charts/Charts.tsx   # Line + bar charts (Recharts)
    filters/FilterBar.tsx
    sections/
      KpiRow.tsx
      WeakestOutlets.tsx
      DataTable.tsx
      SummarySection.tsx  # Telegram send + settings
      TelegramModal.tsx   # Modal konfigurasi bot
      DataQualityBanner.tsx
    ui/
      Autocomplete.tsx  # Custom combobox untuk filter outlet
      KpiCard.tsx
  lib/
    data.ts             # Pure logic: parsing, normalisasi, agregasi, summary
  store/
    useStore.ts         # Zustand store + localStorage persistence
  public/
    sample_data.csv     # File data (read-only)
```

---

## Keterbatasan

- Tidak ada data target/kuota → ranking berdasarkan nilai absolut
- Tidak ada data periode sebelumnya → tidak ada perbandingan MoM/YoY
- Ringkasan adalah rule-based (tidak menggunakan LLM)
- Hanya membaca satu file CSV
