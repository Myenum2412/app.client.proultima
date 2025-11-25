'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ScrapRequest, CreateScrapRequestData, UpdateScrapRequestData, StaffUpdateScrapRequestData } from '@/types/scrap';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
// Removed queue-based email imports - using direct API calls instead

// Upload scrap images to Supabase storage
export async function uploadScrapImages(files: File[]): Promise<string[]> {
  const supabase = createClient();
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('scrap-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error(`Failed to upload image: ${file.name}`);
    }

    const { data: urlData } = supabase.storage
      .from('scrap-images')
      .getPublicUrl(filePath);

    uploadedUrls.push(urlData.publicUrl);
  }

  return uploadedUrls;
}

export function useScrapRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch scrap requests based on user role
  const { data: scrapRequests = [], isLoading, error } = useQuery<ScrapRequest[]>({
    queryKey: ['scrap-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // console.log('🔍 Fetching scrap requests...', { userId: user.id, role: user.role });

      let query = supabase
        .from('scrap_requests')
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            email,
            department,
            branch
          ),
          admin:admin_submitter_id (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // If staff, only fetch their own requests
      if (user.role === 'staff') {
        query = query.eq('staff_id', user.staffId);
      }
      // Admin sees all requests

      const { data, error } = await query;

      // console.log('📊 Scrap requests fetched:', {
      //   count: data?.length || 0,
      //   data: data?.map(r => ({ id: r.id, status: r.status, submitter: r.submitter_name })),
      //   error
      // });

      if (error) {
        console.error('❌ Error fetching scrap requests:', error);
        throw error;
      }

      return data as ScrapRequest[];
    },
    enabled: !!user,
    staleTime: 0, // Instant updates - no stale time
    refetchOnWindowFocus: false, // Disable - we have real-time
  });

  // Get pending count for admin
  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['scrap-requests-pending-count'],
    queryFn: async () => {
      // console.log('🔍 Fetching scrap pending count...');
      
      const { count, error } = await supabase
        .from('scrap_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // console.log('📊 Scrap pending count:', { count, error });

      if (error) {
        console.error('❌ Error fetching scrap pending count:', error);
        throw error;
      }
      return count || 0;
    },
    staleTime: 0, // Instant updates - no stale time
  });

  // Instant invalidation function
  const invalidateScrap = () => {
    queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
    queryClient.invalidateQueries({ queryKey: ['scrap-requests-pending-count'] });
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    broadcastDataUpdate('scrap-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'scrap-updated') {
        // console.log('🔄 Cross-tab sync: scrap updated');
        queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription with debouncing
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('scrap-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scrap_requests' },
        (payload) => {
          // console.log('📡 Scrap request changed:', {
          //   event: payload.eventType,
          //   table: payload.table,
          //   new: payload.new,
          //   old: payload.old,
          //   timestamp: new Date().toISOString()
          // });
          invalidateScrap(); // Use instant invalidation
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: scrap_requests');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: scrap_requests');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, invalidateScrap]);

  // Create scrap request mutation
  const createScrapRequest = useMutation({
    mutationFn: async (data: CreateScrapRequestData) => {
      // Prepare insert data, explicitly including other_issue
      // Note: source_asset_id is NOT a column in scrap_requests table, it's stored in notification metadata only
      const insertData = {
        staff_id: data.staff_id,
        admin_submitter_id: data.admin_submitter_id,
        submitter_type: data.submitter_type,
        submitter_name: data.submitter_name,
        brand_name: data.brand_name,
        workstation_number: data.workstation_number,
        users_name: data.users_name,
        serial_number: data.serial_number,
        scrap_status: data.scrap_status,
        branch: data.branch,
        images: data.images,
        other_issue: data.other_issue, // Explicitly include other_issue
      };
      
      const { data: insertedData, error } = await supabase
        .from('scrap_requests')
        .insert([insertData])
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            email,
            department,
            branch
          ),
          admin:admin_submitter_id (
            id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;
      
      // Return immediately - notifications and emails will be created in onSuccess (non-blocking)
      return { insertedData, originalData: data };
    },
    onSuccess: async ({ insertedData, originalData }) => {
      toast.success('Scrap request submitted successfully');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-requests-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'scrap', action: 'created' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());

      // Create notifications and send emails in background (non-blocking)
      // This runs asynchronously and doesn't block the UI response
      (async () => {
        try {
          // Fetch all admins for notifications and emails
          const { data: admins } = await supabase
            .from('admins')
            .select('id, email');

          if (!admins || admins.length === 0) return;

          const staffName = insertedData.staff?.name || 'Staff Member';
          
          // Batch insert all notifications at once (much faster than sequential)
          const notifications = admins.map(admin => ({
            user_id: admin.id,
            type: 'scrap_request',
            title: 'New Scrap Request',
            message: `New scrap request from ${staffName}: ${originalData.brand_name || originalData.serial_number}`,
            reference_id: insertedData.id,
            reference_table: 'scrap_requests',
            is_viewed: false,
            metadata: {
              brand_name: originalData.brand_name,
              serial_number: originalData.serial_number,
              scrap_status: originalData.scrap_status,
              requested_by: staffName,
              branch: originalData.branch,
              source_asset_id: originalData.source_asset_id, // Store source asset ID for tracking
              other_issue: (originalData as any).other_issue // Store other issue description if provided
            }
          }));

          // Batch insert notifications (non-blocking, fire-and-forget)
          Promise.resolve(
            supabase
              .from('notifications')
              .insert(notifications)
          )
            .then(() => {
              // Invalidate notification count after notifications are created
              queryClient.invalidateQueries({ queryKey: ['notification-count'] });
            })
            .catch((err: Error) => console.error('Failed to create notifications:', err));

          // Send emails in parallel (non-blocking, fire-and-forget)
          const adminEmails = admins.map(admin => admin.email).filter(Boolean);
          adminEmails.forEach(adminEmail => {
            fetch('/api/email/send-scrap-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'new_request',
                requestData: insertedData,
                adminEmail: adminEmail
              })
            }).catch(err => console.error('Failed to send scrap request email:', err));
          });
        } catch (error) {
          console.error('❌ Error in background notification/email processing:', error);
          // Don't throw - these are non-critical operations
        }
      })();
    },
    onError: (error: Error) => {
      console.error('Error creating scrap request:', error);
      toast.error('Failed to submit scrap request');
    },
  });

  // Update scrap request mutation (for admin approval/rejection)
  const updateScrapRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScrapRequestData }) => {
      const { data: updatedData, error } = await supabase
        .from('scrap_requests')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id (
            id,
            name,
            email,
            department,
            branch
          ),
          admin:admin_submitter_id (
            id,
            name,
            email
          )
        `)
        .single();

      if (error) throw error;
      
      // If status was updated, notify the requester
      if (data.status) {
        const staffName = updatedData.staff?.name || 'Staff Member';
        const equipmentDesc = updatedData.brand_name || updatedData.serial_number || 'equipment';
        await supabase
          .from('notifications')
          .insert({
            user_id: updatedData.staff_id,
            type: 'scrap_status_update',
            title: `Scrap Request ${data.status}`,
            message: `Your scrap request for "${equipmentDesc}" has been ${data.status}`,
            reference_id: id,
            reference_table: 'scrap_requests',
            is_viewed: false,
            metadata: {
              status: data.status,
              brand_name: updatedData.brand_name,
              serial_number: updatedData.serial_number,
              admin_response: data.admin_response
            }
          });
      }
      
      return { updatedRequest: updatedData, updateData: data };
    },
    onSuccess: async ({ updatedRequest, updateData }) => {
      toast.success('Scrap request updated successfully');
      
      // If approved and source_asset_id exists, delete the asset
      if (updateData.status === 'approved') {
        try {
          // Query notification to get source_asset_id from metadata
          const { data: notifications } = await supabase
            .from('notifications')
            .select('metadata')
            .eq('reference_id', updatedRequest.id)
            .eq('reference_table', 'scrap_requests')
            .limit(1)
            .single();

          const sourceAssetId = notifications?.metadata?.source_asset_id;
          
          if (sourceAssetId) {
            // Hard delete the asset from asset_requests table
            const { error: deleteError } = await supabase
              .from('asset_requests')
              .delete()
              .eq('id', sourceAssetId);

            if (deleteError) {
              console.error('Error deleting asset after scrap approval:', deleteError);
              // Don't throw - asset deletion failure shouldn't fail the scrap approval
            } else {
              // Invalidate asset queries to update UI
              queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
            }
          }
        } catch (error) {
          console.error('Error checking for source asset:', error);
          // Don't throw - continue with scrap approval
        }
      }
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-requests-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'scrap', action: updateData.status === 'approved' ? 'approved' : 'rejected' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());

      // Send email notification to submitter (don't block UI)
      try {
        // console.log('📧 Sending scrap update email notification...');
        
        // Get submitter email
        let submitterEmail = '';
        if (updatedRequest.submitter_type === 'staff' && updatedRequest.staff) {
          submitterEmail = updatedRequest.staff.email;
        } else if (updatedRequest.submitter_type === 'admin' && updatedRequest.admin) {
          submitterEmail = updatedRequest.admin.email;
        }

        if (submitterEmail) {
          const status = updateData.status === 'approved' ? 'approved' : 'rejected';
          
          await fetch('/api/email/send-scrap-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: status,
              requestData: updatedRequest,
              staffEmail: submitterEmail,
              adminResponse: updateData.admin_response
            })
          });
        }
      } catch (emailError) {
        console.error('❌ Failed to send scrap update email:', emailError);
        // Don't throw - email failure shouldn't fail the update
      }
    },
    onError: (error: Error) => {
      console.error('Error updating scrap request:', error);
      toast.error('Failed to update scrap request');
    },
  });

  // Staff update scrap request mutation (for staff to edit their own requests)
  const staffUpdateScrapRequest = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StaffUpdateScrapRequestData }) => {
      const { data: updatedData, error } = await supabase
        .from('scrap_requests')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      toast.success('Scrap request updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
      broadcastDataUpdate('scrap-updated');
    },
    onError: (error: any) => {
      console.error('Error updating scrap request:', error);
      toast.error(error.message || 'Failed to update scrap request');
    },
  });

  // Staff delete scrap request mutation (for staff to delete their own requests)
  const staffDeleteScrapRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scrap_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Scrap request deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['scrap-requests'] });
      broadcastDataUpdate('scrap-updated');
    },
    onError: (error: any) => {
      console.error('Error deleting scrap request:', error);
      toast.error(error.message || 'Failed to delete scrap request');
    },
  });

  return {
    scrapRequests,
    isLoading,
    error,
    pendingCount,
    createScrapRequest,
    updateScrapRequest,
    staffUpdateScrapRequest: staffUpdateScrapRequest.mutate,
    staffDeleteScrapRequest: staffDeleteScrapRequest.mutate,
    isStaffUpdating: staffUpdateScrapRequest.isPending,
    isStaffDeleting: staffDeleteScrapRequest.isPending,
    uploadScrapImages,
  };
}
