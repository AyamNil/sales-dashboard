import { create } from "zustand";
import { persist } from "zustand/middleware";
import Papa from "papaparse";
import {
  Row,
  Filters,
  ParseResult,
  validateColumns,
  processRows,
  filterRows,
} from "@/lib/data";

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface DataState {
  // Raw data
  allRows: Row[];
  parseResult: ParseResult | null;
  loading: boolean;
  loadError: string;

  // Filters (persisted)
  filters: Filters;

  // Table state
  tableSearch: string;
  tablePage: number;
  sortCol: keyof Row;
  sortDir: "asc" | "desc";

  // Telegram config (persisted)
  telegram: TelegramConfig;

  // Derived (computed on demand via selectors)
  filteredRows: () => Row[];

  // Actions
  loadCSV: (csvText: string) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  setTableSearch: (q: string) => void;
  setTablePage: (p: number) => void;
  setSort: (col: keyof Row) => void;
  setTelegram: (config: Partial<TelegramConfig>) => void;
  clearTelegram: () => void;
}

function defaultFilters(): Filters {
  return { dateFrom: "", dateTo: "", region: "", brand: "", outlet_id: "" };
}

export const useStore = create<DataState>()(
  persist(
    (set, get) => ({
      allRows: [],
      parseResult: null,
      loading: false,
      loadError: "",
      filters: defaultFilters(),
      tableSearch: "",
      tablePage: 1,
      sortCol: "date",
      sortDir: "desc",
      telegram: { botToken: "", chatId: "" },

      filteredRows: () => filterRows(get().allRows, get().filters),

      loadCSV: (csvText: string) => {
        set({ loading: true, loadError: "" });
        Papa.parse<Record<string, string>>(csvText.trim(), {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const fields = result.meta.fields ?? [];
            const missing = validateColumns(fields);
            if (missing.length) {
              set({
                loading: false,
                loadError: `Kolom wajib tidak ditemukan: ${missing.join(", ")}`,
              });
              return;
            }
            const parsed = processRows(result.data);
            const dates = parsed.rows.map((r) => r.date).sort();
            const dateFrom = dates[0] ?? "";
            const dateTo = dates[dates.length - 1] ?? "";
            set({
              allRows: parsed.rows,
              parseResult: parsed,
              loading: false,
              loadError: "",
              filters: { ...defaultFilters(), dateFrom, dateTo },
              tablePage: 1,
            });
          },
          error: (err: Error) => {
            set({ loading: false, loadError: `Gagal parse CSV: ${err.message}` });
          },
        });
      },

      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value }, tablePage: 1 })),

      resetFilters: () => {
        const rows = get().allRows;
        const dates = rows.map((r) => r.date).sort();
        set({
          filters: {
            ...defaultFilters(),
            dateFrom: dates[0] ?? "",
            dateTo: dates[dates.length - 1] ?? "",
          },
          tableSearch: "",
          tablePage: 1,
        });
      },

      setTableSearch: (q) => set({ tableSearch: q, tablePage: 1 }),
      setTablePage: (p) => set({ tablePage: p }),

      setSort: (col) =>
        set((s) => ({
          sortCol: col,
          sortDir: s.sortCol === col && s.sortDir === "asc" ? "desc" : "asc",
          tablePage: 1,
        })),

      setTelegram: (config) =>
        set((s) => ({ telegram: { ...s.telegram, ...config } })),

      clearTelegram: () => set({ telegram: { botToken: "", chatId: "" } }),
    }),
    {
      name: "sales-dashboard",
      // Only persist filters, sort, telegram config — not the full dataset
      partialize: (s) => ({
        filters: s.filters,
        sortCol: s.sortCol,
        sortDir: s.sortDir,
        telegram: s.telegram,
        tableSearch: s.tableSearch,
      }),
    }
  )
);
