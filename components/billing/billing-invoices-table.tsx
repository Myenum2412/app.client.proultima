"use client";

import { useState } from "react";
import { useBillingInvoices } from "@/lib/hooks/use-api";
import { SectionTableCard } from "@/components/projects/section-table-card";
import {
  billingInvoiceColumns,
  type BillingInvoiceRow,
} from "@/components/billing/invoice-columns";
import { InvoiceDetailsDrawer } from "./invoice-details-drawer";
import { PaginationControls } from "@/components/ui/pagination-controls";

export function BillingInvoicesTable() {
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoiceRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: invoicesData, isLoading } = useBillingInvoices({
    page,
    pageSize,
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load invoices." },
  });

  const handleOpenDrawer = (row: BillingInvoiceRow) => {
    setSelectedInvoice(row);
    setIsDrawerOpen(true);
  };

  const invoices = invoicesData?.data ?? [];
  const pagination = invoicesData?.pagination;

  // Create columns with callback
  const columnsWithActions = billingInvoiceColumns(handleOpenDrawer);

  return (
    <>
      <SectionTableCard
        title="Invoice History"
        data={invoices}
        columns={columnsWithActions}
        exportFilename="billing-invoices.csv"
        onRowClick={handleOpenDrawer}
        isLoading={isLoading}
        pagination={
          pagination ? (
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1); // Reset to first page when changing page size
              }}
            />
          ) : undefined
        }
      />
      <InvoiceDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        invoice={selectedInvoice}
      />
    </>
  );
}


