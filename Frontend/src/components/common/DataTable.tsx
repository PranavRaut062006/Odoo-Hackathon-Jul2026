import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKeys,
  pageSize = 8,
  toolbar,
  onRowClick,
  emptyLabel = "No results",
}: {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const filtered = useMemo(() => {
    let rows = data;
    if (q && searchKeys?.length) {
      const term = q.toLowerCase();
      rows = rows.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(term)),
      );
    }
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sort.key] ?? "");
        const bv = String((b as Record<string, unknown>)[sort.key] ?? "");
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, q, searchKeys, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="rounded-2xl border bg-card card-elevated overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b">
        {searchKeys && (
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="max-w-xs h-9"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={cn("text-left font-medium px-4 py-2.5", c.className)}
                >
                  <button
                    className={cn(
                      "inline-flex items-center gap-1",
                      c.sortable && "hover:text-foreground",
                    )}
                    onClick={() => {
                      if (!c.sortable) return;
                      const k = String(c.key);
                      setSort((s) =>
                        s?.key === k
                          ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" }
                          : { key: k, dir: "asc" },
                      );
                    }}
                  >
                    {c.header}
                    {c.sortable && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-muted-foreground">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              current.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-accent/50" : "hover:bg-accent/30",
                  )}
                >
                  {columns.map((c) => (
                    <td key={String(c.key)} className={cn("px-4 py-3 align-middle", c.className)}>
                      {c.render
                        ? c.render(row)
                        : String((row as Record<string, unknown>)[c.key as string] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground">
        <div>
          Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of{" "}
          {filtered.length}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 font-medium text-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
