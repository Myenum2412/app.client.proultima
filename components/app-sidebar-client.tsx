"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api/fetch-json"
import { queryKeys } from "@/lib/query/keys"
import type { ProjectsListItem } from "@/app/api/projects/route"
import { NavProjects } from "@/components/nav-projects"

export function AppSidebarClient() {
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => fetchJson<ProjectsListItem[]>("/api/projects"),
    staleTime: 60_000,
    meta: { errorMessage: "Failed to load projects." },
  })

  return (
    <NavProjects
      projects={projects}
      isLoading={isProjectsLoading}
      isError={isProjectsError}
    />
  )
}

