import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Fetch system status from various sources
    const { data: projects } = await supabase
      .from('projects')
      .select('status')

    const statusCounts = {
      active: projects?.filter((p: any) => p.status === 'active').length || 0,
      pending: projects?.filter((p: any) => p.status === 'pending').length || 0,
      completed: projects?.filter((p: any) => p.status === 'completed').length || 0,
    }

    return createSuccessResponse({
      systemStatus: 'operational',
      lastUpdated: new Date().toISOString(),
      projectStatus: statusCounts,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

