import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'

export interface Project {
  id: string
  projectName: string
  projectNumber?: string
  jobNumber?: string
  status: string
  dueDate: string
  description?: string
  createdAt: string
  updatedAt: string
}

const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }

  const result: ApiResponse<Project[]> = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch projects')
  }

  return result.data
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
