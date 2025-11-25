import { NextRequest, NextResponse } from 'next/server';
import { sendLowStockAlertEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

/**
 * API route to send low stock alert emails to admins for stationary items
 * Usage: POST /api/email/send-stationary-low-stock-alert
 * Body: { itemName: string, quantity: number, branch: string, staffName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { itemName, quantity, branch, staffName } = await request.json();

    if (!itemName || quantity === undefined || !branch || !staffName) {
      return NextResponse.json(
        { error: 'Missing required fields: itemName, quantity, branch, and staffName' },
        { status: 400 }
      );
    }

    // Fetch all admin emails
    const supabase = await createClient();
    const { data: admins, error } = await supabase
      .from('admins')
      .select('email');

    if (error) {
      console.error('Error fetching admin emails:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admin emails' },
        { status: 500 }
      );
    }

    const emailsToSend = (admins || [])
      .map(admin => admin.email)
      .filter((email): email is string => Boolean(email));

    if (emailsToSend.length === 0) {
      console.warn('[send-stationary-low-stock-alert] No admin emails found for low stock alert', {
        itemName,
        quantity,
        branch,
        staffName,
      });
      return NextResponse.json(
        { error: 'No admin emails found' },
        { status: 400 }
      );
    }

    // Send email to all admins
    const result = await sendLowStockAlertEmail(
      itemName,
      quantity,
      branch,
      staffName,
      emailsToSend
    );

    return NextResponse.json({
      success: true,
      message: 'Low stock alert email sent successfully',
      result,
      details: {
        itemName,
        quantity,
        branch,
        staffName,
        recipients: emailsToSend.length
      }
    });
  } catch (error) {
    console.error('Error sending low stock alert email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send low stock alert email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

