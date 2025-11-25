"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskSearch } from "./task-search";
import { TaskStatusFilter } from "./task-status-filter";
import { TaskPriorityFilter } from "./task-priority-filter";
import { useTaskPriorities } from "@/hooks/use-task-priorities";
import { TaskStatus, TaskPriority } from "@/types";
import { IconX } from "@tabler/icons-react";
import { useMemo } from "react";

interface TaskFilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TaskStatus | "all";
  onStatusChange: (status: TaskStatus | "all") => void;
  priorityFilter: TaskPriority | "all";
  onPriorityChange: (priority: TaskPriority | "all") => void;
  onClearFilters: () => void;
}

export function TaskFilterControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  onClearFilters,
}: TaskFilterControlsProps) {
  const { priorities } = useTaskPriorities();

  // Create color map for quick lookup
  const priorityColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    priorities.forEach(p => {
      map[p.name] = p.color;
    });
    return map;
  }, [priorities]);

  const hasActiveFilters = 
    searchQuery !== "" || 
    statusFilter !== "all" || 
    priorityFilter !== "all";

  const getStatusBadgeColor = (status: TaskStatus | "all") => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "todo":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "backlog":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityBadgeColor = (priority: TaskPriority | "all") => {
    if (priority === "all") return "bg-gray-100 text-gray-800 border-gray-200";
    
    const color = priorityColorMap[priority] || 'gray';
    const colorClasses: Record<string, string> = {
      red: "bg-red-100 text-red-800 border-red-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorClasses[color] || colorClasses.gray;
  };

  const getStatusLabel = (status: TaskStatus | "all") => {
    switch (status) {
      case "backlog": return "Backlog";
      case "todo": return "To Do";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      default: return "All Status";
    }
  };

  const getPriorityLabel = (priority: TaskPriority | "all") => {
    if (priority === "all") return "All Priority";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search Input */}
          <TaskSearch onSearchChange={onSearchChange} />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <TaskStatusFilter
              value={statusFilter}
              onValueChange={onStatusChange}
            />

            <TaskPriorityFilter
              value={priorityFilter}
              onValueChange={onPriorityChange}
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="flex items-center gap-1"
              >
                <IconX className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {searchQuery && (
                <Badge variant="outline" className="text-xs">
                  Search: &quot;{searchQuery}&quot;
                </Badge>
              )}
              
              {statusFilter !== "all" && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusBadgeColor(statusFilter)}`}
                >
                  Status: {getStatusLabel(statusFilter)}
                </Badge>
              )}
              
              {priorityFilter !== "all" && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityBadgeColor(priorityFilter)}`}
                >
                  Priority: {getPriorityLabel(priorityFilter)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
