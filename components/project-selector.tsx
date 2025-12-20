"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useProjects } from "@/hooks/use-projects"
import { cn } from "@/lib/utils"

interface ProjectSelectorProps {
  selectedProjectId: string | null
  onProjectSelect: (projectId: string | null) => void
}

export function ProjectSelector({ selectedProjectId, onProjectSelect }: ProjectSelectorProps) {
  const [mounted, setMounted] = useState(false)
  const { data: projects = [], isLoading } = useProjects()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="px-4 lg:px-6 py-6 relative bg-gradient-to-br from-green-500 to-green-600 rounded-lg my-4 mx-4">
        <div className="flex items-center justify-center min-h-[150px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="px-4 lg:px-6 py-6 relative rounded-lg my-4 mx-4"
      style={{
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Wave-like background patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,100 Q300,50 600,100 T1200,100 L1200,200 L0,200 Z"
              fill="rgba(255,255,255,0.1)"
            />
            <path
              d="M0,120 Q400,70 800,120 T1200,120 L1200,200 L0,200 Z"
              fill="rgba(255,255,255,0.05)"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10">
        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-6">Project Selector</h1>

        {/* Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const isSelected = selectedProjectId === project.id
            return (
              <Card
                key={project.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105",
                  isSelected
                    ? "bg-slate-900 dark:bg-slate-950 border-slate-800"
                    : "bg-white border-gray-200"
                )}
                onClick={() => onProjectSelect(isSelected ? null : (project.id || null))}
              >
                <CardContent className="p-4">
                  <div
                    className={cn(
                      "font-bold text-lg mb-2",
                      isSelected ? "text-white" : "text-gray-900"
                    )}
                  >
                    {project.jobNumber || project.projectName || "N/A"}
                  </div>
                  <div
                    className={cn(
                      "text-sm leading-snug",
                      isSelected ? "text-white/80" : "text-gray-700"
                    )}
                  >
                    {project.projectName || "No description available"}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/80">No projects available</p>
          </div>
        )}
      </div>
    </div>
  )
}

