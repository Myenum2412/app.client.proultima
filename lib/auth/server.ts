import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function requireUser(options?: { redirectTo?: string }) {
  const user = await getUser();
  if (!user) {
    redirect(options?.redirectTo ?? "/login");
  }
  return user;
}


