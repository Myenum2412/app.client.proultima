import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { id, note, verifier_id } = await request.json();

    if (!id || !verifier_id) {
      return NextResponse.json({ error: 'Missing id or verifier_id' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: transaction, error: fetchError } = await supabase
      .from('cash_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.verification_status !== 'pending') {
      return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });
    }

    const branch = transaction.branch;

    const { data: openingBalanceData } = await supabase
      .from('branch_opening_balances')
      .select('opening_balance')
      .ilike('branch', branch)
      .single();

    const openingBalance = openingBalanceData?.opening_balance || 0;

    const { data: latestApproved } = await supabase
      .from('cash_transactions')
      .select('balance')
      .eq('branch', branch)
      .eq('verification_status', 'approved')
      .order('verified_at', { ascending: false })
      .order('transaction_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousBalance = latestApproved?.balance ?? openingBalance;
    const newBalance = previousBalance + (transaction.cash_in || 0) - (transaction.cash_out || 0);

    const { data: updated, error: updateError } = await supabase
      .from('cash_transactions')
      .update({
        balance: newBalance,
        verification_status: 'approved',
        verified_by: verifier_id,
        verified_at: new Date().toISOString(),
        verification_notes: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        staff:staff_id (
          name,
          employee_id,
          email
        )
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const transactionType = updated.cash_in && updated.cash_in > 0 ? 'Income' : 'Expense';
    const amount = updated.cash_in || updated.cash_out || 0;
    const hasProof = Array.isArray(updated.attachment_urls) && updated.attachment_urls.length > 0;

    const notifications: Array<Record<string, unknown>> = [];
    notifications.push({
      user_id: updated.staff_id,
      type: 'cashbook_transaction_approved',
      title: 'Cash transaction approved',
      message: `Your ${transactionType} (${amount}) for ${updated.branch} has been approved.`,
      reference_id: updated.id,
      reference_table: 'cash_transactions',
      metadata: {
        branch: updated.branch,
        amount,
        transaction_type: transactionType,
        verification_notes: note || null,
      },
    });

    const { data: admins } = await supabase.from('admins').select('id, email');
    for (const admin of admins || []) {
      notifications.push({
        user_id: admin.id,
        type: 'cashbook_entry',
        title: 'Cashbook entry approved',
        message: `${updated.primary_list} (${amount}) has been approved for ${updated.branch}.${hasProof ? ' Proof reviewed.' : ''}`,
        reference_id: updated.id,
        reference_table: 'cash_transactions',
        metadata: {
          branch: updated.branch,
          amount,
          transaction_type: transactionType,
          has_proof: hasProof,
        },
      });
    }

    if (notifications.length) {
      await supabase.from('notifications').insert(notifications);
    }

    const recipientEmails = Array.from(
      new Set(
        [
          updated.staff?.email,
          ...(admins || []).map((admin) => admin.email),
        ].filter(Boolean) as string[]
      )
    );

    if (recipientEmails.length) {
      const subject = `Transaction approved • ${updated.branch}${hasProof ? ' • proof attached' : ''}`;
      const html = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
              <h2 style="margin: 0 0 16px 0; color: #111827;">Cash transaction approved</h2>
              <p style="margin: 0 0 16px 0;">The transaction submitted by <strong>${updated.staff?.name || 'Staff member'}</strong> has been approved and posted to the cashbook.${hasProof ? ' Supporting proof was reviewed.' : ''}</p>
              <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);">
                <p style="margin: 0; color: #6b7280; font-size: 13px;">Branch</p>
                <p style="margin: 4px 0 12px 0; font-weight: 600; font-size: 15px;">${updated.branch}</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">Amount</p>
                <p style="margin: 4px 0 12px 0; font-weight: 600; font-size: 15px;">₹${amount.toLocaleString('en-IN')}</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">Purpose</p>
                <p style="margin: 4px 0 12px 0; font-weight: 500; font-size: 15px;">${updated.primary_list || '—'}${updated.nature_of_expense ? ` · ${updated.nature_of_expense}` : ''}</p>
                ${note ? `<p style="margin: 0; color: #4b5563; font-size: 13px;">Verifier note: ${note}</p>` : ''}
                ${hasProof ? `<p style="margin: 12px 0 0 0; color: #4b5563; font-size: 13px;">Proof attachments remain available in the portal for reference.</p>` : ''}
              </div>
              <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">This is an automated alert from ProUltima.</p>
            </div>
          </body>
        </html>
      `;

      try {
        await sendEmail({ to: recipientEmails, subject, html });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
