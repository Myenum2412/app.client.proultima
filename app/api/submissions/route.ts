import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // First, try to fetch from submissions table (new approach)
    // Note: We don't join drawings table because there's no foreign key relationship
    // We'll look up drawings manually if needed
    let submissionsQuery = supabase
      .from('submissions')
      .select(`
        *,
        projects:project_id (
          id,
          project_name,
          project_number
        )
      `)
      .order('submission_date', { ascending: false })

    // Filter by submission_type if status is provided (maps to submission_type in submissions table)
    if (status) {
      submissionsQuery = submissionsQuery.eq('submission_type', status)
    }

    const { data: submissionsData, error: submissionsError } = await submissionsQuery

    // Check for actual errors
    if (submissionsError) {
      // PGRST116 = relation does not exist
      // PGRST202 = permission denied
      // PGRST204 = schema cache miss (table might exist but not in cache yet)
      if (submissionsError.code === 'PGRST116') {
        console.log('Submissions table does not exist')
        return createSuccessResponse([])
      }
      // Log other errors for debugging but still return empty array
      console.error('Error fetching submissions:', {
        code: submissionsError.code,
        message: submissionsError.message,
        details: submissionsError.details,
        hint: submissionsError.hint
      })
      return createSuccessResponse([])
    }

    // If submissions table exists (even if empty), process the data
    if (submissionsData) {
      // If table is empty, return empty array (no error)
      if (submissionsData.length === 0) {
        console.log('Submissions table exists but is empty. Run seed data if needed.')
        return createSuccessResponse([])
      }
      const submissions = submissionsData.map((submission: any) => {
        const project = Array.isArray(submission.projects) 
          ? submission.projects[0] 
          : submission.projects || {}

        return {
          id: submission.id,
          proNumber: project.project_number || '—',
          projectName: project.project_name || '—',
          submissionType: submission.submission_type || '—',
          workDescription: submission.work_description || '—',
          drawing: submission.drawing_number || '—',
          sheets: submission.sheets || '—',
          submissionDate: submission.submission_date || '—',
          projectId: submission.project_id,
          releaseStatus: submission.release_status || '',
          pdfPath: submission.pdf_path || '',
          status: submission.status,
          evaluationDate: submission.evaluation_date,
          submittedBy: submission.submitted_by,
          evaluatedBy: submission.evaluated_by,
        }
      })

      return createSuccessResponse(submissions)
    }

    // If we get here, submissionsData is null/undefined (shouldn't happen with proper error handling)
    return createSuccessResponse([])
  } catch (error) {
    return handleApiError(error)
  }
}

