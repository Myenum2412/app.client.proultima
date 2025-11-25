"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

interface FloatingNotificationWidgetProps {
  userRole: 'admin' | 'staff'
  notificationCount: number
  onRefetchCount?: () => void
  children: React.ReactNode // Notification content
}

export function FloatingNotificationWidget({
  userRole,
  notificationCount,
  onRefetchCount,
  children
}: FloatingNotificationWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { user } = useAuth()

  // Clear badge count when widget is opened (mobile-like behavior)
  useEffect(() => {
    if (isExpanded && user) {
      // Mark as viewed when widget opens
      const now = new Date().toISOString()
      
      if (userRole === 'admin') {
        localStorage.setItem('task-proofs-last-viewed', now)
        localStorage.setItem('maintenance-last-viewed', now)
      } else {
        localStorage.setItem(`notifications-last-viewed-${user.staffId}`, now)
      }
      
      // Trigger refetch to update count after a brief delay
      setTimeout(() => {
        onRefetchCount?.()
      }, 100)
    }
  }, [isExpanded, user, userRole, onRefetchCount])

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 w-96 max-w-[calc(100vw-2rem)] sm:max-w-md mb-2"
          >
            <Card className="overflow-hidden border-2 max-h-[70vh]">
              {children}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:shadow-xl transition-all duration-200",
          isExpanded && "bg-primary/90"
        )}
      >
        {isExpanded ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <>
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </>
        )}
      </motion.button>
    </div>
  )
}
