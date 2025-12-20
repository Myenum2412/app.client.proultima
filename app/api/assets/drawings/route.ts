import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request)

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const type = searchParams.get('type') // 'yet-to-return', 'yet-to-release', 'log'

    // Determine which table to query based on type
    let tableName: string
    if (type === 'yet-to-return') {
      tableName = 'drawings_yet_to_return'
    } else if (type === 'yet-to-release') {
      tableName = 'drawings_yet_to_release'
    } else if (type === 'log') {
      tableName = 'drawing_log'
    } else {
      // Default to drawing_log if no type specified
      tableName = 'drawing_log'
    }

    let query = supabase.from(tableName).select('*')

    // If projectId is provided and is a valid UUID, filter by project_id
    if (projectId) {
      // Check if projectId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(projectId)) {
        // Valid UUID - filter by project_id only
        query = query.eq('project_id', projectId)
        console.log(`Filtering ${tableName} by project_id:`, projectId)
      } else {
        console.log(`Invalid UUID format for projectId: ${projectId}, showing all drawings`)
      }
    } else {
      console.log(`No projectId provided, showing all drawings from ${tableName}`)
    }

    const { data: drawings, error } = await query.order('latest_submitted_date', { ascending: false })

    if (error) {
      console.error(`Error fetching drawings from ${tableName}:`, error)
      console.error('Query details:', { 
        tableName, 
        projectId, 
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint
      })
      return createSuccessResponse([])
    }

    console.log(`Fetched ${drawings?.length || 0} drawings from ${tableName}`, { 
      projectId, 
      type,
      isUuid: projectId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId) : false,
      hasProjectId: !!projectId
    })

    // Transform the data to match our interface
    const transformedDrawings = (drawings || []).map((drawing: any) => ({
      dwg: drawing.dwg || drawing.drawing_number || '',
      status: drawing.status || '',
      description: drawing.description || '',
      releaseStatus: drawing.release_status || drawing.releaseStatus || '',
      latestSubmittedDate: drawing.latest_submitted_date || drawing.latestSubmittedDate || '',
      weeksSinceSent: drawing.weeks_since_sent || drawing.weeksSinceSent || '',
      totalWeight: drawing.total_weight || drawing.totalWeight || 0,
      pdfPath: drawing.pdf_path || drawing.pdfPath || '',
    }))

    return createSuccessResponse(transformedDrawings)
  } catch (error) {
    return handleApiError(error)
  }
}

