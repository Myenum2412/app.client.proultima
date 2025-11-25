'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { useTasks } from '@/hooks/use-tasks';
import { useTaskReschedules } from '@/hooks/use-task-reschedules';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { RescheduleApprovalDialog } from '@/components/admin/reschedule-approval-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, Eye, Clock, CheckCircle2, X, Calendar, Wrench, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { TaskUpdateProof } from '@/types/cashbook';

interface NotificationDropdownProps {
  onViewProof?: (taskId: string) => void;
  inWidget?: boolean;
}

export function NotificationDropdown({ onViewProof, inWidget = false }: NotificationDropdownProps) {
  const router = useRouter();
  const { proofs, pendingCount } = useTaskProofs();
  const { tasks } = useTasks();
  const { reschedules } = useTaskReschedules();
  const { requests: maintenanceRequests } = useMaintenanceRequests();
  const { requisitions: purchaseRequisitions } = usePurchaseRequisitions();
  const { scrapRequests } = useScrapRequests();
  const [selectedReschedule, setSelectedReschedule] = useState<any>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  
  // Track last viewed time from localStorage
  const [lastViewedTime, setLastViewedTime] = useState<string | null>(null);
  
  // Initialize last viewed time from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin-notifications-last-viewed');
      setLastViewedTime(stored);
    }
  }, []);

  // Listen for notification clearing events
  useEffect(() => {
    const handleNotificationsCleared = (event: CustomEvent) => {
      if (event.detail?.type === 'admin-notifications') {
        setLastViewedTime(event.detail.timestamp);
      }
    };

    window.addEventListener('notificationsCleared', handleNotificationsCleared as EventListener);
    
    return () => {
      window.removeEventListener('notificationsCleared', handleNotificationsCleared as EventListener);
    };
  }, []);

  // Get recent pending proofs (max 5)
  const recentPendingProofs = proofs
    .filter(proof => proof.is_verified === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Filter pending reschedules
  const pendingReschedules = useMemo(() => 
    reschedules.filter(r => r.status === 'pending'),
    [reschedules]
  );

  // Pending maintenance requests
  const pendingMaintenance = useMemo(() => 
    maintenanceRequests.filter(r => r.status === 'pending'),
    [maintenanceRequests]
  );

  // Pending purchase requisitions
  const pendingPurchase = useMemo(() => 
    purchaseRequisitions.filter(r => r.status === 'pending'),
    [purchaseRequisitions]
  );

  // Pending scrap requests
  const pendingScrap = useMemo(() => 
    scrapRequests.filter(r => r.status === 'pending'),
    [scrapRequests]
  );

  // Recent task status updates by staff
  const recentTaskUpdates = useMemo(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return tasks.filter(t => 
      t.last_updated_by && 
      new Date(t.updated_at) > oneDayAgo
    );
  }, [tasks]);


  // Safe timestamp parser that handles both "with time zone" and "without time zone"
  const parseTimestamp = (timestamp: string) => {
    // If timestamp doesn't have timezone info, treat as UTC
    if (!timestamp.includes('+') && !timestamp.includes('Z')) {
      return new Date(timestamp + 'Z');
    }
    return new Date(timestamp);
  };

  // Count only new notifications (created after last view)
  // ✅ FIX: Filter ALL proofs, not just recent 5
  const newPendingCount = useMemo(() => {
    if (!lastViewedTime) return pendingCount;
    
    return proofs.filter(
      proof => proof.is_verified === null && 
      parseTimestamp(proof.created_at) > parseTimestamp(lastViewedTime)
    ).length;
  }, [proofs, lastViewedTime, pendingCount]);

  // Mark as viewed when dropdown opens
  const handleDropdownOpen = (open: boolean) => {
    if (open && typeof window !== 'undefined') {
      const now = new Date().toISOString();
      localStorage.setItem('admin-notifications-last-viewed', now);
      setLastViewedTime(now);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('notificationsCleared', {
        detail: { type: 'admin-notifications', timestamp: now }
      }));
    }
  };

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find((t: any) => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  const getStatusBadge = (proof: TaskUpdateProof) => {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // If inWidget, render list view instead of dropdown
  if (inWidget) {
    if (pendingCount === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No pending verifications
        </div>
      );
    }

    return (
      <div className="p-2">
        {recentPendingProofs.map((proof) => (
          <div
            key={proof.id}
            className="p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
            onClick={() => onViewProof?.(proof.task_id)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-1">
                {getStatusBadge(proof)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {getTaskTitle(proof.task_id)}
                  </p>
                  <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {proof.staff?.name || 'Unknown Staff'} • {formatDistanceToNow(parseTimestamp(proof.created_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {proof.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (pendingCount === 0) {
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
          {newPendingCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary hover:bg-primary/90 animate-in zoom-in-50 duration-200"
              variant="default"
            >
              {newPendingCount > 9 ? '9+' : newPendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">All Notifications</h4>
          <p className="text-xs text-muted-foreground">
            {pendingCount + pendingReschedules.length + pendingMaintenance.length + 
             pendingPurchase.length + pendingScrap.length + recentTaskUpdates.length} total notifications
          </p>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {/* Task Proof Verifications */}
          {recentPendingProofs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Task Proof Verifications ({recentPendingProofs.length})
              </h4>
              {recentPendingProofs.map((proof) => (
                <DropdownMenuItem
                  key={proof.id}
                  className="p-3 cursor-pointer"
                  onClick={() => onViewProof?.(proof.task_id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {getTaskTitle(proof.task_id)}
                        </p>
                        {getStatusBadge(proof)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {proof.staff?.name || 'Unknown Staff'} • {formatDistanceToNow(parseTimestamp(proof.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {proof.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {/* Reschedule Requests */}
          {pendingReschedules.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Reschedule Requests ({pendingReschedules.length})
              </h4>
              {pendingReschedules.slice(0, 3).map((reschedule) => (
                <DropdownMenuItem
                  key={reschedule.id}
                  className="p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedReschedule(reschedule);
                    setIsRescheduleDialogOpen(true);
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {reschedule.task?.title || 'Unknown Task'}
                        </p>
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reschedule.staff?.name || 'Unknown Staff'} • {formatDistanceToNow(new Date(reschedule.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-orange-600">
                        New date: {format(new Date(reschedule.requested_new_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {/* Maintenance Requests */}
          {pendingMaintenance.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Maintenance Requests ({pendingMaintenance.length})
              </h4>
              {pendingMaintenance.slice(0, 3).map((request) => (
                <DropdownMenuItem
                  key={request.id}
                  className="p-3 cursor-pointer"
                  onClick={() => router.push('/admin/maintenance')}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <Wrench className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {request.brand_name || request.workstation_number || 'Maintenance Request'}
                        </p>
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.serial_number || 'No serial number'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.staff?.name} • {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {/* Purchase Requisitions */}
          {pendingPurchase.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Purchase Requisitions ({pendingPurchase.length})
              </h4>
              {pendingPurchase.slice(0, 3).map((request) => (
                <DropdownMenuItem
                  key={request.id}
                  className="p-3 cursor-pointer"
                  onClick={() => router.push('/admin/purchase')}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {request.purchase_item}
                        </p>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.staff?.name} • {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {/* Scrap Requests */}
          {pendingScrap.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Scrap Requests ({pendingScrap.length})
              </h4>
              {pendingScrap.slice(0, 3).map((request) => (
                <DropdownMenuItem
                  key={request.id}
                  className="p-3 cursor-pointer"
                  onClick={() => router.push('/admin/scrap')}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {request.brand_name}
                        </p>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Workstation: {request.workstation_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.staff?.name} • {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {/* Task Status Updates */}
          {recentTaskUpdates.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Task Status Updates ({recentTaskUpdates.length})
              </h4>
              {recentTaskUpdates.slice(0, 3).map((task) => (
                <DropdownMenuItem
                  key={task.id}
                  className="p-3 cursor-pointer"
                  onClick={() => router.push('/admin/tasks')}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {task.title}
                        </p>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {task.task_no} • {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated by {task.last_updater?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          {/* No notifications message */}
          {recentPendingProofs.length === 0 && 
           pendingReschedules.length === 0 && 
           pendingMaintenance.length === 0 && 
           pendingPurchase.length === 0 && 
           pendingScrap.length === 0 && 
           recentTaskUpdates.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No new notifications
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="p-3 cursor-pointer"
          onClick={() => {
            // TODO: Navigate to full notifications page
            // console.log('Navigate to full notifications page');
          }}
        >
          <div className="flex items-center justify-center w-full text-sm text-primary">
            View All Notifications
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Reschedule Approval Dialog */}
      {selectedReschedule && (
        <RescheduleApprovalDialog
          reschedule={selectedReschedule}
          trigger={<div style={{ display: 'none' }} />}
        />
      )}
    </DropdownMenu>
  );
}

