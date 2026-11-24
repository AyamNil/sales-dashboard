"use client";
import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { comparePeriod, generateSummary } from "@/lib/data";
import TelegramModal from "./TelegramModal";
import { Copy, Send, Settings } from "lucide-react";

export default function SummarySection() {
  const { filteredRows, filters, telegram, allRows, summaryMode, setSummaryMode } = useStore();
  const rows = filteredRows();
  const [modalOpen, setModalOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [sending, setSending] = useState(false);

  const comparison = useMemo(() => comparePeriod(allRows, filters), [allRows, filters]);
  const text = useMemo(() => generateSummary(rows, filters, summaryMode, comparison), [rows, filters, summaryMode, comparison]);
  const configured = !!(telegram.botToken && telegram.chatId);
  const changeClass = comparison.change >= 0 ? "text-green-600" : "text-red-600";
  const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

  const sortedDates = allRows.map((r) => r.date).sort();
  const df = filters.dateFrom || sortedDates[0] || "";
  const dt = filters.dateTo || sortedDates[sortedDates.length - 1] || "";

  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopyDone(true); setTimeout(() => setCopyDone(false), 2000); }
    catch { window.getSelection()?.selectAllChildren(document.getElementById("summary-text")!); }
  }

  async function send() {
    if (!configured) { setSendStatus({ type: "err", msg: "Atur Bot Token dan Chat ID di Pengaturan terlebih dahulu." }); return; }
    setSending(true); setSendStatus(null);
    try {
      const res = await fetch(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegram.chatId, text, parse_mode: "HTML" }),
      });
      const json = await res.json();
      setSendStatus(json.ok ? { type: "ok", msg: "✓ Pesan terkirim ke Telegram!" } : { type: "err", msg: `✗ ${json.description ?? "Gagal mengirim"}` });
    } catch (e: unknown) {
      setSendStatus({ type: "err", msg: `✗ Koneksi gagal: ${e instanceof Error ? e.message : String(e)}` });
    } finally { setSending(false); }
  }

  return (
    <>
      <section className="bg-white border border-slate-200 rounded-lg p-4 mb-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-1">Ringkasan Manajemen (Telegram)</h2>
        <p className="text-[11px] text-slate-400 mb-3">Periode: {df} s.d. {dt} · Berdasarkan filter aktif · Rule-based summary</p>

        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => setSummaryMode("full")} className={`px-3 py-1 text-xs rounded border ${summaryMode === "full" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-500"}`}>Full</button>
          <button onClick={() => setSummaryMode("compact")} className={`px-3 py-1 text-xs rounded border ${summaryMode === "compact" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-500"}`}>Compact</button>
          <span className="text-[11px] text-slate-400 self-center">Mode tersimpan otomatis</span>
        </div>

        {comparison.hasComparison ? (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 flex flex-wrap gap-4 text-xs">
            <span>Periode sebelumnya: <b>{comparison.previousFrom} s.d. {comparison.previousTo}</b></span>
            <span>Net sales sebelumnya: <b>{fmt(comparison.previousSales)}</b></span>
            <span className={changeClass}>Perubahan: <b>{comparison.change >= 0 ? "▲" : "▼"} {Math.abs(comparison.change).toFixed(1).replace(".", ",")}%</b></span>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3 text-xs text-slate-500">Perbandingan periode sebelumnya tidak tersedia karena tidak ada data.</div>
        )}

        <div id="summary-text" className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-slate-800">{text}</div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"><Copy size={13} /> {copyDone ? "Tersalin!" : "Salin teks"}</button>
          <button onClick={send} disabled={sending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0088cc] text-white rounded hover:bg-[#0077b5] disabled:opacity-50"><Send size={13} /> {sending ? "Mengirim…" : "Kirim ke Telegram"}</button>
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 border border-slate-200 rounded hover:border-blue-400 hover:text-blue-600"><Settings size={13} /> Pengaturan {configured && <span className="w-2 h-2 rounded-full bg-green-500" />}</button>
          {sendStatus && <span className={`text-xs font-medium ${sendStatus.type === "ok" ? "text-green-600" : "text-red-600"}`}>{sendStatus.msg}</span>}
        </div>
      </section>
      {modalOpen && <TelegramModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
