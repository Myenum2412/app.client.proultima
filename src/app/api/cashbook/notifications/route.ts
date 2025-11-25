import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Scenario = 'pending' | 'autoApproved';

interface TransactionPayload {
  id: string;
  branch?: string | null;
  cash_in?: number | null;
  cash_out?: number | null;
  primary_list?: string | null;
  nature_of_expense?: string | null;
  transaction_date?: string | null;
  voucher_no?: string | null;
  attachment_urls?: string[] | null;
  staff?: {
    name?: string | null;
    email?: string | null;
    employee_id?: string | null;
  } | null;
  staff_id?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { scenario, transaction }: { scenario?: Scenario; transaction?: TransactionPayload } =
      await request.json();

    if (!scenario || !transaction?.id) {
      return NextResponse.json(
        { error: 'Missing scenario or transaction payload' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const staffName = transaction.staff?.name || 'Staff Member';
    const branch = transaction.branch || 'Unknown branch';
    const transactionType =
      transaction.cash_in && transaction.cash_in > 0
        ? 'Income'
        : transaction.cash_out && transaction.cash_out > 0
          ? 'Expense'
          : 'Transaction';
    const amount =
      transaction.cash_in && transaction.cash_in > 0
        ? transaction.cash_in
        : transaction.cash_out && transaction.cash_out > 0
          ? transaction.cash_out
          : 0;

    const hasProof = Boolean(transaction.attachment_urls?.length);
    const metadataBase = {
      branch,
      amount,
      transaction_type: transactionType,
      requested_by: staffName,
      has_proof: hasProof,
    };

    if (scenario === 'pending') {
      const [{ data: accountants, error: accountantError }, { data: admins, error: adminError }] =
        await Promise.all([
          supabase
            .from('staff')
            .select('id')
            .ilike('role', 'accountant')
            .eq('is_active', true),
          supabase.from('admins').select('id'),
        ]);

      if (accountantError || adminError) {
        console.error('[cashbook:notifications] Failed to fetch recipients', {
          accountantError,
          adminError,
        });
        return NextResponse.json(
          { error: 'Failed to fetch notification recipients' },
          { status: 500 }
        );
      }

      const recipients = [
        ...(accountants || []).map(({ id }) => id),
        ...(admins || []).map(({ id }) => id),
      ].filter(Boolean);

      if (recipients.length === 0) {
        console.warn('[cashbook:notifications] No recipients found for pending transaction notification', {
          transactionId: transaction.id,
          branch,
        });
        return NextResponse.json(
          { success: false, message: 'No recipients found for pending notification' },
          { status: 200 }
        );
      }

      const rows = recipients.map((userId) => ({
        user_id: userId,
        type: 'cashbook_entry' as const,
        title: 'Cash transaction pending approval',
        message: `${staffName} submitted a ${transactionType} (${amount}) for ${branch}${hasProof ? ' • proof attached' : ''}.`,
        reference_id: transaction.id,
        reference_table: 'cash_transactions',
        is_viewed: false,
        metadata: {
          ...metadataBase,
          requires_approval: true,
        },
      }));

      const { error: insertError } = await supabase.from('notifications').insert(rows);

      if (insertError) {
        console.error('[cashbook:notifications] Failed to insert pending notifications', insertError);
        return NextResponse.json(
          { error: 'Failed to insert notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, count: rows.length });
    }

    if (scenario === 'autoApproved') {
      const { data: admins, error: adminError } = await supabase.from('admins').select('id');

      if (adminError) {
        console.error('[cashbook:notifications] Failed to fetch admins for auto-approved entry', adminError);
        return NextResponse.json(
          { error: 'Failed to fetch admins' },
          { status: 500 }
        );
      }

      const recipients = (admins || []).map(({ id }) => id).filter(Boolean);

      if (recipients.length === 0) {
        console.warn('[cashbook:notifications] No admins found for auto-approved notification', {
          transactionId: transaction.id,
          branch,
        });
        return NextResponse.json(
          { success: false, message: 'No admins found for auto-approved notification' },
          { status: 200 }
        );
      }

      const rows = recipients.map((userId) => ({
        user_id: userId,
        type: 'cashbook_entry' as const,
        title: 'New cashbook entry',
        message: `New ${transactionType} from ${staffName}: ${transaction.nature_of_expense || 'Cash entry'} (${amount})${hasProof ? ' • proof attached' : ''}.`,
        reference_id: transaction.id,
        reference_table: 'cash_transactions',
        is_viewed: false,
        metadata: {
          ...metadataBase,
          nature_of_expense: transaction.nature_of_expense,
          requires_approval: false,
        },
      }));

      const { error: insertError } = await supabase.from('notifications').insert(rows);

      if (insertError) {
        console.error('[cashbook:notifications] Failed to insert auto-approved notifications', insertError);
        return NextResponse.json(
          { error: 'Failed to insert notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, count: rows.length });
    }

    return NextResponse.json({ error: 'Unsupported scenario' }, { status: 400 });
  } catch (error) {
    console.error('[cashbook:notifications] Unexpected error', error);
    return NextResponse.json({ error: 'Failed to process notification request' }, { status: 500 });
  }
}

