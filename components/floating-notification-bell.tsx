"use client";

import * as React from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "notification-bell-closed";

export function FloatingNotificationBell() {
  const [isClosed, setIsClosed] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    // Check if the bell was previously closed
    const closed = localStorage.getItem(STORAGE_KEY);
    if (closed !== "true") {
      setIsClosed(false);
    }
  }, []);

  const handleClose = () => {
    setIsClosed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isClosed && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className={cn("fixed bottom-6 right-6 z-50")}
        >
          <div className="relative flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
            {/* Notification Bell Icon */}
            <div className="relative">
              <Bell className="h-6 w-6 text-primary" />
              {/* Optional: Add a badge for unread notifications */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                3
              </span>
            </div>

            {/* Notification Text */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Notifications</span>
              <span className="text-xs text-muted-foreground">
                You have 3 new notifications
              </span>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="h-6 w-6 shrink-0"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

