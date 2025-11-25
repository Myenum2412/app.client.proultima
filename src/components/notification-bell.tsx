'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useNotificationCount } from '@/hooks/use-notification-count';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useAllNotifications, type Notification } from '@/hooks/use-all-notifications';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Icon mapping for notification types
const getNotificationIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'task_assignment': '📋',
    'task_update': '📝',
    'task_delegation': '👥',
    'task_status_update': '✅',
    'task_proof_upload': '📸',
    'task_proof_verified': '✓',
    'task_proof_rejected': '❌',
    'task_reschedule_request': '📅',
    'task_reschedule_approved': '✅',
    'task_reschedule_rejected': '❌',
    'task_delegation_received': '👥',
    'maintenance_request': '🔧',
    'maintenance_status_update': '🔧',
    'purchase_request': '🛒',
    'purchase_status_update': '🛒',
    'scrap_request': '🗑️',
    'scrap_status_update': '🗑️',
    'cashbook_entry': '💰',
    'cashbook_verification_required': '🕑',
    'cashbook_transaction_approved': '✅',
    'cashbook_transaction_rejected': '⚠️',
  };
  return iconMap[type] || '🔔';
};

// Get notification action URL
const getNotificationUrl = (type: string, metadata: any, userRole?: string) => {
  const basePath = userRole === 'admin' ? '/admin' : '/staff';
  
  if (type.includes('task')) return `${basePath}/tasks`;
  if (type.includes('maintenance')) return `${basePath}/maintenance`;
  if (type.includes('purchase')) return `${basePath}/maintenance`;
  if (type.includes('scrap')) return `${basePath}/maintenance`;
  if (type === 'cashbook_verification_required') {
    return userRole === 'admin'
      ? '/admin/cashbook'
      : '/staff/accounting/approvals';
  }
  if (type.startsWith('cashbook_transaction')) {
    return `${basePath}/cashbook`;
  }
  if (type.includes('cashbook')) return `${basePath}/cashbook`;
  return `${basePath}/dashboard`;
};

// Format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Use React Query hooks (like Dynamic Island)
  const { notifications, isLoading, deleteNotification } = useAllNotifications();
  const { count, markAllViewed, markViewed, isMarkingViewed } = useNotificationCount(user?.role);
  const { checkAndPlaySound } = useNotificationSound();
  
  const unreadCount = notifications.filter(n => !n.is_viewed).length;

  // Auto-play sound when count increases (like Dynamic Island)
  useEffect(() => {
    checkAndPlaySound(count);
  }, [count, checkAndPlaySound]);

  // Auto-mark all as viewed when opening panel
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllViewed();
    }
  }, [isOpen, unreadCount, markAllViewed]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as viewed
    if (!notification.is_viewed) {
      markViewed(notification.id);
    }
    
    // Special handling for task proof upload notifications
    if (notification.type === 'task_proof_upload' && notification.metadata) {
      const taskId = notification.metadata.task_id;
      const proofId = notification.reference_id;
      router.push(`/admin/tasks?verifyTask=${taskId}&proofId=${proofId}`);
    } else {
      // Navigate to relevant page
      const url = getNotificationUrl(notification.type, notification.metadata, user?.role);
      router.push(url);
    }
    
    // Close dropdown
    setIsOpen(false);
  };

  const handleDeleteNotification = (notificationId: string) => {
    deleteNotification(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllViewed();
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Bell Button */}
      <Button
        variant="outline"
        size="icon"
        className="relative h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary border-2 border-gray-200 hover:border-purple-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6 text-gray-100" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingViewed}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-w-80">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 transition-colors relative group",
                      !notification.is_viewed && "bg-blue-50 border-l-4 border-l-blue-500"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.is_viewed && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      {/* X button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
