import { NextRequest, NextResponse } from 'next/server';
import { sendSupportTicketEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const {
      ticketNo,
      user_name,
      user_email,
      user_role,
      category,
      priority,
      title,
      description,
      attachment_urls,
    } = await request.json();

    // Validate required fields
    if (!ticketNo || !user_name || !user_email || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email to both developers
    const developerEmails = ['myenumam@gmail.com', 'najasneju@gmail.com'];
    
    for (const email of developerEmails) {
      await sendSupportTicketEmail({
        toEmail: email,
        ticketNo,
        senderName: user_name,
        senderEmail: user_email,
        senderRole: user_role || 'staff',
        category: category || 'other',
        priority: priority || 'medium',
        title,
        description,
        attachmentUrls: attachment_urls || [],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending support ticket email:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

