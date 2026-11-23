"use client";
import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { weakestOutlets, formatIDR } from "@/lib/data";

export default function WeakestOutlets() {
  const { filteredRows } = useStore();
  const rows = filteredRows();

  const { weak, totalOutlets } = useMemo(() => {
    const weak = weakestOutlets(rows, 5);
    const totalOutlets = new Set(rows.map((r) => r.outlet_id)).size;
    return { weak, totalOutlets };
  }, [rows]);

  const maxAbs = Math.max(...weak.map((w) => Math.abs(w.net_sales_idr)), 1);

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4 mb-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-1">5 Outlet Penjualan Terendah</h2>
      <p className="text-[11px] text-slate-400 mb-3">
        Ranking: total net_sales_idr terendah dalam periode filter aktif. Outlet dengan nilai negatif (retur &gt; penjualan) ditampilkan. Tie-break: outlet_id ascending.
      </p>

      {totalOutlets < 5 && totalOutlets > 0 && (
        <p className="text-xs text-slate-500 mb-2">
          Hanya {totalOutlets} outlet tersedia setelah filter. Menampilkan {weak.length} outlet.
        </p>
      )}

      {weak.length === 0 ? (
        <p className="text-slate-400 italic text-sm">Tidak ada data outlet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase py-2 px-2 w-8">Rank</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase py-2 px-2">Outlet</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase py-2 px-2">ID</th>
                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase py-2 px-2">Net Sales IDR</th>
                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase py-2 px-2">Volume</th>
                <th className="w-36 py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {weak.map((w, i) => {
                const neg = w.net_sales_idr < 0;
                const pct = Math.round((Math.abs(w.net_sales_idr) / maxAbs) * 100);
                return (
                  <tr key={w.key} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-2 font-bold text-slate-400">#{i + 1}</td>
                    <td className="py-2 px-2">{w.outlet_name}</td>
                    <td className="py-2 px-2 text-slate-500">{w.key}</td>
                    <td className={`py-2 px-2 text-right tabular-nums font-medium ${neg ? "text-red-600" : ""}`}>
                      {formatIDR(w.net_sales_idr)}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-500">{w.line_count} baris</td>
                    <td className="py-2 px-2">
                      <div className="bg-slate-100 rounded h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded ${neg ? "bg-red-500" : "bg-blue-500"}`}
                          style={{ width: `${pct}%`, minWidth: 2 }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
