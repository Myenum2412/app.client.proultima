"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, RefreshCw } from "lucide-react";
import { TaskAllocationDialog } from "./task-allocation-dialog";
import { TasksTable } from "./tasks-table";
import { TaskStatsCards } from "./task-stats-cards";
import { TaskStaffFilter } from "./task-staff-filter";
import { useTasks } from "@/hooks/use-tasks";
import { useStaff } from "@/hooks/use-staff";
import { TaskStatus, TaskPriority } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export function TasksManagement() {
  const { 
    tasks, 
    isLoading, 
    deleteTask
  } = useTasks();
  const { staff } = useStaff();
  
  // Local state for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [staffFilter, setStaffFilter] = useState<string | "all">("all");
  const [cardFilter, setCardFilter] = useState<'all' | 'completed' | 'in_progress' | 'incomplete'>('all');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle task delete
  const handleTaskDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  // Simplified refresh function - data updates automatically via real-time subscriptions
  const handleRefresh = () => {
    // No-op: real-time subscriptions handle updates automatically
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesStaff = staffFilter === "all" || task.assigned_staff_ids?.includes(staffFilter);
    
    // Card filter logic
    let matchesCardFilter = true;
    if (cardFilter !== 'all') {
      if (cardFilter === 'completed') {
        matchesCardFilter = task.status === 'completed';
      } else if (cardFilter === 'in_progress') {
        matchesCardFilter = task.status === 'in_progress';
      } else if (cardFilter === 'incomplete') {
        // Incomplete: overdue and not completed
        if (!task.due_date) {
          matchesCardFilter = false;
        } else {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          matchesCardFilter = dueDate < today && task.status !== 'completed';
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesStaff && matchesCardFilter;
  });

  // Debug logging
  // console.log('🔍 TasksManagement Debug:', {
  //   tasks: tasks,
  //   tasksLength: tasks?.length,
  //   isLoading,
  //   filteredTasks: filteredTasks,
  //   filteredTasksLength: filteredTasks?.length,
  //   searchQuery,
  //   statusFilter,
  //   priorityFilter
  // });

  // Don't render until we're on the client side
  if (!isClient) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Task Management</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all your tasks in one place
          </p>
        </div>
        
        <div className="flex flex-row gap-2">
          
          <TaskAllocationDialog 
            trigger={
              <Button className="w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <TaskStatsCards 
          tasks={tasks} 
          activeFilter={cardFilter}
          onCardClick={setCardFilter}
        />
      )}

      {/* Filters & Search */}
      <div className="flex flex-col  sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
      <div className="flex items-center gap-x-3">
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {/* Staff Filter */}
        <TaskStaffFilter 
          value={staffFilter} 
          onValueChange={setStaffFilter} 
        />
      </div>
      </div>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <TasksTable tasks={filteredTasks} onDelete={handleTaskDelete} />
      )}
    </div>
  );
}
