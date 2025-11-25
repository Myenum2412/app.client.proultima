import { NextRequest, NextResponse } from 'next/server';
import { sendDelegationCompletionEmail, sendDelegationVerifiedEmail, sendDelegationRejectedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, delegatorEmail, delegatorName, delegateeEmail, delegateeName, taskTitle, taskNo, rejectionReason } = body;

    if (!type || !taskTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'delegation_completed':
        if (!delegatorEmail || !delegatorName || !delegateeName) {
          return NextResponse.json({ error: 'Missing required fields for delegation_completed' }, { status: 400 });
        }
        result = await sendDelegationCompletionEmail(
          delegatorEmail,
          delegatorName,
          delegateeName,
          taskTitle,
          taskNo || 'Unknown'
        );
        break;

      case 'delegation_verified':
        if (!delegateeEmail || !delegateeName || !delegatorName) {
          return NextResponse.json({ error: 'Missing required fields for delegation_verified' }, { status: 400 });
        }
        result = await sendDelegationVerifiedEmail(
          delegateeEmail,
          delegateeName,
          delegatorName,
          taskTitle,
          taskNo || 'Unknown'
        );
        break;

      case 'delegation_rejected':
        if (!delegateeEmail || !delegateeName || !delegatorName) {
          return NextResponse.json({ error: 'Missing required fields for delegation_rejected' }, { status: 400 });
        }
        result = await sendDelegationRejectedEmail(
          delegateeEmail,
          delegateeName,
          delegatorName,
          taskTitle,
          taskNo || 'Unknown',
          rejectionReason
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Delegation email error:', error);
    return NextResponse.json(
      { error: 'Failed to send delegation email' },
      { status: 500 }
    );
  }
}



