import { NextRequest, NextResponse } from 'next/server';
import { 
  sendTaskProofUploadedEmail,
  sendTaskProofApprovedEmail,
  sendTaskProofRejectedEmail
} from '@/lib/task-proof-emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, proofData, adminEmail, staffEmail, verificationNotes } = body;

    if (!type || !proofData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'proof_uploaded':
        if (!adminEmail) {
          return NextResponse.json(
            { error: 'Admin email is required for proof upload notification' },
            { status: 400 }
          );
        }
        result = await sendTaskProofUploadedEmail(proofData, adminEmail);
        break;
      case 'proof_approved':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for proof approval notification' },
            { status: 400 }
          );
        }
        result = await sendTaskProofApprovedEmail(proofData, staffEmail, verificationNotes);
        break;
      case 'proof_rejected':
        if (!staffEmail) {
          return NextResponse.json(
            { error: 'Staff email is required for proof rejection notification' },
            { status: 400 }
          );
        }
        result = await sendTaskProofRejectedEmail(proofData, staffEmail, verificationNotes);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending proof notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
