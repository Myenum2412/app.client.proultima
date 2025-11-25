import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { transaction } = await request.json();

    if (!transaction || !transaction.branch || !transaction.transaction_date) {
      return NextResponse.json({ error: 'Invalid transaction payload' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: accountants } = await supabase
      .from('staff')
      .select('email')
      .ilike('role', 'accountant')
      .eq('is_active', true);

    const { data: admins } = await supabase
      .from('admins')
      .select('email');

    const recipients = Array.from(
      new Set(
        [
          ...(accountants || []).map((a) => a.email).filter(Boolean),
          ...(admins || []).map((a) => a.email).filter(Boolean),
        ] as string[]
      )
    );

    if (recipients.length === 0) {
      console.warn('[cash-transaction-pending] No admin/accountant recipients for pending transaction email', {
        transactionId: transaction.id,
        branch: transaction.branch,
      });
      return NextResponse.json({ success: false, message: 'No recipients for pending transaction email' });
    }

    const amount = (transaction.cash_in || 0) - (transaction.cash_out || 0);
    const amountDisplay = amount >= 0
      ? `+₹${Math.abs(amount).toLocaleString('en-IN')}`
      : `-₹${Math.abs(amount).toLocaleString('en-IN')}`;
    const hasProof = Array.isArray(transaction.attachment_urls) && transaction.attachment_urls.length > 0;

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
            <h2 style="margin: 0 0 16px 0; color: #111827;">Cash Transaction Awaiting Verification</h2>
            <p style="margin: 0 0 16px 0;">A new transaction from <strong>${transaction.staff?.name || 'Staff member'}</strong> is pending approval.</p>
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">Branch</p>
              <p style="margin: 4px 0 12px 0; font-weight: 600; font-size: 15px;">${transaction.branch}</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">Transaction Date</p>
              <p style="margin: 4px 0 12px 0; font-weight: 600; font-size: 15px;">${new Date(transaction.transaction_date).toLocaleDateString('en-IN')}</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">Voucher</p>
              <p style="margin: 4px 0 12px 0; font-weight: 600; font-size: 15px;">${transaction.voucher_no || 'N/A'}</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">Amount</p>
              <p style="margin: 4px 0 12px 0; font-weight: 600; font-size: 15px;">${amountDisplay}</p>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">Purpose</p>
              <p style="margin: 4px 0 0 0; font-weight: 500; font-size: 15px;">${transaction.primary_list || '—'}${transaction.nature_of_expense ? ` · ${transaction.nature_of_expense}` : ''}</p>
            </div>
            <div style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.proultima.com'}/staff/accounting/approvals" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Review transaction</a>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">This is an automated alert from ProUltima.${hasProof ? ' Supporting proof is available in the portal.' : ''}</p>
          </div>
        </body>
      </html>
    `;

    const subject = `Verification required: ${transaction.branch} • ${transaction.primary_list || 'Cash transaction'}${hasProof ? ' • proof attached' : ''}`;

    const result = await sendEmail({
      to: recipients,
      subject,
      html,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending pending verification email:', error);
    return NextResponse.json({ error: 'Failed to send pending verification email' }, { status: 500 });
  }
}
