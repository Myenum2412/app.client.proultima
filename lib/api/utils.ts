import { NextResponse } from 'next/server'
import { ApiErrorCode, HTTP_STATUS } from './constants'
import { ZodError } from 'zod'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errorCode?: ApiErrorCode
  message?: string
  validationErrors?: Record<string, string[]>
  timestamp?: string
}

export interface ApiError {
  message: string
  code: ApiErrorCode
  status: number
  validationErrors?: Record<string, string[]>
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Create an error API response with proper error code
 */
export function createErrorResponse(
  error: string | ApiError,
  status?: number,
  errorCode?: ApiErrorCode,
  validationErrors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  let errorMessage: string
  let errorStatusCode: number
  let errorCodeValue: ApiErrorCode | undefined
  let validationErrs: Record<string, string[]> | undefined

  if (typeof error === 'string') {
    errorMessage = error
    errorStatusCode = status || HTTP_STATUS.INTERNAL_SERVER_ERROR
    errorCodeValue = errorCode
    validationErrs = validationErrors
  } else {
    errorMessage = error.message
    errorStatusCode = error.status
    errorCodeValue = error.code
    validationErrs = error.validationErrors
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      errorCode: errorCodeValue,
      validationErrors: validationErrs,
      timestamp: new Date().toISOString(),
    },
    { status: errorStatusCode }
  )
}

/**
 * Handle API errors with proper categorization
 */
export async function handleApiError(error: unknown): Promise<NextResponse<ApiResponse>> {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors: Record<string, string[]> = {}
    error.issues.forEach((err) => {
      const path = err.path.join('.')
      if (!validationErrors[path]) {
        validationErrors[path] = []
      }
      validationErrors[path].push(err.message)
    })

    return createErrorResponse(
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ApiErrorCode.VALIDATION_ERROR,
      validationErrors
    )
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Check for known error patterns
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return createErrorResponse(
        error.message,
        HTTP_STATUS.FORBIDDEN,
        ApiErrorCode.FORBIDDEN
      )
    }

    if (error.message.includes('not found')) {
      return createErrorResponse(
        error.message,
        HTTP_STATUS.NOT_FOUND,
        ApiErrorCode.NOT_FOUND
      )
    }

    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return createErrorResponse(
        error.message,
        HTTP_STATUS.UNAUTHORIZED,
        ApiErrorCode.UNAUTHORIZED
      )
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('query')) {
      return createErrorResponse(
        'Database error occurred',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ApiErrorCode.DATABASE_ERROR
      )
    }

    // Default error response
    return createErrorResponse(
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ApiErrorCode.INTERNAL_ERROR
    )
  }

  // Unknown error type
  return createErrorResponse(
    'An unexpected error occurred',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ApiErrorCode.INTERNAL_ERROR
  )
}

/**
 * Create an API error object
 */
export function createApiError(
  message: string,
  code: ApiErrorCode,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  validationErrors?: Record<string, string[]>
): ApiError {
  return {
    message,
    code,
    status,
    validationErrors,
  }
}

/**
 * Validate request body with Zod schema
 */
export function validateRequest<T>(
  body: unknown,
  schema: { parse: (data: unknown) => T }
): { data: T; error: null } | { data: null; error: ZodError } {
  try {
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error }
    }
    throw error
  }
}

