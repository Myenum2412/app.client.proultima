"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { EvaluationLogDialog } from "@/components/dashboard/evaluation-log-dialog";
import { ActiveProjectsDialog } from "@/components/dashboard/active-projects-dialog";
import { OutstandingPaymentDialog } from "@/components/dashboard/outstanding-payment-dialog";
import type { ProjectsListItem } from "@/app/api/projects/route";
import type { BillingInvoiceRow } from "@/components/billing/invoice-columns";

export function DashboardMetrics() {
  const [isEvaluationLogOpen, setIsEvaluationLogOpen] = useState(false);
  const [isActiveProjectsOpen, setIsActiveProjectsOpen] = useState(false);
  const [isOutstandingPaymentOpen, setIsOutstandingPaymentOpen] =
    useState(false);

  // Fetch projects from Supabase
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => fetchJson<ProjectsListItem[]>("/api/projects"),
    staleTime: 60_000,
  });

  // Fetch invoices from Supabase
  const { data: invoicesData } = useQuery({
    queryKey: queryKeys.billingInvoices(),
    queryFn: () =>
      fetchJson<{ data: BillingInvoiceRow[]; pagination: any }>(
        "/api/billing/invoices?page=1&pageSize=1000"
      ),
    staleTime: 60_000,
  });

  const invoices = invoicesData?.data ?? [];

  // Calculate metrics from real data
  const totalActiveProjects = projects.length;

  const detailingInProcess = projects.filter(
    (p) => p.detailingStatus === "IN PROCESS"
  ).length;

  const revisionInProcess = projects.filter(
    (p) => p.revisionStatus === "IN PROCESS"
  ).length;

  const releasedJobs = projects.filter((p) =>
    p.releaseStatus?.includes("RELEASED")
  ).length;

  // Calculate total estimated tons for projects not yet detailed
  const yetToBeDetailedTons = projects
    .filter((p) => p.detailingStatus !== "COMPLETED")
    .reduce((sum, p) => sum + (p.estimatedTons ?? 0), 0);

  // Calculate total released tons from projects (use releasedTons field)
  const totalReleasedTons = projects.reduce(
    (sum, p) => sum + (p.releasedTons ?? 0),
    0
  );

  // Calculate total estimated tons
  const totalEstimatedTons = projects.reduce(
    (sum, p) => sum + (p.estimatedTons ?? 0),
    0
  );

  // Job Availability (percentage of released vs estimated)
  const jobAvailability =
    totalEstimatedTons > 0
      ? Math.round((totalReleasedTons / totalEstimatedTons) * 100)
      : 0;

  // Calculate outstanding payments (total amount billed from all invoices)
  // Assuming all invoices are outstanding unless paid
  const outstandingPayment = invoices.reduce(
    (sum, inv) => sum + inv.totalAmountBilled,
    0
  );

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const metrics = [
    {
      label: "Total Active Projects",
      value: totalActiveProjects.toString(),
      unit: "",
      clickable: true,
      onClick: () => setIsActiveProjectsOpen(true),
    },
    {
      label: "Detailing in Process",
      value: detailingInProcess.toString(),
      unit: "",
    },
    {
      label: "Revision in Process",
      value: revisionInProcess.toString(),
      unit: "",
    },
    {
      label: "Released Jobs",
      value: releasedJobs.toString(),
      unit: "",
    },
    {
      label: "Yet to be Detailed Tons",
      value: yetToBeDetailedTons.toFixed(1),
      unit: "Tons",
      clickable: true,
      onClick: () => setIsEvaluationLogOpen(true),
    },
    {
      label: "Job Availability",
      value: jobAvailability.toString(),
      unit: "%",
      labelColor: "text-green-700 dark:text-green-400",
    },
    {
      label: "Outstanding Payment",
      value: money.format(outstandingPayment),
      unit: "",
      labelColor: "text-red-700 dark:text-red-400",
      clickable: true,
      onClick: () => setIsOutstandingPaymentOpen(true),
    },
  ];

  return (
    <Card className="w-full shadow-lg overflow-hidden relative ">
      <div className="absolute inset-0 h-full w-full bg-section opacity-70 " />
      <CardHeader className="relative overflow-hidden">
        <div className="relative">
          <h1 className="text-xl font-semibold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Project metrics and statistics
          </p>
        </div>
      </CardHeader>
      <CardContent >
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`flex flex-col p-4 rounded-lg border bg-background/50 backdrop-blur-sm ${
                metric.clickable
                  ? "cursor-pointer hover:bg-background/70 transition-colors"
                  : ""
              }`}
              onClick={metric.onClick}
              role={metric.clickable ? "button" : undefined}
              tabIndex={metric.clickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (
                  metric.clickable &&
                  metric.onClick &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  metric.onClick();
                }
              }}
            >
              <div
                className={`text-sm mb-2 font-medium ${
                  metric.labelColor || "text-muted-foreground"
                }`}
              >
                {metric.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                {metric.unit && (
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <EvaluationLogDialog
        open={isEvaluationLogOpen}
        onOpenChange={setIsEvaluationLogOpen}
      />
      <ActiveProjectsDialog
        open={isActiveProjectsOpen}
        onOpenChange={setIsActiveProjectsOpen}
      />
      <OutstandingPaymentDialog
        open={isOutstandingPaymentOpen}
        onOpenChange={setIsOutstandingPaymentOpen}
      />
    </Card>
  );
}
