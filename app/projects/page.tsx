import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import type { SidebarUser } from "@/components/app-sidebar";
import { TopHeader } from "@/components/app/top-header";
import { ProjectSections } from "@/components/projects/project-sections";
import {
  ProjectOverview,
  type ProjectOverviewData,
} from "@/components/projects/project-overview";
import { ProjectMaterialListManagement } from "@/components/projects/material-list-management";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth/server";
import Image from "next/image";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjects, getProjectById, getAllDrawingsByProject } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Projects",
  description: "View and manage all your construction projects, drawings, and project details",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Fetch projects from Supabase
  const projectsData = await getProjects(supabase);
  
  const projects = projectsData.map((p) => ({
    id: p.id,
    jobNumber: p.project_number,
    name: p.project_name,
  }));

  // Get selected project ID from URL params, default to first project
  const selectedProjectId = params.project || (projects[0]?.id || "");
  
  // Find the selected project
  const selectedProject = await getProjectById(supabase, selectedProjectId);
  
  if (!selectedProject) {
    // Fallback to first project if not found
    const firstProject = projectsData[0];
    if (!firstProject) {
      throw new Error("No projects found");
    }
  }

  const project = selectedProject || projectsData[0];

  // Calculate metrics from drawings data
  const drawings = await getAllDrawingsByProject(supabase, project.id);

  const totals = drawings.reduce(
    (acc: { total: number; released: number }, r) => {
      acc.total += r.total_weight || 0;
      const rs = String(r.release_status ?? "").toLowerCase();
      if (rs.includes("released")) acc.released += r.total_weight || 0;
      return acc;
    },
    { total: 0, released: 0 }
  );

  const overview: ProjectOverviewData = {
    projectName: project.project_name,
    jobNumber: project.project_number,
    fabricatorName: null,
    contractorName: project.contractor_name ?? null,
    projectLocation: null,
    estimatedTons: project.estimated_tons ?? null,
    approvalTons: totals.total,
    latestRevTons: totals.total,
    releasedTons: totals.released,
    detailingStatus: project.detailing_status ?? null,
    revisionStatus: project.revision_status ?? null,
    releaseStatus: project.release_status ?? null,
  };

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
          section="Projects"
          page="All Projects"
          search={{ placeholder: "Search projects...", action: "/projects", name: "q" }}
        />
        <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          <Card className="w-full shadow-lg overflow-hidden">
            <CardHeader className="relative overflow-hidden">
              <Image
                src="/image/dashboard-bg.png"
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                priority
                className="object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/70 to-white/20" />
              <div className="relative">
                <h1 className="text-xl font-semibold">Project Drawings Overview</h1>
                <p className="text-sm text-muted-foreground">
                  Select a project to view drawings, submissions, invoices, logs, and change orders
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <ProjectsPageClient 
                projects={projects} 
                selectedProjectId={selectedProjectId}
              />
            </CardContent>
          </Card>

          {/* Show selected project details */}
          <Card className="w-full shadow-lg overflow-hidden">
            <CardHeader className="relative overflow-hidden">
              <Image
                src="/image/dashboard-bg.png"
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                priority
                className="object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-linear-to-r from-white/90 via-white/70 to-white/20" />
            </CardHeader>
            <CardContent className="py-6">
              <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                <ProjectOverview data={overview} />
              </div>
            </CardContent>
          </Card>

          <ProjectSections projectId={selectedProjectId} />
          <ProjectMaterialListManagement projectId={selectedProjectId} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


