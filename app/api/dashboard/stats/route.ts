import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

interface DashboardStats {
  totalActiveProjects: {
    value: number
    label: string
  }
  detailingInProcess: {
    value: number
    label: string
  }
  releasedJobs: {
    value: number
    label: string
  }
  revisionInProcess: {
    value: number
    label: string
  }
  yetToBeDetailed: {
    value: number
    label: string
  }
  jobAvailability: {
    label: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Fetch projects from Supabase
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')

    if (error) {
      console.error('Error fetching projects:', error)
      // Return default stats on error
      return createSuccessResponse<DashboardStats>({
        totalActiveProjects: { value: 0, label: 'Total Active Projects' },
        detailingInProcess: { value: 0, label: 'Detailing in Process' },
        releasedJobs: { value: 0, label: 'Released Jobs' },
        revisionInProcess: { value: 0, label: 'Revision in Process' },
        yetToBeDetailed: { value: 0, label: 'Yet to be Detailed Tons' },
        jobAvailability: { label: 'Job Availability' },
      })
    }

    // Calculate stats from projects
    const totalActiveProjects = projects?.length || 0
    const detailingInProcess = projects?.filter(p => p.status === 'detailing').length || 0
    const releasedJobs = projects?.filter(p => p.status === 'released').length || 0
    const revisionInProcess = projects?.filter(p => p.status === 'revision').length || 0
    const yetToBeDetailed = projects?.filter(p => p.status === 'pending').length || 0

    const stats: DashboardStats = {
      totalActiveProjects: {
        value: totalActiveProjects,
        label: 'Total Active Projects',
      },
      detailingInProcess: {
        value: detailingInProcess,
        label: 'Detailing in Process',
      },
      releasedJobs: {
        value: releasedJobs,
        label: 'Released Jobs',
      },
      revisionInProcess: {
        value: revisionInProcess,
        label: 'Revision in Process',
      },
      yetToBeDetailed: {
        value: yetToBeDetailed,
        label: 'Yet to be Detailed Tons',
      },
      jobAvailability: {
        label: 'Job Availability',
      },
    }

    return createSuccessResponse(stats)
  } catch (error) {
    return handleApiError(error)
  }
}

