"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import { DataTable } from "@/components/data-table/data-table";
import type { Payment } from "@/components/data-table/payments-columns";
import { paymentColumns } from "@/components/data-table/payments-columns";

export function PaymentsTable() {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.payments(),
    queryFn: () => fetchJson<Payment[]>("/api/payments"),
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load payments." },
  });

  return (
    <DataTable
      columns={paymentColumns}
      data={data}
      filterColumnId="email"
      filterPlaceholder="Filter emails..."
    />
  );
}


