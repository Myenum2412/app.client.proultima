'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
// Removed queue-based email imports - using direct API calls instead
import { toast } from 'sonner';
import type { PurchaseRequisition, PurchaseRequisitionFormData } from '@/types/maintenance';

export function usePurchaseRequisitions(staffId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch purchase requisitions (all or filtered by staff_id)
  const { data: requisitions = [], isLoading, error, refetch } = useQuery<PurchaseRequisition[]>({
    queryKey: ['purchase-requisitions', staffId],
    queryFn: async () => {
      let query = supabase
        .from('purchase_requisitions')
        .select(`
          *,
          staff:staff_id(name, employee_id, email),
          admin:approved_by(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (staffId) {
        query = query.eq('staff_id', staffId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant updates - no stale time
  });

  // Instant invalidation function
  const invalidatePurchase = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    broadcastDataUpdate('purchase-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'purchase-updated') {
        // console.log('🔄 Cross-tab sync: purchase updated');
        queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription for purchase requisitions
  useEffect(() => {
    const channel = supabase
      .channel('purchase-requisitions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_requisitions' },
        (payload) => {
          // console.log('📡 Purchase requisition changed:', payload);
          invalidatePurchase(); // Use instant invalidation
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: purchase_requisitions');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: purchase_requisitions');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidatePurchase]);

  // Update requisition (for staff to edit their own requests)
  const updateRequisitionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PurchaseRequisitionFormData> }) => {
      const { data: result, error } = await supabase
        .from('purchase_requisitions')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id(name, employee_id, email)
        `)
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Purchase requisition updated successfully!');
      invalidatePurchase();
    },
    onError: (error: any) => {
      console.error('Error updating purchase requisition:', error);
      toast.error(error.message || 'Failed to update purchase requisition');
    },
  });

  // Delete requisition (for staff to delete their own requests)
  const deleteRequisitionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchase_requisitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Purchase requisition deleted successfully!');
      invalidatePurchase();
    },
    onError: (error: any) => {
      console.error('Error deleting purchase requisition:', error);
      toast.error(error.message || 'Failed to delete purchase requisition');
    },
  });

  // Create requisition
  const createMutation = useMutation({
    mutationFn: async (data: PurchaseRequisitionFormData & { staff_id: string }) => {
      const { data: result, error } = await supabase
        .from('purchase_requisitions')
        .insert(data)
        .select(`
          *,
          staff:staff_id(name, employee_id, email)
        `)
        .single();
      
      if (error) throw error;
      
      // Insert notifications for all admins
      const { data: admins } = await supabase
        .from('admins')
        .select('id');

      const staffName = Array.isArray(result.staff) ? result.staff[0]?.name : result.staff?.name || 'Staff Member';
      
      for (const admin of admins || []) {
        await supabase
          .from('notifications')
          .insert({
            user_id: admin.id,
            type: 'purchase_request',
            title: 'New Purchase Request',
            message: `New purchase request from ${staffName}: ${result.purchase_item}`,
            reference_id: result.id,
            reference_table: 'purchase_requisitions',
            is_viewed: false,
            metadata: {
              purchase_item: result.purchase_item,
              description: result.description,
              requested_by: staffName,
              branch: result.branch
            }
          });
      }
      
      return result;
    },
    onSuccess: async (data) => {
      toast.success('Purchase requisition submitted successfully!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'purchase', action: 'created' } 
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
          const staffName = Array.isArray(data.staff) ? data.staff[0]?.name : data.staff?.name || 'Staff Member';
          
          // Send email notification to all admins using direct API call
          for (const adminEmail of adminEmails) {
            try {
              await fetch('/api/email/send-purchase-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'new_request',
                  requestData: data,
                  adminEmail: adminEmail
                })
              });
            } catch (error) {
              console.error('Failed to send purchase request email:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to queue email notification:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to submit requisition: ' + (error as Error).message);
    },
  });

  // Approve requisition (now sets to verification_pending)
  const approveMutation = useMutation({
    mutationFn: async ({ id, adminId, notes, requisition }: { id: string; adminId: string; notes?: string; requisition: PurchaseRequisition }) => {
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'verification_pending',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Notify the requester about approval
      const staffName = Array.isArray(requisition.staff) ? requisition.staff[0]?.name : requisition.staff?.name || 'Staff Member';
      await supabase
        .from('notifications')
        .insert({
          user_id: requisition.staff_id,
          type: 'purchase_status_update',
          title: 'Purchase Request Approved',
          message: `Your purchase request for "${requisition.purchase_item}" has been approved`,
          reference_id: id,
          reference_table: 'purchase_requisitions',
          is_viewed: false,
          metadata: {
            status: 'approved',
            purchase_item: requisition.purchase_item,
            admin_response: notes
          }
        });
      
      return requisition;
    },
    onSuccess: async (requisition) => {
      toast.success('Purchase requisition approved!');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'purchase', action: 'approved' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      
      // Send email notification to staff using direct API call
      try {
        const staffEmail = Array.isArray(requisition.staff) ? requisition.staff[0]?.email : requisition.staff?.email;
        const staffName = Array.isArray(requisition.staff) ? requisition.staff[0]?.name : requisition.staff?.name || 'Staff Member';
        if (staffEmail) {
          await fetch('/api/email/send-purchase-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'approved',
              requestData: requisition,
              staffEmail: staffEmail,
              adminNotes: requisition.admin_notes
            })
          });
        }
      } catch (error) {
        console.error('Failed to send approval email:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to approve requisition: ' + (error as Error).message);
    },
  });

  // Reject requisition
  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminId, reason, requisition }: { id: string; adminId: string; reason: string; requisition: PurchaseRequisition }) => {
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Notify the requester about rejection
      const staffName = Array.isArray(requisition.staff) ? requisition.staff[0]?.name : requisition.staff?.name || 'Staff Member';
      await supabase
        .from('notifications')
        .insert({
          user_id: requisition.staff_id,
          type: 'purchase_status_update',
          title: 'Purchase Request Rejected',
          message: `Your purchase request for "${requisition.purchase_item}" has been rejected`,
          reference_id: id,
          reference_table: 'purchase_requisitions',
          is_viewed: false,
          metadata: {
            status: 'rejected',
            purchase_item: requisition.purchase_item,
            admin_response: reason
          }
        });
      
      return requisition;
    },
    onSuccess: async (requisition) => {
      toast.success('Purchase requisition rejected');
      
      // Invalidate ALL related queries for instant UI update
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'purchase', action: 'rejected' } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      
      // Send email notification to staff using direct API call
      try {
        const staffEmail = Array.isArray(requisition.staff) ? requisition.staff[0]?.email : requisition.staff?.email;
        const staffName = Array.isArray(requisition.staff) ? requisition.staff[0]?.name : requisition.staff?.name || 'Staff Member';
        if (staffEmail) {
          await fetch('/api/email/send-purchase-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'rejected',
              requestData: requisition,
              staffEmail: staffEmail,
              rejectionReason: requisition.rejection_reason
            })
          });
        }
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to reject requisition: ' + (error as Error).message);
    },
  });

  // Upload product details mutation (staff only)
  const uploadProductMutation = useMutation({
    mutationFn: async ({ 
      id, 
      request_type,
      product_name,
      brand_name,
      serial_no,
      warranty,
      condition,
      user_name,
      remote_id,
      specification,
      product_image_urls,
      shop_contact,
      quantity,
      price
    }: { 
      id: string;
      request_type: 'system' | 'common';
      product_name: string;
      brand_name: string;
      serial_no?: string;
      warranty?: string;
      condition: 'new' | '2nd_hand' | 'used';
      user_name: string;
      remote_id?: string;
      specification?: string;
      product_image_urls: string[];
      shop_contact?: string;
      quantity?: number;
      price?: number;
    }) => {
      const { data, error } = await supabase
        .from('purchase_requisitions')
        .update({
          request_type,
          product_name,
          brand_name,
          serial_no: serial_no || null,
          warranty: warranty || null,
          condition,
          user_name,
          remote_id: remote_id || null,
          specification: specification || null,
          product_image_urls,
          shop_contact: shop_contact || null,
          quantity: quantity || null,
          price: price || null,
          product_uploaded_at: new Date().toISOString(),
          status: 'awaiting_final_verification',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id(name, employee_id, email),
          admin:approved_by(name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (result) => {
      toast.success('Product details uploaded successfully!');
      invalidatePurchase();

      // Send email notification to all admins
      try {
        const { data: admins } = await supabase.from('admins').select('email');
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            fetch('/api/email/send-purchase-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'product_uploaded',
                requestData: result,
                adminEmail: admin.email
              })
            }).catch(err => console.error('Email send failed:', err));
          }
        }
      } catch (error) {
        console.error('Failed to send product upload email:', error);
      }
    },
    onError: (error: any) => {
      console.error('Error uploading product details:', error);
      toast.error(error.message || 'Failed to upload product details');
    },
  });

  // Verify product mutation (admin only)
  const verifyProductMutation = useMutation({
    mutationFn: async ({ 
      id, 
      verified_by, 
      verification_notes, 
      approve 
    }: { 
      id: string; 
      verified_by: string; 
      verification_notes?: string; 
      approve: boolean;
    }) => {
      const { data, error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: approve ? 'completed' : 'verification_pending',
          verified_by: approve ? verified_by : null,
          verified_at: approve ? new Date().toISOString() : null,
          verification_notes: approve ? verification_notes : null,
          proof_rejection_reason: !approve ? verification_notes : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id(name, employee_id, email),
          admin:approved_by(name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      const action = data.status === 'completed' ? 'verified' : 'rejected';
      toast.success(`Product ${action} successfully!`);
      invalidatePurchase();

      // Auto-create asset request when purchase is completed
      if (data.status === 'completed') {
        try {
          // Helper function to map condition from purchase to asset
          const mapCondition = (condition: string | undefined): 'new' | 'refurbished' | 'used' | undefined => {
            if (!condition) return undefined;
            if (condition === 'new') return 'new';
            if (condition === 'used' || condition === '2nd_hand') return 'used';
            return undefined;
          };

          // Helper function to format warranty
          const formatWarranty = (warranty: string | undefined): string | undefined => {
            if (!warranty) return undefined;
            // Try to parse as date, otherwise return as-is
            try {
              const date = new Date(warranty);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
              }
            } catch {
              // Not a date, return as-is
            }
            return warranty;
          };

          // Get staff name
          let staffName = Array.isArray(data.staff) ? data.staff[0]?.name : data.staff?.name;
          if (!staffName && data.staff_id) {
            const { data: staffData } = await supabase
              .from('staff')
              .select('name')
              .eq('id', data.staff_id)
              .single();
            staffName = staffData?.name || 'Staff Member';
          }

          const requestType = data.request_type || 'system';

          // For system type: Check for duplicate serial number
          if (requestType === 'system' && data.serial_no) {
            const { data: existingAsset, error: checkError } = await supabase
              .from('asset_requests')
              .select('id, product_name, serial_no')
              .eq('request_type', 'system')
              .eq('serial_no', data.serial_no)
              .limit(1)
              .single();

            if (existingAsset && !checkError) {
              toast.error(`Duplicate serial number found: ${data.serial_no}. Asset creation skipped.`);
              // Send duplicate serial number email notification
              try {
                const staffEmail = Array.isArray(data.staff) ? data.staff[0]?.email : data.staff?.email;
                if (staffEmail) {
                  // Send product verified email
                  fetch('/api/email/send-purchase-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'product_verified',
                      requestData: data,
                      staffEmail,
                      verificationNotes: data.verification_notes
                    })
                  }).catch(err => console.error('Email send failed:', err));
                  
                  // Send duplicate serial number email
                  fetch('/api/email/send-purchase-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'duplicate_serial',
                      requestData: data,
                      staffEmail,
                      duplicateSerialNo: data.serial_no
                    })
                  }).catch(err => console.error('Duplicate serial email send failed:', err));
                }
              } catch (error) {
                console.error('Failed to send email notifications:', error);
              }
              return; // Exit early, don't create asset
            }
          }

          // Build product name
          let productName = data.product_name || 'Product';
          if (data.brand_name) {
            productName = data.serial_no 
              ? `${data.brand_name} - ${data.serial_no}`
              : `${data.brand_name} - ${productName}`;
          }

          // Generate asset number
          const assetNumberModule = await import('@/lib/asset-number-utils');
          const assetNumber = await assetNumberModule.getNextAssetNumber();

          // Create asset request
          const assetRequestData = {
            staff_id: data.staff_id,
            staff_name: staffName || 'Staff Member',
            branch: data.branch,
            asset_number: assetNumber,
            product_name: productName,
            quantity: requestType === 'common' ? (data.quantity || 1) : 1,
            condition: mapCondition(data.condition),
            additional_notes: data.verification_notes || undefined,
            image_urls: data.product_image_urls || [],
            status: 'approved' as const,
            requested_date: new Date().toISOString(),
            approved_by: data.verified_by || data.approved_by || undefined,
            approved_at: data.verified_at || new Date().toISOString(),
            admin_notes: data.verification_notes || undefined,
            request_type: requestType,
            shop_contact: requestType === 'common' ? data.shop_contact : undefined,
            serial_no: data.serial_no || undefined,
            warranty: formatWarranty(data.warranty),
            brand_name: data.brand_name || undefined,
            specification: data.specification || undefined,
            price: requestType === 'common' ? data.price : undefined,
          };

          const { data: createdAsset, error: assetError } = await supabase
            .from('asset_requests')
            .insert([assetRequestData])
            .select()
            .single();

          if (assetError) {
            console.error('Failed to create asset request:', assetError);
            toast.warning('Product verified, but failed to create asset record. Please create manually.');
          } else {
            // Invalidate asset queries to update UI
            queryClient.invalidateQueries({ queryKey: ['asset-requests'] });
            
            // Create notification for staff about asset creation
            if (createdAsset) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: data.staff_id,
                  type: 'asset_status_update',
                  title: 'Asset Created from Purchase',
                  message: `Your verified purchase has been added to your assets`,
                  reference_id: createdAsset.id,
                  reference_table: 'asset_requests',
                  is_viewed: false,
                  metadata: {
                    source: 'purchase_verification',
                    purchase_id: data.id,
                    product_name: productName
                  }
                });
              
              // Send email notification to staff about asset creation
              try {
                const staffEmail = Array.isArray(data.staff) ? data.staff[0]?.email : data.staff?.email;
                if (staffEmail) {
                  fetch('/api/email/send-purchase-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'asset_created',
                      requestData: data,
                      staffEmail,
                      assetRequest: createdAsset
                    })
                  }).catch(err => console.error('Asset creation email send failed:', err));
                }
              } catch (error) {
                console.error('Failed to send asset creation email:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error creating asset request:', error);
          toast.warning('Product verified, but failed to create asset record. Please create manually.');
        }
      }

      // Send email notification to staff
      try {
        const staffEmail = Array.isArray(data.staff) ? data.staff[0]?.email : data.staff?.email;
        if (staffEmail) {
          const type = data.status === 'completed' ? 'product_verified' : 'product_rejected';
          fetch('/api/email/send-purchase-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              requestData: data,
              staffEmail,
              verificationNotes: data.verification_notes,
              rejectionReason: data.proof_rejection_reason
            })
          }).catch(err => console.error('Email send failed:', err));
        }
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
    },
    onError: (error: any) => {
      console.error('Error verifying product:', error);
      toast.error(error.message || 'Failed to verify product');
    },
  });

  return {
    requisitions,
    isLoading,
    error,
    refetch,
    createRequisition: createMutation.mutate,
    updateRequisition: updateRequisitionMutation.mutate,
    deleteRequisition: deleteRequisitionMutation.mutate,
    approveRequisition: approveMutation.mutate,
    rejectRequisition: rejectMutation.mutate,
    uploadProduct: uploadProductMutation.mutate,
    verifyProduct: verifyProductMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateRequisitionMutation.isPending,
    isDeleting: deleteRequisitionMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isUploading: uploadProductMutation.isPending,
    isVerifying: verifyProductMutation.isPending,
  };
}

// Hook to fetch completed purchases for pre-filling maintenance forms
export function useCompletedPurchases(staffId?: string) {
  const supabase = createClient();

  const { data: purchases = [], isLoading, error } = useQuery<PurchaseRequisition[]>({
    queryKey: ['completed-purchases', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      const { data, error } = await supabase
        .from('purchase_requisitions')
        .select('*')
        .eq('staff_id', staffId)
        .in('status', ['completed', 'awaiting_final_verification'])
        .not('product_name', 'is', null)
        .not('serial_no', 'is', null)
        .order('approved_at', { ascending: false });

      if (error) throw error;
      
      // Filter out entries where product_name or serial_no are empty strings
      return (data || []).filter(
        (p) => p.product_name && p.product_name.trim() !== '' && p.serial_no && p.serial_no.trim() !== ''
      );
    },
    enabled: !!staffId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Format purchases for dropdown display
  const formattedPurchases = purchases.map((purchase) => ({
    ...purchase,
    displayText: `${purchase.product_name || 'Unknown'} - (${purchase.serial_no || 'N/A'})`,
  }));

  return {
    purchases: formattedPurchases,
    isLoading,
    error,
  };
}

