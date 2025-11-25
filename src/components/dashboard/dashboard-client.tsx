"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, MoreVertical, Edit, Trash2, Users, Clock, AlertCircle, ListTodo,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast,
  Circle, CheckCircle, CircleHelp, ChevronsUp, Eye, Calendar as CalendarIcon
} from "lucide-react";
import { TaskAllocationDialog } from "@/components/tasks/task-allocation-dialog";
import { TeamFormDialog } from "@/components/teams/team-form-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { AttendanceWidget } from "@/components/admin/attendance-widget";
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog";
import type { Task } from "@/types";
import { useTasks } from "@/hooks/use-tasks";
import { useStaff } from "@/hooks/use-staff";
import { useTeams } from "@/hooks/use-teams";
import { useRouter } from "next/navigation";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  PaginationState,
  Row,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type DateRange } from "react-day-picker";

// Chart configuration
const statusChartConfig = {
  count: { label: "Tasks" },
  completed: { label: "Completed", color: "hsl(142, 76%, 36%)" }, // Green
  inProgress: { label: "In Progress", color: "hsl(217, 91%, 60%)" }, // Blue
  todo: { label: "To Do", color: "hsl(45, 93%, 47%)" }, // Yellow
  backlog: { label: "Backlog", color: "hsl(215, 20%, 65%)" }, // Gray
};

const priorityChartConfig = {
  tasks: { label: "Tasks" },
  urgent: { label: "Urgent", color: "hsl(var(--chart-1))" },
  high: { label: "High", color: "hsl(var(--chart-2))" },
  medium: { label: "Medium", color: "hsl(var(--chart-3))" },
  low: { label: "Low", color: "hsl(var(--chart-4))" },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "todo":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    case "backlog":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "medium":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "low":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

const getNextRunTime = (repeatConfig: any) => {
  if (!repeatConfig) return 'Not configured';
  
  const { frequency, interval, custom_days, end_date } = repeatConfig;
  const today = new Date();
  
  if (end_date && today > new Date(end_date)) {
    return 'Ended';
  }
  
  switch (frequency) {
    case 'daily':
      return `Every ${interval} day${interval > 1 ? 's' : ''}`;
    case 'weekly':
      if (custom_days && custom_days.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = custom_days.map((day: number) => dayNames[day]).join(', ');
        return `Weekly (${days})`;
      }
      return `Every ${interval} week${interval > 1 ? 's' : ''}`;
    case 'monthly':
      return `Monthly (${interval}${getOrdinalSuffix(interval)})`;
    case 'custom':
      if (custom_days && custom_days.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = custom_days.map((day: number) => dayNames[day]).join(', ');
        return `Custom (${days})`;
      }
      return 'Custom schedule';
    default:
      return 'Unknown';
  }
};

const getOrdinalSuffix = (num: number) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

const formatStatus = (status: string) => {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "todo":
      return "To Do";
    case "backlog":
      return "Backlog";
    case "completed":
      return "Completed";
    default:
      return status;
  }
};

export function DashboardClient() {
  const queryClient = useQueryClient();
  const { tasks, deleteTask } = useTasks();
  const { staff, deleteStaff } = useStaff();
  const { teams, teamMembers, deleteTeam } = useTeams();
  const router = useRouter();
  
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [priorityTimeRange, setPriorityTimeRange] = useState("30d");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  
  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Listen for real-time data updates using broadcast sync
  useEffect(() => {
    const handleDataUpdate = () => {
      // Use centralized invalidation helper
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    };

    // Listen for custom dataUpdated event
    window.addEventListener('dataUpdated', handleDataUpdate);

    // Set up fallback polling (reduced frequency since we have real-time)
    const intervalId = setInterval(() => {
      handleDataUpdate();
    }, 30000); // Refetch every 30 seconds as fallback

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      clearInterval(intervalId);
    };
  }, [queryClient]);

  // Calculate stats from offline data
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Helper functions to format date ranges
  const formatWeekRange = () => {
    return `${weekAgo.getDate()} - ${now.getDate()}`;
  };

  const formatMonthRange = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = monthNames[monthAgo.getMonth()];
    const endMonth = monthNames[now.getMonth()];
    return startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
  };

  const formatYear = () => {
    return now.getFullYear().toString();
  };

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
    inProgressTasks: tasks.filter((t: any) => t.status === 'in_progress').length,
    todoTasks: tasks.filter((t: any) => t.status === 'todo').length,
    backlogTasks: tasks.filter((t: any) => t.status === 'backlog').length,
    todayTasks: tasks.filter((t: any) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      // Compare only dates (ignore time)
      return dueDate.toDateString() === today.toDateString();
    }).length,
    todayCompletedTasks: tasks.filter((t: any) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString() && t.status === 'completed';
    }).length,
    todayInProgressTasks: tasks.filter((t: any) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString() && t.status === 'in_progress';
    }).length,
    todayTodoTasks: tasks.filter((t: any) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString() && t.status === 'todo';
    }).length,
    totalStaff: staff.length,
    totalTeams: teams.length,
    urgentTasks: tasks.filter((t: any) => t.priority === 'urgent').length,
    highPriorityTasks: tasks.filter((t: any) => t.priority === 'high').length,
    overdueTasks: tasks.filter((t: any) => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== 'completed';
    }).length,
    // Time-based task statistics
    weeklyTasks: tasks.filter((t: any) => new Date(t.created_at) >= weekAgo).length,
    monthlyTasks: tasks.filter((t: any) => new Date(t.created_at) >= monthAgo).length,
    yearlyTasks: tasks.filter((t: any) => new Date(t.created_at) >= yearAgo).length,
  };

  // Prepare pie chart data for task status distribution
  const getPieChartData = (dateRange: DateRange | undefined) => {
    // Default to last 7 days if no date range is provided
    const defaultFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const defaultTo = new Date();
    const fromDate = dateRange?.from || defaultFrom;
    const toDate = dateRange?.to || defaultTo;
    
    // Filter tasks within the date range (using created_at)
    const filteredTasks = tasks.filter((t: any) => {
      const taskDate = new Date(t.created_at);
      // Set time to start of day for comparison (without mutating original dates)
      const taskDateStart = new Date(taskDate);
      taskDateStart.setHours(0, 0, 0, 0);
      const fromDateStart = new Date(fromDate);
      fromDateStart.setHours(0, 0, 0, 0);
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      
      return taskDateStart >= fromDateStart && taskDateStart <= toDateEnd;
    });
    
    return [
      { 
        status: "Completed", 
        count: filteredTasks.filter((t: any) => t.status === 'completed').length,
        fill: "var(--color-completed)" 
      },
      { 
        status: "In Progress", 
        count: filteredTasks.filter((t: any) => t.status === 'in_progress').length,
        fill: "var(--color-inProgress)" 
      },
      { 
        status: "To Do", 
        count: filteredTasks.filter((t: any) => t.status === 'todo').length,
        fill: "var(--color-todo)" 
      },
      { 
        status: "Backlog", 
        count: filteredTasks.filter((t: any) => t.status === 'backlog').length,
        fill: "var(--color-backlog)" 
      },
    ];
  };

  const pieChartData = getPieChartData(dateRange);
  const totalTasksInPeriod = pieChartData.reduce((sum, item) => sum + item.count, 0);

  // Get period description for chart
  const getPeriodDescription = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from || !dateRange?.to) {
      return "Last 7 days";
    }
    // Format dates as "dd/MM/yyyy" (day/month/year)
    return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
      backlog: {
        icon: CircleHelp,
        label: "Backlog",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
      },
      todo: {
        icon: Circle,
        label: "Todo",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      },
      in_progress: {
        icon: Clock,
        label: "In Progress",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      },
      completed: {
        icon: CheckCircle,
        label: "Completed",
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      },
    };

    const config = statusConfig[status] || statusConfig.backlog;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn("gap-1.5", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Priority Badge Component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    const priorityConfig: Record<string, { icon: any; label: string; className: string }> = {
      low: {
        icon: ChevronDown,
        label: "Low",
        className: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
      },
      medium: {
        icon: ChevronRight,
        label: "Medium",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      },
      high: {
        icon: ChevronUp,
        label: "High",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      },
      urgent: {
        icon: ChevronsUp,
        label: "Urgent",
        className: "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-800",
      },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn("gap-1.5", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Task Row Actions Component
  const TaskRowActions = ({ row }: { row: Row<any> }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/admin/tasks`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => deleteTask(row.original.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Define table columns
  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Task",
      accessorKey: "task_no",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue("task_no") ? `TASK-${row.getValue("task_no")}` : `TASK-${row.original.id.slice(0, 4).toUpperCase()}`}
        </div>
      ),
      size: 120,
    },
    {
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => <div className="font-medium max-w-[300px] truncate">{row.getValue("title")}</div>,
    },
    {
      header: "Assignee",
      accessorKey: "assignee",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div>
            {task.allocation_mode === 'team' && task.assigned_team_ids && task.assigned_team_ids.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">
                  {(() => {
                    const team = teams.find(t => t.id === task.assigned_team_ids[0]);
                    return team?.name || 'Unknown Team';
                  })()}
                </span>
                {task.assigned_team_ids.length > 1 && (
                  <span className="text-xs text-muted-foreground">+{task.assigned_team_ids.length - 1}</span>
                )}
              </div>
            ) : task.allocation_mode === 'individual' && task.assigned_staff_ids && task.assigned_staff_ids.length > 0 ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={(() => {
                      const staffMember = staff.find(s => s.id === task.assigned_staff_ids[0]);
                      return staffMember?.profile_image_url || undefined;
                    })()} 
                    alt="Staff" 
                  />
                  <AvatarFallback className="text-xs">
                    {(() => {
                      const staffMember = staff.find(s => s.id === task.assigned_staff_ids[0]);
                      return getInitials(staffMember?.name || 'U');
                    })()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {(() => {
                    const staffMember = staff.find(s => s.id === task.assigned_staff_ids[0]);
                    return staffMember?.name || 'Unknown';
                  })()}
                </span>
                {task.assigned_staff_ids.length > 1 && (
                  <span className="text-xs text-muted-foreground">+{task.assigned_staff_ids.length - 1}</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      header: "Priority",
      accessorKey: "priority",
      cell: ({ row }) => <PriorityBadge priority={row.getValue("priority")} />,
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) => {
        const date = row.getValue("due_date") as string;
        return date ? format(new Date(date), "MMM dd, yyyy") : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <TaskRowActions row={row} />,
      size: 60,
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Initialize TanStack Table
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
  });

  // Prepare time-series chart data
  const generateChartData = (days: number) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter tasks created on or before this date
      const tasksUpToDate = tasks.filter((t: any) => {
        const taskDate = new Date(t.created_at || t.updated_at || today);
        return taskDate <= date;
      });
      
      data.push({
        date: dateStr,
        completed: tasksUpToDate.filter((t: any) => t.status === 'completed').length,
        inProgress: tasksUpToDate.filter((t: any) => t.status === 'in_progress').length,
        todo: tasksUpToDate.filter((t: any) => t.status === 'todo').length,
        backlog: tasksUpToDate.filter((t: any) => t.status === 'backlog').length,
        urgent: tasksUpToDate.filter((t: any) => t.priority === 'urgent').length,
        high: tasksUpToDate.filter((t: any) => t.priority === 'high').length,
        medium: tasksUpToDate.filter((t: any) => t.priority === 'medium').length,
        low: tasksUpToDate.filter((t: any) => t.priority === 'low').length,
      });
    }
    
    return data;
  };

  const getDaysFromRange = (range: string) => {
    switch (range) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      default: return 30;
    }
  };

  // Calculate days from date range for status chart
  const getDaysFromDateRange = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from || !dateRange?.to) {
      return 7; // Default to 7 days
    }
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  };

  const statusChartData = generateChartData(getDaysFromDateRange(dateRange));
  const priorityChartData = generateChartData(getDaysFromRange(priorityTimeRange));

  const handleDeleteTask = async (taskId: string) => {
    deleteTask(taskId);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteStaff(staffId);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm("Are you sure you want to delete this team?")) {
      deleteTeam(teamId);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your tasks, staff, and teams
          </p>
        </div>
        <div className="flex flex-row gap-2 flex-wrap">
          <TaskAllocationDialog
          
          />
          <Button variant="outline" onClick={() => setIsTeamDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
          <TeamFormDialog
            isOpen={isTeamDialogOpen}
            onOpenChange={setIsTeamDialogOpen}
            onSubmit={() => {}}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    Due today
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold mb-1">Today's Task Breakdown</p>
                <div className="space-y-0.5">
                  <p className="text-xs">Completed: {stats.todayCompletedTasks} task{stats.todayCompletedTasks !== 1 ? 's' : ''}</p>
                  <p className="text-xs">In Progress: {stats.todayInProgressTasks} task{stats.todayInProgressTasks !== 1 ? 's' : ''}</p>
                  <p className="text-xs">Todo: {stats.todayTodoTasks} task{stats.todayTodoTasks !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.urgentTasks} urgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTeams} teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        {/* Task Status Distribution - Pie Chart */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-col  items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Task Status Distribution</CardTitle>
              <CardDescription>
                {getPeriodDescription(dateRange)}
              </CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    " justify-start text-left font-normal  sm:ml-auto",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className=" h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from ?? new Date()}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="rounded-lg border bg-card p-3 shadow-sm"
                />
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={statusChartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={pieChartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                  activeIndex={0}
                  activeShape={({
                    outerRadius = 0,
                    ...props
                  }: PieSectorDataItem) => (
                    <Sector {...props} outerRadius={outerRadius + 10} />
                  )}
                />
                {/* <ChartLegend content={<ChartLegendContent/>}  /> */}
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm pt-4">
            <div className="flex items-center gap-2 leading-none font-medium">
              Total: {totalTasksInPeriod} task{totalTasksInPeriod !== 1 ? 's' : ''}
            </div>
            <div className="text-muted-foreground leading-none text-center">
              Showing task status distribution for {getPeriodDescription(dateRange).toLowerCase()}
            </div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>Active team members</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage 
                          src={member.profile_image_url || undefined} 
                          alt={member.name} 
                        />
                        <AvatarFallback className="text-sm font-semibold">
                          {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/staff`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {staff.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No staff members yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Repeated Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Repeated Tasks
          </CardTitle>
          <CardDescription>Tasks that are automatically created on a schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const repeatedTasks = tasks.filter(task => task.is_repeated);
            
            if (repeatedTasks.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No repeated tasks configured</p>
                  <p className="text-sm">Create a task and enable "Repeated" to see it here</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {repeatedTasks.map((task) => {
                  const nextRun = getNextRunTime(task.repeat_config);
                  const childCount = tasks.filter(t => t.parent_task_id === task.id).length;
                  
                  return (
                    <div 
                      key={task.id} 
                      className="flex max-sm:flex-col max-sm:items-start max-sm:justify-start items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedTask(task);
                        setTaskDetailsDialogOpen(true);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.repeat_config?.frequency || 'daily'}
                          </Badge>
                          {childCount > 0 && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                              {childCount} instances
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {task.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>Task: {task.task_no}</span>
                          <span>Priority: {task.priority}</span>
                          <span>Next: {nextRun}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 max-sm:mt-3" onClick={(e) => e.stopPropagation()}>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Recent Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Latest tasks and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="h-11">
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className="flex h-full cursor-pointer items-center gap-2 select-none"
                            onClick={header.column.getToggleSortingHandler()}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="shrink-0 opacity-60 h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="shrink-0 opacity-60 h-4 w-4" />
                            ) : null}
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No tasks found. Create your first task to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
          {/* Left side - Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Center - Page info */}
          <div className="flex items-center justify-center text-sm">
            <span className="text-muted-foreground">
              <span className="text-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getRowCount()
                )}
              </span>{" "}
              of <span className="text-foreground">{table.getRowCount()}</span> tasks
            </span>
            <span className="mx-2">•</span>
            <span className="text-muted-foreground">
              Page <span className="text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{" "}
              <span className="text-foreground">{table.getPageCount()}</span>
            </span>
          </div>

          {/* Right side - Pagination buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Staff and Teams Grid */}
      <div className="grid gap-6 grid-cols-1">
        {/* Staff Card */}
        

      
      </div>

      {/* Attendance Widget */}
      <div className="mt-6">
        <AttendanceWidget />
      </div>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        isOpen={taskDetailsDialogOpen}
        onOpenChange={setTaskDetailsDialogOpen}
        onDelete={(taskId) => {
          deleteTask(taskId);
          setTaskDetailsDialogOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
