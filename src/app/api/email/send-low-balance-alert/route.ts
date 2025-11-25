import { NextRequest, NextResponse } from 'next/server';
import { sendLowBalanceAlertEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

/**
 * API route to send low balance alert emails to admins
 * Usage: POST /api/email/send-low-balance-alert
 * Body: { branch: string, balance: number, adminEmails?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { branch, balance, adminEmails } = await request.json();

    if (!branch || balance === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: branch and balance' },
        { status: 400 }
      );
    }

    // If adminEmails not provided, fetch all admin emails
    let emailsToSend: string[] = adminEmails || [];
    
    if (emailsToSend.length === 0) {
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

      emailsToSend = (admins || [])
        .map(admin => admin.email)
        .filter((email): email is string => Boolean(email));
    }

    if (emailsToSend.length === 0) {
      console.warn('[send-low-balance-alert] No admin emails found for low balance alert', {
        branch,
        balance,
      });
      return NextResponse.json(
        { error: 'No admin emails found' },
        { status: 400 }
      );
    }

    // Send email to all admins
    const result = await sendLowBalanceAlertEmail(
      branch,
      balance,
      emailsToSend
    );

    return NextResponse.json({
      success: true,
      message: 'Low balance alert email sent successfully',
      result,
      details: {
        branch,
        balance,
        recipients: emailsToSend.length
      }
    });
  } catch (error) {
    console.error('Error sending low balance alert email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send low balance alert email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
