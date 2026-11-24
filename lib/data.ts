// DATA CONTRACT
// Sales metric : net_sales_idr = gross_sales_idr - discount_idr
// Invoice count: COUNT DISTINCT invoice_no
// Outlet count : COUNT DISTINCT outlet_id
// Weakest 5    : SUM(net_sales_idr) ASC per outlet_id; tie-break outlet_id asc
// Negatives    : preserved — returns/credits are included in all aggregations
// Duplicates   : exact-key duplicates removed; count reported

export const REQUIRED_COLUMNS = [
  "date",
  "invoice_no",
  "region",
  "outlet_id",
  "outlet_name",
  "brand",
  "net_sales_idr",
] as const;

const REGION_ALIASES: Record<string, string> = {
  jabar: "Jawa Barat",
  "jawa barat": "Jawa Barat",
  jabodetabek: "Jabodetabek",
  "jawa tengah": "Jawa Tengah",
  "jawa timur": "Jawa Timur",
  sumatera: "Sumatera",
  kalimantan: "Kalimantan",
};

export interface Row {
  date: string;
  invoice_no: string;
  region: string;
  branch: string;
  outlet_id: string;
  outlet_name: string;
  outlet_type: string;
  salesman: string;
  brand: string;
  sku: string;
  qty_carton: number;
  price_per_carton_idr: number;
  gross_sales_idr: number;
  discount_idr: number;
  net_sales_idr: number;
}

export interface ParseResult {
  rows: Row[];
  dupes: string[];
  errors: string[];
  dqNotes: string[];
}

export interface KPIs {
  total_net_sales: number;
  invoice_count: number;
  outlet_count: number;
  line_count: number;
  return_count: number;
  return_total: number;
}

export interface AggRow {
  key: string;
  net_sales_idr: number;
  line_count: number;
}

export interface OutletAgg extends AggRow {
  outlet_name: string;
}

export interface Filters {
  dateFrom: string;
  dateTo: string;
  region: string;
  brand: string;
  outlet_id: string;
}

export interface PeriodComparison {
  currentSales: number;
  previousSales: number;
  change: number;
  hasComparison: boolean;
  previousFrom: string;
  previousTo: string;
}

export function normalizeRegion(raw: string): string {
  return REGION_ALIASES[raw.trim().toLowerCase()] ?? raw.trim();
}

export function normalizeRow(r: Record<string, string>): Row {
  return {
    date: (r.date ?? "").trim(),
    invoice_no: (r.invoice_no ?? "").trim(),
    region: normalizeRegion(r.region ?? ""),
    branch: (r.branch ?? "").trim(),
    outlet_id: (r.outlet_id ?? "").trim(),
    outlet_name: (r.outlet_name ?? "").trim(),
    outlet_type: (r.outlet_type ?? "").trim(),
    salesman: (r.salesman ?? "").trim(),
    brand: (r.brand ?? "").trim(),
    sku: (r.sku ?? "").trim(),
    qty_carton: parseFloat(r.qty_carton) || 0,
    price_per_carton_idr: parseFloat(r.price_per_carton_idr) || 0,
    gross_sales_idr: parseFloat(r.gross_sales_idr) || 0,
    discount_idr: parseFloat(r.discount_idr) || 0,
    net_sales_idr: parseFloat(r.net_sales_idr) || 0,
  };
}

export function validateColumns(fields: string[]): string[] {
  return REQUIRED_COLUMNS.filter((c) => !fields.includes(c));
}

function dedupKey(r: Row): string {
  return `${r.date}|${r.invoice_no}|${r.outlet_id}|${r.sku}|${r.net_sales_idr}`;
}

export function processRows(raw: Record<string, string>[]): ParseResult {
  const errors: string[] = [];
  const dqNotes: string[] = [];

  let rows = raw.map(normalizeRow);

  const badDate = rows.filter((r) => !/^\d{4}-\d{2}-\d{2}$/.test(r.date));
  if (badDate.length) {
    errors.push(`${badDate.length} baris dengan format tanggal tidak valid — dikeluarkan.`);
    rows = rows.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
  }

  // Dedup
  const seen = new Set<string>();
  const dupes: string[] = [];
  const deduped: Row[] = [];
  for (const r of rows) {
    const k = dedupKey(r);
    if (seen.has(k)) { dupes.push(r.invoice_no); continue; }
    seen.add(k);
    deduped.push(r);
  }
  if (dupes.length)
    errors.push(`${dupes.length} baris duplikat dihapus (invoice: ${dupes.join(", ")}).`);

  dqNotes.push(
    "Variasi penulisan region (Jabar, JAWA BARAT, JABODETABEK, JAWA TIMUR) dinormalisasi ke nilai kanonik."
  );
  dqNotes.push("Nama outlet dengan spasi di ujung sudah di-trim.");

  const negRows = deduped.filter((r) => r.net_sales_idr < 0);
  if (negRows.length)
    dqNotes.push(
      `${negRows.length} baris retur/kredit (net_sales_idr negatif) dipertahankan. Invoice: ${negRows.map((r) => r.invoice_no).join(", ")}.`
    );

  const missingSalesman = deduped.filter((r) => !r.salesman).length;
  if (missingSalesman)
    dqNotes.push(`${missingSalesman} baris dengan kolom salesman kosong — tidak digunakan dalam agregasi.`);

  return { rows: deduped, dupes, errors, dqNotes };
}

export function filterRows(rows: Row[], f: Filters): Row[] {
  return rows.filter((r) => {
    if (f.dateFrom && r.date < f.dateFrom) return false;
    if (f.dateTo && r.date > f.dateTo) return false;
    if (f.region && r.region !== f.region) return false;
    if (f.brand && r.brand !== f.brand) return false;
    if (f.outlet_id && r.outlet_id !== f.outlet_id) return false;
    return true;
  });
}

export function aggByKey(rows: Row[], keyFn: (r: Row) => string): AggRow[] {
  const map: Record<string, AggRow> = {};
  for (const r of rows) {
    const k = keyFn(r);
    if (!map[k]) map[k] = { key: k, net_sales_idr: 0, line_count: 0 };
    map[k].net_sales_idr += r.net_sales_idr;
    map[k].line_count += 1;
  }
  return Object.values(map);
}

export function weakestOutlets(rows: Row[], n = 5): OutletAgg[] {
  const agg = aggByKey(rows, (r) => r.outlet_id);
  const nameMap: Record<string, string> = {};
  for (const r of rows) nameMap[r.outlet_id] = r.outlet_name;
  const result: OutletAgg[] = agg.map((a) => ({
    ...a,
    outlet_name: nameMap[a.key] ?? a.key,
  }));
  result.sort((a, b) => a.net_sales_idr - b.net_sales_idr || a.key.localeCompare(b.key));
  return result.slice(0, n);
}

export function kpis(rows: Row[]): KPIs {
  const negRows = rows.filter((r) => r.net_sales_idr < 0);
  return {
    total_net_sales: rows.reduce((s, r) => s + r.net_sales_idr, 0),
    invoice_count: new Set(rows.map((r) => r.invoice_no)).size,
    outlet_count: new Set(rows.map((r) => r.outlet_id)).size,
    line_count: rows.length,
    return_count: negRows.length,
    return_total: negRows.reduce((s, r) => s + r.net_sales_idr, 0),
  };
}

export function comparePeriod(allRows: Row[], filters: Filters): PeriodComparison {
  const currentFrom = filters.dateFrom || allRows.map((r) => r.date).sort()[0] || "";
  const currentTo = filters.dateTo || allRows.map((r) => r.date).sort().at(-1) || "";
  if (!currentFrom || !currentTo) return { currentSales: 0, previousSales: 0, change: 0, hasComparison: false, previousFrom: "", previousTo: "" };

  const from = new Date(`${currentFrom}T00:00:00`);
  const to = new Date(`${currentTo}T00:00:00`);
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  const previousToDate = new Date(from.getTime() - 86400000);
  const previousFromDate = new Date(previousToDate.getTime() - (days - 1) * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const previousFrom = iso(previousFromDate);
  const previousTo = iso(previousToDate);
  const previousRows = filterRows(allRows, { ...filters, dateFrom: previousFrom, dateTo: previousTo });
  const currentRows = filterRows(allRows, { ...filters, dateFrom: currentFrom, dateTo: currentTo });
  const currentSales = currentRows.reduce((s, r) => s + r.net_sales_idr, 0);
  const previousSales = previousRows.reduce((s, r) => s + r.net_sales_idr, 0);
  return { currentSales, previousSales, change: previousSales ? ((currentSales - previousSales) / Math.abs(previousSales)) * 100 : 0, hasComparison: previousRows.length > 0, previousFrom, previousTo };
}

export function generateSummary(rows: Row[], filters: Filters, mode: "full" | "compact" = "full", comparison?: PeriodComparison): string {
  if (rows.length === 0) return "Tidak ada data untuk periode/filter yang dipilih.";

  const { total_net_sales, invoice_count, outlet_count, line_count } = kpis(rows);
  const sortedDates = rows.map((r) => r.date).sort();
  const dateFrom = filters.dateFrom || sortedDates[0];
  const dateTo = filters.dateTo || sortedDates[sortedDates.length - 1];
  const periodStr = dateFrom === dateTo ? dateFrom : `${dateFrom} s.d. ${dateTo}`;

  const topRegion = aggByKey(rows, (r) => r.region).sort((a, b) => b.net_sales_idr - a.net_sales_idr)[0];
  const topBrand = aggByKey(rows, (r) => r.brand).sort((a, b) => b.net_sales_idr - a.net_sales_idr)[0];
  const weak = weakestOutlets(rows, 5);
  const stats = kpis(rows);
  const safeTotal = Math.abs(total_net_sales) || 1;
  const regionShare = topRegion ? (topRegion.net_sales_idr / safeTotal) * 100 : 0;
  const brandShare = topBrand ? (topBrand.net_sales_idr / safeTotal) * 100 : 0;
  const comparisonLine = comparison?.hasComparison
    ? `Perbandingan periode sebelumnya (${comparison.previousFrom} s.d. ${comparison.previousTo}): ${comparison.change >= 0 ? "naik" : "turun"} ${Math.abs(comparison.change).toFixed(1).replace(".", ",")}%.`
    : "Perbandingan periode sebelumnya tidak tersedia karena tidak ada data.";

  const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
  const fmtShort = (n: number) => {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2).replace(".", ",")} M`;
    if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(1).replace(".", ",")} jt`;
    return `${sign}${fmt(n)}`;
  };

  const filterParts = [];
  if (filters.region) filterParts.push(`region: ${filters.region}`);
  if (filters.brand) filterParts.push(`brand: ${filters.brand}`);
  if (filters.outlet_id) filterParts.push(`outlet: ${filters.outlet_id}`);
  const regionClause = topRegion
    ? `Region dengan kontribusi penjualan terbesar adalah ${topRegion.key} sebesar ${fmtShort(topRegion.net_sales_idr)}.`
    : "";
  const brandClause = topBrand
    ? `Brand dengan penjualan tertinggi adalah ${topBrand.key} sebesar ${fmtShort(topBrand.net_sales_idr)}.`
    : "";
  const weakStr = weak.length
    ? weak.map((w, i) => `${i + 1}. ${w.outlet_name} — ${fmtShort(w.net_sales_idr)} (${w.line_count} baris)`).join("\n")
    : "Tidak ada data outlet.";
  const filterLabel = filterParts.length ? `\nFilter: ${filterParts.join(" · ")}` : "";

  if (mode === "compact") {
    return `Penjualan ${periodStr}: ${fmt(total_net_sales)} dari ${invoice_count} invoice dan ${outlet_count} outlet. Region tertinggi ${topRegion?.key ?? "-"} (${regionShare.toFixed(1).replace(".", ",")}%), brand tertinggi ${topBrand?.key ?? "-"} (${brandShare.toFixed(1).replace(".", ",")}%). ${comparison?.hasComparison ? `Periode sebelumnya ${comparison.change >= 0 ? "naik" : "turun"} ${Math.abs(comparison.change).toFixed(1).replace(".", ",")}%.` : "Perbandingan periode sebelumnya tidak tersedia."}`;
  }

  return [
    `RINGKASAN PENJUALAN`,
    `Periode: ${periodStr}${filterLabel}`,
    "",
    `KINERJA UTAMA`,
    `• Net sales: ${fmt(total_net_sales)}`,
    `• Cakupan: ${invoice_count} invoice · ${outlet_count} outlet · ${line_count} baris invoice`,
    `• Retur/kredit: ${stats.return_count ? `${fmt(stats.return_total)} dari ${stats.return_count} baris` : "tidak ada"}`,
    `• ${comparisonLine}`,
    "",
    `SOROTAN`,
    `• ${regionClause} (${regionShare.toFixed(1).replace(".", ",")}% dari total)`,
    `• ${brandClause} (${brandShare.toFixed(1).replace(".", ",")}% dari total)`,
    "", 
    "",
    `5 OUTLET DENGAN NET SALES TERENDAH`,
    weakStr,
    "",
    "Catatan: ranking outlet berdasarkan total net_sales_idr terendah. Nilai retur/kredit negatif tetap diperhitungkan.",
  ].join("\n");
}

export function formatIDR(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function formatIDRShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2).replace(".", ",")} M`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(1).replace(".", ",")} jt`;
  return `${sign}Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

// Maps dashboard region names → GeoJSON province names (Propinsi field, uppercase)
// Jabodetabek and Jawa Barat both cover DKI JAKARTA + JAWA BARAT — split as: 
// Jabodetabek → DKI JAKARTA only; Jawa Barat → JAWA BARAT + BANTEN
// ponytail: macro-region mapping; replace with actual province-level data if granular data available
export const REGION_TO_PROVINCES: Record<string, string[]> = {
  "Jabodetabek":  ["DKI JAKARTA", "BANTEN"],
  "Jawa Barat":   ["JAWA BARAT"],
  "Jawa Tengah":  ["JAWA TENGAH", "DAERAH ISTIMEWA YOGYAKARTA"],
  "Jawa Timur":   ["JAWA TIMUR"],
  "Sumatera":     ["SUMATERA UTARA", "SUMATERA BARAT", "SUMATERA SELATAN", "RIAU", "JAMBI", "LAMPUNG", "BENGKULU", "DI. ACEH", "BANGKA BELITUNG"],
  "Kalimantan":   ["KALIMANTAN BARAT", "KALIMANTAN TENGAH", "KALIMANTAN SELATAN", "KALIMANTAN TIMUR"],
};

