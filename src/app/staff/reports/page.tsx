'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/hooks/use-tasks';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useTeams } from '@/hooks/use-teams';
import { getStaffTasks } from '@/lib/team-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Settings, ShoppingCart, CheckSquare, Package } from 'lucide-react';
import { TasksReportTable } from '@/components/reports/tasks-report-table';
import { MaintenanceReportTable } from '@/components/reports/maintenance-report-table';
import { PurchaseReportTable } from '@/components/reports/purchase-report-table';
import { ScrapReportTable } from '@/components/staff/scrap-report-table';
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { Skeleton } from '@/components/ui/skeleton';

export default function StaffReportsPage() {
  const { user } = useAuth();
  const { tasks, isLoading: isTasksLoading } = useTasks();
  const { requests: maintenanceRequests, isLoading: isMaintenanceLoading } = useMaintenanceRequests(user?.staffId);
  const { requisitions: purchaseRequests, isLoading: isPurchaseLoading } = usePurchaseRequisitions(user?.staffId);
  const { scrapRequests, isLoading: isScrapLoading } = useScrapRequests();
  const { teams, teamMembers } = useTeams();

  // Filter tasks for current staff (individual + team assignments)
  const myTasks = getStaffTasks(tasks, user?.staffId || '', teamMembers, teams);
  
  // Debug logging
  // console.log('Reports page - All tasks:', tasks.length);
  // console.log('Reports page - My tasks:', myTasks.length);
  // console.log('Reports page - Maintenance requests:', maintenanceRequests.length);
  // console.log('Reports page - Purchase requests:', purchaseRequests.length);

  // Calculate stats
  const taskStats = {
    total: myTasks.length,
    completed: myTasks.filter(t => t.status === 'completed').length,
    inProgress: myTasks.filter(t => t.status === 'in_progress').length,
    pending: myTasks.filter(t => t.status === 'todo' || t.status === 'backlog').length,
  };

  const maintenanceStats = {
    total: maintenanceRequests.length,
    pending: maintenanceRequests.filter(r => r.status === 'pending').length,
    approved: maintenanceRequests.filter(r => r.status === 'approved').length,
    rejected: maintenanceRequests.filter(r => r.status === 'rejected').length,
  };

  const purchaseStats = {
    total: purchaseRequests.length,
    pending: purchaseRequests.filter(r => r.status === 'pending').length,
    approved: purchaseRequests.filter(r => r.status === 'approved').length,
    rejected: purchaseRequests.filter(r => r.status === 'rejected').length,
  };

  // Filter scrap requests for current staff
  const myScrapRequests = scrapRequests.filter((r: any) => {
    // Include requests from both staff and admin (if admin is logged in as staff)
    return r.staff_id === user?.staffId || r.admin_submitter_id === user?.id;
  });
  const scrapStats = {
    total: myScrapRequests.length,
    pending: myScrapRequests.filter((r: any) => r.status === 'pending').length,
    approved: myScrapRequests.filter((r: any) => r.status === 'approved').length,
    rejected: myScrapRequests.filter((r: any) => r.status === 'rejected').length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Activity Reports</h1>
          <p className="text-muted-foreground">
            View and export your work activities, maintenance requests, and purchase requisitions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.completed} completed, {taskStats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {maintenanceStats.pending} pending, {maintenanceStats.approved} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {purchaseStats.pending} pending, {purchaseStats.approved} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taskStats.total + maintenanceStats.total + purchaseStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              All your work activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different report types */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="tasks" className="flex items-center gap-1 text-xs sm:text-sm">
            <CheckSquare className="h-4 w-4" />
            Tasks ({taskStats.total})
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            Maintenance ({maintenanceStats.total})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-1 text-xs sm:text-sm">
            <ShoppingCart className="h-4 w-4" />
            Purchase ({purchaseStats.total})
          </TabsTrigger>
          <TabsTrigger value="scrap" className="flex items-center gap-1 text-xs sm:text-sm">
            <Package className="h-4 w-4" />
            Scrap ({scrapStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Report</CardTitle>
              <CardDescription>
                Your assigned tasks with status, priority, and time tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTasksLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <TasksReportTable 
                  tasks={myTasks}
                  teams={teams}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Requests</CardTitle>
              <CardDescription>
                Your submitted maintenance requests and their approval status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMaintenanceLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <MaintenanceReportTable 
                  requests={maintenanceRequests}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requisitions</CardTitle>
              <CardDescription>
                Your submitted purchase requests and their approval status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPurchaseLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <PurchaseReportTable 
                  requests={purchaseRequests}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scrap" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scrap Requests</CardTitle>
              <CardDescription>
                Your submitted scrap requests and their approval status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isScrapLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrapReportTable scrapRequests={myScrapRequests} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
