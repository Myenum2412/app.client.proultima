'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AdminNotificationIsland } from './admin-notification-island';
import { StaffNotificationIsland } from './staff-notification-island';

export function NotificationIslandManager() {
  const { user } = useAuth();

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  // Render appropriate island based on user role
  if (user.role === 'admin') {
    return <AdminNotificationIsland />;
  }

  return <StaffNotificationIsland />;
}
