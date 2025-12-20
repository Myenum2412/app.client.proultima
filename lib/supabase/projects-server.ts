import { createServerClient } from './server'

export interface ServerProject {
  id: string
  project_name: string
  project_number: string
  job_number?: string
  client_name: string
  contractor_name: string
  project_location: string
  estimated_tons: number
  detailed_tons_per_approval: number
  detailed_tons_per_latest_rev: number
  released_tons: number
  detailing_status: string
  revision_status: string
  release_status: string
  status: string
  due_date: string | null
  start_date: string | null
  actual_delivery_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Fetch all projects from Supabase (server-side)
 * @returns Array of projects or empty array on error
 */
export async function getProjectsServer(): Promise<ServerProject[]> {
  try {
    const supabase = createServerClient()
    
    // Optionally check for authenticated user
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return []
    // }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects from server:', error)
      return []
    }

    return projects || []
  } catch (error) {
    console.error('Error in getProjectsServer:', error)
    return []
  }
}

/**
 * Transform server project data to match the format expected by convertSupabaseProject
 * This matches the camelCase format used by the API route transformation
 */
export function transformServerProject(project: ServerProject) {
  return {
    id: project.id,
    projectName: project.project_name || '',
    jobNumber: project.project_number || project.job_number || '',
    projectNumber: project.project_number || '',
    clientName: project.client_name || 'PSG',
    contractorName: project.contractor_name || 'TBD',
    projectLocation: project.project_location || 'TBD',
    estimatedTons: Number(project.estimated_tons) || 0,
    detailedTonsPerApproval: Number(project.detailed_tons_per_approval) || 0,
    detailedTonsPerLatestRev: Number(project.detailed_tons_per_latest_rev) || 0,
    releasedTons: Number(project.released_tons) || 0,
    detailingStatus: project.detailing_status || 'IN PROCESS',
    revisionStatus: project.revision_status || 'IN PROCESS',
    releaseStatus: project.release_status || 'IN PROCESS',
    status: project.status || 'pending',
    dueDate: project.due_date || '',
    startDate: project.start_date || project.created_at || '',
    actualDeliveryDate: project.actual_delivery_date || null,
    description: project.description || '',
    createdAt: project.created_at || '',
    updatedAt: project.updated_at || '',
  }
}

