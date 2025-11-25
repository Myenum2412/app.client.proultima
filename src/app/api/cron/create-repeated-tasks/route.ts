import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { sendRepeatedTaskEmail } from '@/lib/email';

/**
 * Verify cron job authentication
 * Supports multiple methods:
 * 1. Vercel Cron Jobs: x-vercel-signature header (Vercel automatically adds this)
 * 2. External cron services: Authorization: Bearer ${CRON_SECRET} header
 * 3. Query parameter: ?secret=${CRON_SECRET} (for external services that can't set headers)
 */
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    return false;
  }

  // Method 1: Check for Vercel signature header (Vercel cron jobs automatically add this)
  const vercelSignature = request.headers.get('x-vercel-signature');
  if (vercelSignature) {
    // Vercel cron jobs are automatically authenticated
    return true;
  }

  // Method 2: Check for Bearer token in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Method 3: Check for secret in query parameter (for external cron services)
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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = today.getDate();

    // console.log(`🔄 Processing repeated tasks for ${todayStr} (Day ${dayOfWeek}, ${dayOfMonth}th)`);

    // Get all repeated tasks
    const { data: repeatedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_staff:task_assignments(
          staff_id,
          staff:staff(id, name, email)
        )
      `)
      .eq('is_repeated', true);

    if (tasksError) {
      console.error('❌ Error fetching repeated tasks:', tasksError);
      throw tasksError;
    }

    if (!repeatedTasks || repeatedTasks.length === 0) {
      // console.log('ℹ️ No repeated tasks found');
      return NextResponse.json({ 
        success: true, 
        message: 'No repeated tasks to process',
        created: 0,
        skipped: 0
      });
    }

    // console.log(`📋 Found ${repeatedTasks.length} repeated tasks to check`);

    let createdCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const task of repeatedTasks) {
      try {
        const shouldCreate = shouldCreateTaskToday(task.repeat_config, today, dayOfWeek, dayOfMonth);
        
        if (!shouldCreate) {
          // console.log(`⏭️ Skipping ${task.task_no} - not scheduled for today`);
          skippedCount++;
          continue;
        }

        // Check if task already created today
        const { data: existingTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('parent_task_id', task.id)
          .gte('created_at', todayStr)
          .single();

        if (existingTask) {
          // console.log(`⏭️ Skipping ${task.task_no} - already created today`);
          skippedCount++;
          continue;
        }

        // Create new task instance
        const newTaskNo = `${task.task_no}-${todayStr}`;
        const newDueDate = task.repeat_config?.has_specific_time 
          ? `${todayStr}T${task.repeat_config.start_time || '09:00'}:00.000Z`
          : todayStr;

        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert({
            title: task.title,
            description: task.description,
            allocation_mode: task.allocation_mode,
            assigned_staff_ids: task.assigned_staff_ids || [],
            assigned_team_ids: task.assigned_team_ids || [],
            status: 'todo', // Always start as todo
            priority: task.priority,
            due_date: newDueDate,
            start_date: todayStr,
            is_repeated: false, // This instance is not repeated
            repeat_config: null, // This instance has no repeat config
            support_files: task.support_files || [],
            task_no: newTaskNo,
            parent_task_id: task.id, // Link to original repeated task
          })
          .select()
          .single();

        if (createError) {
          console.error(`❌ Failed to create task ${newTaskNo}:`, createError);
          continue;
        }

        // Create task assignments
        if (task.assigned_staff_ids && task.assigned_staff_ids.length > 0) {
          const assignments = task.assigned_staff_ids.map((staffId: string) => ({
            task_id: newTask.id,
            staff_id: staffId,
          }));

          const { error: assignmentError } = await supabase
            .from('task_assignments')
            .insert(assignments);

          if (assignmentError) {
            console.error(`❌ Failed to create assignments for ${newTaskNo}:`, assignmentError);
          }
        }

        // Send email notifications
        if (task.assigned_staff && task.assigned_staff.length > 0) {
          for (const assignment of task.assigned_staff) {
            if (assignment.staff?.email) {
              try {
                await sendRepeatedTaskEmail(
                  assignment.staff.email,
                  assignment.staff.name,
                  task.title,
                  newTaskNo,
                  task.priority,
                  newDueDate || undefined
                );
                // console.log(`📧 Repeated task email sent to ${assignment.staff.name} (${newTaskNo})`);
              } catch (emailError) {
                console.error(`❌ Failed to send repeated task email for ${assignment.staff.name}:`, emailError);
              }
            }
          }
        }

        // console.log(`✅ Created repeated task: ${newTaskNo}`);
        createdCount++;
        results.push({
          originalTask: task.task_no,
          newTask: newTaskNo,
          assignedTo: task.assigned_staff?.map((a: any) => a.staff?.name).filter(Boolean) || []
        });

      } catch (error) {
        console.error(`❌ Error processing task ${task.task_no}:`, error);
        skippedCount++;
      }
    }

    // console.log(`🎉 Repeated tasks processing complete: ${createdCount} created, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      message: `Processed repeated tasks: ${createdCount} created, ${skippedCount} skipped`,
      created: createdCount,
      skipped: skippedCount,
      results
    });

  } catch (error) {
    console.error('❌ Error in create-repeated-tasks cron:', error);
    return NextResponse.json(
      { error: 'Failed to process repeated tasks' },
      { status: 500 }
    );
  }
}

function shouldCreateTaskToday(repeatConfig: any, today: Date, dayOfWeek: number, dayOfMonth: number): boolean {
  if (!repeatConfig) return false;

  const { frequency, interval, end_date, custom_days } = repeatConfig;

  // Check if past end date
  if (end_date && today > new Date(end_date)) {
    return false;
  }

  switch (frequency) {
    case 'daily':
      // Check interval (every X days)
      const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
      return daysSinceEpoch % interval === 0;

    case 'weekly':
      // Check if today is in custom_days array
      return custom_days && custom_days.includes(dayOfWeek);

    case 'monthly':
      // Check if today is the right day of month
      return dayOfMonth === interval;

    case 'custom':
      // For custom, check custom_days
      return custom_days && custom_days.includes(dayOfWeek);

    default:
      return false;
  }
}
