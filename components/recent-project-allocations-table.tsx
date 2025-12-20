"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Plus, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { useProjects } from "@/hooks/use-projects"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import Link from "next/link"
import { useState } from "react"
import { ProjectAllocationForm } from "@/components/project-allocation-form"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  detailing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  released: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  revision: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
}

export function RecentProjectAllocationsTable() {
  const { data: projects = [], isLoading, error } = useProjects()
  const [isAllocationFormOpen, setIsAllocationFormOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  // Get the 5 most recently allocated projects, sorted by allocation date (most recent first)
  const recentProjects = projects
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 5)

  const handleView = (projectId: string) => {
    // Navigate to project detail view
    window.location.href = `/projects?project=${projectId}`
  }

  const handleEdit = (projectId: string) => {
    setSelectedProjectId(projectId)
    // Navigate to edit page or open edit dialog
    // For now, navigate to dashboard with project filter
    window.location.href = `/dashboard?project=${projectId}&action=edit`
  }

  const handleAllocate = () => {
    setIsAllocationFormOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Allocated Projects</CardTitle>
          <CardDescription>Latest project allocations sorted by allocation date</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recently Allocated Projects</CardTitle>
          <CardDescription>Latest project allocations sorted by allocation date</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorState message="Failed to load projects" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recently Allocated Projects</CardTitle>
              <CardDescription>Latest project allocations sorted by allocation date (most recent first)</CardDescription>
            </div>
            <Button onClick={handleAllocate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Allocate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No projects allocated yet</p>
              <Button onClick={handleAllocate} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Allocate New Project
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Project Number</TableHead>
                    <TableHead>Allocation Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProjects.map((project) => {
                    const projectNumber = (project as any).jobNumber || (project as any).projectNumber || project.projectNumber || '-'
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.projectName}</TableCell>
                        <TableCell>{projectNumber}</TableCell>
                        <TableCell>
                          {project.createdAt
                            ? format(new Date(project.createdAt), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[project.status] || statusColors.pending}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(project.id!)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(project.id!)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAllocate}
                              title="Allocate"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectAllocationForm
        open={isAllocationFormOpen}
        onOpenChange={setIsAllocationFormOpen}
      />
    </>
  )
}

