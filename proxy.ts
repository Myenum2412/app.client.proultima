import { NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

export async function proxy(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // Refresh the session cookies if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/") ||
    pathname === "/submissions" ||
    pathname.startsWith("/submissions/") ||
    pathname === "/billing" ||
    pathname.startsWith("/billing/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname === "/upload-demo" ||
    pathname.startsWith("/upload-demo/");
  const isAuthPage = pathname === "/login";

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";

    const redirectResponse = NextResponse.redirect(redirectUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


