"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MaterialListManagementCard,
  type MaterialListBlock,
} from "@/components/projects/project-table-card";

type ApiResponse = { title: string; blocks: MaterialListBlock[] };

export function ProjectMaterialListManagement({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.projectMaterialLists(projectId),
    queryFn: () =>
      fetchJson<ApiResponse>(
        `/api/projects/${encodeURIComponent(projectId)}/material-lists`
      ),
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load material lists." },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const blocks = data?.blocks ?? [];
  if (!blocks.length) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <MaterialListManagementCard title={data?.title} blocks={blocks} />
    </div>
  );
}


