"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/store/useStore";
import FilterBar from "@/components/filters/FilterBar";
import KpiRow from "@/components/sections/KpiRow";
import Charts from "@/components/charts/Charts";
import WeakestOutlets from "@/components/sections/WeakestOutlets";
import DataTable from "@/components/sections/DataTable";
import SummarySection from "@/components/sections/SummarySection";
import DataQualityBanner from "@/components/sections/DataQualityBanner";
import { UploadCloud } from "lucide-react";

const IndonesiaMap = dynamic(() => import("@/components/charts/IndonesiaMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-5 h-40 flex items-center justify-center text-sm text-slate-400">
      Memuat peta…
    </div>
  ),
});

export default function Home() {
  const { allRows, loading, loadError, loadCSV } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (allRows.length > 0) return; // already loaded (or restored)
    fetch("/sample_data.csv")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(loadCSV)
      .catch(() => {/* show manual upload */});
  }, []); // ponytail: runs once on mount; strict-mode double-invoke safe because loadCSV is idempotent

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { alert("File harus berformat .csv"); return; }
    file.text().then(loadCSV);
  }

  const hasData = allRows.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <h1 className="text-base font-bold text-slate-800">📊 Sales Performance Dashboard</h1>
        <span className="ml-auto text-xs text-slate-400">
          {loading && "Memuat data…"}
          {!loading && hasData && `${allRows.length.toLocaleString("id-ID")} baris dimuat · net_sales_idr`}
          {!loading && !hasData && !loadError && "Belum ada data"}
        </span>
        {loadError && <span className="text-xs text-red-600 font-medium">{loadError}</span>}
        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded hover:border-blue-400 hover:text-blue-600 transition-colors">
          <UploadCloud size={13} /> Upload CSV
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </label>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">
        {!hasData && !loading && (
          <div className="text-center py-20 text-slate-400">
            <UploadCloud size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-2">
              {loadError
                ? "Tidak dapat memuat sample_data.csv otomatis. Gunakan tombol Upload CSV di atas."
                : "Memuat sample_data.csv…"}
            </p>
            <p className="text-xs">Pastikan file ada di <code className="bg-slate-100 px-1 rounded">public/sample_data.csv</code></p>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 text-slate-400 text-sm">Memuat dan memproses data…</div>
        )}

        {hasData && (
          <>
            <DataQualityBanner />
            <FilterBar />
            <KpiRow />
            <IndonesiaMap />
            <Charts />
            <WeakestOutlets />
            <DataTable />
            <SummarySection />
          </>
        )}
      </main>
    </div>
  );
}
