import type { Metadata } from "next";
import { GalleryVerticalEnd } from "lucide-react"
import { redirect } from "next/navigation"
import Image from "next/image"

import { LoginForm } from "@/components/login-form"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Proultima account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  async function signIn(formData: FormData) {
    "use server"
    const supabase = await createSupabaseServerClient()

    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const redirectToRaw = String(formData.get("redirectTo") ?? "/dashboard")
    const redirectTo = redirectToRaw.startsWith("/") ? redirectToRaw : "/dashboard"

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    redirect(redirectTo)
  }

  const errorParam = sp.error
  const error =
    typeof errorParam === "string" ? decodeURIComponent(errorParam) : undefined

  const redirectedFromParam = sp.redirectedFrom
  const redirectTo =
    typeof redirectedFromParam === "string" ? redirectedFromParam : "/dashboard"

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/login" className="flex items-center gap-2 font-medium">
          <div className="text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Image src="/image/logo.png" alt="Proultima" width={30} height={30} />
            </div>
            Proultima.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm action={signIn} error={error} redirectTo={redirectTo} />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/image/login.jpg"
          alt="Image"
          fill
          sizes="50vw"
          className="object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
