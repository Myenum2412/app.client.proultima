import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SectionKey =
  | "drawings_yet_to_return"
  | "drawings_yet_to_release"
  | "drawing_log"
  | "invoice_history"
  | "upcoming_submissions"
  | "change_orders";

function isSectionKey(value: string | null): value is SectionKey {
  return (
    value === "drawings_yet_to_return" ||
    value === "drawings_yet_to_release" ||
    value === "drawing_log" ||
    value === "invoice_history" ||
    value === "upcoming_submissions" ||
    value === "change_orders"
  );
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");
  const projectId = searchParams.get("projectId");

  if (!isSectionKey(section)) {
    return NextResponse.json(
      { message: "Invalid section" },
      { status: 400 }
    );
  }

  if (!projectId) {
    return NextResponse.json(
      { message: "Missing projectId" },
      { status: 400 }
    );
  }

  // Back-compat route: delegates to the same DB shape as /api/projects/[projectId]/sections
  // (kept to avoid breaking older clients)
  const url = new URL(request.url);
  url.pathname = `/api/projects/${encodeURIComponent(projectId)}/sections`;
  return fetch(url.toString(), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
}


