import { createServerClient } from './server'
import { Submission } from '@/components/submissions-table'

export interface ServerSubmission {
  id: string
  project_id: string
  drawing_id: string | null
  submission_type: string
  work_description: string | null
  drawing_number: string | null
  sheets: string | null
  submission_date: string
  release_status: string | null
  pdf_path: string | null
  status: string | null
  evaluation_date: string | null
  submitted_by: string | null
  evaluated_by: string | null
  created_at: string
  updated_at: string
  projects?: {
    id: string
    project_name: string
    project_number: string
  } | Array<{
    id: string
    project_name: string
    project_number: string
  }>
  drawings?: {
    id: string
    dwg: string
    description: string
    pdf_path: string
  } | Array<{
    id: string
    dwg: string
    description: string
    pdf_path: string
  }>
}

/**
 * Fetch all submissions from Supabase (server-side)
 * @param status Optional status filter (APP, R&R, FFU, PENDING)
 * @returns Array of submissions or empty array on error
 */
export async function getSubmissionsServer(status?: string): Promise<ServerSubmission[]> {
  try {
    const supabase = createServerClient()

    // First, try a simple query to check if table exists and is accessible
    const { data: testData, error: testError } = await supabase
      .from('submissions')
      .select('id')
      .limit(1)

    // If table doesn't exist or has permission issues, return empty
    if (testError) {
      if (testError.code === 'PGRST116') {
        console.log('Submissions table does not exist (PGRST116), returning empty array')
        return []
      }
      // Log other errors (permissions, RLS, etc.)
      console.error('Error accessing submissions table:', {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint
      })
      return []
    }

    // Table exists and is accessible, now fetch full data
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

    // Filter by submission_type if status is provided
    if (status) {
      submissionsQuery = submissionsQuery.eq('submission_type', status)
    }

    const { data: submissionsData, error: submissionsError } = await submissionsQuery

    // Check for actual errors (table doesn't exist, permission issues, etc.)
    if (submissionsError) {
      // PGRST116 = relation does not exist
      // PGRST202 = permission denied
      // PGRST204 = schema cache miss (table might exist but not in cache yet)
      if (submissionsError.code === 'PGRST116') {
        console.log('Submissions table does not exist, returning empty array')
        return []
      }
      // Log other errors for debugging but still return empty array
      console.error('Error fetching submissions:', {
        code: submissionsError.code,
        message: submissionsError.message,
        details: submissionsError.details,
        hint: submissionsError.hint
      })
      return []
    }

    // If submissions table exists (even if empty), process the data
    if (submissionsData) {
      // If table is empty, return empty array (no error)
      if (submissionsData.length === 0) {
        console.log('Submissions table exists but is empty. Run seed data if needed.')
        return []
      }
      // If drawing_id is null but drawing_number exists, try to find the drawing in drawing_log
      const submissionsWithDrawings = await Promise.all(
        (submissionsData as any[]).map(async (submission: any) => {
          // If drawing_id is null but we have a drawing_number, try to find it
          if (!submission.drawing_id && submission.drawing_number) {
            try {
              // Try to find drawing in drawing_log first
              let drawingLog = null
              let logError = null
              
              const { data: logData, error: logErr } = await supabase
                .from('drawing_log')
                .select('id, dwg, description, pdf_path')
                .eq('project_id', submission.project_id)
                .eq('dwg', submission.drawing_number)
                .limit(1)
                .maybeSingle()
              
              if (!logErr && logData) {
                drawingLog = logData
              } else {
                // Try drawings_yet_to_release
                const { data: releaseData, error: releaseErr } = await supabase
                  .from('drawings_yet_to_release')
                  .select('id, dwg, description, pdf_path')
                  .eq('project_id', submission.project_id)
                  .eq('dwg', submission.drawing_number)
                  .limit(1)
                  .maybeSingle()
                
                if (!releaseErr && releaseData) {
                  drawingLog = releaseData
                } else {
                  // Try drawings_yet_to_return
                  const { data: returnData, error: returnErr } = await supabase
                    .from('drawings_yet_to_return')
                    .select('id, dwg, description, pdf_path')
                    .eq('project_id', submission.project_id)
                    .eq('dwg', submission.drawing_number)
                    .limit(1)
                    .maybeSingle()
                  
                  if (!returnErr && returnData) {
                    drawingLog = returnData
                  }
                }
              }

              if (drawingLog) {
                // Found matching drawing, update the submission data
                submission.drawing_id = drawingLog.id
                submission.drawings = {
                  id: drawingLog.id,
                  dwg: drawingLog.dwg,
                  description: drawingLog.description || '',
                  pdf_path: drawingLog.pdf_path || '',
                }
              }
            } catch (err) {
              // Silently continue if drawing lookup fails
              // Drawing data is optional, submission can still work without it
            }
          }
          return submission
        })
      )

      return submissionsWithDrawings as ServerSubmission[]
    }

    // If we get here, submissionsData is null/undefined (shouldn't happen with proper error handling)
    return []
  } catch (error) {
    console.error('Error in getSubmissionsServer:', error)
    return []
  }
}

/**
 * Transform server submission data to match the Submission interface format
 * This matches the camelCase format used by the API route transformation
 */
export function transformServerSubmission(submission: ServerSubmission): Submission {
  const project = Array.isArray(submission.projects) 
    ? submission.projects[0] 
    : submission.projects
  
  const drawing = Array.isArray(submission.drawings)
    ? submission.drawings[0]
    : submission.drawings

  // Extract revision from drawing number or sheets
  let sheets = submission.sheets || '—'
  if (sheets === '—' && submission.drawing_number) {
    const revisionMatch = submission.drawing_number.match(/R-(\d+)/i) || submission.drawing_number.match(/_(\d+)_/i)
    sheets = revisionMatch ? revisionMatch[1] : '—'
  }

  return {
    id: submission.id,
    proNumber: project?.project_number || '—',
    projectName: project?.project_name || '—',
    submissionType: submission.submission_type || '—',
    workDescription: submission.work_description || drawing?.description || '—',
    drawing: submission.drawing_number || drawing?.dwg || '—',
    sheets: sheets,
    submissionDate: submission.submission_date || '—',
    projectId: submission.project_id,
    releaseStatus: submission.release_status || '',
    pdfPath: submission.pdf_path || drawing?.pdf_path || '',
  }
}

