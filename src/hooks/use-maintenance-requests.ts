'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
// Removed queue-based email imports - using direct API calls instead
import type { MaintenanceRequest, MaintenanceFormData, MaintenanceStatus } from '@/types/maintenance';

export function useMaintenanceRequests(staffId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch maintenance requests
  const { data: requests = [], isLoading, error, refetch } = useQuery<MaintenanceRequest[]>({
    queryKey: ['maintenance-requests', staffId],
    queryFn: async () => {
      // console.log('🔍 Fetching maintenance requests...', { staffId });
      
      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          ),
          approver:approved_by (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      // console.log('📊 Maintenance requests fetched:', {
      //   count: data?.length || 0,
      //   data: data?.map(r => ({ id: r.id, status: r.status, branch: r.branch })),
      //   error
      // });

      if (error) {
        console.error('❌ Error fetching maintenance requests:', error);
        throw error;
      }
      return data || [];
    },
    staleTime: 0, // Instant updates - no stale time
    refetchOnWindowFocus: false, // Disable - we have real-time
  });

  // Get pending count for admin
  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['maintenance-requests-pending-count'],
    queryFn: async () => {
      // console.log('🔍 Fetching pending count...');
      
      const { count, error } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // console.log('📊 Pending count:', { count, error });

      if (error) {
        console.error('❌ Error fetching pending count:', error);
        throw error;
      }
      return count || 0;
    },
    staleTime: 0, // Instant updates - no stale time
  });

  // Instant invalidation function
  const invalidateMaintenance = () => {
    queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    broadcastDataUpdate('maintenance-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'maintenance-updated') {
        // console.log('🔄 Cross-tab sync: maintenance updated');
        queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
        queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription with debouncing
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        (payload) => {
          // console.log('📡 Maintenance request changed:', {
          //   event: payload.eventType,
          //   table: payload.table,
          //   new: payload.new,
          //   old: payload.old,
          //   timestamp: new Date().toISOString()
          // });
          invalidateMaintenance(); // Use instant invalidation
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: maintenance_requests');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: maintenance_requests');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidateMaintenance]);


  // Create maintenance request mutation
  const createMutation = useMutation({
    mutationFn: async (formData: MaintenanceFormData & { staff_id: string; admin_notes?: string }) => {
      // Exclude asset_number and remarks from insert as they're not columns in maintenance_requests table
      // asset_number is only used for lookup/auto-fill purposes
      // remarks is stored in admin_notes field
      const { asset_number, remarks, ...maintenanceData } = formData;
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          ...maintenanceData,
          status: 'pending',
          requested_date: new Date().toISOString(),
        })
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          )
        `)
        .single();

      if (error) throw error;
      
      // Insert notifications for all admins
      const { data: admins } = await supabase
        .from('admins')
        .select('id');

      for (const admin of admins || []) {
        await supabase
          .from('notifications')
          .insert({
            user_id: admin.id,
            type: 'maintenance_request',
            title: 'New Maintenance Request',
            message: `New maintenance request from ${data.staff?.name || 'Staff Member'} for ${formData.brand_name || 'equipment'}`,
            reference_id: data.id,
            reference_table: 'maintenance_requests',
            is_viewed: false,
            metadata: {
              brand_name: formData.brand_name,
              serial_number: formData.serial_number,
              workstation_number: formData.workstation_number,
              requested_by: data.staff?.name || 'Staff Member',
              branch: formData.branch
            }
          });
      }
      
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Maintenance request submitted successfully!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'maintenance', action: 'created' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());

      // Send email notification to admin using email helper
      try {
        // Get admin emails
        const { data: admins } = await supabase
          .from('admins')
          .select('email');
        
        if (admins && admins.length > 0) {
          const adminEmails = admins.map(admin => admin.email).filter(Boolean);
          
          // Send email notification to all admins using direct API call
          for (const adminEmail of adminEmails) {
            try {
              await fetch('/api/email/send-maintenance-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'new_request',
                  requestData: data,
                  adminEmail: adminEmail
                })
              });
            } catch (error) {
              console.error('Failed to send maintenance request email:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to queue email notification:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + (error as Error).message);
    },
  });

  // Update maintenance request mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<MaintenanceFormData & { admin_notes?: string }> }) => {
      // Exclude asset_number and remarks from update as they're not columns in maintenance_requests table
      // remarks is stored in admin_notes field
      const { asset_number, remarks, ...maintenanceData } = formData;
      
      // If remarks is provided, store it in admin_notes
      // Only allow updating admin_notes if status is pending (staff can edit their own remarks)
      const updateData: any = { ...maintenanceData };
      if (remarks !== undefined) {
        updateData.admin_notes = remarks || undefined;
      }
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Request updated successfully!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'maintenance', action: 'updated' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to update request: ' + (error as Error).message);
    },
  });

  // Approve request mutation (admin only)
  const approveMutation = useMutation({
    mutationFn: async ({ id, adminId, notes }: { id: string; adminId: string; notes?: string }) => {
      // console.log('🔍 Approving maintenance request...', { requestId: id, adminId });
      
      // Get current admin user from localStorage (custom auth)
      const authUserJson = localStorage.getItem('auth_user');
      if (!authUserJson) {
        throw new Error('Admin not authenticated');
      }
      
      const authUser = JSON.parse(authUserJson);
      // console.log('✅ Found admin user:', { id: authUser.id, role: authUser.role });
      
      if (authUser.role !== 'admin') {
        throw new Error('Only admin can approve requests');
      }
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'approved',
          approved_by: authUser.id, // Use admin ID from localStorage
          approved_at: new Date().toISOString(),
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error approving request:', error);
        throw error;
      }
      
      // Notify the requester about approval
      const equipmentDesc = data.brand_name || data.serial_number || 'equipment';
      await supabase
        .from('notifications')
        .insert({
          user_id: data.staff_id,
          type: 'maintenance_status_update',
          title: 'Maintenance Request Approved',
          message: `Your maintenance request for "${equipmentDesc}" has been approved`,
          reference_id: id,
          reference_table: 'maintenance_requests',
          is_viewed: false,
          metadata: {
            status: 'approved',
            brand_name: data.brand_name,
            serial_number: data.serial_number,
            admin_response: notes
          }
        });
      
      // console.log('✅ Request approved successfully');
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Request approved successfully!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'maintenance', action: 'approved' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());

      // Auto-create asset request when maintenance is approved
      try {
        // Helper function to map condition
        const mapCondition = (condition: string | undefined): 'new' | 'refurbished' | 'used' | undefined => {
          if (!condition) return undefined;
          if (condition === 'new') return 'new';
          if (condition === 'used') return 'used';
          return undefined;
        };

        // Helper function to format warranty date
        const formatWarranty = (warrantyDate: string | undefined): string | undefined => {
          if (!warrantyDate) return undefined;
          try {
            const date = new Date(warrantyDate);
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          } catch {
            return warrantyDate; // Return as-is if parsing fails
          }
        };

        // Build product name from brand_name and serial_number
        let productName = 'System Equipment';
        if (data.brand_name && data.serial_number) {
          productName = `${data.brand_name} - ${data.serial_number}`;
        } else if (data.brand_name) {
          productName = data.brand_name;
        } else if (data.serial_number) {
          productName = `Equipment - ${data.serial_number}`;
        }

        // Get staff name - use from joined data or fetch if missing
        let staffName = data.staff?.name;
        if (!staffName && data.staff_id) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('name')
            .eq('id', data.staff_id)
            .single();
          staffName = staffData?.name || 'Staff Member';
        }

        // Create asset request
        const assetRequestData = {
          staff_id: data.staff_id,
          staff_name: staffName || 'Staff Member',
          branch: data.branch,
          product_name: productName,
          quantity: 1,
          condition: mapCondition(data.condition),
          additional_notes: data.admin_notes || undefined,
          image_urls: data.attachment_urls || [],
          status: 'approved' as const,
          requested_date: new Date().toISOString(),
          approved_by: data.approved_by || undefined,
          approved_at: data.approved_at || new Date().toISOString(),
          admin_notes: data.admin_notes || undefined,
          request_type: 'system' as const,
          shop_contact: data.contact_name || undefined,
          serial_no: data.serial_number || undefined,
          warranty: formatWarranty(data.warranty_end_date),
          brand_name: data.brand_name || undefined,
        };

        const { data: createdAsset, error: assetError } = await supabase
          .from('asset_requests')
          .insert([assetRequestData])
          .select()
          .single();

        if (assetError) {
          console.error('Failed to create asset request:', assetError);
          // Don't fail the maintenance approval if asset creation fails
          // Optionally show a warning toast
          toast.warning('Maintenance approved, but failed to create asset record. Please create manually.');
        } else {
          // Invalidate asset queries to update UI
          queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
          
          // Optional: Create notification for staff about asset creation
          if (createdAsset) {
            await supabase
              .from('notifications')
              .insert({
                user_id: data.staff_id,
                type: 'asset_status_update',
                title: 'Asset Created from Maintenance',
                message: `Your approved maintenance record has been added to your assets`,
                reference_id: createdAsset.id,
                reference_table: 'asset_requests',
                is_viewed: false,
                metadata: {
                  source: 'maintenance_approval',
                  maintenance_id: data.id,
                  product_name: productName
                }
              });
          }
        }
      } catch (error) {
        console.error('Error creating asset request:', error);
        // Don't fail the maintenance approval if asset creation fails
        toast.warning('Maintenance approved, but failed to create asset record. Please create manually.');
      }

      // Send email notification to staff using direct API call
      if (data.staff?.email) {
        try {
          await fetch('/api/email/send-maintenance-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'approved',
              requestData: data,
              staffEmail: data.staff.email,
              adminNotes: data.admin_notes
            })
          });
        } catch (error) {
          console.error('Failed to send approval email:', error);
        }
      }
    },
    onError: (error) => {
      toast.error('Failed to approve request: ' + (error as Error).message);
    },
  });

  // Reject request mutation (admin only)
  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminId, reason }: { id: string; adminId: string; reason: string }) => {
      // console.log('🔍 Rejecting maintenance request...', { requestId: id, adminId });
      
      // Get current admin user from localStorage (custom auth)
      const authUserJson = localStorage.getItem('auth_user');
      if (!authUserJson) {
        throw new Error('Admin not authenticated');
      }
      
      const authUser = JSON.parse(authUserJson);
      // console.log('✅ Found admin user:', { id: authUser.id, role: authUser.role });
      
      if (authUser.role !== 'admin') {
        throw new Error('Only admin can reject requests');
      }
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'rejected',
          approved_by: authUser.id, // Use admin ID from localStorage
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id (
            name,
            email,
            employee_id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error rejecting request:', error);
        throw error;
      }
      
      // Notify the requester about rejection
      const equipmentDesc = data.brand_name || data.serial_number || 'equipment';
      await supabase
        .from('notifications')
        .insert({
          user_id: data.staff_id,
          type: 'maintenance_status_update',
          title: 'Maintenance Request Rejected',
          message: `Your maintenance request for "${equipmentDesc}" has been rejected`,
          reference_id: id,
          reference_table: 'maintenance_requests',
          is_viewed: false,
          metadata: {
            status: 'rejected',
            brand_name: data.brand_name,
            serial_number: data.serial_number,
            admin_response: reason
          }
        });
      
      // console.log('✅ Request rejected successfully');
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Request rejected.');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'maintenance', action: 'rejected' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());

      // Send email notification to staff using direct API call
      if (data.staff?.email) {
        try {
          await fetch('/api/email/send-maintenance-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'rejected',
              requestData: data,
              staffEmail: data.staff.email,
              rejectionReason: data.rejection_reason
            })
          });
        } catch (error) {
          console.error('Failed to send rejection email:', error);
        }
      }
    },
    onError: (error) => {
      toast.error('Failed to reject request: ' + (error as Error).message);
    },
  });

  // Delete maintenance request mutation (for staff to delete their own requests)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Maintenance request deleted successfully!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'maintenance', action: 'deleted' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error) => {
      toast.error('Failed to delete request: ' + (error as Error).message);
    },
  });

  return {
    requests,
    pendingCount,
    isLoading,
    error,
    refetch,
    createRequest: createMutation.mutate,
    updateRequest: updateMutation.mutate,
    deleteRequest: deleteMutation.mutate,
    approveRequest: approveMutation.mutate,
    rejectRequest: rejectMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
