'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
import { toast } from 'sonner';

export interface StationaryItem {
  id: string;
  item_name: string;
  unit: 'Box' | 'Pcs' | 'Rim' | 'Count';
  quantity: number;
  last_added_date: string;
  added_by_staff_name: string;
  branch: string;
  grocery_request_id: string;
}

export function useStationaryItems(branch: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch approved grocery request items for the branch
  const { data: stationaryItems = [], isLoading, error, refetch } = useQuery<StationaryItem[]>({
    queryKey: ['stationary-items', branch],
    queryFn: async () => {
      if (!branch) return [];

      // Get all approved grocery request items for this branch
      const { data: items, error: itemsError } = await supabase
        .from('grocery_request_items')
        .select(`
          id,
          item_name,
          unit,
          quantity,
          created_at,
          grocery_request_id,
          grocery_requests!inner (
            id,
            status,
            branch,
            staff_name
          )
        `)
        .eq('grocery_requests.status', 'approved')
        .eq('grocery_requests.branch', branch)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Transform the data to match StationaryItem interface
      const transformedItems = (items || []).map((item: any) => ({
        id: item.id,
        item_name: item.item_name,
        unit: item.unit,
        quantity: item.quantity,
        last_added_date: item.created_at,
        added_by_staff_name: item.grocery_requests?.staff_name || '',
        branch: item.grocery_requests?.branch || branch,
        grocery_request_id: item.grocery_request_id,
      }));

      return transformedItems;
    },
    enabled: !!branch,
    staleTime: 0,
  });

  // Instant invalidation function
  const invalidateStationary = () => {
    queryClient.invalidateQueries({ queryKey: ['stationary-items', branch] });
    broadcastDataUpdate('stationary-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'stationary-updated') {
        invalidateStationary();
      }
    });

    return unsubscribe;
  }, []);

  // Real-time subscription for grocery request items
  useEffect(() => {
    if (!branch) return;

    const channel = supabase
      .channel('stationary-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_request_items',
        },
        () => {
          invalidateStationary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branch]);

  // Buy stationary item mutation - reduce quantity
  const buyStationaryItem = useMutation({
    mutationFn: async ({ itemId, quantityToBuy, staffName }: { itemId: string; quantityToBuy: number; staffName: string }) => {
      // Get the current item
      const { data: item, error: itemError } = await supabase
        .from('grocery_request_items')
        .select('*, grocery_requests!inner(branch, status)')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      if (!item || item.grocery_requests?.status !== 'approved') {
        throw new Error('Item not found or not approved');
      }

      if (item.quantity < quantityToBuy) {
        throw new Error(`Insufficient quantity. Available: ${item.quantity}`);
      }

      const newQuantity = item.quantity - quantityToBuy;

      // Update the quantity
      const { error: updateError } = await supabase
        .from('grocery_request_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Check if low stock (quantity <= 1) and send email alert
      if (newQuantity <= 1) {
        try {
          await fetch('/api/email/send-stationary-low-stock-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemName: item.item_name,
              quantity: newQuantity,
              branch: item.grocery_requests?.branch || branch,
              staffName,
            }),
          });
        } catch (error) {
          console.error('Failed to send low stock alert:', error);
          // Don't throw - purchase should still succeed even if email fails
        }
      }

      return { success: true, newQuantity };
    },
    onSuccess: () => {
      invalidateStationary();
      toast.success('Item purchased successfully');
    },
    onError: (error: Error) => {
      console.error('Error buying stationary item:', error);
      toast.error(error.message || 'Failed to purchase item');
    },
  });

  // Delete stationary item mutation
  const deleteStationaryItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('grocery_request_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateStationary();
      toast.success('Item deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting stationary item:', error);
      toast.error('Failed to delete item');
    },
  });

  return {
    stationaryItems,
    isLoading,
    error,
    refetch,
    buyStationaryItem: buyStationaryItem.mutate,
    deleteStationaryItem: deleteStationaryItem.mutate,
    isBuying: buyStationaryItem.isPending,
    isDeleting: deleteStationaryItem.isPending,
  };
}

