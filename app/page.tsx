import type { Metadata } from "next";
import { redirect } from "next/navigation"

import { getUser } from "@/lib/auth/server"

export const metadata: Metadata = {
  title: "Home",
  description: "Proultima - Project Management Platform",
};

export default async function Home() {
  const user = await getUser()
  redirect(user ? "/dashboard" : "/login")
}
