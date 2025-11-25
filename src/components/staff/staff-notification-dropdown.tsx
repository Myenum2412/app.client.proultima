'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/hooks/use-tasks';
import { useTeams } from '@/hooks/use-teams';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Clock, Wrench, ShoppingCart, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface StaffNotificationDropdownProps {
  inWidget?: boolean;
}

export function StaffNotificationDropdown({ inWidget = false }: StaffNotificationDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Track last viewed time from localStorage
  const [lastViewedTime, setLastViewedTime] = useState<string | null>(null);
  
  // Initialize last viewed time from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('staff-notifications-last-viewed');
      setLastViewedTime(stored);
    }
  }, []);

  // Get staff-specific data
  const { tasks } = useTasks();
  const { requests: maintenanceRequests } = useMaintenanceRequests(user?.staffId);
  const { requisitions: purchaseRequisitions } = usePurchaseRequisitions(user?.staffId);

  // Import team data for proper task filtering
  const { teams, teamMembers } = useTeams();

  // Get staff's tasks (individual + team assignments)
  const getStaffTeams = (staffId: string) => {
    // Get teams where staff is a member
    const memberTeams = teamMembers
      .filter(tm => tm.staff_id === staffId)
      .map(tm => tm.team_id);
    
    // Get teams where staff is the leader
    const leaderTeams = teams
      .filter(t => t.leader_id === staffId)
      .map(t => t.id);
    
    return [...new Set([...memberTeams, ...leaderTeams])];
  };

  const userTeams = user?.staffId ? getStaffTeams(user.staffId) : [];

  // Get staff's tasks (individual OR team assignments)
  const myTasks = tasks.filter((task: any) => {
    const isIndividuallyAssigned = task.assigned_staff_ids?.includes(user?.staffId || '');
    const isTeamAssigned = task.assigned_team_ids?.some((teamId: string) => userTeams.includes(teamId));
    return isIndividuallyAssigned || isTeamAssigned;
  });

  // Get recent task updates (new assignments and completions only)
  const recentTaskUpdates = myTasks.filter((task: any) => {
    const updatedAt = new Date(task.updated_at);
    const createdAt = new Date(task.created_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Show if: newly created OR recently completed
    const isNewAssignment = createdAt > oneDayAgo;
    const isRecentlyCompleted = task.status === 'completed' && updatedAt > oneDayAgo;
    
    return isNewAssignment || isRecentlyCompleted;
  });

  // Get recent maintenance request updates (only approved/rejected, not pending)
  const recentMaintenanceUpdates = maintenanceRequests.filter((req: any) => {
    const updatedAt = new Date(req.updated_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Only show approved or rejected requests (not pending)
    return updatedAt > oneDayAgo && req.status !== 'pending';
  });

  // Get recent purchase requisition updates (only approved/rejected, not pending)
  const recentPurchaseUpdates = purchaseRequisitions.filter((req: any) => {
    const updatedAt = new Date(req.updated_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Only show approved or rejected requests (not pending)
    return updatedAt > oneDayAgo && req.status !== 'pending';
  });

  // Count only new notifications (created after last view)
  const newTaskUpdates = useMemo(() => {
    if (!lastViewedTime) return recentTaskUpdates.length;
    
    return recentTaskUpdates.filter(
      (task: any) => new Date(task.updated_at) > new Date(lastViewedTime)
    ).length;
  }, [recentTaskUpdates, lastViewedTime]);

  const newMaintenanceUpdates = useMemo(() => {
    if (!lastViewedTime) return recentMaintenanceUpdates.length;
    
    return recentMaintenanceUpdates.filter(
      req => new Date(req.updated_at) > new Date(lastViewedTime)
    ).length;
  }, [recentMaintenanceUpdates, lastViewedTime]);

  const newPurchaseUpdates = useMemo(() => {
    if (!lastViewedTime) return recentPurchaseUpdates.length;
    
    return recentPurchaseUpdates.filter(
      req => new Date(req.updated_at) > new Date(lastViewedTime)
    ).length;
  }, [recentPurchaseUpdates, lastViewedTime]);

  const totalNewCount = newTaskUpdates + newMaintenanceUpdates + newPurchaseUpdates;


  // Mark as viewed when dropdown opens
  const handleDropdownOpen = (open: boolean) => {
    if (open && typeof window !== 'undefined') {
      const now = new Date().toISOString();
      localStorage.setItem('staff-notifications-last-viewed', now);
      setLastViewedTime(now);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'todo':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            New Assignment
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  // Helper to get notification type message
  const getTaskNotificationMessage = (task: any) => {
    const createdAt = new Date(task.created_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isNewAssignment = createdAt > oneDayAgo;
    
    if (task.status === 'completed') {
      return 'Task Completed';
    } else if (isNewAssignment) {
      return 'New Task Assigned';
    } else {
      return 'Task Updated';
    }
  };

  // If inWidget, render list view instead of dropdown
  if (inWidget) {
    if (totalNewCount === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No new notifications
        </div>
      );
    }

    return (
      <div className="p-2">
        {/* Task Updates */}
        {newTaskUpdates > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Task Updates ({newTaskUpdates})
            </h4>
            {recentTaskUpdates
              .filter((task: any) => !lastViewedTime || new Date(task.updated_at) > new Date(lastViewedTime))
              .slice(0, 3)
              .map((task: any) => (
                <div
                  key={task.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => router.push('/staff/tasks')}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-medium">
                            {getTaskNotificationMessage(task)}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {task.title}
                          </p>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Maintenance Updates */}
        {newMaintenanceUpdates > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Maintenance Requests ({newMaintenanceUpdates})
            </h4>
            {recentMaintenanceUpdates
              .filter(req => !lastViewedTime || new Date(req.updated_at) > new Date(lastViewedTime))
              .slice(0, 3)
              .map((request) => (
                <div
                  key={request.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => router.push('/staff/maintenance')}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <Wrench className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {request.serial_number || request.brand_name || 'Maintenance Request'}
                        </p>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.branch} • {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Purchase Updates */}
        {newPurchaseUpdates > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Purchase Requisitions ({newPurchaseUpdates})
            </h4>
            {recentPurchaseUpdates
              .filter(req => !lastViewedTime || new Date(req.updated_at) > new Date(lastViewedTime))
              .slice(0, 3)
              .map((requisition) => (
                <div
                  key={requisition.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => router.push('/staff/maintenance')}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {requisition.purchase_item}
                        </p>
                        {getStatusBadge(requisition.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {requisition.name} • {formatDistanceToNow(new Date(requisition.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  if (totalNewCount === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNewCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-500 hover:bg-blue-600 animate-in zoom-in-50 duration-200"
              variant="default"
            >
              {totalNewCount > 9 ? '9+' : totalNewCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Your Notifications</h4>
          <p className="text-xs text-muted-foreground">
            {totalNewCount} new update{totalNewCount !== 1 ? 's' : ''} for you
          </p>
        </div>
        
        {/* Task Updates Section */}
        {newTaskUpdates > 0 && (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
              Task Updates ({newTaskUpdates})
            </DropdownMenuLabel>
            <div className="max-h-40 overflow-y-auto">
              {recentTaskUpdates
                .filter((task: any) => !lastViewedTime || new Date(task.updated_at) > new Date(lastViewedTime))
                .slice(0, 3)
                .map((task: any) => (
                  <DropdownMenuItem
                    key={task.id}
                    className="p-3 cursor-pointer"
                    onClick={() => router.push('/staff/tasks')}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-1">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium">
                              {getTaskNotificationMessage(task)}
                            </p>
                            <p className="text-sm font-medium truncate">
                              {task.title}
                            </p>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Maintenance Updates Section */}
        {newMaintenanceUpdates > 0 && (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
              Maintenance Requests ({newMaintenanceUpdates})
            </DropdownMenuLabel>
            <div className="max-h-40 overflow-y-auto">
              {recentMaintenanceUpdates
                .filter(req => !lastViewedTime || new Date(req.updated_at) > new Date(lastViewedTime))
                .slice(0, 3)
                .map((request) => (
                  <DropdownMenuItem
                    key={request.id}
                    className="p-3 cursor-pointer"
                    onClick={() => router.push('/staff/maintenance')}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-1">
                        <Wrench className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {request.serial_number || request.brand_name || 'Maintenance Request'}
                          </p>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {request.branch} • {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Purchase Updates Section */}
        {newPurchaseUpdates > 0 && (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
              Purchase Requisitions ({newPurchaseUpdates})
            </DropdownMenuLabel>
            <div className="max-h-40 overflow-y-auto">
              {recentPurchaseUpdates
                .filter(req => !lastViewedTime || new Date(req.updated_at) > new Date(lastViewedTime))
                .slice(0, 3)
                .map((requisition) => (
                  <DropdownMenuItem
                    key={requisition.id}
                    className="p-3 cursor-pointer"
                    onClick={() => router.push('/staff/maintenance')}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-1">
                        <ShoppingCart className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {requisition.purchase_item}
                          </p>
                          {getStatusBadge(requisition.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {requisition.branch} • {formatDistanceToNow(new Date(requisition.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem 
          className="p-3 cursor-pointer"
          onClick={() => router.push('/staff/dashboard')}
        >
          <div className="flex items-center justify-center w-full text-sm text-primary">
            View All Updates
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

