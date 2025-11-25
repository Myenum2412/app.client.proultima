import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function extractNumericSuffix(value?: string | null): number {
  if (!value) return 0;
  const match = value.match(/(\d+)$/);
  if (!match) return 0;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function findNextAvailableVoucher(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branch: string,
  prefix: string,
  startOfYear: string
): Promise<string> {
  const { data: candidates } = await supabase
    .from('cash_transactions')
    .select('voucher_no')
    .eq('branch', branch)
    .ilike('voucher_no', `${prefix}%`)
    .gte('transaction_date', startOfYear);

  const highest = (candidates || [])
    .map((row) => extractNumericSuffix(row.voucher_no))
    .reduce((max, value) => (value > max ? value : max), 0);

  const nextNumber = highest + 1;
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const { branch, type } = await request.json();

    if (!branch || !type) {
      return NextResponse.json({ error: 'Missing branch or type' }, { status: 400 });
    }

    if (type !== 'cash_out' && type !== 'cash_in') {
      return NextResponse.json({ error: 'Type must be cash_out or cash_in' }, { status: 400 });
    }

    const supabase = await createClient();
    const prefix = type === 'cash_out' ? 'CO' : 'CI';
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;

    let attempts = 0;
    while (attempts < 3) {
      const voucher_no = await findNextAvailableVoucher(supabase, branch, prefix, startOfYear);

      const { data: existing } = await supabase
        .from('cash_transactions')
        .select('id')
        .eq('voucher_no', voucher_no)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ voucher_no, type });
      }

      attempts += 1;
    }

    return NextResponse.json({ error: 'Unable to generate unique voucher number' }, { status: 409 });
  } catch (error) {
    console.error('Error generating voucher number:', error);
    return NextResponse.json({ error: 'Failed to generate voucher number' }, { status: 500 });
  }
}
