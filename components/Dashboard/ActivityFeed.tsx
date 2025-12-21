"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useProjects } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityData {
  label: string;
  value: number;
  color: string;
  size: number;
  current: number;
  target: number;
  unit: string;
}

interface CircleProgressProps {
  data: ActivityData;
  index: number;
}

const CircleProgress = ({ data, index }: CircleProgressProps) => {
  const strokeWidth = 16;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - data.value) / 100) * circumference;

  const gradientId = `gradient-${data.label.toLowerCase()}`;
  const gradientUrl = `url(#${gradientId})`;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
    >
      <div className="relative">
        <svg
          width={data.size}
          height={data.size}
          viewBox={`0 0 ${data.size} ${data.size}`}
          className="transform -rotate-90"
          aria-label={`${data.label} Activity Progress - ${data.value}%`}
        >
          <title>{`${data.label} Activity Progress - ${data.value}%`}</title>

          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: data.color,
                  stopOpacity: 1,
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor:
                    data.color === "#FF2D55"
                      ? "#FF6B8B"
                      : data.color === "#A3F900"
                      ? "#C5FF4D"
                      : "#4DDFED",
                  stopOpacity: 1,
                }}
              />
            </linearGradient>
          </defs>

          <circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-200/50 dark:text-zinc-800/50"
          />

          <motion.circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke={gradientUrl}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{
              duration: 1.8,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 6px rgba(0,0,0,0.15))",
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

const DetailedActivityInfo = ({ activities }: { activities: ActivityData[] }) => {
  return (
    <motion.div
      className="flex flex-col gap-6 ml-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {activities.map((activity) => (
        <motion.div key={activity.label} className="flex flex-col">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {activity.label}
          </span>
          <span
            className="text-2xl font-semibold"
            style={{ color: activity.color }}
          >
            {activity.current}/{activity.target}
            <span className="text-base ml-1 text-zinc-600 dark:text-zinc-400">
              {activity.unit}
            </span>
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

const ActivityFeed = ({ className }: { className?: string }) => {
  const { data: projects, isLoading, error } = useProjects();

  const activities = useMemo(() => {
    if (!projects || projects.length === 0) {
      return [
        {
          label: "COMPLETION",
          value: 0,
          color: "#FF2D55",
          size: 200,
          current: 0,
          target: 100,
          unit: "%",
        },
        {
          label: "DETALING",
          value: 0,
          color: "#A3F900",
          size: 160,
          current: 0,
          target: 100,
          unit: "%",
        },
        {
          label: "RELEASE",
          value: 0,
          color: "#04C7DD",
          size: 120,
          current: 0,
          target: 100,
          unit: "%",
        },
      ];
    }

    // Calculate aggregate metrics from all projects
    let totalEstimatedTons = 0;
    let totalDetailedTons = 0;
    let totalReleasedTons = 0;
    let totalCompletionPercentage = 0;

    let totalDetailingPercent = 0;
    let totalReleasePercent = 0;

    projects.forEach((project: any) => {
      const estimatedTons = Number(project.estimatedTons) || 0;
      const detailedTons = Number(project.detailedTonsPerApproval) || 0;
      const releasedTons = Number(project.releasedTons) || 0;
      
      // Use pre-calculated percentages if available, otherwise calculate
      const detailingPct = Number(project.detailedTonsPerApprovalPercent) || 
        (estimatedTons > 0 ? (detailedTons / estimatedTons) * 100 : 0);
      const releasePct = Number(project.releasedTonsPercent) || 
        (estimatedTons > 0 ? (releasedTons / estimatedTons) * 100 : 0);

      totalEstimatedTons += estimatedTons;
      totalDetailedTons += detailedTons;
      totalReleasedTons += releasedTons;
      totalDetailingPercent += detailingPct;
      totalReleasePercent += releasePct;
      totalCompletionPercentage += detailingPct; // Use detailing as completion metric
    });

    // Calculate averages
    const avgCompletion = projects.length > 0 ? totalCompletionPercentage / projects.length : 0;
    const avgDetailingPercentage = projects.length > 0 ? totalDetailingPercent / projects.length : 0;
    const avgReleasePercentage = projects.length > 0 ? totalReleasePercent / projects.length : 0;
    
    // Fallback to aggregate calculation if needed
    const detailingPercentage = avgDetailingPercentage || 
      (totalEstimatedTons > 0 ? (totalDetailedTons / totalEstimatedTons) * 100 : 0);
    const releasePercentage = avgReleasePercentage ||
      (totalEstimatedTons > 0 ? (totalReleasedTons / totalEstimatedTons) * 100 : 0);

    return [
      {
        label: "COMPLETION",
        value: Math.min(100, Math.max(0, Math.round(avgCompletion))),
        color: "#FF2D55",
        size: 200,
        current: Math.min(100, Math.max(0, Math.round(avgCompletion))),
        target: 100,
        unit: "%",
      },
      {
        label: "DETALING",
        value: Math.min(100, Math.max(0, Math.round(detailingPercentage))),
        color: "#A3F900",
        size: 160,
        current: Math.min(100, Math.max(0, Math.round(detailingPercentage))),
        target: 100,
        unit: "%",
      },
      {
        label: "RELEASE",
        value: Math.min(100, Math.max(0, Math.round(releasePercentage))),
        color: "#04C7DD",
        size: 120,
        current: Math.min(100, Math.max(0, Math.round(releasePercentage))),
        target: 100,
        unit: "%",
      },
    ];
  }, [projects]);

  if (isLoading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex flex-col items-center gap-8">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center">
            <div className="relative w-[180px] h-[180px]">
              <Skeleton className="w-full h-full rounded-full" />
            </div>
            <div className="flex flex-col gap-6 ml-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Failed to load activity data</p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-3xl mx-auto p-8 rounded-3xl",
        "text-zinc-900 dark:text-white bg-card border shadow-sm",
        className
      )}
    >
      <div className="flex flex-col items-center gap-8">
        <motion.h2
          className="text-2xl font-medium text-zinc-900 dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Project Activity
        </motion.h2>

        <div className="flex items-center">
          <div className="relative w-[180px] h-[180px]">
            {activities.map((activity, index) => (
              <CircleProgress
                key={activity.label}
                data={activity}
                index={index}
              />
            ))}
          </div>
          <DetailedActivityInfo activities={activities} />
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
