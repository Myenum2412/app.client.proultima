"use client";

import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import { DataTablePro } from "@/components/data-table/data-table-pro";
import type { DrawingRow } from "@/components/data-table/drawings-columns";
import { drawingsColumns } from "@/components/data-table/drawings-columns";

export function DrawingsTable() {
  const { data: response } = useSuspenseQuery({
    queryKey: [...queryKeys.drawings(), 'all'],
    queryFn: () => fetchJson<{ data: DrawingRow[]; pagination: any }>("/api/drawings?page=1&pageSize=1000"),
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load drawings." },
  });

  // Extract data array from paginated response
  const data = response?.data ?? [];

  // Ensure stable identity for TanStack Table (avoid unnecessary resets).
  const rows = useMemo(() => data, [data]);

  return (
    <DataTablePro
      columns={drawingsColumns}
      data={rows}
      searchColumnId="description"
      searchPlaceholder="Search drawings..."
      exportFilename="drawings.csv"
      filterLabel="Filter"
      headerClassName="bg-emerald-50/70"
      renderFilterMenu={(table) => (
        <>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              table.getColumn("status")?.setFilterValue(undefined);
            }}
          >
            All statuses
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {(["APP", "REV", "PND", "REJ"] as const).map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={(e) => {
                e.preventDefault();
                table.getColumn("status")?.setFilterValue(s);
              }}
            >
              {s}
            </DropdownMenuItem>
          ))}
        </>
      )}
    />
  );
}


