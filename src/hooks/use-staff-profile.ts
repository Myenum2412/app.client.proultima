'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { saveUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export function useStaffProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { user, refreshUser } = useAuth();

  // Update profile (name and/or profile picture)
  const updateProfileMutation = useMutation({
    mutationFn: async ({ name, profile_image_url }: { name?: string; profile_image_url?: string }) => {
      if (!user?.staffId) throw new Error('Not authenticated');

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (name) updateData.name = name;
      if (profile_image_url) updateData.profile_image_url = profile_image_url;

      const { data, error } = await supabase
        .from('staff')
        .update(updateData)
        .eq('id', user.staffId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      toast.success('Profile updated successfully!');
      
      // Update localStorage with new data
      if (user) {
        const updatedUser = {
          ...user,
          name: data.name,
          profileImage: data.profile_image_url || user.profileImage,
        };
        saveUser(updatedUser);
      }
      
      // Refresh auth context
      await refreshUser();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff', user?.staffId] });
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + (error as Error).message);
    },
  });

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: async ({ 
      currentPassword, 
      newPassword 
    }: { 
      currentPassword: string; 
      newPassword: string;
    }) => {
      if (!user?.staffId) throw new Error('Not authenticated');

      // Fetch current password hash
      const { data: staffData, error: fetchError } = await supabase
        .from('staff')
        .select('password_hash')
        .eq('id', user.staffId)
        .single();

      if (fetchError) throw new Error('Failed to verify current password');

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, staffData.password_hash);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.staffId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  // Upload profile image to Supabase Storage
  const uploadProfileImage = async (file: File): Promise<string> => {
    if (!user?.staffId) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.staffId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('staff-profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('staff-profiles')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    uploadProfileImage,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
}

