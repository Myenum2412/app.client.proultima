"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ReleaseStatus = "Partially Released" | "Yet to Be Released";

interface ReleaseStatusSelectorProps {
  value: string;
  onChange?: (value: ReleaseStatus) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

const statusConfig: Record<ReleaseStatus, { color: string; bgColor: string; label: string }> = {
  "Partially Released": {
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    label: "Partially Released",
  },
  "Yet to Be Released": {
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    label: "Yet to Be Released",
  },
};

export function ReleaseStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status as ReleaseStatus;
  const config = statusConfig[normalizedStatus] || {
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    label: status,
  };

  return (
    <Badge
      className={cn(
        "border-transparent font-medium",
        config.bgColor,
        config.color
      )}
    >
      {config.label}
    </Badge>
  );
}

export function ReleaseStatusSelector({
  value,
  onChange,
  disabled = false,
  className,
  showLabel = false,
}: ReleaseStatusSelectorProps) {
  const currentStatus = (value === "Partially Released" || value === "Yet to Be Released")
    ? (value as ReleaseStatus)
    : "Yet to Be Released";

  const handleChange = (newValue: string) => {
    if (onChange && (newValue === "Partially Released" || newValue === "Yet to Be Released")) {
      onChange(newValue as ReleaseStatus);
    }
  };

  // If no onChange handler, just show badge (read-only mode)
  if (!onChange) {
    return <ReleaseStatusBadge status={currentStatus} />;
  }
  
  if (disabled) {
    return <ReleaseStatusBadge status={currentStatus} />;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Status:</span>
      )}
      <Select value={currentStatus} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue>
            <ReleaseStatusBadge status={currentStatus} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Partially Released">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Partially Released</span>
            </div>
          </SelectItem>
          <SelectItem value="Yet to Be Released">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span>Yet to Be Released</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

