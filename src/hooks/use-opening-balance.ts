'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { BranchOpeningBalance, BranchOpeningBalanceHistoryEntry } from '@/types/cashbook';

export function useOpeningBalance() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch all opening balances (include history)
  const { data: openingBalances = [], isLoading } = useQuery<BranchOpeningBalance[]>({
    queryKey: ['opening-balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_opening_balances')
        .select('*')
        .order('branch');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete opening balance
  const deleteMutation = useMutation({
    mutationFn: async (branch: string) => {
      const { error } = await supabase
        .from('branch_opening_balances')
        .delete()
        .ilike('branch', branch);  // Case-insensitive match
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Opening balance deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['opening-balances'] });
      queryClient.invalidateQueries({ queryKey: ['branch-opening-balance'] });
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
    },
    onError: (error) => {
      toast.error('Failed to delete opening balance: ' + (error as Error).message);
    },
  });

  // Update/Insert opening balance (full overwrite)
  const updateMutation = useMutation({
    mutationFn: async ({ branch, opening_balance }: { branch: string; opening_balance: number }) => {
      const { data: existing } = await supabase
        .from('branch_opening_balances')
        .select('*')
        .ilike('branch', branch)  // Case-insensitive match
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('branch_opening_balances')
          .update({ 
            opening_balance, 
            updated_at: new Date().toISOString() 
          })
          .ilike('branch', branch)  // Case-insensitive match
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('branch_opening_balances')
          .insert({ 
            branch, 
            opening_balance,
            period_start: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success('Opening balance updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['opening-balances'] });
      queryClient.invalidateQueries({ queryKey: ['branch-opening-balance'] });
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
    },
    onError: (error) => {
      toast.error('Failed to update opening balance: ' + (error as Error).message);
    },
  });

  // Append entry to history and increment opening_balance
  const appendEntryMutation = useMutation({
    mutationFn: async ({
      branch,
      amount,
      date,
      note,
      added_by,
    }: { branch: string; amount: number; date: string; note?: string; added_by?: string; }) => {
      if (!branch) throw new Error('Branch is required');
      if (!date) throw new Error('Date is required');
      if (!Number.isFinite(amount)) throw new Error('Amount is required');

      // Fetch current row
      const { data: existing, error: fetchError } = await supabase
        .from('branch_opening_balances')
        .select('id, balance_history, opening_balance')
        .ilike('branch', branch)
        .single();

      if (fetchError) throw fetchError;

      const entry: BranchOpeningBalanceHistoryEntry = {
        date,
        amount,
        note,
        added_by,
      };

      const newHistory = Array.isArray(existing?.balance_history) ? [...existing.balance_history, entry] : [entry];
      const newOpening = (existing?.opening_balance || 0) + amount;

      const { data, error } = await supabase
        .from('branch_opening_balances')
        .update({
          balance_history: newHistory,
          opening_balance: newOpening,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Opening balance entry added');
      queryClient.invalidateQueries({ queryKey: ['opening-balances'] });
      queryClient.invalidateQueries({ queryKey: ['branch-opening-balance'] });
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
    },
    onError: (error) => {
      toast.error('Failed to add opening balance entry: ' + (error as Error).message);
    },
  });

  return {
    openingBalances,
    isLoading,
    updateOpeningBalance: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteOpeningBalance: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    appendOpeningBalanceEntry: appendEntryMutation.mutate,
    isAppending: appendEntryMutation.isPending,
  };
}



