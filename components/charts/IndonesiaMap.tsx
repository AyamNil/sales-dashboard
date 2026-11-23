"use client";
import { useMemo, useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useStore } from "@/store/useStore";
import { aggByKey, formatIDRShort, REGION_TO_PROVINCES } from "@/lib/data";

const GEO_URL = "/indonesia-provinces.json";

// province name (uppercase) → dashboard region name
const PROVINCE_TO_REGION: Record<string, string> = {};
for (const [region, provinces] of Object.entries(REGION_TO_PROVINCES)) {
  for (const p of provinces) PROVINCE_TO_REGION[p.toUpperCase()] = region;
}

export default function IndonesiaMap() {
  const { filteredRows } = useStore();
  const rows = filteredRows();

  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [geoLoaded, setGeoLoaded] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Pre-fetch to verify GeoJSON loads correctly and signal readiness
  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (d?.features?.length) setGeoLoaded(true); else throw new Error("No features"); })
      .catch((e) => setGeoError(e.message));
  }, []);

  const regionSales = useMemo(() => {
    const agg = aggByKey(rows, (r) => r.region);
    const map: Record<string, number> = {};
    for (const a of agg) map[a.key] = a.net_sales_idr;
    return map;
  }, [rows]);

  const values = Object.values(regionSales).filter((v) => v > 0);
  const maxVal = values.length ? Math.max(...values) : 1;
  const minVal = values.length ? Math.min(...values) : 0;

  const colorScale = scaleLinear<string>()
    .domain([0, minVal, maxVal])
    .range(["#f1f5f9", "#bfdbfe", "#1d4ed8"]);

  function getFill(propinsi: string): string {
    const region = PROVINCE_TO_REGION[propinsi.toUpperCase()];
    if (!region) return "#e2e8f0";
    const val = regionSales[region];
    if (val === undefined || val <= 0) return "#f8fafc";
    return colorScale(val);
  }

  function getTooltipContent(propinsi: string): string {
    const region = PROVINCE_TO_REGION[propinsi.toUpperCase()];
    if (!region) return propinsi;
    const val = regionSales[region];
    return val !== undefined
      ? `${propinsi}\n${region}: ${formatIDRShort(val)}`
      : `${propinsi}\n${region}: tidak ada data`;
  }

  if (geoError) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Peta Penjualan per Region</h2>
        <p className="text-sm text-red-500">Gagal memuat peta: {geoError}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-5 relative">
      <h2 className="text-sm font-semibold text-slate-700 mb-1">Peta Penjualan per Region</h2>
      <p className="text-[11px] text-slate-400 mb-3">
        Warna menunjukkan total net_sales_idr · abu-abu = provinsi di luar cakupan region data
      </p>

      {/* Legend */}
      <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-500">
        <span>Rendah</span>
        <div className="flex h-3 w-28 rounded overflow-hidden border border-slate-200">
          {["#f1f5f9","#dbeafe","#93c5fd","#3b82f6","#1d4ed8"].map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <span>Tinggi</span>
        <span className="ml-2 text-slate-300">|</span>
        <div className="w-3 h-3 rounded border border-slate-200" style={{ background: "#e2e8f0" }} />
        <span>Di luar cakupan</span>
      </div>

      {!geoLoaded && (
        <div className="h-72 flex items-center justify-center text-sm text-slate-400">
          Memuat peta Indonesia…
        </div>
      )}

      <div className={geoLoaded ? "block" : "hidden"}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [118, -2.5], scale: 1050 }}
          width={800}
          height={300}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const propinsi: string = (geo.properties?.Propinsi as string) ?? "";
                const fill = getFill(propinsi);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.6}
                    className="outline-none"
                    onMouseEnter={(e) => {
                      (e.currentTarget as SVGPathElement).setAttribute("fill", "#fbbf24");
                      setTooltip({ x: e.clientX, y: e.clientY, content: getTooltipContent(propinsi) });
                    }}
                    onMouseMove={(e) => {
                      setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as SVGPathElement).setAttribute("fill", fill);
                      setTooltip(null);
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Region chips */}
      {Object.keys(regionSales).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(regionSales)
            .sort((a, b) => b[1] - a[1])
            .map(([region, val]) => (
              <span
                key={region}
                className="inline-flex items-center gap-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: colorScale(Math.max(val, 0)) }}
                />
                {region}: {formatIDRShort(val)}
              </span>
            ))}
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-800 text-white text-xs rounded px-2.5 py-1.5 whitespace-pre leading-relaxed shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
