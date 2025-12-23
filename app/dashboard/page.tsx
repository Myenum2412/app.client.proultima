import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar"
import type { SidebarUser } from "@/components/app-sidebar"
import { TopHeader } from "@/components/app/top-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { QueryBoundary } from "@/components/query/query-boundary"
import { requireUser } from "@/lib/auth/server"
import { DashboardClient } from "./dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View project metrics, statistics, and schedule meetings",
};

export default async function Page() {
  const user = await requireUser()

  const displayName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (user.email ? user.email.split("@")[0] : "User")

  const avatar =
    (typeof user.user_metadata?.avatar_url === "string" &&
      user.user_metadata.avatar_url) ||
    "/image/profile.jpg"

  const sidebarUser: SidebarUser = {
    name: displayName,
    email: user.email ?? "",
    avatar,
  }

  const initialMe = {
    id: user.id,
    email: user.email ?? null,
    user_metadata: user.user_metadata ?? {},
  }

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        <TopHeader
          section="Dashboard"
          page="Overview"
          search={{ placeholder: "Search...", action: "/dashboard", name: "q" }}
        />
        <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          <QueryBoundary
            loadingTitle="Loading dashboard..."
            loadingSubtitle="Validating your session and fetching your data"
          >
            <DashboardClient initialMe={initialMe} />
          </QueryBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
