import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendRescheduleNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { type, rescheduleId } = await request.json();

    if (!type || !rescheduleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch reschedule details with related data
    const { data: reschedule, error: fetchError } = await supabase
      .from('task_reschedules')
      .select(`
        *,
        staff:staff!staff_id(id, name, email),
        admin:admins!admin_id(id, name, email),
        task:tasks!task_id(id, title, task_no, due_date)
      `)
      .eq('id', rescheduleId)
      .single();

    if (fetchError || !reschedule) {
      console.error('Error fetching reschedule:', fetchError);
      return NextResponse.json(
        { error: 'Reschedule not found' },
        { status: 404 }
      );
    }

    // Send appropriate email based on type
    let emailResult;
    switch (type) {
      case 'new_reschedule':
        // Send to admin
        if (reschedule.admin) {
          emailResult = await sendRescheduleNotificationEmail({
            type: 'new_reschedule',
            to: reschedule.admin.email,
            toName: reschedule.admin.name,
            taskTitle: reschedule.task?.title || 'Unknown Task',
            taskNo: reschedule.task?.task_no,
            staffName: reschedule.staff?.name || 'Unknown Staff',
            staffEmail: reschedule.staff?.email || '',
            reason: reschedule.reason,
            requestedDate: reschedule.requested_new_date,
            originalDate: reschedule.original_due_date,
            rescheduleId: reschedule.id,
          });
        }
        break;

      case 'reschedule_approved':
        // Send to staff
        if (reschedule.staff) {
          emailResult = await sendRescheduleNotificationEmail({
            type: 'reschedule_approved',
            to: reschedule.staff.email,
            toName: reschedule.staff.name,
            taskTitle: reschedule.task?.title || 'Unknown Task',
            taskNo: reschedule.task?.task_no,
            newDueDate: reschedule.requested_new_date,
            adminResponse: reschedule.admin_response,
            rescheduleId: reschedule.id,
          });
        }
        break;

      case 'reschedule_rejected':
        // Send to staff
        if (reschedule.staff) {
          emailResult = await sendRescheduleNotificationEmail({
            type: 'reschedule_rejected',
            to: reschedule.staff.email,
            toName: reschedule.staff.name,
            taskTitle: reschedule.task?.title || 'Unknown Task',
            taskNo: reschedule.task?.task_no,
            originalDate: reschedule.original_due_date,
            adminResponse: reschedule.admin_response,
            rescheduleId: reschedule.id,
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    if (!emailResult || !emailResult.success) {
      console.error('Error sending email');
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: emailResult.messageId });
  } catch (error) {
    console.error('Error in reschedule notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
