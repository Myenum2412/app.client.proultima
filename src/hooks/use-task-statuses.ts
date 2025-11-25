'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import type { TaskStatusOption } from '@/types';

export function useTaskStatuses() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: statuses = [], isLoading, error, refetch } = useQuery<TaskStatusOption[]>({
    queryKey: ['task-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_status_options')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant updates for task statuses
  });

  useEffect(() => {
    const channel = supabase
      .channel('task-status-options-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_status_options' },
        (payload) => {
          // console.log('📡 Task status options table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: task_status_options');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: task_status_options');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  return {
    statuses,
    isLoading,
    error,
    refetch,
  };
}
