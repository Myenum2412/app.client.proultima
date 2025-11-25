'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_viewed: boolean;
  created_at: string;
  metadata: any;
  user_id: string;
  user_role: string | null;
  reference_id: string | null;
  reference_table: string | null;
  viewed_at: string | null;
}

export function useAllNotifications() {
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['all-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 0, // Instant updates for notifications
    refetchInterval: 60 * 1000, // Refetch every minute as fallback
  });

  // Instant invalidation function
  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    broadcastDataUpdate('notification-changed', { userId: user?.id });
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'notification-changed' || message.type === 'notification-count-changed') {
        // console.log('🔄 Cross-tab sync: notifications updated');
        queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription for notifications table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // console.log('📡 Notification changed:', payload);
          invalidateNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: all-notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: all-notifications');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, invalidateNotifications]);

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      broadcastDataUpdate('notification-changed', { userId: user?.id });
    },
    onError: (error) => {
      console.error('Failed to delete notification:', error);
    }
  });

  return { 
    notifications, 
    isLoading, 
    refetch,
    deleteNotification: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending
  };
}
