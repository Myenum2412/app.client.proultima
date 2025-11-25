import { NextRequest, NextResponse } from 'next/server';
import { sendGroceryRequestEmail, sendGroceryApprovalEmail, sendGroceryRejectionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, requestData, adminEmail, staffEmail, rejectionReason, adminNotes } = body;

    if (!type || !requestData) {
      return NextResponse.json(
        { error: 'Missing required fields: type, requestData' },
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
        result = await sendGroceryRequestEmail(requestData, adminEmail);
        break;

      case 'approved':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for approval notification' },
            { status: 400 }
          );
        }
        result = await sendGroceryApprovalEmail(requestData, staffEmail, adminNotes);
        break;

      case 'rejected':
        if (!staffEmail || !rejectionReason) {
          return NextResponse.json(
            { error: 'Staff email and rejection reason are required for rejection notification' },
            { status: 400 }
          );
        }
        result = await sendGroceryRejectionEmail(requestData, staffEmail, rejectionReason);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type. Must be: new_request, approved, or rejected' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending grocery notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: (error as Error).message },
      { status: 500 }
    );
  }
}

