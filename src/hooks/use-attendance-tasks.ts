'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface AttendanceTaskStatus {
  attendance_id: string;
  attendance_date?: string;
  task_title: string | null;
  task_status: string | null;
  task_updated_at: string | null;
}

export function useAttendanceTasks(
  staffId: string | undefined, 
  dateRange: number,
  allStaffMode: boolean = false // NEW parameter
) {
  const supabase = createClient();

  return useQuery<AttendanceTaskStatus[]>({
    queryKey: ['attendance-tasks', staffId, dateRange, allStaffMode],
    queryFn: async () => {
      if (allStaffMode) {
        // NEW: Support for all staff (Today's Attendance table)
        const today = new Date().toISOString().split('T')[0];
        
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('id, staff_id, date')
          .eq('date', today);

        if (attendanceError) throw attendanceError;
        if (!attendance || attendance.length === 0) return [];

        const taskStatuses = await Promise.all(
          attendance.map(async (record) => {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('title, status, updated_at')
              .contains('assigned_staff_ids', [record.staff_id])
              .gte('updated_at', `${today}T00:00:00`)
              .lte('updated_at', `${today}T23:59:59`)
              .order('updated_at', { ascending: false })
              .limit(1);

            return {
              attendance_id: record.id,
              attendance_date: record.date,
              task_title: tasks && tasks.length > 0 ? tasks[0].title : null,
              task_status: tasks && tasks.length > 0 ? tasks[0].status : null,
              task_updated_at: tasks && tasks.length > 0 ? tasks[0].updated_at : null,
            };
          })
        );

        return taskStatuses;
      }
      
      // Original single-staff logic (KEEP EXISTING CODE)
      if (!staffId) return [];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, staff_id, date, login_time, logout_time')
        .eq('staff_id', staffId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;
      if (!attendance || attendance.length === 0) return [];

      const taskStatuses = await Promise.all(
        attendance.map(async (record) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('title, status, updated_at')
            .contains('assigned_staff_ids', [staffId])
            .gte('updated_at', `${record.date}T00:00:00`)
            .lte('updated_at', `${record.date}T23:59:59`)
            .order('updated_at', { ascending: false })
            .limit(1);

          return {
            attendance_id: record.id,
            attendance_date: record.date,
            task_title: tasks && tasks.length > 0 ? tasks[0].title : null,
            task_status: tasks && tasks.length > 0 ? tasks[0].status : null,
            task_updated_at: tasks && tasks.length > 0 ? tasks[0].updated_at : null,
          };
        })
      );

      return taskStatuses;
    },
    enabled: allStaffMode || !!staffId,
    staleTime: 0, // Instant updates for attendance
  });
}
