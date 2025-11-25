import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { sendDailyReport } from '@/lib/email';

/**
 * Verify cron job authentication
 * Supports external cron services:
 * 1. Authorization: Bearer ${CRON_SECRET} header
 * 2. Query parameter: ?secret=${CRON_SECRET} (for external services that can't set headers)
 */
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    return false;
  }

  // Method 1: Check for Bearer token in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Method 2: Check for secret in query parameter (for external cron services)
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  if (secretParam === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron authentication (supports multiple methods)
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    // Get total tasks
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Get completed today
    const { count: completedToday } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('updated_at', today);

    // Get in progress
    const { count: inProgress } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    // Get overdue tasks
    const { count: overdue } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed');

    // Get today's tasks (due today)
    const { count: todayTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('due_date', today);

    // Get attendance for today
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);

    const attendanceStats = {
      present: attendanceData?.filter(a => a.status === 'present').length || 0,
      absent: attendanceData?.filter(a => a.status === 'absent').length || 0,
      leave: attendanceData?.filter(a => a.status === 'leave').length || 0,
    };

    // Get pending requests
    const { count: pendingMaintenance } = await supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: pendingPurchase } = await supabase
      .from('purchase_requisitions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: pendingScrap } = await supabase
      .from('scrap_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: pendingGrocery } = await supabase
      .from('grocery_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get top performers (staff with most completed tasks today)
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('assigned_staff_ids')
      .eq('status', 'completed')
      .gte('updated_at', today);

    // Count tasks per staff member
    const staffTaskCounts: Record<string, number> = {};
    completedTasks?.forEach(task => {
      task.assigned_staff_ids?.forEach((staffId: string) => {
        staffTaskCounts[staffId] = (staffTaskCounts[staffId] || 0) + 1;
      });
    });

    // Get top 5 performers
    const topStaffIds = Object.entries(staffTaskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([staffId]) => staffId);

    const topPerformers = [];
    if (topStaffIds.length > 0) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name')
        .in('id', topStaffIds);

      for (const staff of staffData || []) {
        topPerformers.push({
          staffName: staff.name,
          tasksCompleted: staffTaskCounts[staff.id] || 0,
        });
      }
    }

    // Get team performance
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name');

    const teamPerformance = [];
    for (const team of teams || []) {
      const { count: teamTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .contains('assigned_team_ids', [team.id]);

      const { count: teamCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .contains('assigned_team_ids', [team.id])
        .eq('status', 'completed');

      const completionRate = teamTasks ? Math.round(((teamCompleted || 0) / teamTasks) * 100) : 0;

      teamPerformance.push({
        teamName: team.name,
        completionRate,
      });
    }

    // Get admin email
    const { data: admin } = await supabase
      .from('admins')
      .select('email')
      .limit(1)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    // Send report to both admin and najasneju@gmail.com
    const recipients = [admin.email, 'najasneju@gmail.com','myenumam@gmail.com','vel@proultimaengineering.com'];
    const reportData = {
      todayTasks: todayTasks || 0,           // NEW
      completedToday: completedToday || 0,
      inProgress: inProgress || 0,
      overdue: overdue || 0,
      attendance: attendanceStats,            // NEW
      pendingRequests: {                      // NEW
        maintenance: pendingMaintenance || 0,
        purchase: pendingPurchase || 0,
        scrap: pendingScrap || 0,
        grocery: pendingGrocery || 0,
      },
      teamPerformance: teamPerformance.slice(0, 5),
      topPerformers,
    };

    // Send to all recipients
    for (const email of recipients) {
      try {
        await sendDailyReport(email, reportData);
        // console.log(`📧 Daily report sent to ${email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send daily report to ${email}:`, emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Daily report sent successfully' 
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

