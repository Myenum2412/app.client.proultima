'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { TaskVerificationDialog } from "@/components/admin/task-verification-dialog"
import { ConnectionStatus } from "@/components/connection-status"
import { useTasks } from "@/hooks/use-tasks"
import { useAuth } from "@/contexts/auth-context"
import { getCurrentUser } from "@/lib/auth"
import { RefreshCw } from "lucide-react"

interface SiteHeaderProps {
  userName?: string;
  userRole?: 'admin' | 'staff';
}

export function SiteHeader({ userName, userRole }: SiteHeaderProps) {
  const { user } = useAuth();
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user?.name || userName || 'Admin');
  const { tasks } = useTasks();

  const handleViewProof = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsVerificationDialogOpen(true);
  };

  const selectedTask = tasks.find((t: any) => t.id === selectedTaskId);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      const currentUser = getCurrentUser();
      if (currentUser) setDisplayName(currentUser.name);
    };
    window.addEventListener('adminProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('adminProfileUpdated', handleProfileUpdate);
  }, []);

  // Update display name when user changes
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();
  const roleLabel = userRole === 'admin' ? ' ' : userRole === 'staff' ? 'Staff' : '';
  const displayText = displayName ? `${greeting}, ${roleLabel} ${displayName}` : 'Documents';

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 " />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{displayText}</h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Refresh Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.reload()}
              className="h-8 w-8 p-0"
              title="Refresh Page"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {/* Connection Status */}
            <ConnectionStatus />
          </div>
        </div>
      </header>

      {/* Task Verification Dialog */}
      {selectedTask && (
        <TaskVerificationDialog
          task={selectedTask}
          isOpen={isVerificationDialogOpen}
          onOpenChange={(open) => {
            setIsVerificationDialogOpen(open);
            if (!open) {
              setSelectedTaskId(null);
            }
          }}
        />
      )}
    </>
  )
}
