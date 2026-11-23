"use client";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

export interface Option {
  id: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  label?: string;
}

export default function Autocomplete({ options, value, onChange, placeholder = "Ketik untuk mencari…", label }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync display when value changes externally (e.g. reset)
  useEffect(() => {
    if (!value) { setQuery(""); return; }
    const opt = options.find((o) => o.id === value);
    if (opt) setQuery(opt.label);
  }, [value, options]);

  const visible = query && !value
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()) || o.id.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(opt: Option) {
    onChange(opt.id);
    setQuery(opt.label);
    setOpen(false);
    setCursor(-1);
  }

  function clear() {
    onChange("");
    setQuery("");
    setCursor(-1);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) { if (e.key === "ArrowDown" || e.key === "ArrowUp") setOpen(true); return; }
    const len = visible.length;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, len - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (cursor >= 0 && visible[cursor]) select(visible[cursor]); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  // Scroll active option into view
  useEffect(() => {
    if (cursor < 0) return;
    listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div className="relative">
      {label && <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          className="w-full min-w-[200px] pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          onChange={(e) => { setQuery(e.target.value); onChange(""); setCursor(-1); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {(query || value) && (
          <button
            onMouseDown={(e) => { e.preventDefault(); clear(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
            aria-label="Hapus"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto"
          role="listbox"
        >
          {visible.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400 italic">Tidak ditemukan</div>
          ) : (
            visible.map((opt, i) => (
              <div
                key={opt.id}
                role="option"
                aria-selected={opt.id === value}
                className={`px-3 py-2 text-sm cursor-pointer ${i === cursor || opt.id === value ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}
                onMouseDown={(e) => { e.preventDefault(); select(opt); }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
