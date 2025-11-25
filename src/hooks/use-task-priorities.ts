"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import type { TaskPriorityOption } from "@/types";

export function useTaskPriorities() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<TaskPriorityOption[]>({
    queryKey: ['task-priorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_priority_options')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant updates for task priorities
    refetchOnWindowFocus: false,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('task-priorities-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'task_priority_options' },
        (payload) => {
          // console.log('📡 Task priorities changed:', payload);
          refetch();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: task-priorities');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: task-priorities');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, supabase]);

  return {
    priorities: data || [],
    isLoading,
    error,
    refetch,
  };
}
