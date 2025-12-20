"use client"

import * as React from "react"
import {
  Activity,
  AudioWaveform,
  BookOpen,
  Bot,
  Home,
  ClipboardList,
  Command,
  CreditCard,
  Folder,
  BarChart,
  Weight,
  Frame,
  GalleryVerticalEnd,
  Map,
  Plug,
  FileText,
  MessageCircle,
  Package,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  Upload,
  Wrench,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { Separator } from "@radix-ui/react-separator"
import { useProjects } from "@/hooks/use-projects"
// This is sample data.
const data = {
  user: {
    name: "User",
    email: "user@proultima.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
   
    {
      title: "Projects",
      url: "/",
      icon: Folder,
    },
   
    {
      title: "Billing & Invoices",
      url: "/billing",
      icon: CreditCard,
      
    },
  
  ],
  projects: [
    {
      name: "Valley View Business Park Tilt Panels",
      url: "/projects?project=PRO-2025-001",
      icon: Folder,
    },
    {
      name: "MID-WAY SOUTH LOGISTIC CENTER, PANELS",
      url: "/projects?project=PRO-2025-002",
      icon: Folder,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Fetch real-time projects
  const { data: realProjects = [], isLoading: isLoadingProjects } = useProjects()

  // Transform real projects to NavProjects format
  const projects = React.useMemo(() => {
    if (isLoadingProjects || realProjects.length === 0) {
      // Return default projects while loading or if no projects
      return data.projects
    }

    // Map real projects to NavProjects format
    return realProjects.map((project) => {
      return {
        name: project.projectName || project.jobNumber || `Project ${project.id}`,
        url: `/projects?project=${project.id || project.jobNumber || project.projectName}`,
        icon: Folder, // Use common Folder icon for all projects
      }
    })
  }, [realProjects, isLoadingProjects])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <img
            src="/image/logo.png"
            alt="Proultima"
            className="h-12 w-12 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 object-contain shrink-0 transition-all duration-200"
          />
          <span className="group-data-[collapsible=icon]:hidden font-semibold">Proultima</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
