"use client";
import { useStore } from "@/store/useStore";
import { useMemo } from "react";
import { kpis } from "@/lib/data";
import { formatIDRShort, formatIDR } from "@/lib/data";
import { KpiCardRaw } from "@/components/ui/KpiCard";

export default function KpiRow() {
  const { allRows, filteredRows } = useStore();
  const rows = filteredRows();
  const stats = useMemo(() => kpis(rows), [rows]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      <KpiCardRaw
        label="Total Net Sales"
        value={formatIDRShort(stats.total_net_sales)}
        note="net_sales_idr · termasuk retur"
        warn={stats.total_net_sales < 0}
      />
      <KpiCardRaw
        label="Jumlah Invoice"
        value={stats.invoice_count.toLocaleString("id-ID")}
        note="distinct invoice_no"
      />
      <KpiCardRaw
        label="Jumlah Outlet"
        value={stats.outlet_count.toLocaleString("id-ID")}
        note="distinct outlet_id"
      />
      <KpiCardRaw
        label="Baris Invoice"
        value={stats.line_count.toLocaleString("id-ID")}
        note="invoice lines"
      />
      {stats.return_count > 0 && (
        <KpiCardRaw
          label="Retur/Kredit"
          value={stats.return_count}
          note={`${formatIDRShort(stats.return_total)} total nilai negatif`}
          warn
        />
      )}
    </div>
  );
}
