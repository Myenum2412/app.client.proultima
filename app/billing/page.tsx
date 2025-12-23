import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarUser } from "@/components/app-sidebar";
import { TopHeader } from "@/components/app/top-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth/server";
import { BillingInvoicesTable } from "@/components/billing/billing-invoices-table";
import { BillingOverview } from "@/components/billing/billing-overview";
import { QueryBoundary } from "@/components/query/query-boundary";

export const metadata: Metadata = {
  title: "Billing & Invoices",
  description: "View and manage invoices, payments, and billing information",
};

export default async function BillingPage() {
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
          section="Billing"
          page="Billing & Invoices"
          search={{ placeholder: "Search invoices...", action: "/billing", name: "q" }}
        />
        <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          <QueryBoundary
            loadingTitle="Loading billing data..."
            loadingSubtitle="Fetching invoice information"
          >
            <BillingOverview />
            <BillingInvoicesTable />
          </QueryBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


