'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
import { toast } from 'sonner';
import type { SupportTicket, SupportTicketFormData } from '@/types/support';

export function useSupportTickets(userId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch support tickets
  const { data: tickets = [], isLoading, error, refetch } = useQuery<SupportTicket[]>({
    queryKey: ['support-tickets', userId],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          admin_responder:admin_responder_id(name, email)
        `)
        .order('created_at', { ascending: false });

      // Filter by user if userId provided
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant updates - no stale time
  });

  // Count tickets by status
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const closedCount = tickets.filter(t => t.status === 'closed').length;

  // Instant invalidation function
  const invalidateSupport = () => {
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    broadcastDataUpdate('support-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'support-updated') {
        // console.log('🔄 Cross-tab sync: support updated');
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('support-tickets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        (payload) => {
          // console.log('📡 Support ticket changed:', payload);
          invalidateSupport(); // Use instant invalidation
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidateSupport]);

  // Create ticket
  const createMutation = useMutation({
    mutationFn: async (data: SupportTicketFormData) => {
      // Generate ticket number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .like('ticket_no', `ST-${year}%`);

      const ticketNumber = `ST-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

      // console.log('Ticket creation attempt:', { data, ticketNumber });
      
      const { data: result, error } = await supabase
        .from('support_tickets')
        .insert({
          ...data,
          ticket_no: ticketNumber,
        })
        .select()
        .single();

      if (error) {
        console.error('Ticket creation error:', error);
        throw error;
      }
      // console.log('Ticket created successfully:', result);
      return result;
    },
    onSuccess: () => {
      toast.success('Support ticket submitted successfully!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'support', action: 'created' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to submit ticket: ' + (error as Error).message);
    },
  });

  // Update ticket status/response (admin only)
  const updateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      admin_response, 
      admin_responder_id 
    }: { 
      id: string; 
      status?: string; 
      admin_response?: string; 
      admin_responder_id?: string;
    }) => {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (status) updateData.status = status;
      if (admin_response) {
        updateData.admin_response = admin_response;
        updateData.responded_at = new Date().toISOString();
      }
      if (admin_responder_id) updateData.admin_responder_id = admin_responder_id;

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Ticket updated successfully!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'support', action: 'updated' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to update ticket: ' + (error as Error).message);
    },
  });

  return {
    tickets,
    isLoading,
    error,
    refetch,
    openCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    createTicket: createMutation.mutate,
    updateTicket: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

