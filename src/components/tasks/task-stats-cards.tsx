"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TaskStatus } from "@/types";
import { IconCheck, IconClock, IconList, IconProgress } from "@tabler/icons-react";

interface TaskStatsCardsProps {
  tasks: Task[];
  activeFilter?: 'all' | 'completed' | 'in_progress' | 'incomplete';
  onCardClick?: (filter: 'all' | 'completed' | 'in_progress' | 'incomplete') => void;
}

export function TaskStatsCards({ tasks, activeFilter = 'all', onCardClick }: TaskStatsCardsProps) {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const totalTasks = tasks.length;
  const completedTasks = getTasksByStatus("completed").length;
  const inProgressTasks = getTasksByStatus("in_progress").length;
  const incompleteTasks = tasks.filter(task => {
    if (!task.due_date) return false; // Skip tasks without due dates
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    return dueDate < today && task.status !== 'completed';
  }).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      title: "Total Tasks",
      value: totalTasks,
      description: "All tasks in the system",
      icon: IconList,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      filterKey: 'all' as const,
    },
    {
      title: "Completed",
      value: completedTasks,
      description: `${completionRate}% completion rate`,
      icon: IconCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      filterKey: 'completed' as const,
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      description: "Currently being worked on",
      icon: IconProgress,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      filterKey: 'in_progress' as const,
    },
    {
      title: "Incomplete",
      value: incompleteTasks,
      description: "Overdue and not completed",
      icon: IconClock,
      color: "text-gray-600",
      bgColor: "bg-yellow-100",
      filterKey: 'incomplete' as const,
    },
  ];

  const handleCardClick = (filterKey: 'all' | 'completed' | 'in_progress' | 'incomplete') => {
    if (onCardClick) {
      // Toggle: if clicking the same card, reset to 'all'
      if (activeFilter === filterKey) {
        onCardClick('all');
      } else {
        onCardClick(filterKey);
      }
    }
  };

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        const isActive = activeFilter === stat.filterKey;
        const isClickable = !!onCardClick;
        
        return (
          <Card 
            key={stat.title} 
            className={`
              ${stat.title === "Incomplete" && stat.value > 0 ? "bg-red-100" : "bg-white"}
              ${isClickable ? "cursor-pointer transition-all hover:shadow-md" : ""}
              ${isActive ? "ring-2 ring-primary" : ""}
            `}
            onClick={() => isClickable && handleCardClick(stat.filterKey)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shadow-none">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
