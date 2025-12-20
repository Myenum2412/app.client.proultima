"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ChangeOrdersTable } from "@/components/change-orders-table";
import { useProjects } from "@/hooks/use-projects";
import { LoadingState } from "@/components/ui/loading-state";
import { Project } from "@/components/projects/types";
import { convertSupabaseProject } from "@/components/projects/utils";
import { ProjectSelector } from "@/components/projects/project-selector";
import { ProjectOverview } from "@/components/projects/project-overview";
import { ProjectDrawingsSection } from "@/components/projects/project-drawings-section";
import { motion } from "motion/react";

function ProjectContent({
  selectedProject: propSelectedProject,
  filter,
  initialProjects,
}: {
  selectedProject?: Project;
  filter?: string;
  initialProjects?: any[];
}) {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project");

  // Fetch projects from Supabase (client-side fallback if initialProjects not provided)
  const { data: supabaseProjects = [], isLoading, error } = useProjects();

  // State for projects list
  const [projects, setProjects] = useState<Project[]>([]);
  // State for currently selected project
  const [currentProject, setCurrentProject] = useState<Project | null>(
    propSelectedProject || null
  );

  // Track manual selection to prevent useEffect from overriding
  const manualSelectionRef = useRef<boolean>(false);
  // Track if we've initialized the first project selection
  const hasInitializedRef = useRef<boolean>(false);
  // Track current project ID to avoid including currentProject in dependencies
  const currentProjectIdRef = useRef<string | number | null>(currentProject?.id ?? null);
  
  // Update ref when currentProject changes
  useEffect(() => {
    currentProjectIdRef.current = currentProject?.id ?? null;
  }, [currentProject?.id]);

  // Update projects when initialProjects (SSR data) is provided
  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) {
      const convertedInitialProjects = initialProjects.map(
        convertSupabaseProject
      );
      setProjects(convertedInitialProjects);
      console.log("Total projects loaded (SSR):", convertedInitialProjects.length);
    }
  }, [initialProjects]);

  // Update projects when Supabase data loads (client-side fallback)
  useEffect(() => {
    if (!initialProjects && supabaseProjects.length > 0) {
      const convertedSupabaseProjects = supabaseProjects.map(
        convertSupabaseProject
      );
      setProjects(convertedSupabaseProjects);
      console.log("Total projects loaded (client):", convertedSupabaseProjects.length);
    }
  }, [supabaseProjects, initialProjects]);

  // Handle project selection logic (only for URL, prop, filter, or initial load)
  useEffect(() => {
    // Skip if user manually selected a project
    if (manualSelectionRef.current) {
      return;
    }

    // Priority 1: URL parameter (from file management card click) - highest priority
    if (projectIdFromUrl && projects.length > 0) {
      const projectFromUrl = projects.find((p) => {
        if (p.projectNumber === projectIdFromUrl) return true;
        if (p.id.toString() === projectIdFromUrl) return true;
        if (
          typeof p.id === "number" &&
          !isNaN(Number(projectIdFromUrl)) &&
          p.id === Number(projectIdFromUrl)
        )
          return true;
        if (typeof p.id === "string" && p.id === projectIdFromUrl) return true;
        if (p.supabaseId && p.supabaseId === projectIdFromUrl) return true;
        if (p.projectName === projectIdFromUrl) return true;
        return false;
      });

      if (projectFromUrl) {
        const currentId = currentProjectIdRef.current;
        if (projectFromUrl.id !== currentId) {
          console.log(
            "Found project from URL:",
            projectFromUrl.projectNumber,
            projectFromUrl.projectName
          );
          currentProjectIdRef.current = projectFromUrl.id;
          setCurrentProject(projectFromUrl);
          hasInitializedRef.current = true;
        }
        return;
      }
    }

    // Priority 2: Prop selected project
    if (propSelectedProject) {
      const currentId = currentProjectIdRef.current;
      if (propSelectedProject.id !== currentId) {
        currentProjectIdRef.current = propSelectedProject.id;
        setCurrentProject(propSelectedProject);
        hasInitializedRef.current = true;
      }
      return;
    }

    // Priority 3: Filter
    if (filter && projects.length > 0) {
      const filteredProject = projects.find((p) => {
        if (filter === "active") return p.completionPercentage < 100;
        if (filter === "detailing")
          return (
            p.status.detailing.includes("IN PROCESS") ||
            p.status.detailing.includes("COMPLETED")
          );
        if (filter === "revision")
          return p.status.revision.includes("IN PROCESS");
        if (filter === "release")
          return (
            p.status.release.includes("IN PROCESS") ||
            p.status.release.includes("PENDING")
          );
        return false;
      });
      
      if (filteredProject) {
        const currentId = currentProjectIdRef.current;
        if (filteredProject.id !== currentId) {
          currentProjectIdRef.current = filteredProject.id;
          setCurrentProject(filteredProject);
          hasInitializedRef.current = true;
        }
      } else if (projects.length > 0) {
        // If filter doesn't match, select first project
        const currentId = currentProjectIdRef.current;
        if (projects[0].id !== currentId) {
          currentProjectIdRef.current = projects[0].id;
          setCurrentProject(projects[0]);
          hasInitializedRef.current = true;
        }
      }
      return;
    }

    // Priority 4: Auto-select first project on initial load only
    if (!hasInitializedRef.current && projects.length > 0 && currentProjectIdRef.current === null) {
      // Try to find "Valley View Business Park Tilt Panels" first, otherwise use first project
      const valleyViewProject = projects.find(
        (p) =>
          p.projectName === "Valley View Business Park Tilt Panels" ||
          p.projectNumber === "PRO-2025-001"
      );
      const projectToSelect = valleyViewProject || projects[0];
      currentProjectIdRef.current = projectToSelect.id;
      setCurrentProject(projectToSelect);
      hasInitializedRef.current = true;
      console.log("Auto-selected initial project:", projectToSelect.projectNumber);
    }
  }, [propSelectedProject, filter, projectIdFromUrl, projects]);

  // Handle manual project selection (user clicks a card)
  const handleProjectSelect = (project: Project) => {
    console.log("Manual project selection:", project.projectNumber, project.projectName);
    // Set flag to prevent useEffect from overriding
    manualSelectionRef.current = true;
    // Update ref and state immediately
    currentProjectIdRef.current = project.id;
    setCurrentProject(project);
    
    // Reset the flag after a brief moment to allow future useEffect runs
    setTimeout(() => {
      manualSelectionRef.current = false;
    }, 100);
  };

  // Show loading state while fetching from Supabase (only on initial load and if no SSR data)
  if (!initialProjects && isLoading && projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <LoadingState message="Loading projects from database..." />
      </motion.div>
    );
  }

  // Show error state if there's an error
  if (error) {
    console.error("Error loading projects from Supabase:", error);
  }

  // Show message if no project is selected
  if (!currentProject) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center py-8 text-gray-500"
      >
        {projects.length === 0 
          ? "Loading project details..." 
          : "Please select a project"}
      </motion.div>
    );
  }

  // Check if project was selected from file management card (via URL)
  const isProjectSelectedFromCard = projectIdFromUrl !== null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex-1 overflow-y-auto p-4 lg:p-6 my-4"
    >
      <div className="space-y-6">
        {/* Project Selector - Only show if no project selected from file management card */}
        {!isProjectSelectedFromCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ProjectSelector
              projects={projects}
              currentProject={currentProject}
              onProjectSelect={handleProjectSelect}
            />
          </motion.div>
        )}

        {/* Selected Project Overview */}
        <ProjectOverview project={currentProject} />

        {/* Drawings Section */}
        <ProjectDrawingsSection project={currentProject} />

        {/* Change Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="rounded-lg">
            <CardContent className="pt-6 p-4">
              <div className="w-full">
                <ChangeOrdersTable
                  changeOrders={currentProject.changeOrders}
                  projectNumber={currentProject.projectNumber}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.main>
  );
}

export default function Projects({
  selectedProject: propSelectedProject,
  filter,
  initialProjects,
}: {
  selectedProject?: Project;
  filter?: string;
  initialProjects?: any[];
}) {
  return (
    <>
      <ProjectContent 
        selectedProject={propSelectedProject} 
        filter={filter}
        initialProjects={initialProjects}
      />
    </>
  );
}
