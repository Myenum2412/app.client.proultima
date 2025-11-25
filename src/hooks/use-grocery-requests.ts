'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
// Removed queue-based email imports - using direct API calls instead
import { toast } from 'sonner';
import type { 
  GroceryRequest, 
  CreateGroceryRequestData, 
  UpdateGroceryRequestData,
  ApproveGroceryRequestData,
  RejectGroceryRequestData 
} from '@/types';

export function useGroceryRequests(staffId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch grocery requests (all or filtered by staff_id) with items
  const { data: groceryRequests = [], isLoading, error, refetch } = useQuery<GroceryRequest[]>({
    queryKey: ['grocery-requests', staffId],
    queryFn: async () => {
      let query = supabase
        .from('grocery_requests')
        .select(`
          *,
          staff:staff_id(name, employee_id, email),
          admin:approved_by(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (staffId) {
        query = query.eq('staff_id', staffId);
      }
      
      const { data: requests, error } = await query;
      
      if (error) throw error;
      
      // Fetch items for each request
      const requestsWithItems = await Promise.all(
        (requests || []).map(async (request) => {
          const { data: items, error: itemsError } = await supabase
            .from('grocery_request_items')
            .select('*')
            .eq('grocery_request_id', request.id)
            .order('created_at', { ascending: true });
          
          if (itemsError) throw itemsError;
          
          return {
            ...request,
            items: items || []
          };
        })
      );
      
      return requestsWithItems;
    },
    staleTime: 0, // Instant updates - no stale time
  });

  // Instant invalidation function
  const invalidateGrocery = () => {
    queryClient.invalidateQueries({ queryKey: ['grocery-requests'] });
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    broadcastDataUpdate('grocery-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'grocery-updated') {
        invalidateGrocery();
      }
    });

    return unsubscribe;
  }, []);

  // Real-time subscription for grocery requests
  useEffect(() => {
    const channel = supabase
      .channel('grocery-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_requests',
        },
        () => {
          invalidateGrocery();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Create grocery request mutation
  const createGroceryRequest = useMutation({
    mutationFn: async (data: CreateGroceryRequestData) => {
      // Calculate total request amount
      const totalRequestAmount = data.items.reduce((sum, item) => sum + item.total_amount, 0);
      
      // Insert the main request
      const { data: result, error } = await supabase
        .from('grocery_requests')
        .insert([{
          staff_id: data.staff_id,
          staff_name: data.staff_name,
          branch: data.branch,
          notes: data.notes,
          total_request_amount: totalRequestAmount,
        }])
        .select()
        .single();

      if (error) throw error;

      // Insert all items
      if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          grocery_request_id: result.id,
          item_name: item.item_name,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
        }));

        const { error: itemsError } = await supabase
          .from('grocery_request_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Notify all admins about new grocery request
      const { data: admins } = await supabase
        .from('admins')
        .select('id');

      if (admins && admins.length > 0) {
        const itemSummary = data.items.map(item => `${item.quantity} ${item.unit} of ${item.item_name}`).join(', ');
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          user_role: 'admin',
          type: 'grocery_request',
          title: 'New Stationary Request',
          description: `${data.staff_name} from ${data.branch} requested: ${itemSummary}`,
          reference_id: result.id,
          reference_table: 'grocery_requests',
          metadata: {
            staff_name: data.staff_name,
            branch: data.branch,
            items: data.items,
            total_request_amount: totalRequestAmount
          }
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Failed to create notifications:', notificationError);
        }
      }

      // Send email notification using direct API call
      try {
        await fetch('/api/email/send-grocery-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_request',
            requestData: { ...result, items: data.items }
          })
        });
      } catch (error) {
        console.error('Failed to send grocery request email:', error);
      }

      return result;
    },
    onSuccess: () => {
      invalidateGrocery();
      toast.success('Stationary request submitted successfully');
    },
    onError: (error) => {
      console.error('Error creating grocery request:', error);
      toast.error('Failed to submit stationary request');
    },
  });

  // Update grocery request mutation (staff only, pending requests)
  const updateGroceryRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGroceryRequestData }) => {
      // Calculate total request amount if items are provided
      let totalRequestAmount = 0;
      if (data.items) {
        totalRequestAmount = data.items.reduce((sum, item) => sum + item.total_amount, 0);
      }

      // Update the main request
      const updateData: any = { ...data };
      if (data.items) {
        delete updateData.items; // Remove items from main update
        updateData.total_request_amount = totalRequestAmount;
      }

      const { data: result, error } = await supabase
        .from('grocery_requests')
        .update(updateData)
        .eq('id', id)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;

      // Handle items update if provided
      if (data.items) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('grocery_request_items')
          .delete()
          .eq('grocery_request_id', id);

        if (deleteError) throw deleteError;

        // Insert new items
        if (data.items.length > 0) {
          const itemsToInsert = data.items.map(item => ({
            grocery_request_id: id,
            item_name: item.item_name,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
          }));

          const { error: itemsError } = await supabase
            .from('grocery_request_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return result;
    },
    onSuccess: () => {
      invalidateGrocery();
      toast.success('Stationary request updated successfully');
    },
    onError: (error) => {
      console.error('Error updating grocery request:', error);
      toast.error('Failed to update stationary request');
    },
  });

  // Approve grocery request mutation (admin only)
  const approveGroceryRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ApproveGroceryRequestData }) => {
      const { data: result, error } = await supabase
        .from('grocery_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          admin_notes: data.admin_notes,
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id(name, email),
          admin:approved_by(name, email)
        `)
        .single();

      if (error) throw error;

      // Insert notification for staff
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: result.staff_id,
            user_role: 'staff',
            type: 'grocery_status_update',
            title: 'Stationary Request Approved',
            description: `Your request for ${result.quantity} ${result.unit} of ${result.item_name} has been approved`,
            reference_id: result.id,
            reference_table: 'grocery_requests',
            metadata: {
              status: 'approved',
              item_name: result.item_name,
              quantity: result.quantity,
              unit: result.unit,
              total_amount: result.total_amount,
              admin_notes: data.admin_notes
            }
          }
        ]);

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      // Send email notification using direct API call
      try {
        await fetch('/api/email/send-grocery-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'approved',
            requestData: result,
            adminNotes: data.admin_notes
          })
        });
      } catch (error) {
        console.error('Failed to send grocery approval email:', error);
      }

      return result;
    },
    onSuccess: () => {
      invalidateGrocery();
      toast.success('Stationary request approved successfully');
    },
    onError: (error) => {
      console.error('Error approving grocery request:', error);
      toast.error('Failed to approve stationary request');
    },
  });

  // Reject grocery request mutation (admin only)
  const rejectGroceryRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RejectGroceryRequestData }) => {
      const { data: result, error } = await supabase
        .from('grocery_requests')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          rejection_reason: data.rejection_reason,
          admin_notes: data.admin_notes,
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id(name, email),
          admin:approved_by(name, email)
        `)
        .single();

      if (error) throw error;

      // Insert notification for staff
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: result.staff_id,
            user_role: 'staff',
            type: 'grocery_status_update',
            title: 'Stationary Request Rejected',
            description: `Your request for ${result.quantity} ${result.unit} of ${result.item_name} has been rejected`,
            reference_id: result.id,
            reference_table: 'grocery_requests',
            metadata: {
              status: 'rejected',
              item_name: result.item_name,
              quantity: result.quantity,
              unit: result.unit,
              total_amount: result.total_amount,
              rejection_reason: data.rejection_reason,
              admin_notes: data.admin_notes
            }
          }
        ]);

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      // Send email notification using direct API call
      try {
        await fetch('/api/email/send-grocery-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rejected',
            requestData: result,
            rejectionReason: data.rejection_reason
          })
        });
      } catch (error) {
        console.error('Failed to send grocery rejection email:', error);
      }

      return result;
    },
    onSuccess: () => {
      invalidateGrocery();
      toast.success('Stationary request rejected successfully');
    },
    onError: (error) => {
      console.error('Error rejecting grocery request:', error);
      toast.error('Failed to reject stationary request');
    },
  });

  // Delete grocery request mutation (staff only, pending requests)
  const deleteGroceryRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grocery_requests')
        .delete()
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateGrocery();
      toast.success('Stationary request deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting grocery request:', error);
      toast.error('Failed to delete stationary request');
    },
  });

  // Computed values
  const stats = useMemo(() => {
    const total = groceryRequests.length;
    const pending = groceryRequests.filter(req => req.status === 'pending').length;
    const approved = groceryRequests.filter(req => req.status === 'approved').length;
    const rejected = groceryRequests.filter(req => req.status === 'rejected').length;

    return { total, pending, approved, rejected };
  }, [groceryRequests]);

  return {
    groceryRequests,
    isLoading,
    error,
    refetch,
    createGroceryRequest: createGroceryRequest.mutate,
    updateGroceryRequest: updateGroceryRequest.mutate,
    approveGroceryRequest: approveGroceryRequest.mutate,
    rejectGroceryRequest: rejectGroceryRequest.mutate,
    deleteGroceryRequest: deleteGroceryRequest.mutate,
    isCreating: createGroceryRequest.isPending,
    isUpdating: updateGroceryRequest.isPending,
    isApproving: approveGroceryRequest.isPending,
    isRejecting: rejectGroceryRequest.isPending,
    isDeleting: deleteGroceryRequest.isPending,
    stats,
  };
}
