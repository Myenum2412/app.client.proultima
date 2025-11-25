"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";

export interface SystemOptions {
  roles: string[];
  departments: string[];
  branches: string[];
  expense_categories: string[];
}

export function useSystemOptions() {
  const supabase = createClient();
  const { user } = useAuth();
  
  const { data, isLoading, error, refetch } = useQuery<SystemOptions>({
    queryKey: ['system-options', user?.email],
    queryFn: async () => {
      // console.log('🔍 Fetching system options for email:', user?.email);
      
      // Try to get specific admin first
      let { data, error } = await supabase
        .from('admins')
        .select('roles, departments, branches, expense_categories')
        .eq('email', user?.email || 'vel@proultimaengineering.com')
        .single();

      // If not found, get first admin as fallback
      if (error && error.code === 'PGRST116') {
        console.warn('⚠️ Admin not found by email, fetching first admin as fallback');
        const fallbackResult = await supabase
          .from('admins')
          .select('roles, departments, branches, expense_categories')
          .limit(1)
          .single();
        
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      // console.log('📊 System options result:', {
      //   userEmail: user?.email,
      //   branches: data?.branches,
      //   branchesCount: data?.branches?.length || 0,
      //   error: error?.message,
      // });

      if (error) {
        console.error('❌ Error fetching system options:', error);
        throw error;
      }

      if (!data) {
        console.warn('⚠️ No admin record found for email:', user?.email);
      }

      return {
        roles: data?.roles || [],
        departments: data?.departments || [],
        branches: data?.branches || [],
        expense_categories: data?.expense_categories || [],
      };
    },
    staleTime: 0, // Instant updates for system options
  });

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('system-options-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admins',
        },
        () => {
          // console.log('🔄 System options updated, refetching...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, supabase]);

  return {
    roles: data?.roles || [],
    departments: data?.departments || [],
    branches: data?.branches || [],
    expense_categories: data?.expense_categories || [],
    isLoading,
    error,
    refetch,
  };
}

