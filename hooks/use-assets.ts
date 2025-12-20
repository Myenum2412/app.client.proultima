import { useQuery } from '@tanstack/react-query'
import { ApiResponse } from '@/lib/api/utils'
import { queryKeys } from '@/lib/config/query-config'

export interface DrawingYetToReturn {
  dwg: string
  status: string
  description: string
  releaseStatus: string
  latestSubmittedDate: string
  weeksSinceSent: string
  totalWeight?: number
  pdfPath?: string
}

export interface DrawingYetToRelease {
  dwg: string
  status: string
  description: string
  releaseStatus: string
  latestSubmittedDate: string
  totalWeight?: number
  pdfPath?: string
}

export interface DrawingLog {
  dwg: string
  status: string
  description: string
  latestSubmittedDate: string
  totalWeight: number
  weeksSinceSent?: string
  pdfPath?: string
}

export interface ChangeOrder {
  id: string
  description: string
  amount: number
  date: string
  status: string
  weightChanges?: number
  totalHours?: number
  pdfPath?: string
}

const fetchDrawings = async (projectId?: string, type?: string): Promise<any[]> => {
  const params = new URLSearchParams()
  if (projectId) params.append('projectId', projectId)
  if (type) params.append('type', type)
  
  const url = `/api/assets/drawings${params.toString() ? `?${params.toString()}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch drawings')
  }

  const result: ApiResponse<any[]> = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch drawings')
  }

  return Array.isArray(result.data) ? result.data : []
}

const fetchChangeOrders = async (projectId?: string): Promise<ChangeOrder[]> => {
  const params = new URLSearchParams()
  if (projectId) params.append('projectId', projectId)
  
  const url = `/api/assets/change-orders${params.toString() ? `?${params.toString()}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch change orders')
  }

  const result: ApiResponse<ChangeOrder[]> = await response.json()
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch change orders')
  }

  return Array.isArray(result.data) ? result.data : []
}

export function useDrawingsYetToReturn(projectId?: string) {
  return useQuery({
    queryKey: ['assets', 'drawings', 'yet-to-return', projectId],
    queryFn: () => fetchDrawings(projectId, 'yet-to-return') as Promise<DrawingYetToReturn[]>,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useDrawingsYetToRelease(projectId?: string) {
  return useQuery({
    queryKey: ['assets', 'drawings', 'yet-to-release', projectId],
    queryFn: () => fetchDrawings(projectId, 'yet-to-release') as Promise<DrawingYetToRelease[]>,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useDrawingLog(projectId?: string) {
  return useQuery({
    queryKey: ['assets', 'drawings', 'log', projectId],
    queryFn: () => fetchDrawings(projectId, 'log') as Promise<DrawingLog[]>,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useChangeOrders(projectId?: string) {
  return useQuery({
    queryKey: ['assets', 'change-orders', projectId],
    queryFn: () => fetchChangeOrders(projectId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

