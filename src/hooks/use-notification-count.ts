"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useEffect, useMemo } from 'react'
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync'

export function useNotificationCount(role: string | undefined) {
  const supabase = createClient()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: count = 0, refetch } = useQuery<number>({
    queryKey: ['notification-count', user?.id, role],
    queryFn: async () => {
      if (!user) return 0

      // Use the new unified notifications table
      const { data, error } = await supabase
        .rpc('get_unviewed_notification_count', { p_user_id: user.id })

      if (error) {
        console.error('Error fetching notification count:', error)
        return 0
      }

      return data || 0
    },
    enabled: !!user && !!role,
    staleTime: 0, // Instant updates for notifications
    refetchInterval: 60 * 1000, // Refetch every minute
  })

  // Instant invalidation function
  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-count'] })
    broadcastDataUpdate('notification-count-changed', { userId: user?.id, role })
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'notification-count-changed') {
        // console.log('🔄 Cross-tab sync: notification count updated');
        queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription for notifications table
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          // console.log('📡 Notification changed:', payload)
          invalidateNotifications()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: notifications')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: notifications')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, invalidateNotifications])

  // Mark all notifications as viewed mutation
  const markAllViewedMutation = useMutation({
    mutationFn: async () => {
      if (!user) return 0

      const { data, error } = await supabase
        .rpc('mark_all_notifications_viewed', { p_user_id: user.id })

      if (error) throw error
      return data
    },
    onSuccess: (updatedCount) => {
      // console.log(`✅ Marked ${updatedCount} notifications as viewed`)
      queryClient.invalidateQueries({ queryKey: ['notification-count'] })
      broadcastDataUpdate('notification-count-changed', { userId: user?.id, role })
    },
    onError: (error) => {
      console.error('Failed to mark notifications as viewed:', error)
    },
  })

  // Mark single notification as viewed mutation
  const markViewedMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) return false

      const { data, error } = await supabase
        .rpc('mark_notification_viewed', { 
          p_notification_id: notificationId, 
          p_user_id: user.id 
        })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-count'] })
      broadcastDataUpdate('notification-count-changed', { userId: user?.id, role })
    },
    onError: (error) => {
      console.error('Failed to mark notification as viewed:', error)
    },
  })

  return { 
    count, 
    refetch,
    markAllViewed: markAllViewedMutation.mutate,
    markViewed: markViewedMutation.mutate,
    isMarkingViewed: markAllViewedMutation.isPending || markViewedMutation.isPending
  }
}
