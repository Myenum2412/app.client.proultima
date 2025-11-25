'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { useMaintenanceRequests } from '@/hooks/use-maintenance-requests';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useTasks } from '@/hooks/use-tasks';

export interface NotificationItem {
  id: string;
  type: 'task-proof' | 'maintenance' | 'purchase' | 'task-update';
  title: string;
  description: string;
  status: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  actionUrl: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [lastViewedTime, setLastViewedTime] = useState<string | null>(null);
  
  // Initialize last viewed time from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${user?.role}-notifications-last-viewed`);
      setLastViewedTime(stored);
    }
  }, [user?.role]);

  // Get data based on user role
  const { proofs, pendingCount: taskProofsPending } = useTaskProofs();
  const { requests: maintenanceRequests, pendingCount: maintenancePending } = useMaintenanceRequests(
    user?.role === 'staff' ? user?.staffId : undefined
  );
  const { requisitions: purchaseRequisitions } = usePurchaseRequisitions(
    user?.role === 'staff' ? user?.staffId : undefined
  );
  const { tasks } = useTasks();

  // Get user's tasks for staff notifications
  const myTasks = useMemo(() => {
    if (user?.role !== 'staff' || !user?.staffId) return [];
    return tasks.filter((task: any) => 
      task.assigned_staff_ids?.includes(user.staffId!)
    );
  }, [tasks, user?.role, user?.staffId]);

  // Convert data to unified notification format
  const allNotifications = useMemo((): NotificationItem[] => {
    const notifications: NotificationItem[] = [];

    // Task proof notifications (admin only)
    if (user?.role === 'admin') {
      proofs
        .filter(proof => proof.is_verified === null)
        .forEach(proof => {
          notifications.push({
            id: `task-proof-${proof.id}`,
            type: 'task-proof',
            title: `Task Proof Pending`,
            description: `Proof submitted by ${proof.staff?.name || 'Unknown Staff'}`,
            status: 'pending',
            timestamp: new Date(proof.created_at),
            priority: 'high',
            actionUrl: '/admin/tasks'
          });
        });
    }

    // Maintenance request notifications
    if (user?.role === 'admin') {
      maintenanceRequests
        .filter(req => req.status === 'pending')
        .forEach(request => {
          notifications.push({
            id: `maintenance-${request.id}`,
            type: 'maintenance',
            title: `Maintenance Request`,
            description: `${request.staff?.name || 'Unknown Staff'} - ${request.serial_number || request.brand_name || 'System Request'}`,
            status: 'pending',
            timestamp: new Date(request.created_at),
            priority: 'medium',
            actionUrl: '/admin/maintenance'
          });
        });
    } else if (user?.role === 'staff') {
      // Staff maintenance notifications (status updates)
      maintenanceRequests
        .filter(req => {
          const updatedAt = new Date(req.updated_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return updatedAt > oneDayAgo;
        })
        .forEach(request => {
          notifications.push({
            id: `maintenance-${request.id}`,
            type: 'maintenance',
            title: `Maintenance Request ${request.status}`,
            description: `${request.serial_number || request.brand_name || 'System Request'}`,
            status: request.status,
            timestamp: new Date(request.updated_at),
            priority: request.status === 'rejected' ? 'high' : 'medium',
            actionUrl: '/staff/maintenance'
          });
        });
    }

    // Purchase requisition notifications
    if (user?.role === 'admin') {
      purchaseRequisitions
        .filter(req => req.status === 'pending')
        .forEach(requisition => {
          notifications.push({
            id: `purchase-${requisition.id}`,
            type: 'purchase',
            title: `Purchase Requisition`,
            description: `${requisition.staff?.name || 'Unknown Staff'} - ${requisition.purchase_item}`,
            status: 'pending',
            timestamp: new Date(requisition.created_at),
            priority: 'medium',
            actionUrl: '/admin/maintenance'
          });
        });
    } else if (user?.role === 'staff') {
      // Staff purchase notifications (status updates)
      purchaseRequisitions
        .filter(req => {
          const updatedAt = new Date(req.updated_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return updatedAt > oneDayAgo;
        })
        .forEach(requisition => {
          notifications.push({
            id: `purchase-${requisition.id}`,
            type: 'purchase',
            title: `Purchase Requisition ${requisition.status}`,
            description: requisition.purchase_item,
            status: requisition.status,
            timestamp: new Date(requisition.updated_at),
            priority: requisition.status === 'rejected' ? 'high' : 'medium',
            actionUrl: '/staff/maintenance'
          });
        });
    }

    // Task update notifications (staff only)
    if (user?.role === 'staff') {
      myTasks
        .filter((task: any) => {
          const updatedAt = new Date(task.updated_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return updatedAt > oneDayAgo;
        })
        .forEach((task: any) => {
          notifications.push({
            id: `task-${task.id}`,
            type: 'task-update',
            title: `Task Updated`,
            description: task.title,
            status: task.status,
            timestamp: new Date(task.updated_at),
            priority: task.priority === 'urgent' ? 'high' : 'medium',
            actionUrl: '/staff/tasks'
          });
        });
    }

    // Sort by timestamp (newest first)
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [
    user?.role, 
    user?.staffId, 
    proofs, 
    maintenanceRequests, 
    purchaseRequisitions, 
    myTasks
  ]);

  // Filter new notifications (created after last view)
  const newNotifications = useMemo(() => {
    if (!lastViewedTime) return allNotifications;
    
    return allNotifications.filter(
      notification => notification.timestamp > new Date(lastViewedTime)
    );
  }, [allNotifications, lastViewedTime]);

  // Get counts by type
  const counts = useMemo(() => {
    const counts = {
      total: newNotifications.length,
      taskProofs: newNotifications.filter(n => n.type === 'task-proof').length,
      maintenance: newNotifications.filter(n => n.type === 'maintenance').length,
      purchase: newNotifications.filter(n => n.type === 'purchase').length,
      taskUpdates: newNotifications.filter(n => n.type === 'task-update').length,
    };

    return counts;
  }, [newNotifications]);

  // Mark notifications as viewed
  const markAsViewed = () => {
    if (typeof window !== 'undefined') {
      const now = new Date().toISOString();
      localStorage.setItem(`${user?.role}-notifications-last-viewed`, now);
      setLastViewedTime(now);
    }
  };

  // Listen for notification clearing events
  useEffect(() => {
    const handleNotificationsCleared = (event: CustomEvent) => {
      if (event.detail?.type) {
        const now = new Date().toISOString();
        localStorage.setItem(`${user?.role}-notifications-last-viewed`, now);
        setLastViewedTime(now);
      }
    };

    window.addEventListener('notificationsCleared', handleNotificationsCleared as EventListener);
    
    return () => {
      window.removeEventListener('notificationsCleared', handleNotificationsCleared as EventListener);
    };
  }, [user?.role]);

  return {
    notifications: allNotifications,
    newNotifications,
    counts,
    markAsViewed,
    isLoading: false, // Could be enhanced to track loading states
  };
}
