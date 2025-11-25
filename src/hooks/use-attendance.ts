'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { Attendance, AttendanceRecord, AttendanceSummary } from '@/types/attendance';

export function useAttendance() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Mark login
  const markLoginMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const today = getTodayDate();
      const now = new Date().toISOString();

      // Check if already logged in today
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('date', today)
        .single();

      if (existing) {
        // Get the last check-in time
        const lastCheckIn = existing.check_ins && existing.check_ins.length > 0
          ? new Date(existing.check_ins[existing.check_ins.length - 1])
          : new Date(existing.login_time);
        
        const nowDate = new Date(now);
        const timeDiffMinutes = (nowDate.getTime() - lastCheckIn.getTime()) / (1000 * 60);
        
        // Determine if this is a genuine check-in or just a page refresh
        const isGenuineCheckIn = (
          existing.status === 'logged_out' && // Was logged out
          timeDiffMinutes >= 1 // At least 1 minute since last check-in
        );
        
        // Determine if we should update login_time and last_activity
        const shouldUpdateActivity = timeDiffMinutes >= 0.5; // Update if >30 seconds
        
        if (isGenuineCheckIn) {
          // This is a real re-login after logout - add check-in
          const updatedCheckIns = [...(existing.check_ins || []), now];
          
          const { data, error } = await supabase
            .from('attendance')
            .update({
              login_time: now,
              check_ins: updatedCheckIns,
              status: 'active',
              logout_time: null,
              last_activity: now,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return { success: true, data, isNewLogin: false, isCheckIn: true };
        } else if (shouldUpdateActivity) {
          // Just update last_activity, don't add check-in (same session)
          const { data, error } = await supabase
            .from('attendance')
            .update({
              last_activity: now,
              status: 'active', // Ensure active if somehow not
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return { success: true, data, isNewLogin: false, isCheckIn: false };
        } else {
          // Too recent - likely a page refresh, do nothing
          return { success: true, data: existing, isNewLogin: false, isCheckIn: false };
        }
      }

      // First login of the day - create new attendance record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          staff_id: staffId,
          login_time: now,
          date: today,
          status: 'active',
          check_ins: [now], // Initialize with first check-in
          last_activity: now,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, isNewLogin: true, isCheckIn: false };
    },
    onSuccess: (result) => {
      if (result.isNewLogin) {
        toast.success('Login time recorded');
      } else if (result.isCheckIn) {
        toast.success(`Check-in recorded (${result.data.check_ins?.length || 0} sessions today)`);
      }
      // Silent update for last_activity refresh
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (error) => {
      console.error('Error marking login:', error);
      toast.error('Failed to record login time');
    },
  });

  // Mark logout
  const markLogoutMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const today = getTodayDate();

      const { data, error } = await supabase
        .from('attendance')
        .update({
          logout_time: new Date().toISOString(),
          status: 'logged_out',
        })
        .eq('staff_id', staffId)
        .eq('date', today)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      toast.success('Logout time recorded');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (error) => {
      console.error('Error marking logout:', error);
      toast.error('Failed to record logout time');
    },
  });

  // Get today's attendance for a specific staff
  const useTodayAttendance = (staffId: string | undefined) => {
    return useQuery<Attendance | null>({
      queryKey: ['attendance', 'today', staffId],
      queryFn: async () => {
        if (!staffId) return null;

        const today = getTodayDate();
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('staff_id', staffId)
          .eq('date', today)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected
          throw error;
        }

        return data as Attendance | null;
      },
      enabled: !!staffId,
    });
  };

  // Get all today's attendance records
  const useTodayAllAttendance = () => {
    return useQuery<AttendanceRecord[]>({
      queryKey: ['attendance', 'today', 'all'],
      queryFn: async () => {
        const today = getTodayDate();
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            *,
            staff:staff_id (
              id,
              name,
              email,
              phone,
              role,
              department,
              profile_image_url
            )
          `)
          .eq('date', today)
          .order('login_time', { ascending: false });

        if (error) throw error;

        return data as AttendanceRecord[];
      },
    });
  };

  // Get attendance summary
  const useAttendanceSummary = () => {
    return useQuery<AttendanceSummary>({
      queryKey: ['attendance-summary'],
      queryFn: async () => {
        const today = getTodayDate();

        // Get total staff count
        const { count: totalStaff } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get present count
        const { count: present } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today);

        // Get logged out count
        const { count: loggedOut } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'logged_out');

        return {
          totalStaff: totalStaff || 0,
          present: present || 0,
          absent: (totalStaff || 0) - (present || 0),
          loggedOut: loggedOut || 0,
        };
      },
    });
  };

  // Get attendance history for a staff member
  const useAttendanceHistory = (staffId: string | undefined, days: number = 30) => {
    return useQuery<Attendance[]>({
      queryKey: ['attendance', 'history', staffId, days],
      queryFn: async () => {
        if (!staffId) return [];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error} = await supabase
          .from('attendance')
          .select('*')
          .eq('staff_id', staffId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) throw error;

        return data as Attendance[];
      },
      enabled: !!staffId,
    });
  };

  // Real-time subscription for attendance
  useEffect(() => {
    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          // console.log('📡 Attendance changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
          window.dispatchEvent(new CustomEvent('dataUpdated'));
        }
      )
      .subscribe();

    const handleDataUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
    };

    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [queryClient, supabase]);

  return {
    markLogin: markLoginMutation.mutate,
    markLogout: markLogoutMutation.mutate,
    isMarkingLogin: markLoginMutation.isPending,
    isMarkingLogout: markLogoutMutation.isPending,
    useTodayAttendance,
    useTodayAllAttendance,
    useAttendanceSummary,
    useAttendanceHistory,
  };
}

