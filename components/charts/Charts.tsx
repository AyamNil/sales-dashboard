"use client";
import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { aggByKey, formatIDR } from "@/lib/data";
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

const COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#64748b"];

function idrTick(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}M`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}jt`;
  return String(v);
}

function idrLabel(v: number | string | readonly (string | number)[] | undefined) {
  return formatIDR(typeof v === "number" ? v : Number(v ?? 0));
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      {children}
      {note && <p className="text-[11px] text-slate-400 mt-2">{note}</p>}
    </div>
  );
}

export default function Charts() {
  const { filteredRows } = useStore();
  const rows = filteredRows();

  const { byDate, byRegion, byBrand, byType } = useMemo(() => {
    const byDate = aggByKey(rows, (r) => r.date)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((x) => ({ date: x.key, value: x.net_sales_idr }));

    const byRegion = aggByKey(rows, (r) => r.region)
      .sort((a, b) => b.net_sales_idr - a.net_sales_idr)
      .map((x) => ({ name: x.key, value: x.net_sales_idr }));

    const byBrand = aggByKey(rows, (r) => r.brand)
      .sort((a, b) => b.net_sales_idr - a.net_sales_idr)
      .map((x) => ({ name: x.key, value: x.net_sales_idr }));

    const byType = aggByKey(rows, (r) => r.outlet_type || "Lainnya")
      .sort((a, b) => b.net_sales_idr - a.net_sales_idr)
      .map((x) => ({ name: x.key, value: x.net_sales_idr }));

    return { byDate, byRegion, byBrand, byType };
  }, [rows]);

  if (rows.length === 0)
    return <p className="text-slate-400 italic text-sm mb-5">Tidak ada data untuk filter yang dipilih.</p>;

  return (
    <div className="space-y-4 mb-5">
      <ChartCard
        title="Penjualan harian (Net Sales IDR)"
        note="Metrik: sum net_sales_idr per tanggal · termasuk retur/kredit"
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={byDate}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis tickFormatter={idrTick} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
            <Tooltip formatter={(v) => [idrLabel(v), "Net Sales"]} />
            <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Penjualan per region">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byRegion} layout="vertical">
              <XAxis type="number" tickFormatter={idrTick} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip formatter={(v) => [idrLabel(v), "Net Sales"]} />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Penjualan per brand" note={`${byBrand.length} brand · scroll untuk melihat semua`}>
          <div className="overflow-y-auto" style={{ height: Math.max(200, byBrand.length * 38) > 360 ? 360 : Math.max(200, byBrand.length * 38) }}>
            <ResponsiveContainer width="100%" height={Math.max(200, byBrand.length * 38)}>
              <BarChart data={byBrand} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
                <XAxis type="number" tickFormatter={idrTick} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} tickLine={false} interval={0} />
                <Tooltip formatter={(v) => [idrLabel(v), "Net Sales"]} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                  {byBrand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Penjualan per tipe outlet">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byType}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tickFormatter={idrTick} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
            <Tooltip formatter={(v) => [idrLabel(v), "Net Sales"]} />
            <Bar dataKey="value" fill="#16a34a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
