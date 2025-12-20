import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

interface SearchResult {
  type: 'project' | 'file' | 'invoice' | 'submission'
  id: string
  title: string
  description?: string
  url: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return createSuccessResponse<SearchResult[]>([])
    }

    const supabase = createServerClient()

    const searchTerm = query.toLowerCase().trim()
    const results: SearchResult[] = []

    // Search projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, project_name, project_number, description')
      .or(`project_name.ilike.%${searchTerm}%,project_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(10)

    if (projects) {
      projects.forEach((project: any) => {
        results.push({
          type: 'project',
          id: project.id,
          title: project.project_name || project.project_number,
          description: project.description,
          url: `/dashboard?project=${project.id}`,
        })
      })
    }

    // Search files (if you have a files table)
    const { data: files } = await supabase
      .from('files')
      .select('id, name, description')
      .ilike('name', `%${searchTerm}%`)
      .limit(10)

    if (files) {
      files.forEach((file: any) => {
        results.push({
          type: 'file',
          id: file.id,
          title: file.name,
          description: file.description,
          url: `/files?id=${file.id}`,
        })
      })
    }

    return createSuccessResponse(results)
  } catch (error) {
    return handleApiError(error)
  }
}

