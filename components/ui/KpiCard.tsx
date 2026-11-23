import { formatIDR, formatIDRShort } from "@/lib/data";

interface Props {
  label: string;
  value: number;
  note: string;
  short?: boolean;
  warn?: boolean;
}

export default function KpiCard({ label, value, note, short = true, warn }: Props) {
  const display = short ? formatIDRShort(value) : value.toLocaleString("id-ID");
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? "text-amber-600" : "text-slate-800"}`}>{display}</p>
      <p className="text-[11px] text-slate-400 mt-1">{note}</p>
    </div>
  );
}

export function KpiCardRaw({ label, value, note, warn }: { label: string; value: string | number; note: string; warn?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? "text-amber-600" : "text-slate-800"}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{note}</p>
    </div>
  );
}
