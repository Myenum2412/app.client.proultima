import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching evaluations:', error)
      return createSuccessResponse([])
    }

    return createSuccessResponse(evaluations || [])
  } catch (error) {
    return handleApiError(error)
  }
}

