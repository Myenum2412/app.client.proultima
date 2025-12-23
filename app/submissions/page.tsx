import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarUser } from "@/components/app-sidebar";
import { TopHeader } from "@/components/app/top-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth/server";
import { SubmissionsTable } from "@/components/submissions/submissions-table";
import { QueryBoundary } from "@/components/query/query-boundary";

export const metadata: Metadata = {
  title: "Submissions",
  description: "View and manage RFI submissions and submittals",
};

export default async function SubmissionsPage() {
  const user = await requireUser();

  const displayName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (user.email ? user.email.split("@")[0] : "User");

  const avatar =
    (typeof user.user_metadata?.avatar_url === "string" &&
      user.user_metadata.avatar_url) ||
    "/image/profile.jpg";

  const sidebarUser: SidebarUser = {
    name: displayName,
    email: user.email ?? "",
    avatar,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        <TopHeader
          section="Submissions"
          page="All Submissions"
          search={{ placeholder: "Search submissions...", action: "/submissions", name: "q" }}
        />
        <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          <QueryBoundary
            loadingTitle="Loading submissions..."
            loadingSubtitle="Fetching submission data"
          >
            <SubmissionsTable />
          </QueryBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


