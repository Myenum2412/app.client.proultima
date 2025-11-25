'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/hooks/use-tasks';
import { useTeams } from '@/hooks/use-teams';
import { useStaff } from '@/hooks/use-staff';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { getStaffTasks } from '@/lib/team-utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListTodo, CheckCircle2, Clock, AlertCircle, Calendar, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffDashboardTasksTable } from '@/components/staff/staff-dashboard-tasks-table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart, Sector } from 'recharts';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { toast } from 'sonner';

// Chart configurations - matching admin dashboard exact colors
const statusChartConfig = {
  count: { label: "Tasks" },
  completed: { label: "Completed", color: "hsl(142, 76%, 36%)" }, // Green
  inProgress: { label: "In Progress", color: "hsl(217, 91%, 60%)" }, // Blue
  todo: { label: "To Do", color: "hsl(45, 93%, 47%)" }, // Yellow
  backlog: { label: "Backlog", color: "hsl(215, 20%, 65%)" }, // Gray
};

const requestChartConfig = {
  count: { label: "Requests" },
  pending: { label: "Pending", color: "hsl(45, 93%, 47%)" }, // Yellow
  approved: { label: "Approved", color: "hsl(142, 76%, 36%)" }, // Green
  rejected: { label: "Rejected", color: "hsl(0, 84%, 60%)" }, // Red
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tasks, isLoading, deleteTask } = useTasks();
  const { teams, teamMembers } = useTeams();
  const { staff } = useStaff();
  const { requests: maintenanceRequests } = useMaintenanceRequests();
  const { requisitions: purchaseRequisitions } = usePurchaseRequisitions();

  // Time period filters for charts
  const [taskPeriod, setTaskPeriod] = useState('7');
  const [requestPeriod, setRequestPeriod] = useState('7');

  // Listen for real-time data updates using broadcast sync
  useEffect(() => {
    const handleDataUpdate = () => {
      // Use centralized invalidation helper
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
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


  // Filter tasks assigned to current staff member (individual OR team assignments, including as leader)
  const myTasks = getStaffTasks(tasks, user?.staffId || '', teamMembers, teams);

  // Filter data by time period
  const getFilteredTasks = (days: string) => {
    const daysNum = parseInt(days);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);
    
    return myTasks.filter(t => 
      t.created_at && new Date(t.created_at) >= cutoffDate
    );
  };

  const getFilteredRequests = (days: string) => {
    const daysNum = parseInt(days);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);
    
    const filteredMaintenance = maintenanceRequests?.filter((r: any) => 
      r.staff_id === user?.staffId && r.created_at && new Date(r.created_at) >= cutoffDate
    ) || [];
    
    const filteredPurchase = purchaseRequisitions?.filter((r: any) => 
      r.staff_id === user?.staffId && r.created_at && new Date(r.created_at) >= cutoffDate
    ) || [];
    
    return { maintenance: filteredMaintenance, purchase: filteredPurchase };
  };

  // Calculate statistics - tasks assigned today (not due today)
  const todayTasks = myTasks.filter(t => {
    // Check if task was assigned today by looking at task_assignments
    const today = new Date();
    const todayString = today.toDateString();
    
    // Check if any assignment for this task was made today
    const hasAssignmentToday = t.task_assignments?.some((assignment: any) => {
      const assignmentDate = new Date(assignment.assigned_at);
      return assignmentDate.toDateString() === todayString;
    });
    
    return hasAssignmentToday;
  });

  const todoTasks = myTasks.filter(t => t.status === 'todo');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const incompleteTasks = myTasks.filter(t => t.status !== 'completed');

  // Filter requests for current staff member
  const myMaintenanceRequests = maintenanceRequests?.filter((r: any) => r.staff_id === user?.staffId) || [];
  const myPurchaseRequests = purchaseRequisitions?.filter((r: any) => r.staff_id === user?.staffId) || [];
  const totalRequests = myMaintenanceRequests.length + myPurchaseRequests.length;

  // Get filtered data for charts
  const filteredTasksForChart = getFilteredTasks(taskPeriod);
  const filteredRequestsForChart = getFilteredRequests(requestPeriod);

  // Chart data using filtered data - transformed to pie chart format (matching admin)
  const taskStatusData = [
    { 
      status: "Completed", 
      count: filteredTasksForChart.filter(t => t.status === 'completed').length,
      fill: "var(--color-completed)" 
    },
    { 
      status: "In Progress", 
      count: filteredTasksForChart.filter(t => t.status === 'in_progress').length,
      fill: "var(--color-inProgress)" 
    },
    { 
      status: "To Do", 
      count: filteredTasksForChart.filter(t => t.status === 'todo').length,
      fill: "var(--color-todo)" 
    },
    { 
      status: "Backlog", 
      count: filteredTasksForChart.filter(t => t.status === 'backlog').length,
      fill: "var(--color-backlog)" 
    },
  ];

  const requestStatusData = [
    { 
      status: "Pending", 
      count: filteredRequestsForChart.maintenance.filter((r: any) => r.status === 'pending').length + filteredRequestsForChart.purchase.filter((r: any) => r.status === 'pending').length,
      fill: "var(--color-pending)" 
    },
    { 
      status: "Approved", 
      count: filteredRequestsForChart.maintenance.filter((r: any) => r.status === 'approved').length + filteredRequestsForChart.purchase.filter((r: any) => r.status === 'approved').length,
      fill: "var(--color-approved)" 
    },
    { 
      status: "Rejected", 
      count: filteredRequestsForChart.maintenance.filter((r: any) => r.status === 'rejected').length + filteredRequestsForChart.purchase.filter((r: any) => r.status === 'rejected').length,
      fill: "var(--color-rejected)" 
    },
  ];

  // Calculate totals
  const totalTasksInPeriod = taskStatusData.reduce((sum, item) => sum + item.count, 0);
  const totalRequestsInPeriod = requestStatusData.reduce((sum, item) => sum + item.count, 0);

  // Helper function to get period description
  const getPeriodDescription = (period: string) => {
    return `Last ${period} days`;
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };


  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your tasks and requests
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Due today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully finished
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incomplete Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{incompleteTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Still in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Requests</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Maintenance & Purchase
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Tasks Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Tasks by Status</CardTitle>
              <CardDescription>Your task distribution</CardDescription>
            </div>
            <Select value={taskPeriod} onValueChange={setTaskPeriod}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
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
                  data={taskStatusData}
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
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm pt-4">
            <div className="flex items-center gap-2 leading-none font-medium">
              Total: {totalTasksInPeriod} task{totalTasksInPeriod !== 1 ? 's' : ''}
            </div>
            <div className="text-muted-foreground leading-none text-center">
              Showing task status distribution for {getPeriodDescription(taskPeriod).toLowerCase()}
            </div>
          </CardFooter>
        </Card>

        {/* Requests Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Request Status</CardTitle>
              <CardDescription>Maintenance & Purchase requests</CardDescription>
            </div>
            <Select value={requestPeriod} onValueChange={setRequestPeriod}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={requestChartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={requestStatusData}
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
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm pt-4">
            <div className="flex items-center gap-2 leading-none font-medium">
              Total: {totalRequestsInPeriod} request{totalRequestsInPeriod !== 1 ? 's' : ''}
            </div>
            <div className="text-muted-foreground leading-none text-center">
              Showing request status distribution for {getPeriodDescription(requestPeriod).toLowerCase()}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* My Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>All tasks assigned to you</CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-3">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <StaffDashboardTasksTable 
              tasks={myTasks}
              availableStaff={staff?.map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                department: s.department
              })) || []}
              teams={teams?.map(t => ({
                id: t.id,
                name: t.name
              })) || []}
            />
          )}
        </CardContent>
      </Card>

    </div>
  );
}

