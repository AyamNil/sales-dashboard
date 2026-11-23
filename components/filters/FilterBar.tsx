"use client";
import { useStore } from "@/store/useStore";
import { useMemo } from "react";
import Autocomplete from "@/components/ui/Autocomplete";
import { X, RotateCcw } from "lucide-react";

export default function FilterBar() {
  const { filters, allRows, setFilter, resetFilters } = useStore();

  const { regions, brands, outletOptions } = useMemo(() => {
    const regions = [...new Set(allRows.map((r) => r.region))].sort();
    const brands = [...new Set(allRows.map((r) => r.brand))].sort();
    const nameMap: Record<string, string> = {};
    for (const r of allRows) nameMap[r.outlet_id] = r.outlet_name;
    const outlets = [...new Set(allRows.map((r) => r.outlet_id))].sort();
    return {
      regions,
      brands,
      outletOptions: outlets.map((id) => ({ id, label: `${nameMap[id]} (${id})` })),
    };
  }, [allRows]);

  const activeTags: { label: string; onRemove: () => void }[] = [];
  if (filters.dateFrom || filters.dateTo)
    activeTags.push({ label: `📅 ${filters.dateFrom || "…"} – ${filters.dateTo || "…"}`, onRemove: () => { setFilter("dateFrom", ""); setFilter("dateTo", ""); } });
  if (filters.region)
    activeTags.push({ label: `🗺 ${filters.region}`, onRemove: () => setFilter("region", "") });
  if (filters.brand)
    activeTags.push({ label: `🏷 ${filters.brand}`, onRemove: () => setFilter("brand", "") });
  if (filters.outlet_id)
    activeTags.push({ label: `🏪 ${filters.outlet_id}`, onRemove: () => setFilter("outlet_id", "") });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-5 shadow-sm">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Dari tanggal</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter("dateFrom", e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sampai tanggal</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter("dateTo", e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Region</label>
          <select
            value={filters.region}
            onChange={(e) => setFilter("region", e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          >
            <option value="">Semua region</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Brand</label>
          <select
            value={filters.brand}
            onChange={(e) => setFilter("brand", e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          >
            <option value="">Semua brand</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <Autocomplete
          label="Outlet"
          options={outletOptions}
          value={filters.outlet_id}
          onChange={(id) => setFilter("outlet_id", id)}
          placeholder="Ketik nama atau ID outlet…"
        />
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 border border-slate-200 rounded-md hover:border-red-400 hover:text-red-500 transition-colors"
        >
          <RotateCcw size={13} /> Reset filter
        </button>
      </div>

      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {activeTags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded px-2 py-0.5">
              {t.label}
              <button onClick={t.onRemove} aria-label="Hapus filter" className="hover:text-red-500">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
