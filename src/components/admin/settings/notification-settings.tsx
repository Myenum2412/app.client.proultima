"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useNotificationSound } from "@/hooks/use-notification-sound"
import { useNotificationCount } from "@/hooks/use-notification-count"
import { useAuth } from "@/contexts/auth-context"
import { Bell, Volume2, VolumeX, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function NotificationSettings() {
  const { user } = useAuth()
  const { toggleSound, isSoundEnabled, playNotificationSound } = useNotificationSound()
  const { markAllViewed, isMarkingViewed } = useNotificationCount(user?.role)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Initialize sound state from localStorage
  useEffect(() => {
    setSoundEnabled(isSoundEnabled())
  }, [isSoundEnabled])

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled)
    toggleSound(enabled)
    toast.success(enabled ? "Notification sounds enabled" : "Notification sounds disabled")
  }

  const handleTestSound = () => {
    playNotificationSound()
    toast.success("Test sound played")
  }

  const handleMarkAllRead = () => {
    markAllViewed()
    toast.success("All notifications marked as read")
  }

  return (
    <div className="space-y-6">
      {/* Sound Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Sound Settings
          </CardTitle>
          <CardDescription>
            Configure notification sound preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-toggle" className="text-base">
                Notification Sounds
              </Label>
              <p className="text-sm text-muted-foreground">
                Play sound when new notifications arrive
              </p>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSound}
              disabled={!soundEnabled}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 mr-2" />
              ) : (
                <VolumeX className="h-4 w-4 mr-2" />
              )}
              Test Sound
            </Button>
            {!soundEnabled && (
              <p className="text-xs text-muted-foreground">
                Enable sounds to test
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Notification Management
          </CardTitle>
          <CardDescription>
            Manage your current notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">
                Mark All as Read
              </Label>
              <p className="text-sm text-muted-foreground">
                Clear all unread notification badges
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingViewed}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isMarkingViewed ? "Marking..." : "Mark All Read"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Notifications are synced in real-time across all your devices</p>
          <p>• Sound alerts play when the notification count increases</p>
          <p>• You can disable sounds if you prefer silent notifications</p>
          <p>• Notification settings are saved in your browser's local storage</p>
        </CardContent>
      </Card>
    </div>
  )
}
