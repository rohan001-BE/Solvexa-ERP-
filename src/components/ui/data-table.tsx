"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ElementType;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Search records...",
  searchFilter,
  filterSlot,
  actionsSlot,
  emptyTitle = "No records found",
  emptySubtitle = "Try adjusting your filters or search query.",
  emptyIcon: EmptyIcon = Inbox,
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    if (searchFilter) {
      return data.filter((item) => searchFilter(item, search.toLowerCase()));
    }
    // Default search across all string values
    return data.filter((item) =>
      Object.values(item).some(
        (val) =>
          typeof val === "string" && val.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search, searchFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  return (
    <div className="space-y-4">
      {/* Control Bar: Search + Filter Slot + Action Slot */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {searchFilter && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl pl-9 pr-3.5 py-2.5 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          )}
          {filterSlot}
        </div>

        {actionsSlot && <div className="flex items-center gap-2">{actionsSlot}</div>}
      </div>

      {/* Table Container */}
      <div className="solvexa-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-purple-600" />
            <p className="text-xs font-medium text-slate-600">Loading data from database...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 border border-purple-100">
              <EmptyIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">{emptyTitle}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{emptySubtitle}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={`px-4 py-3.5 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${col.className || ""}`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedData.map((row, rowIdx) => (
                  <tr
                    key={row.id || rowIdx}
                    className="hover:bg-purple-50/40 transition-colors group"
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-4 py-3.5 ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left"
                        } ${col.className || ""}`}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? "—")
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(page * pageSize, filteredData.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{filteredData.length}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-purple-700 shadow-sm">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
