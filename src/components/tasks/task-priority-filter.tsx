"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskPriorities } from "@/hooks/use-task-priorities";
import { TaskPriority } from "@/types";

interface TaskPriorityFilterProps {
  value: TaskPriority | "all";
  onValueChange: (value: TaskPriority | "all") => void;
  label?: string;
}

export function TaskPriorityFilter({ 
  value, 
  onValueChange, 
  label = "Priority" 
}: TaskPriorityFilterProps) {
  const { priorities } = useTaskPriorities();

  const priorityOptions = [
    { value: "all", label: "All Priority" },
    ...priorities.map(p => ({ 
      value: p.name, 
      label: p.name.charAt(0).toUpperCase() + p.name.slice(1) 
    }))
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {priorityOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
