'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { NotificationIsland } from './notification-island';
import { useNotificationCategories, useMarkAllNotificationsRead, useMarkCategoryRead } from '@/hooks/use-notification-categories';
import { useNotificationSound } from '@/hooks/use-notification-sound';

export function StaffNotificationIsland() {
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
        router.push('/staff/tasks');
        break;
      case 'task_proof_upload':
      case 'task_proof_verified':
      case 'task_proof_rejected':
        router.push('/staff/tasks');
        break;
      case 'task_reschedule_request':
      case 'task_reschedule_approved':
      case 'task_reschedule_rejected':
        router.push('/staff/tasks');
        break;
      case 'maintenance_status_update':
        router.push('/staff/maintenance');
        break;
      case 'purchase_status_update':
        router.push('/staff/purchase-requisitions');
        break;
      case 'scrap_status_update':
        router.push('/staff/scrap-requests');
        break;
      case 'cashbook_verification_required':
        router.push('/staff/accounting/approvals');
        break;
      case 'cashbook_transaction_approved':
      case 'cashbook_transaction_rejected':
        router.push('/staff/cashbook');
        break;
      default:
        break;
    }
  };

  if (isLoading || !categories) {
    return null;
  }

  // Filter categories for staff (6 categories, no cashbook)
  const staffCategories = [
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
      categories={staffCategories}
      onMarkAllRead={markAllRead}
      onMarkCategoryRead={markCategoryRead}
      onNotificationClick={handleNotificationClick}
      soundEnabled={isSoundEnabled()}
      position="bottom"
    />
  );
}
