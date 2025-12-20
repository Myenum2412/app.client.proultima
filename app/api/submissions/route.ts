import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // First, try to fetch from submissions table (new approach)
    let submissionsQuery = supabase
      .from('submissions')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          project_number,
          job_number
        ),
        drawings:drawing_id (
          id,
          dwg,
          description,
          pdf_path
        )
      `)
      .order('submission_date', { ascending: false })

    // Filter by submission_type if status is provided (maps to submission_type in submissions table)
    if (status) {
      submissionsQuery = submissionsQuery.eq('submission_type', status)
    }

    const { data: submissionsData, error: submissionsError } = await submissionsQuery

    // If submissions table exists and has data, use it
    if (!submissionsError && submissionsData && submissionsData.length > 0) {
      const submissions = submissionsData.map((submission: any) => {
        const project = Array.isArray(submission.projects) 
          ? submission.projects[0] 
          : submission.projects || {}
        
        const drawing = Array.isArray(submission.drawings)
          ? submission.drawings[0]
          : submission.drawings || {}

        return {
          id: submission.id,
          proNumber: project.project_number || project.job_number || '—',
          projectName: project.project_name || '—',
          submissionType: submission.submission_type || '—',
          workDescription: submission.work_description || drawing.description || '—',
          drawing: submission.drawing_number || drawing.dwg || '—',
          sheets: submission.sheets || '—',
          submissionDate: submission.submission_date || '—',
          projectId: submission.project_id,
          releaseStatus: submission.release_status || '',
          pdfPath: submission.pdf_path || drawing.pdf_path || '',
          status: submission.status,
          evaluationDate: submission.evaluation_date,
          submittedBy: submission.submitted_by,
          evaluatedBy: submission.evaluated_by,
        }
      })

      return createSuccessResponse(submissions)
    }

    // Fallback to drawings table for backward compatibility
    // This ensures the API still works if submissions table doesn't exist yet
    console.log('Submissions table not found or empty, falling back to drawings table')
    
    let drawingsQuery = supabase
      .from('drawings')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          project_number,
          job_number
        )
      `)
      .in('status', ['APP', 'R&R', 'FFU', 'PENDING'])
      .order('latest_submitted_date', { ascending: false })

    if (status) {
      drawingsQuery = drawingsQuery.eq('status', status)
    }

    const { data: drawings, error: drawingsError } = await drawingsQuery

    if (drawingsError) {
      console.error('Error fetching drawings for submissions:', drawingsError)
      return createSuccessResponse([])
    }

    // Transform drawings into submission format
    const submissions = (drawings || []).map((drawing: any) => {
      const project = Array.isArray(drawing.projects) ? drawing.projects[0] : drawing.projects || {}
      
      // Extract revision from drawing number (e.g., "R-1" from "U2524_R-1_FFU")
      const revisionMatch = drawing.dwg?.match(/R-(\d+)/i) || drawing.dwg?.match(/_(\d+)_/i)
      const revision = revisionMatch ? revisionMatch[1] : '—'

      return {
        id: drawing.id,
        proNumber: project.project_number || project.job_number || project.jobNumber || '—',
        projectName: project.project_name || project.projectName || '—',
        submissionType: drawing.status || '—',
        workDescription: drawing.description || '—',
        drawing: drawing.dwg || '—',
        sheets: revision,
        submissionDate: drawing.latest_submitted_date || drawing.latestSubmittedDate || '—',
        projectId: drawing.project_id,
        releaseStatus: drawing.release_status || drawing.releaseStatus || '',
        pdfPath: drawing.pdf_path || drawing.pdfPath || '',
      }
    })

    return createSuccessResponse(submissions)
  } catch (error) {
    return handleApiError(error)
  }
}

