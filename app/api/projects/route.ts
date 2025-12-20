import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (projectId) {
      // Fetch single project by ID
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) {
        console.error('Error fetching project:', error)
        return createSuccessResponse(null)
      }

      // Transform the data to match our interface
      const transformedProject = project ? {
        id: project.id,
        projectName: project.project_name || project.projectName || '',
        jobNumber: project.project_number || project.jobNumber || '',
        clientName: project.client_name || project.clientName || '',
        contractorName: project.contractor_name || project.contractorName || '',
        projectLocation: project.project_location || project.projectLocation || '',
        estimatedTons: project.estimated_tons || project.estimatedTons || 0,
        detailedTonsPerApproval: project.detailed_tons_per_approval || project.detailedTonsPerApproval || 0,
        detailedTonsPerApprovalPercent: project.detailed_tons_per_approval_percent || project.detailedTonsPerApprovalPercent || 0,
        detailedTonsPerLatestRev: project.detailed_tons_per_latest_rev || project.detailedTonsPerLatestRev || 0,
        releasedTons: project.released_tons || project.releasedTons || 0,
        releasedTonsPercent: project.released_tons_percent || project.releasedTonsPercent || 0,
        detailingStatus: project.detailing_status || project.detailingStatus || 'IN PROCESS',
        revisionStatus: project.revision_status || project.revisionStatus || 'IN PROCESS',
        releaseStatus: project.release_status || project.releaseStatus || 'IN PROCESS',
        status: project.status || 'pending',
        dueDate: project.due_date || project.dueDate || '',
        description: project.description || '',
        createdAt: project.created_at || project.createdAt || '',
        updatedAt: project.updated_at || project.updatedAt || '',
      } : null

      return createSuccessResponse(transformedProject)
    }

    // Fetch all projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return createSuccessResponse([])
    }

    // Transform the data to match our interface
    const transformedProjects = (projects || []).map((project: any) => ({
      id: project.id,
      projectName: project.project_name || project.projectName || '',
      jobNumber: project.project_number || project.jobNumber || '',
      clientName: project.client_name || project.clientName || '',
      contractorName: project.contractor_name || project.contractorName || '',
      projectLocation: project.project_location || project.projectLocation || '',
      estimatedTons: project.estimated_tons || project.estimatedTons || 0,
      detailedTonsPerApproval: project.detailed_tons_per_approval || project.detailedTonsPerApproval || 0,
      detailedTonsPerApprovalPercent: project.detailed_tons_per_approval_percent || project.detailedTonsPerApprovalPercent || 0,
      detailedTonsPerLatestRev: project.detailed_tons_per_latest_rev || project.detailedTonsPerLatestRev || 0,
      releasedTons: project.released_tons || project.releasedTons || 0,
      releasedTonsPercent: project.released_tons_percent || project.releasedTonsPercent || 0,
      detailingStatus: project.detailing_status || project.detailingStatus || 'IN PROCESS',
      revisionStatus: project.revision_status || project.revisionStatus || 'IN PROCESS',
      releaseStatus: project.release_status || project.releaseStatus || 'IN PROCESS',
      status: project.status || 'pending',
      dueDate: project.due_date || project.dueDate || '',
      description: project.description || '',
      createdAt: project.created_at || project.createdAt || '',
      updatedAt: project.updated_at || project.updatedAt || '',
    }))

    return createSuccessResponse(transformedProjects)
  } catch (error) {
    return handleApiError(error)
  }
}

