import { NextRequest, NextResponse } from 'next/server';
import { sendScrapRequestEmail, sendScrapApprovalEmail, sendScrapRejectionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, requestData, adminEmail, submitterEmail, rejectionReason, adminNotes } = body;

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
        result = await sendScrapRequestEmail(requestData, adminEmail);
        break;

      case 'approved':
        if (!submitterEmail) {
          return NextResponse.json(
            { error: 'Submitter email is required for approval notification' },
            { status: 400 }
          );
        }
        result = await sendScrapApprovalEmail(requestData, submitterEmail, adminNotes);
        break;

      case 'rejected':
        if (!submitterEmail || !rejectionReason) {
          return NextResponse.json(
            { error: 'Submitter email and rejection reason are required for rejection notification' },
            { status: 400 }
          );
        }
        result = await sendScrapRejectionEmail(requestData, submitterEmail, rejectionReason);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type. Must be: new_request, approved, or rejected' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending scrap notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: (error as Error).message },
      { status: 500 }
    );
  }
}


