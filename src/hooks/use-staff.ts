'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { hashPassword } from '@/lib/auth';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';

interface Staff {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
  is_online?: boolean;        // Online/offline status
  last_seen?: string;          // Last activity timestamp
}

interface StaffFormData {
  name: string;
  email: string;
  employee_id: string;
  password: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profileImage?: string;
}

interface StaffUpdateData {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profileImage?: string;
  oldProfileImageUrl?: string;
  password?: string;
}

export function useStaff() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch all staff
  const { data: staff = [], isLoading, error, refetch } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant updates for staff changes
    refetchOnWindowFocus: false, // Disable - we have real-time
    // Removed refetchInterval - real-time subscriptions handle updates
  });

  // Instant invalidation function
  const invalidateStaff = () => {
    queryClient.invalidateQueries({ queryKey: ['staff'] });
    broadcastDataUpdate('staff-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'staff-updated') {
        // console.log('🔄 Cross-tab sync: staff updated');
        queryClient.invalidateQueries({ queryKey: ['staff'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('staff-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          // console.log('📡 Staff table changed:', payload);
          invalidateStaff(); // Use instant invalidation
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: staff');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: staff');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidateStaff]);

  // Create staff mutation
  const createMutation = useMutation({
    mutationFn: async (formData: StaffFormData) => {
      // Hash password
      const password_hash = await hashPassword(formData.password);

      const { data, error } = await supabase
        .from('staff')
        .insert({
          name: formData.name,
          email: formData.email,
          employee_id: formData.employee_id,
          password_hash,
          role: formData.role,
          department: formData.department,
          branch: formData.branch,
          phone: formData.phone,
          profile_image_url: formData.profileImage || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Staff member created successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to create staff: ' + (error as Error).message);
    },
  });

  // Update staff mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: StaffUpdateData) => {
      const updateFields: Record<string, unknown> = {
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        department: updateData.department,
        branch: updateData.branch,
        phone: updateData.phone,
        profile_image_url: updateData.profileImage || null,
        updated_at: new Date().toISOString(),
      };

      // Add password hash if password is provided
      if (updateData.password && updateData.password.trim() !== '') {
        // console.log('🔑 Updating staff password...', { staffId: updateData.id });
        const password_hash = await hashPassword(updateData.password);
        updateFields.password_hash = password_hash;
        // console.log('✅ Password hash updated successfully');
      }

      const { data, error } = await supabase
        .from('staff')
        .update(updateFields)
        .eq('id', updateData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Staff member updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to update staff: ' + (error as Error).message);
    },
  });

  // Delete staff mutation with validation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check for ANY tasks (active or completed) assigned to this staff
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status')
        .contains('assigned_staff_ids', [id]);
      
      if (tasks && tasks.length > 0) {
        throw new Error(`Cannot delete: This staff member has ${tasks.length} task(s) assigned. Please reassign or remove tasks first.`);
      }
      
      // Check for task delegations
      const { data: delegations } = await supabase
        .from('task_delegations')
        .select('id')
        .or(`from_staff_id.eq.${id},to_staff_id.eq.${id}`);
      
      if (delegations && delegations.length > 0) {
        throw new Error(`Cannot delete: This staff member has task delegations. Remove delegations first.`);
      }
      
      // HARD DELETE - actually remove the row
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      toast.success('Staff member deleted successfully');
      
      // Optimistically remove from UI immediately
      queryClient.setQueryData(['staff'], (old: any[]) => 
        old ? old.filter(staff => staff.id !== deletedId) : []
      );
      
      // Also refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  return {
    staff,
    isLoading,
    error,
    refetch,
    createStaff: createMutation.mutate,
    updateStaff: updateMutation.mutate,
    deleteStaff: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
