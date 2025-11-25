"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/admin/notification-dropdown"
import { MaintenanceNotificationDropdown } from "@/components/admin/maintenance-notification-dropdown"
import { useNotificationCount } from "@/hooks/use-notification-count"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle } from "lucide-react"

export function AdminNotificationPanel() {
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
            <h3 className="font-semibold text-base sm:text-lg">All Notifications</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Stay updated with latest activities
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

      {/* Single List View - All Notifications */}
      <ScrollArea className="h-[400px]">
        <div className="p-2">
          {/* Task Proofs Section */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Task Proof Verifications
            </h4>
            <NotificationDropdown inWidget />
          </div>

          {/* Requests Section */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Maintenance, Purchase & Scrap Requests
            </h4>
            <MaintenanceNotificationDropdown inWidget />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
