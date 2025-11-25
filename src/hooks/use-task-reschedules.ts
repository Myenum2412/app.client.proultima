'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
import type { TaskReschedule } from '@/types';

export function useTaskReschedules() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Instant invalidation function
  const invalidateReschedules = () => {
    queryClient.invalidateQueries({ queryKey: ['task-reschedules'] });
    broadcastDataUpdate('reschedules-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'reschedules-updated') {
        // console.log('🔄 Cross-tab sync: reschedules updated');
        queryClient.invalidateQueries({ queryKey: ['task-reschedules'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Fetch reschedules with staff/admin data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['task-reschedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_reschedules')
        .select(`
          *,
          staff:staff!staff_id(id, name, email),
          admin:admins!admin_id(id, name, email),
          task:tasks!task_id(id, title, task_no)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 0, // Instant updates
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('task-reschedules-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'task_reschedules' },
        (payload) => {
          // console.log('📡 Reschedule changed:', payload);
          invalidateReschedules();
          
          // Trigger notification event
          window.dispatchEvent(new CustomEvent('rescheduleUpdated', { 
            detail: payload 
          }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, invalidateReschedules]);

  // Create reschedule request mutation
  const createRescheduleMutation = useMutation({
    mutationFn: async (data: {
      task_id: string;
      staff_id: string;
      reason: string;
      requested_new_date: string;
      original_due_date?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('task_reschedules')
        .insert(data)
        .select(`
          *,
          staff:staff!staff_id (
            name,
            email
          ),
          task:tasks!task_id (
            title,
            task_no
          )
        `)
        .single();
      
      if (error) throw error;

      // Notify all admins about reschedule request
      const { data: admins } = await supabase
        .from('staff')
        .select('id')
        .eq('role', 'admin');

      for (const admin of admins || []) {
        await supabase
          .from('notifications')
          .insert({
            user_id: admin.id,
            type: 'task_reschedule_request',
            title: 'Task Reschedule Request',
            message: `${result.staff?.name} requests to reschedule "${result.task?.title}"`,
            reference_id: result.id,
            reference_table: 'task_reschedules',
            is_viewed: false,
            metadata: {
              task_no: result.task?.task_no,
              task_id: data.task_id,
              original_date: data.original_due_date,
              requested_date: data.requested_new_date,
              reason: data.reason,
              staff_name: result.staff?.name
            }
          });
      }

      return result;
    },
    onSuccess: async (result) => {
      toast.success('Reschedule request submitted');
      
      // Invalidate ALL relevant queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['task-reschedules'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync event
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'reschedule', action: 'created' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      
      // Send email to admin
      await fetch('/api/email/send-reschedule-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_reschedule',
          rescheduleId: result.id,
        }),
      });
      
      refetch();
    },
  });

  // Approve reschedule mutation
  const approveRescheduleMutation = useMutation({
    mutationFn: async ({ id, adminId, response }: {
      id: string;
      adminId: string;
      response?: string;
    }) => {
      // Get reschedule details
      const { data: reschedule } = await supabase
        .from('task_reschedules')
        .select('*, task:tasks!task_id(*)')
        .eq('id', id)
        .single();
      
      if (!reschedule) throw new Error('Reschedule not found');
      
      // Update reschedule status
      const { data: updatedReschedule, error: rescheduleError } = await supabase
        .from('task_reschedules')
        .update({
          status: 'approved',
          admin_id: adminId,
          admin_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff!staff_id (
            name,
            email
          ),
          task:tasks!task_id (
            title,
            task_no
          )
        `)
        .single();
      
      if (rescheduleError) throw rescheduleError;
      
      // Update task with new date ONLY (keep original status - don't change to "rescheduled")
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ due_date: reschedule.requested_new_date })
        .eq('id', reschedule.task_id);
      
      if (taskError) throw taskError;

      // Notify staff member about reschedule approval
      const { data: admin } = await supabase
        .from('staff')
        .select('name')
        .eq('id', adminId)
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: updatedReschedule.staff_id,
          type: 'task_reschedule_approved',
          title: 'Reschedule Request Approved',
          message: `Your reschedule request for "${updatedReschedule.task?.title}" has been approved by ${admin?.name}`,
          reference_id: updatedReschedule.id,
          reference_table: 'task_reschedules',
          is_viewed: false,
          metadata: {
            task_no: updatedReschedule.task?.task_no,
            task_id: updatedReschedule.task_id,
            new_date: updatedReschedule.requested_new_date,
            admin_response: response,
            approved_by: admin?.name
          }
        });
      
      return updatedReschedule;
    },
    onSuccess: async (reschedule) => {
      toast.success('Reschedule approved');
      
      // Invalidate ALL relevant queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['task-reschedules'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync event
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'reschedule', action: 'approved' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      
      // Send email to staff
      await fetch('/api/email/send-reschedule-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reschedule_approved',
          rescheduleId: reschedule.id,
        }),
      });
      
      refetch();
    },
  });

  // Reject reschedule mutation
  const rejectRescheduleMutation = useMutation({
    mutationFn: async ({ id, adminId, response }: {
      id: string;
      adminId: string;
      response: string;
    }) => {
      const { data, error } = await supabase
        .from('task_reschedules')
        .update({
          status: 'rejected',
          admin_id: adminId,
          admin_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff!staff_id (
            name,
            email
          ),
          task:tasks!task_id (
            title,
            task_no
          )
        `)
        .single();
      
      if (error) throw error;

      // Notify staff member about reschedule rejection
      const { data: admin } = await supabase
        .from('staff')
        .select('name')
        .eq('id', adminId)
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: data.staff_id,
          type: 'task_reschedule_rejected',
          title: 'Reschedule Request Rejected',
          message: `Your reschedule request for "${data.task?.title}" has been rejected by ${admin?.name}`,
          reference_id: data.id,
          reference_table: 'task_reschedules',
          is_viewed: false,
          metadata: {
            task_no: data.task?.task_no,
            task_id: data.task_id,
            admin_response: response,
            rejected_by: admin?.name
          }
        });

      return data;
    },
    onSuccess: async (reschedule) => {
      toast.success('Reschedule rejected');
      
      // Invalidate ALL relevant queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['task-reschedules'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync event
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'reschedule', action: 'rejected' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      
      // Send email to staff
      await fetch('/api/email/send-reschedule-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reschedule_rejected',
          rescheduleId: reschedule.id,
        }),
      });
      
      refetch();
    },
  });

  return {
    reschedules: data || [],
    isLoading,
    refetch,
    createReschedule: createRescheduleMutation.mutate,
    approveReschedule: approveRescheduleMutation.mutate,
    rejectReschedule: rejectRescheduleMutation.mutate,
    isCreating: createRescheduleMutation.isPending,
    isApproving: approveRescheduleMutation.isPending,
    isRejecting: rejectRescheduleMutation.isPending,
  };
}
