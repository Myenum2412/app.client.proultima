import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: 200 }
  )
}

export function createErrorResponse(
  error: string,
  status: number = 500
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

export async function handleApiError(error: unknown): Promise<NextResponse<ApiResponse>> {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500)
  }
  
  return createErrorResponse('An unexpected error occurred', 500)
}

export function validateRequest<T>(
  body: unknown,
  validator: (data: any) => data is T
): T | null {
  if (!validator(body)) {
    return null
  }
  return body
}

