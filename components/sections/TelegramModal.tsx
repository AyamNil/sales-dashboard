"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { X, Eye, EyeOff } from "lucide-react";

export default function TelegramModal({ onClose }: { onClose: () => void }) {
  const { telegram, setTelegram, clearTelegram } = useStore();
  const [token, setToken] = useState(telegram.botToken);
  const [chatId, setChatId] = useState(telegram.chatId);
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setTelegram({ botToken: token.trim(), chatId: chatId.trim() });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  }

  function clear() {
    clearTelegram();
    setToken("");
    setChatId("");
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="flex items-center justify-between mb-1">
          <h2 id="modal-title" className="text-base font-semibold">⚙ Pengaturan Telegram</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Tutup"><X size={18} /></button>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Dapatkan token dari{" "}
          <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-blue-600 underline">@BotFather</a>.
          Chat ID via{" "}
          <a href="https://t.me/userinfobot" target="_blank" rel="noopener" className="text-blue-600 underline">@userinfobot</a>.{" "}
          Tersimpan di <code className="bg-slate-100 px-1 rounded">localStorage</code> browser — tidak dikirim ke server lain.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Bot API Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:AAxxxxxxxxxxxxxx"
                className="w-full pl-3 pr-10 py-2 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showToken ? "Sembunyikan token" : "Tampilkan token"}
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Format: &lt;bot_id&gt;:&lt;token&gt; dari BotFather</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Chat ID</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-1001234567890"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[11px] text-slate-400">ID grup/channel (awalan -100...) atau ID pribadi</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={clear}
            className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-300 px-3 py-1.5 rounded transition-colors"
          >
            🗑 Hapus kredensial
          </button>
          {saved && <span className="text-xs text-green-600 font-medium">✓ Tersimpan</span>}
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-sm text-slate-500 border border-slate-200 rounded hover:border-red-300 hover:text-red-500 transition-colors">Batal</button>
            <button onClick={save} className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
}
