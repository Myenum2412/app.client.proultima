"use client";

import { useState } from "react";
import { Building2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EvaluationLogDialog } from "@/components/dashboard/evaluation-log-dialog";

function PercentPill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-emerald-200 px-2.5 py-1 text-sm font-semibold text-emerald-900">
      {value}
    </span>
  );
}

function StatusPill({
  label,
  variant = "success",
}: {
  label: string;
  variant?: "success" | "neutral";
}) {
  if (variant === "success") {
    return (
      <Badge className="bg-emerald-600 text-white border-transparent px-4 py-1">
        {label}
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-600 text-white border-transparent px-4 py-1">
      {label}
    </Badge>
  );
}

export type ProjectOverviewData = {
  projectName: string;
  jobNumber: string;
  fabricatorName?: string | null;
  contractorName?: string | null;
  projectLocation?: string | null;
  estimatedTons?: number | null;
  approvalTons?: number | null;
  latestRevTons?: number | null;
  releasedTons?: number | null;
  detailingStatus?: string | null;
  revisionStatus?: string | null;
  releaseStatus?: string | null;
};

export function ProjectOverview({ data }: { data: ProjectOverviewData }) {
  const [isEvaluationLogOpen, setIsEvaluationLogOpen] = useState(false);
  
  const estimated = data.estimatedTons ?? null;
  const approval = data.approvalTons ?? null;
  const latest = data.latestRevTons ?? null;
  const released = data.releasedTons ?? null;

  const pct = (numerator: number | null, denom: number | null) => {
    if (!numerator || !denom || denom === 0) return null;
    return Math.round((numerator / denom) * 100);
  };

  const approvalPct = pct(approval, estimated);
  const releasedPct = pct(released, estimated);

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">
              {data.projectName}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">Job Number</div>
            <div className="mt-1 text-base font-semibold">{data.jobNumber}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Fabricator Name</div>
            <div className="mt-1 text-base font-semibold">
              {data.fabricatorName ?? "—"}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Contractor Name</div>
            <div className="mt-1 flex items-center gap-2 text-base font-semibold">
              <Building2 className="size-4 text-muted-foreground" />
              {data.contractorName ?? "—"}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Project Location</div>
            <div className="mt-1 flex items-center gap-2 text-base font-semibold">
              <MapPin className="size-4 text-muted-foreground" />
              {data.projectLocation ?? "—"}
            </div>
          </div>

          <div
            className="cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
            onClick={() => setIsEvaluationLogOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsEvaluationLogOpen(true);
              }
            }}
          >
            <div className="text-sm text-muted-foreground">Estimated Tons</div>
            <div className="mt-1 text-base font-semibold">
              {estimated == null ? "—" : estimated.toFixed(1)}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">
              Detailed Tons per Approval dwgs
            </div>
            <div className="mt-1 flex items-center gap-3 text-base font-semibold">
              {approval == null ? "—" : approval.toFixed(2)}{" "}
              {approvalPct == null ? null : <PercentPill value={`${approvalPct}%`} />}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">
              Detailed Tons per latest Rev/FFU
            </div>
            <div className="mt-1 text-base font-semibold">
              {latest == null ? "—" : latest.toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">
              Released Tons (so far)
            </div>
            <div className="mt-1 flex items-center gap-3 text-base font-semibold">
              {released == null ? "—" : released.toFixed(2)}{" "}
              {releasedPct == null ? null : <PercentPill value={`${releasedPct}%`} />}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Detailing Status</div>
            <div className="mt-2">
              <StatusPill label={data.detailingStatus ?? "—"} variant="success" />
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Revision Status</div>
            <div className="mt-2">
              <StatusPill label={data.revisionStatus ?? "—"} variant="success" />
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Release Status</div>
            <div className="mt-2">
              <StatusPill label={data.releaseStatus ?? "—"} variant="neutral" />
            </div>
          </div>
        </div>
      </CardContent>
      <EvaluationLogDialog
        open={isEvaluationLogOpen}
        onOpenChange={setIsEvaluationLogOpen}
      />
    </Card>
  );
}


