'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
import type { CashTransaction, CashTransactionFormData, BranchOpeningBalance, CashBookSummary } from '@/types/cashbook';

interface UseCashTransactionsOptions {
  autoApprove?: boolean;
  includePending?: boolean;
  includeRejected?: boolean;
}

export function useCashTransactions(
  branch?: string,
  startDate?: string,
  endDate?: string,
  options: UseCashTransactionsOptions = {}
) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const autoApprove = options.autoApprove ?? true;
  const includePending = options.includePending ?? false;
  const includeRejected = options.includeRejected ?? includePending;

  // Fetch cash transactions
  const { data: transactions = [], isLoading, error, refetch } = useQuery<CashTransaction[]>({
    queryKey: ['cash-transactions', branch, startDate, endDate, includePending, includeRejected],
    queryFn: async () => {
      let query = supabase
        .from('cash_transactions')
        .select(`
          *,
          staff:staff_id (
            name,
            employee_id,
            email
          )
        `)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (branch) {
        query = query.ilike('branch', branch);  // Case-insensitive match
      }

      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }

      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }

      if (!includePending && !includeRejected) {
        query = query.eq('verification_status', 'approved');
      } else {
        const statuses = new Set<string>(['approved']);
        if (includePending) statuses.add('pending');
        if (includeRejected) statuses.add('rejected');
        query = query.in('verification_status', Array.from(statuses));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - financial data can tolerate slight delay
    refetchOnWindowFocus: false, // Disable - we have real-time
  });

  // Fetch expense categories from admin settings
  const { data: expenseCategories = [] } = useQuery<string[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('expense_categories')
        .single();

      if (error) throw error;
      return data?.expense_categories || [];
    },
  });

  // Fetch branch opening balance
  const { data: openingBalance } = useQuery<BranchOpeningBalance | null>({
    queryKey: ['branch-opening-balance', branch],
    queryFn: async () => {
      if (!branch) return null;

      const { data, error } = await supabase
        .from('branch_opening_balances')
        .select('*')
        .ilike('branch', branch)  // Case-insensitive match
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!branch,
  });

  const approvedTransactions = useMemo(
    () => transactions.filter((t) => t.verification_status === 'approved'),
    [transactions]
  );

  const summary: CashBookSummary = {
    opening_balance: openingBalance?.opening_balance || 0,
    total_cash_in: approvedTransactions.reduce((sum, t) => sum + (t.cash_in || 0), 0),
    total_cash_out: approvedTransactions.reduce((sum, t) => sum + (t.cash_out || 0), 0),
    closing_balance: 0,
    transaction_count: approvedTransactions.length,
  };

  summary.closing_balance = summary.opening_balance + summary.total_cash_in - summary.total_cash_out;

  // Instant invalidation function
  const invalidateCash = () => {
    queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['branch-opening-balances'] });
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    broadcastDataUpdate('cash-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'cash-updated') {
        queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cash-transactions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_transactions' },
        () => {
          invalidateCash(); // Use instant invalidation
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: cash_transactions');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidateCash]);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (formData: CashTransactionFormData & { staff_id: string; branch: string; voucher_no: string }) => {
      const previousBalance = approvedTransactions.length > 0
        ? approvedTransactions[0].balance
        : (openingBalance?.opening_balance || 0);
      const newBalance = previousBalance + (formData.cash_in || 0) - (formData.cash_out || 0);
      const verificationStatus = autoApprove ? 'approved' : 'pending';
      const balanceToStore = autoApprove ? newBalance : previousBalance;

      const { data, error } = await supabase
        .from('cash_transactions')
        .insert({
          ...formData,
          balance: balanceToStore,
          verification_status: verificationStatus,
          verified_by: autoApprove ? formData.staff_id : null,
          verified_at: autoApprove ? new Date().toISOString() : null,
        })
        .select(`
          *,
          staff:staff_id (
            name,
            employee_id,
            email
          )
        `)
        .single();

      if (error) throw error;
      
      if (autoApprove) {
        const BALANCE_THRESHOLD = 500;
        if (newBalance < BALANCE_THRESHOLD && previousBalance >= BALANCE_THRESHOLD) {
          try {
            const response = await fetch('/api/email/send-low-balance-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                branch: formData.branch,
                balance: newBalance,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Failed to send low balance alert email:', errorData);
            }
          } catch (emailError) {
            console.error('Failed to send low balance alert email:', emailError);
          }
        }
      }
      
      const transactionForBroadcast = {
        id: data.id,
        branch: data.branch,
        cash_in: data.cash_in,
        cash_out: data.cash_out,
        primary_list: data.primary_list,
        nature_of_expense: data.nature_of_expense,
        transaction_date: data.transaction_date,
        voucher_no: data.voucher_no,
        attachment_urls: data.attachment_urls,
        staff: data.staff,
        staff_id: data.staff_id,
      };

      if (autoApprove) {
        try {
          await fetch('/api/cashbook/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario: 'autoApproved',
              transaction: transactionForBroadcast,
            }),
          });
        } catch (err) {
          console.error('Failed to broadcast auto-approved cashbook notification:', err);
        }
      } else {
        try {
          await fetch('/api/cashbook/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario: 'pending',
              transaction: transactionForBroadcast,
            }),
          });
        } catch (err) {
          console.error('Failed to create pending transaction notifications:', err);
        }

        try {
          await fetch('/api/email/cash-transaction-pending', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction: transactionForBroadcast }),
          });
        } catch (err) {
          console.error('Failed to send pending transaction email:', err);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success(autoApprove ? 'Transaction added successfully!' : 'Transaction submitted for verification.');
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['branch-opening-balances'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-categories'] });
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'cashbook', action: 'created' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to add transaction: ' + (error as Error).message);
    },
  });

  // Update and delete mutations remain unchanged
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CashTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('cash_transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transaction updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['branch-opening-balances'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'cashbook', action: 'updated' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to update transaction: ' + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Transaction deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['branch-opening-balances'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'cashbook', action: 'deleted' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to delete transaction: ' + (error as Error).message);
    },
  });

  return {
    transactions,
    expenseCategories,
    openingBalance,
    summary,
    isLoading,
    error,
    refetch,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}



