/**
 * Reusable Supabase Query Functions
 * Provides type-safe database operations
 */

// @ts-nocheck - Temporary bypass for Supabase type generation issues
import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Project, DrawingLog, DrawingYetToRelease, DrawingYetToReturn, Invoice, Submission, ProjectInsert, ProjectUpdate } from '@/lib/database.types'

type SupabaseClientType = SupabaseClient<Database>

// ============================================================================
// Projects Queries
// ============================================================================

export async function getProjects(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('project_number', { ascending: true })

  if (error) throw error
  return data as Project[]
}

export async function getProjectByNumber(supabase: SupabaseClientType, projectNumber: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('project_number', projectNumber)
    .single()

  if (error) throw error
  return data as Project
}

export async function getProjectById(supabase: SupabaseClientType, projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data as Project
}

export async function createProject(supabase: SupabaseClientType, project: ProjectInsert) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project as any)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

export async function updateProject(supabase: SupabaseClientType, id: string, updates: ProjectUpdate) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

export async function deleteProject(supabase: SupabaseClientType, id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// Drawing Log Queries
// ============================================================================

export async function getDrawingLogByProject(supabase: SupabaseClientType, projectId: string) {
  const { data, error } = await supabase
    .from('drawing_log')
    .select('*')
    .eq('project_id', projectId)
    .order('dwg', { ascending: true })

  if (error) throw error
  return data as DrawingLog[]
}

export async function getAllDrawingLogs(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('drawing_log')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DrawingLog[]
}

// ============================================================================
// Drawings Yet to Release Queries
// ============================================================================

export async function getDrawingsYetToReleaseByProject(supabase: SupabaseClientType, projectId: string) {
  const { data, error } = await supabase
    .from('drawings_yet_to_release')
    .select('*')
    .eq('project_id', projectId)
    .order('dwg', { ascending: true })

  if (error) throw error
  return data as DrawingYetToRelease[]
}

export async function getAllDrawingsYetToRelease(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('drawings_yet_to_release')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DrawingYetToRelease[]
}

// ============================================================================
// Drawings Yet to Return Queries
// ============================================================================

export async function getDrawingsYetToReturnByProject(supabase: SupabaseClientType, projectId: string) {
  const { data, error } = await supabase
    .from('drawings_yet_to_return')
    .select('*')
    .eq('project_id', projectId)
    .order('dwg', { ascending: true })

  if (error) throw error
  return data as DrawingYetToReturn[]
}

export async function getAllDrawingsYetToReturn(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('drawings_yet_to_return')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DrawingYetToReturn[]
}

// ============================================================================
// Combined Drawings Query (all three tables)
// ============================================================================

export type CombinedDrawing = {
  id: string
  project_id: string | null
  dwg: string
  status: string
  description: string | null
  release_status: string | null
  latest_submitted_date: string | null
  weeks_since_sent: string | null
  total_weight: number | null
  pdf_path: string | null
  section: 'drawing_log' | 'drawings_yet_to_release' | 'drawings_yet_to_return'
}

export async function getAllDrawingsByProject(supabase: SupabaseClientType, projectId: string): Promise<CombinedDrawing[]> {
  // Fetch from all three tables in parallel
  const [drawingLogs, yetToRelease, yetToReturn] = await Promise.all([
    getDrawingLogByProject(supabase, projectId),
    getDrawingsYetToReleaseByProject(supabase, projectId),
    getDrawingsYetToReturnByProject(supabase, projectId),
  ])

  // Combine and tag with section
  const combined: CombinedDrawing[] = [
    ...drawingLogs.map(d => ({ ...d, section: 'drawing_log' as const })),
    ...yetToRelease.map(d => ({ ...d, section: 'drawings_yet_to_release' as const })),
    ...yetToReturn.map(d => ({ ...d, section: 'drawings_yet_to_return' as const })),
  ]

  return combined
}

// ============================================================================
// Invoices Queries
// ============================================================================

export async function getInvoices(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('issue_date', { ascending: false })

  if (error) throw error
  return data as Invoice[]
}

export async function getInvoicesByProjectNumber(supabase: SupabaseClientType, projectNumber: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('project_number', projectNumber)
    .order('issue_date', { ascending: false })

  if (error) throw error
  return data as Invoice[]
}

export async function getInvoiceById(supabase: SupabaseClientType, id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Invoice
}

export async function updateInvoiceStatus(supabase: SupabaseClientType, id: string, status: Invoice['status'], paidDate?: string) {
  const updates: { status: Invoice['status']; paid_date?: string } = { status }
  if (status === 'Paid' && paidDate) {
    updates.paid_date = paidDate
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Invoice
}

// ============================================================================
// Submissions Queries
// ============================================================================

export async function getSubmissions(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      projects:project_id (
        project_number,
        project_name
      )
    `)
    .order('submission_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getSubmissionsByProject(supabase: SupabaseClientType, projectId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('project_id', projectId)
    .order('submission_date', { ascending: false })

  if (error) throw error
  return data as Submission[]
}

export async function createSubmission(supabase: SupabaseClientType, submission: Database['public']['Tables']['submissions']['Insert']) {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single()

  if (error) throw error
  return data as Submission
}

// ============================================================================
// Material Lists Queries
// ============================================================================

export async function getMaterialListsByProject(supabase: SupabaseClientType, projectId: string) {
  const { data, error } = await supabase
    .from('material_lists')
    .select(`
      *,
      bar_items:material_list_bar_items (*),
      fields:material_list_fields (*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// Payments Queries
// ============================================================================

export async function getPaymentsByInvoice(supabase: SupabaseClientType, invoiceId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createPayment(supabase: SupabaseClientType, payment: Database['public']['Tables']['payments']['Insert']) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate weeks between a date and now
 */
export function calculateWeeksSince(dateString: string | null | undefined): number {
  if (!dateString) return 0
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
  return diffWeeks
}

/**
 * Get project metrics for dashboard
 */
export async function getProjectMetrics(supabase: SupabaseClientType, projectId: string) {
  const [project, drawingLogs, yetToRelease, yetToReturn, invoices] = await Promise.all([
    getProjectById(supabase, projectId),
    getDrawingLogByProject(supabase, projectId),
    getDrawingsYetToReleaseByProject(supabase, projectId),
    getDrawingsYetToReturnByProject(supabase, projectId),
    supabase
      .from('invoices')
      .select('*')
      .eq('project_number', '')
      .then(async ({ data }) => {
        // Get project number first
        const proj = await getProjectById(supabase, projectId)
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .eq('project_number', proj.project_number)
        return invoiceData || []
      }),
  ])

  // Calculate totals
  const totalDrawings = drawingLogs.length + yetToRelease.length + yetToReturn.length
  const totalWeight = [...drawingLogs, ...yetToRelease, ...yetToReturn].reduce(
    (sum, d) => sum + (d.total_weight || 0),
    0
  )
  const releasedDrawings = drawingLogs.filter(d => 
    d.release_status?.toLowerCase().includes('released')
  ).length

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount_billed || 0), 0)
  const paidAmount = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.total_amount_billed || 0), 0)

  return {
    project,
    totalDrawings,
    totalWeight,
    releasedDrawings,
    pendingDrawings: yetToReturn.length,
    yetToReleaseCount: yetToRelease.length,
    totalInvoices: invoices.length,
    totalBilled,
    paidAmount,
    outstandingAmount: totalBilled - paidAmount,
  }
}

