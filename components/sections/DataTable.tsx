"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { Row, formatIDR } from "@/lib/data";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

const PAGE_SIZE = 50;

const COLS: { key: keyof Row; label: string; num: boolean }[] = [
  { key: "date", label: "Tanggal", num: false },
  { key: "invoice_no", label: "Invoice", num: false },
  { key: "region", label: "Region", num: false },
  { key: "outlet_name", label: "Outlet", num: false },
  { key: "brand", label: "Brand", num: false },
  { key: "sku", label: "SKU", num: false },
  { key: "qty_carton", label: "Qty", num: true },
  { key: "net_sales_idr", label: "Net Sales IDR", num: true },
];

export default function DataTable() {
  const { filteredRows, tableSearch, tablePage, sortCol, sortDir, setTableSearch, setTablePage, setSort } = useStore();
  const rows = filteredRows();

  const sorted = useMemo(() => {
    const q = tableSearch.toLowerCase();
    const searched = q
      ? rows.filter((r) =>
          r.outlet_name.toLowerCase().includes(q) ||
          r.invoice_no.toLowerCase().includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q)
        )
      : rows;

    return [...searched].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const cmp = typeof av === "number" ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, tableSearch, sortCol, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(tablePage, pageCount);
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ col }: { col: keyof Row }) {
    if (sortCol !== col) return <ChevronsUpDown size={12} className="inline opacity-30 ml-0.5" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="inline text-blue-600 ml-0.5" />
      : <ChevronDown size={12} className="inline text-blue-600 ml-0.5" />;
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4 mb-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Data Detail Invoice</h2>

      <div className="flex flex-wrap gap-3 items-center mb-3">
        <input
          type="text"
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          placeholder="Cari outlet, invoice, brand, SKU…"
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <span className="text-xs text-slate-400 ml-auto">{sorted.length.toLocaleString("id-ID")} baris</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => setSort(c.key)}
                  className={`text-[11px] font-semibold text-slate-500 uppercase py-2 px-2 cursor-pointer select-none hover:text-blue-600 whitespace-nowrap ${c.num ? "text-right" : "text-left"}`}
                >
                  {c.label}<SortIcon col={c.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={COLS.length} className="text-center py-10 text-slate-400 italic">Tidak ada data sesuai filter.</td></tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-colors">
                  {COLS.map((c) => {
                    const val = r[c.key];
                    if (c.key === "net_sales_idr") return (
                      <td key={c.key} className={`py-2 px-2 text-right tabular-nums ${(val as number) < 0 ? "text-red-600 font-medium" : ""}`}>
                        {formatIDR(val as number)}
                      </td>
                    );
                    if (c.num) return <td key={c.key} className="py-2 px-2 text-right tabular-nums">{String(val)}</td>;
                    return <td key={c.key} className="py-2 px-2 max-w-[180px] truncate">{String(val ?? "")}</td>;
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          disabled={page <= 1}
          onClick={() => setTablePage(page - 1)}
          className="px-3 py-1 text-sm border border-slate-200 rounded disabled:opacity-40 hover:not-disabled:border-blue-500"
        >‹ Prev</button>
        <span className="text-xs text-slate-500">Hal. {page} / {pageCount}</span>
        <button
          disabled={page >= pageCount}
          onClick={() => setTablePage(page + 1)}
          className="px-3 py-1 text-sm border border-slate-200 rounded disabled:opacity-40 hover:not-disabled:border-blue-500"
        >Next ›</button>
      </div>
    </section>
  );
}
