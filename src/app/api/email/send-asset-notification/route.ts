import { NextRequest, NextResponse } from 'next/server';
import { sendAssetRequestNotificationEmail, sendAssetApprovalEmail, sendAssetRejectionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, requestData, adminEmail, staffEmail, adminNotes, rejectionReason } = body;

    if (!type || !requestData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'new_request':
        if (!adminEmail) {
          return NextResponse.json(
            { error: 'Admin email is required for new request notification' },
            { status: 400 }
          );
        }
        result = await sendAssetRequestNotificationEmail(requestData, adminEmail);
        break;
      case 'approved':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for approval notification' },
            { status: 400 }
          );
        }
        result = await sendAssetApprovalEmail(requestData, staffEmail, adminNotes);
        break;
      case 'rejected':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for rejection notification' },
            { status: 400 }
          );
        }
        result = await sendAssetRejectionEmail(requestData, staffEmail, rejectionReason);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending asset notification email:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}
