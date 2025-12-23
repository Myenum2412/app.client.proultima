import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type Payment = {
  id: string;
  amount: number;
  status: "success" | "processing" | "failed";
  email: string;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch all payments from Supabase
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows: Payment[] = (payments || []).map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status === "success" ? "success" : p.status === "pending" ? "processing" : "failed",
      email: "", // No email stored directly in payments table
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}


