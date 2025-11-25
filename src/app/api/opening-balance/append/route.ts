import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { branch, amount, date, note, added_by } = await request.json();

    if (!branch || typeof amount !== 'number' || !date) {
      return NextResponse.json({ error: 'branch, amount, and date are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch existing row by branch (case-insensitive)
    const { data: existing, error: fetchError } = await supabase
      .from('branch_opening_balances')
      .select('id, opening_balance, balance_history')
      .ilike('branch', branch)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const history = Array.isArray(existing.balance_history) ? existing.balance_history : [];
    const entry = { date, amount, note, added_by };

    const { data, error } = await supabase
      .from('branch_opening_balances')
      .update({
        balance_history: [...history, entry],
        opening_balance: (existing.opening_balance || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
