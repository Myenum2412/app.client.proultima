"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { FloatingNotificationWidget } from "./floating-notification-widget"
import { AdminNotificationPanel } from "./admin-notification-panel"
import { StaffNotificationPanel } from "./staff-notification-panel"
import { useNotificationCount } from "@/hooks/use-notification-count"
import { useNotificationSound } from "@/hooks/use-notification-sound"

export function NotificationWidgetManager() {
  const { user } = useAuth()
  const { count, refetch } = useNotificationCount(user?.role)
  const { checkAndPlaySound } = useNotificationSound()

  // Play sound when count increases
  useEffect(() => {
    checkAndPlaySound(count)
  }, [count, checkAndPlaySound])

  // Don't render on login page
  if (!user) return null

  return (
    <FloatingNotificationWidget
      userRole={user.role as 'admin' | 'staff'}
      notificationCount={count}
      onRefetchCount={refetch}
    >
      {user.role === 'admin' ? (
        <AdminNotificationPanel />
      ) : (
        <StaffNotificationPanel />
      )}
    </FloatingNotificationWidget>
  )
}
