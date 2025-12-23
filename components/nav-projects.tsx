"use client"

import { Folder, MoreHorizontal } from "lucide-react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
  isLoading,
  isError,
}: {
  projects: {
    id: string
    jobNumber: string
    name: string
  }[]
  isLoading?: boolean
  isError?: boolean
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading ? (
          <>
            {[0, 1, 2].map((i) => (
              <SidebarMenuItem key={`sk_${i}`}>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </SidebarMenuItem>
            ))}
          </>
        ) : isError ? (
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <span>Failed to load projects</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : projects.length ? (
          projects.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild tooltip={item.jobNumber || item.name}>
                <Link href={`/projects/${item.id}`}>
                  <Folder />
                  <span className="truncate">
                    {item.jobNumber ? `${item.jobNumber} — ${item.name}` : item.name}
                  </span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal className="size-4 text-muted-foreground" />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${item.id}`}>View Project</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <span>Actions (coming soon)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <span>No projects yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
