import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Fetch files from Supabase
    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      return createSuccessResponse([])
    }

    return createSuccessResponse(files || [])
  } catch (error) {
    return handleApiError(error)
  }
}

