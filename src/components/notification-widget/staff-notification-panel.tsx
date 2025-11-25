"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { StaffNotificationDropdown } from "@/components/staff/staff-notification-dropdown"
import { useNotificationCount } from "@/hooks/use-notification-count"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle } from "lucide-react"

export function StaffNotificationPanel() {
  const { user } = useAuth()
  const { markAllViewed, isMarkingViewed } = useNotificationCount(user?.role)

  const handleMarkAllRead = () => {
    markAllViewed()
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base sm:text-lg">Notifications</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your task updates and request status
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingViewed}
            className="text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {isMarkingViewed ? "Marking..." : "Mark All Read"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <ScrollArea className="h-[300px]">
        <StaffNotificationDropdown inWidget />
      </ScrollArea>
    </div>
  )
}
