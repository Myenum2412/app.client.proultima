'use client';

import { useState } from 'react';
import { useAttendance } from '@/hooks/use-attendance';
import { useStaff } from '@/hooks/use-staff';
import { useAttendanceTasks } from '@/hooks/use-attendance-tasks';
import { useTasks } from '@/hooks/use-tasks';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Clock,
  Users,
  UserCheck,
  UserX,
  LogOut,
  Activity,
  Download,
  RefreshCw,
  CheckCircle2,
  ListTodo,
  Settings,
  ShoppingCart,
  Package,
  Eye
} from 'lucide-react';
import { AttendanceTable } from './attendance-table';
import { CompletedTasksTable } from './completed-tasks-table';
import { IncompleteTasksTable } from './incomplete-tasks-table';
import { MaintenanceReportTable } from './maintenance-report-table';
import { PurchaseReportTable } from './purchase-report-table';
import { AdminScrapReportTable } from './scrap-report-table';
import { ScrapApprovalDialog } from './scrap-approval-dialog';
import { AddScrapDrawer } from '@/components/staff/add-scrap-drawer';
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { ScrapRequest } from '@/types/scrap';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ReportsContent() {
  const { 
    useTodayAllAttendance, 
    useAttendanceSummary, 
    useAttendanceHistory,
    markLogout,
    isMarkingLogout 
  } = useAttendance();
  
  const { staff: staffData } = useStaff();
  const { tasks } = useTasks();
  const { requests: maintenanceRequests, isLoading: isLoadingMaintenance } = useMaintenanceRequests();
  const { requisitions: purchaseRequisitions, isLoading: isLoadingPurchase } = usePurchaseRequisitions();
  const { scrapRequests, isLoading: isLoadingScrap } = useScrapRequests();
  const { data: attendanceRecords, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useTodayAllAttendance();
  const { data: attendanceSummary, isLoading: isLoadingSummary } = useAttendanceSummary();
  
  const [selectedDateRange, setSelectedDateRange] = useState('7');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedScrap, setSelectedScrap] = useState<ScrapRequest | null>(null);
  const [isScrapDialogOpen, setIsScrapDialogOpen] = useState(false);
  const [isAddScrapOpen, setIsAddScrapOpen] = useState(false);

  const selectedStaff = staffData?.find(s => s.id === selectedStaffId);
  const { data: staffHistory } = useAttendanceHistory(selectedStaffId || undefined, parseInt(selectedDateRange));
  const { data: attendanceTasks } = useAttendanceTasks(
    selectedStaffId || undefined, 
    parseInt(selectedDateRange)
  );
  const { data: todayAttendanceTasks } = useAttendanceTasks(
    undefined,
    1,
    true // Enable all-staff mode for today's table
  );

  // Calculate task statistics
  const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
  const incompleteTasks = tasks.filter((task: any) => task.status !== 'completed').length;

  // Calculate scrap request statistics
  const scrapStats = {
    total: scrapRequests.length,
    pending: scrapRequests.filter(r => r.status === 'pending').length,
    approved: scrapRequests.filter(r => r.status === 'approved').length,
    rejected: scrapRequests.filter(r => r.status === 'rejected').length,
  };

  const handleViewScrap = (request: ScrapRequest) => {
    setSelectedScrap(request);
    setIsScrapDialogOpen(true);
  };

  const handleCloseScrapDialog = () => {
    setIsScrapDialogOpen(false);
    setSelectedScrap(null);
  };

  const handleAddScrap = (data: any) => {
    // The mutation will be called from the drawer component
    setIsAddScrapOpen(false);
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'HH:mm:ss');
  };

  const formatDateTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'MMM dd, HH:mm:ss');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'logged_out':
        return <Badge className="bg-gray-100 text-gray-800">Logged Out</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTaskStatusDisplay = (attendanceId: string) => {
    // Try to find in today's attendance tasks first, then individual history
    const taskStatus = todayAttendanceTasks?.find(t => t.attendance_id === attendanceId) || 
                      attendanceTasks?.find(t => t.attendance_id === attendanceId);
    
    if (!taskStatus || !taskStatus.task_title) {
      return <span className="text-muted-foreground text-sm">No task activity</span>;
    }

    const statusColorMap: Record<string, string> = {
      'backlog': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      'todo': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };

    const statusLabel = taskStatus.task_status
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown';

    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium truncate max-w-[200px]" title={taskStatus.task_title}>
          {taskStatus.task_title}
        </span>
        <Badge 
          variant="outline" 
          className={`w-fit text-xs ${statusColorMap[taskStatus.task_status || 'backlog']}`}
        >
          {statusLabel}
        </Badge>
      </div>
    );
  };

  const handleManualLogout = async (staffId: string, staffName: string) => {
    try {
      markLogout(staffId);
      toast.success(`Marked ${staffName} as logged out`);
    } catch (error) {
      toast.error('Failed to mark logout');
    }
  };

  const exportToCSV = () => {
    if (!attendanceRecords) return;
    
    const csvContent = [
      ['Name', 'Email', 'Department', 'Login Time', 'Logout Time', 'Status', 'Check-ins', 'Task Status'],
      ...attendanceRecords.map(record => {
        const taskStatus = attendanceTasks?.find(t => t.attendance_id === record.id);
        const taskDisplay = taskStatus?.task_title 
          ? `${taskStatus.task_title} - ${taskStatus.task_status}` 
          : 'No task activity';
        
        return [
          record.staff?.name || 'Unknown',
          record.staff?.email || 'N/A',
          record.staff?.department || 'N/A',
          formatTime(record.login_time),
          formatTime(record.logout_time),
          record.status,
          record.check_ins?.length || 0,
          taskDisplay
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance report exported successfully');
  };

  return (
    <div className="space-y-6 max-sm:mx-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Monitor staff attendance, login times, and activity reports
          </p>
        </div>
        <div className="flex flex-row gap-x-3">
         
          <Button 
            variant="default" 
            size="sm" 
            className="w-auto"
            onClick={exportToCSV}
            disabled={!attendanceRecords?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {attendanceSummary && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceSummary.totalStaff}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendanceSummary.present}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incomplete Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{incompleteTasks}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto">
          <TabsTrigger value="today" className="text-xs sm:text-sm">
            <Calendar className="h-4 w-4 mr-1 max-sm:hidden" />
            Today's Attendance
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <Activity className="h-4 w-4 mr-1 max-sm:hidden" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            <CheckCircle2 className="h-4 w-4 mr-1 max-sm:hidden" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="incomplete" className="text-xs sm:text-sm">
            <ListTodo className="h-4 w-4 mr-1 max-sm:hidden" />
            Incomplete
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1 max-sm:hidden" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="purchase" className="text-xs sm:text-sm">
            <ShoppingCart className="h-4 w-4 mr-1 max-sm:hidden" />
            Purchase
          </TabsTrigger>
          <TabsTrigger value="scrap" className="text-xs sm:text-sm">
            <Package className="h-4 w-4 mr-1 max-sm:hidden" />
            Scrap
          </TabsTrigger>
        </TabsList>

        {/* Today's Attendance Tab */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Staff Attendance
              </CardTitle>
              <CardDescription>
                Current login status and times for all staff members
              </CardDescription>
            </CardHeader>
            <CardContent className="p-1 sm:p-6">
              {isLoadingAttendance ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading attendance data...</span>
                </div>
              ) : attendanceRecords && attendanceRecords.length > 0 ? (
                <AttendanceTable
                  records={attendanceRecords}
                  mode="today"
                  onManualLogout={handleManualLogout}
                  isMarkingLogout={isMarkingLogout}
                  getTaskStatusDisplay={getTaskStatusDisplay}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance records found for today.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Individual Attendance History
              </CardTitle>
              <CardDescription>
                View attendance history for specific staff members
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 space-y-4">
              <div className="flex gap-4">
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffData?.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedStaff && staffHistory && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">{selectedStaff.name}</h3>
                    <p className="text-sm text-muted-foreground max-sm:hidden ">
                      {selectedStaff.department} • {selectedStaff.email}
                    </p>
                  </div>

                  {staffHistory.length > 0 ? (
                    <AttendanceTable
                      records={staffHistory}
                      mode="history"
                      getTaskStatusDisplay={getTaskStatusDisplay}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance history found for the selected period.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Tasks Tab */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Completed Tasks Report
              </CardTitle>
              <CardDescription>
                View all completed tasks with filters
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <CompletedTasksTable tasks={tasks} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incomplete Tasks Tab */}
        <TabsContent value="incomplete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Incomplete Tasks Report
              </CardTitle>
              <CardDescription>
                Track in-progress and overdue tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <IncompleteTasksTable tasks={tasks} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Report Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Maintenance Requests Report
              </CardTitle>
              <CardDescription>
                Review all maintenance requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <MaintenanceReportTable requests={maintenanceRequests} isLoading={isLoadingMaintenance} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Report Tab */}
        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Purchase Requisitions Report
              </CardTitle>
              <CardDescription>
                Review all purchase requisitions and their approval status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <PurchaseReportTable requisitions={purchaseRequisitions} isLoading={isLoadingPurchase} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scrap Requests Tab */}
        <TabsContent value="scrap" className="space-y-4">
          {/* Scrap Stats Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scrapStats.total}</div>
                <p className="text-xs text-muted-foreground">All scrap requests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{scrapStats.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{scrapStats.approved}</div>
                <p className="text-xs text-muted-foreground">Approved requests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{scrapStats.rejected}</div>
                <p className="text-xs text-muted-foreground">Rejected requests</p>
              </CardContent>
            </Card>
          </div>

          {/* Scrap Requests Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Scrap Requests Report
                </CardTitle>
                <CardDescription>
                  Review all scrap requests from staff and admins
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddScrapOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Add Scrap
              </Button>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              {isLoadingScrap ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading scrap requests...</span>
                </div>
              ) : (
                <AdminScrapReportTable 
                  scrapRequests={scrapRequests} 
                  onViewDetails={handleViewScrap}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scrap Approval Dialog */}
      <ScrapApprovalDialog
        request={selectedScrap}
        open={isScrapDialogOpen}
        onOpenChange={handleCloseScrapDialog}
      />

      {/* Add Scrap Drawer */}
      <AddScrapDrawer
        isOpen={isAddScrapOpen}
        onOpenChange={setIsAddScrapOpen}
        onSubmit={handleAddScrap}
        isSubmitting={false}
      />
    </div>
  );
}
