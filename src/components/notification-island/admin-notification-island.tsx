'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { NotificationIsland } from './notification-island';
import { useNotificationCategories, useMarkAllNotificationsRead, useMarkCategoryRead } from '@/hooks/use-notification-categories';
import { useNotificationSound } from '@/hooks/use-notification-sound';

export function AdminNotificationIsland() {
  const router = useRouter();
  const { data: categories, isLoading } = useNotificationCategories();
  const markAllRead = useMarkAllNotificationsRead();
  const markCategoryRead = useMarkCategoryRead();
  const { isSoundEnabled } = useNotificationSound();

  const handleNotificationClick = (notification: any) => {
    // Navigate to relevant page based on notification type
    switch (notification.type) {
      case 'task_assignment':
      case 'task_update':
      case 'task_delegation':
      case 'task_status_update':
      case 'task_delegation_received':
        router.push('/admin/tasks');
        break;
      case 'task_proof_upload':
      case 'task_proof_verified':
      case 'task_proof_rejected':
        router.push('/admin/tasks');
        break;
      case 'task_reschedule_request':
      case 'task_reschedule_approved':
      case 'task_reschedule_rejected':
        router.push('/admin/tasks');
        break;
      case 'maintenance_request':
      case 'maintenance_status_update':
        router.push('/admin/maintenance');
        break;
      case 'purchase_request':
      case 'purchase_status_update':
        router.push('/admin/purchase-requisitions');
        break;
      case 'scrap_request':
      case 'scrap_status_update':
        router.push('/admin/scrap-requests');
        break;
      case 'cashbook_entry':
      case 'cashbook_verification_required':
      case 'cashbook_transaction_approved':
      case 'cashbook_transaction_rejected':
        router.push('/admin/cashbook');
        break;
      default:
        break;
    }
  };

  if (isLoading || !categories) {
    return null;
  }

  // Filter categories for admin (all 7 categories)
  const adminCategories = [
    categories.tasks,
    categories.proofs,
    categories.reschedules,
    categories.cashbook,
    categories.maintenance,
    categories.purchase,
    categories.scrap,
  ];

  return (
    <NotificationIsland
      categories={adminCategories}
      onMarkAllRead={markAllRead}
      onMarkCategoryRead={markCategoryRead}
      onNotificationClick={handleNotificationClick}
      soundEnabled={isSoundEnabled()}
      position="bottom"
    />
  );
}
