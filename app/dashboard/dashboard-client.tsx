"use client";

import { useQuery } from "@tanstack/react-query";

import Loader from "@/components/kokonutui/loader";
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { ScheduleMeetingForm } from "@/components/dashboard/schedule-meeting-form";

type MeResponse = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
};

export function DashboardClient({ initialMe }: { initialMe: MeResponse }) {
  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => fetchJson<MeResponse>("/api/me"),
    initialData: initialMe,
    staleTime: 5 * 60_000,
    meta: { errorMessage: "Failed to load your account." },
  });

  const me = meQuery.data;

  if (!me) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader title="Loading your account..." subtitle="Please wait" size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meQuery.isFetching ? (
        <div className="text-xs text-muted-foreground">Refreshing…</div>
      ) : null}
      <DashboardMetrics />
      <ScheduleMeetingForm />
    </div>
  );
}


