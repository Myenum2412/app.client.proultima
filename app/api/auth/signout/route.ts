import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create response and clear auth cookies
    const response = NextResponse.json({ ok: true });
    
    // Clear Supabase auth cookies
    response.cookies.set("sb-access-token", "", {
      maxAge: 0,
      path: "/",
    });
    response.cookies.set("sb-refresh-token", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Sign out error:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}


