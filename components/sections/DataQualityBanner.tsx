"use client";
import { useStore } from "@/store/useStore";
import { AlertTriangle, Info } from "lucide-react";

export default function DataQualityBanner() {
  const { parseResult } = useStore();
  if (!parseResult) return null;

  const { errors, dqNotes } = parseResult;

  return (
    <div className="space-y-3 mb-5">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700 mb-1">Peringatan data</p>
            <ul className="text-xs text-red-600 list-disc pl-4 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}
      {dqNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 mb-1">Catatan kualitas data</p>
            <ul className="text-xs text-amber-700 list-disc pl-4 space-y-0.5">
              {dqNotes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
