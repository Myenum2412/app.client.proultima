'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
import type { TaskUpdateProof } from '@/types/cashbook';

export function useTaskProofs(taskId?: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch task proofs
  const { data: proofs = [], isLoading, error, refetch } = useQuery<TaskUpdateProof[]>({
    queryKey: ['task-proofs', taskId],
    queryFn: async () => {
      let query = supabase
        .from('task_update_proofs')
        .select(`
          *,
          staff:staff_id (
            name,
            employee_id
          ),
          admin:verified_by (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Instant updates for task proofs
    refetchOnWindowFocus: false, // Disable - we have real-time
  });

  // Get pending verifications count
  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['task-proofs-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('task_update_proofs')
        .select('*', { count: 'exact', head: true })
        .is('is_verified', null);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 0, // Instant updates for task proofs
  });

  // Instant invalidation function
  const invalidateTaskProofs = () => {
    queryClient.invalidateQueries({ queryKey: ['task-proofs'] });
    queryClient.invalidateQueries({ queryKey: ['task-proofs-pending-count'] });
    broadcastDataUpdate('task-proofs-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'task-proofs-updated') {
        // console.log('🔄 Cross-tab sync: task proofs updated');
        queryClient.invalidateQueries({ queryKey: ['task-proofs'] });
        queryClient.invalidateQueries({ queryKey: ['task-proofs-pending-count'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('task-proofs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_update_proofs' },
        (payload) => {
          // console.log('📡 Task proof changed:', payload);
          invalidateTaskProofs(); // Use instant invalidation
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: task_update_proofs');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: task_update_proofs');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidateTaskProofs]);

  // Create task proof mutation
  const createMutation = useMutation({
    mutationFn: async (formData: {
      task_id: string;
      staff_id: string;
      status: string;
      proof_image_url: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_update_proofs')
        .insert(formData)
        .select(`
          *,
          staff:staff_id (
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Notify all admins about proof upload
      const { data: admins } = await supabase
        .from('admins')
        .select('id');

      const { data: task } = await supabase
        .from('tasks')
        .select('title, task_no')
        .eq('id', data.task_id)
        .single();

      for (const admin of admins || []) {
        await supabase
          .from('notifications')
          .insert({
            user_id: admin.id,
            type: 'task_proof_upload',
            title: 'Task Proof Needs Verification',
            message: `${data.staff?.name} uploaded proof for "${task?.title}" - awaiting verification`,
            reference_id: data.id,
            reference_table: 'task_update_proofs',
            is_viewed: false,
            metadata: {
              task_no: task?.task_no,
              task_id: data.task_id,
              staff_name: data.staff?.name,
              status: data.status
            }
          });
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success('Proof uploaded successfully! Awaiting admin verification.');
      queryClient.invalidateQueries({ queryKey: ['task-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['task-proofs-pending-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));

      // Send email notification to all admins
      try {
        const { data: admins } = await supabase.from('admins').select('email');
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            fetch('/api/email/send-proof-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'proof_uploaded',
                proofData: data,
                adminEmail: admin.email
              })
            }).catch(err => console.error('Email send failed:', err));
          }
        }
      } catch (error) {
        console.error('Failed to send proof upload email:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to upload proof: ' + (error as Error).message);
    },
  });

  // Verify proof mutation (admin only)
  const verifyMutation = useMutation({
    mutationFn: async ({
      id,
      is_verified,
      verified_by,
      verification_notes,
    }: {
      id: string;
      is_verified: boolean;
      verified_by: string;
      verification_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_update_proofs')
        .update({
          is_verified,
          verified_by,
          verified_at: new Date().toISOString(),
          verification_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          staff:staff_id (
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Notify staff member about proof verification result
      const { data: task } = await supabase
        .from('tasks')
        .select('title, task_no')
        .eq('id', data.task_id)
        .single();

      const { data: admin } = await supabase
        .from('staff')
        .select('name')
        .eq('id', verified_by)
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: data.staff_id,
          type: is_verified ? 'task_proof_verified' : 'task_proof_rejected',
          title: is_verified ? 'Task Proof Verified' : 'Task Proof Rejected',
          message: `Your proof for "${task?.title}" has been ${is_verified ? 'verified' : 'rejected'} by ${admin?.name}`,
          reference_id: data.id,
          reference_table: 'task_update_proofs',
          is_viewed: false,
          metadata: {
            task_no: task?.task_no,
            task_id: data.task_id,
            is_verified,
            verified_by: admin?.name,
            verification_notes
          }
        });

      return data;
    },
    onSuccess: async (result) => {
      const status = result.is_verified ? 'verified' : 'rejected';
      toast.success(`Proof ${status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['task-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['task-proofs-pending-count'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));

      // Send email notification to staff
      try {
        if (result.staff?.email) {
          const type = result.is_verified ? 'proof_approved' : 'proof_rejected';
          fetch('/api/email/send-proof-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              proofData: result,
              staffEmail: result.staff.email,
              verificationNotes: result.verification_notes
            })
          }).catch(err => console.error('Email send failed:', err));
        }
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
    },
    onError: (error) => {
      toast.error('Failed to verify proof: ' + (error as Error).message);
    },
  });

  // Upload image to Supabase Storage
  const uploadProofImage = async (file: File, taskId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-proofs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('task-proofs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Upload receipt image to Supabase Storage
  const uploadReceiptImage = async (file: File, voucherNo: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${voucherNo}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('cash-receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('cash-receipts')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    proofs,
    pendingCount,
    isLoading,
    error,
    refetch,
    createProof: createMutation.mutate,
    verifyProof: verifyMutation.mutate,
    uploadProofImage,
    uploadReceiptImage,
    isCreatingProof: createMutation.isPending,
    isVerifying: verifyMutation.isPending,
  };
}



