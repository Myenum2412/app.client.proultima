"use client";

import { useState } from "react";
import { useSubmissions } from "@/lib/hooks/use-api";
import { SectionTableCard } from "@/components/projects/section-table-card";
import {
  upcomingSubmissionColumns,
  type SubmissionRow,
} from "@/components/projects/sections";
import { PaginationControls } from "@/components/ui/pagination-controls";

export function SubmissionsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: submissionsData, isLoading } = useSubmissions({
    page,
    pageSize,
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load submissions." },
  });

  const submissions = submissionsData?.data ?? [];
  const pagination = submissionsData?.pagination;

  return (
    <SectionTableCard
      title="All Submissions"
      data={submissions}
      columns={upcomingSubmissionColumns}
      exportFilename="submissions.csv"
      search={{ columnId: "workDescription", placeholder: "Search submissions..." }}
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
              setPage(1);
            }}
          />
        ) : undefined
      }
    />
  );
}

