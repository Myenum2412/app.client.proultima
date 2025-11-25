'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getNextAssetNumber } from '@/lib/asset-number-utils';
import type { AssetRequest } from '@/types/index';

interface CreateAssetRequestData {
  staff_id: string;
  staff_name: string;
  branch: string;
  request_type: 'system' | 'common';
  
  // Common fields
  product_name: string;
  quantity: number;
  image_urls?: string[];
  
  // System-specific fields
  condition?: 'new' | 'refurbished' | 'used';
  additional_notes?: string;
  serial_no?: string; // Serial Number (for system type)
  brand_name?: string; // Brand (for system type)
  workstation?: string; // Workstation (for system type)
  
  // Common-specific fields
  shop_contact?: string;
  warranty?: string;
  specification?: string;
  price?: number;
}

interface UpdateAssetRequestData {
  status: 'approved' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
}

interface StaffUpdateAssetRequestData {
  request_type?: 'system' | 'common';
  product_name?: string;
  quantity?: number;
  image_urls?: string[];
  
  // System-specific fields
  condition?: 'new' | 'refurbished' | 'used';
  additional_notes?: string;
  serial_no?: string; // Serial Number (for system type)
  brand_name?: string; // Brand (for system type)
  workstation?: string; // Workstation (for system type)
  
  // Common-specific fields
  shop_contact?: string;
  warranty?: string;
  specification?: string;
  price?: number;
}

export function useAssetRequests(staffId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch asset requests
  const {
    data: assetRequests = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['asset-requests', staffId],
    queryFn: async () => {
      let query = supabase
        .from('asset_requests')
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            email,
            branch
          ),
          admin:approved_by (
            id,
            name,
            email
          )
        `)
        .order('requested_date', { ascending: false });

      // If staffId is provided, filter by staff
      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching asset requests:', error);
        throw error;
      }

      return data as AssetRequest[];
    },
    enabled: true,
  });

  // Create asset request mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAssetRequestData) => {
      // Generate asset number if not provided
      let assetNumber = (data as any).asset_number;
      if (!assetNumber) {
        assetNumber = await getNextAssetNumber();
      }

      const { data: result, error } = await supabase
        .from('asset_requests')
        .insert([{
          ...data,
          asset_number: assetNumber,
          request_type: data.request_type || 'system', // Default to 'system' if not provided
          status: 'pending',
          requested_date: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating asset request:', error);
        throw error;
      }

      return result;
    },
    onSuccess: async (data) => {
      // Invalidate all asset-requests queries (with and without staffId)
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
      // Also refetch to ensure immediate update
      await queryClient.refetchQueries({ queryKey: ['asset-requests'] });
      // Trigger cross-tab sync
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dataUpdated'));

      // Send email notification to all admins
      try {
        const { data: admins } = await supabase.from('admins').select('email');
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            fetch('/api/email/send-asset-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'new_request',
                requestData: data,
                adminEmail: admin.email
              })
            }).catch(err => console.error('Email send failed:', err));
          }
        }
      } catch (error) {
        console.error('Failed to send asset request email:', error);
      }
    },
  });

  // Update asset request mutation (approve/reject)
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateAssetRequestData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('asset_requests')
        .update({
          ...data,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            email,
            branch
          )
        `)
        .single();

      if (error) {
        console.error('Error updating asset request:', error);
        throw error;
      }

      return result;
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
      // Trigger cross-tab sync
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dataUpdated'));

      // Send email notification to staff
      try {
        if (result.staff?.email) {
          const type = result.status === 'approved' ? 'approved' : 'rejected';
          fetch('/api/email/send-asset-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              requestData: result,
              staffEmail: result.staff.email,
              adminNotes: result.admin_notes,
              rejectionReason: result.rejection_reason
            })
          }).catch(err => console.error('Email send failed:', err));
        }
      } catch (error) {
        console.error('Failed to send asset status email:', error);
      }
    },
  });

  // Staff update asset request mutation (for staff to edit their own requests)
  const staffUpdateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StaffUpdateAssetRequestData }) => {
      const { data: result, error } = await supabase
        .from('asset_requests')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating asset request:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
      // Trigger cross-tab sync
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
  });

  // Staff delete asset request mutation (for staff to delete their own requests)
  const staffDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('asset_requests')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting asset request:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
      // Trigger cross-tab sync
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    },
  });

  // Upload images to Supabase Storage
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `asset-requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('asset-request-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('asset-request-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('asset-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_requests',
        },
        (payload) => {
          // console.log('Asset request change received:', payload);
          // Invalidate and refetch all asset-requests queries
          queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
          queryClient.refetchQueries({ queryKey: ['asset-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = () => {
      queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
    };

    window.addEventListener('dataUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('dataUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  return {
    assetRequests,
    isLoading,
    error,
    refetch,
    createAssetRequest: createMutation.mutateAsync,
    updateAssetRequest: updateMutation.mutateAsync,
    staffUpdateAssetRequest: staffUpdateMutation.mutate,
    staffDeleteAssetRequest: staffDeleteMutation.mutate,
    uploadImages,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isStaffUpdating: staffUpdateMutation.isPending,
    isStaffDeleting: staffDeleteMutation.isPending,
  };
}

// Hook for admin to get pending asset requests count
export function useAssetRequestCount() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['asset-request-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('asset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching asset request count:', error);
        throw error;
      }

      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
