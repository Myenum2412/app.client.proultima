import { NextRequest, NextResponse } from 'next/server';
import { sendLowBalanceAlertEmail } from '@/lib/email';

/**
 * Test endpoint to send low balance alert email
 * Usage: POST /api/email/test-low-balance
 * Body: { branch?: string, balance?: number, testEmail?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { branch = 'Test Branch', balance = 450, testEmail = 'najasneju@gmail.com' } = await request.json();

    // Send email directly using nodemailer
    const result = await sendLowBalanceAlertEmail(
      branch,
      balance,
      [testEmail]
    );

    return NextResponse.json({
      success: true,
      message: 'Test low balance alert email sent successfully',
      result,
      details: {
        branch,
        balance,
        recipient: testEmail,
        note: 'Email sent immediately via nodemailer. Check your inbox.'
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for quick testing via browser
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const branch = searchParams.get('branch') || 'Test Branch';
    const balance = parseFloat(searchParams.get('balance') || '450');
    const testEmail = searchParams.get('email') || 'najasneju@gmail.com';

    // Send email directly using nodemailer
    const result = await sendLowBalanceAlertEmail(
      branch,
      balance,
      [testEmail]
    );

    return NextResponse.json({
      success: true,
      message: 'Test low balance alert email sent successfully',
      result,
      details: {
        branch,
        balance,
        recipient: testEmail,
        note: 'Email sent immediately via nodemailer. Check your inbox.'
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
