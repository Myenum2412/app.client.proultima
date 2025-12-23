"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Home,
  CreditCard,
  Folder,
  MessageCircle,
  Upload,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"
import dynamic from "next/dynamic"

// Dynamically import the client component that uses queries
const AppSidebarClient = dynamic(
  () => import("./app-sidebar-client").then((mod) => ({ default: mod.AppSidebarClient })),
  { ssr: false }
)

export type SidebarUser = {
  name: string
  email: string
  avatar: string
}

// This is sample data.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
        },
        {
      title: "Projects",
      url: "/projects",
      icon: Folder,
        },
        {
      title: "Submissions",
      url: "/submissions",
      icon: Upload,
        },
        {
      title: "Billing & Invoices",
      url: "/billing",
      icon: CreditCard,
        },
        {
      title: "Chat",
      url: "/chat",
      icon: MessageCircle,
    },
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Image
            src="/image/logo.png"
            alt="Proultima"
            width={48}
            height={48}
            className="h-12 w-12 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 object-contain shrink-0 transition-all duration-200"
            priority
          />
          <span className="group-data-[collapsible=icon]:hidden font-semibold">Proultima</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <AppSidebarClient />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
