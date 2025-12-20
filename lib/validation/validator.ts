/**
 * Validation Utilities
 * Helper functions for validating data with Zod schemas
 */

import { z } from 'zod'
import { ApiResponse } from '@/lib/api/utils'
import { NextResponse } from 'next/server'

export interface ValidationError {
  field: string
  message: string
}

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const result = schema.safeParse(data)

    if (result.success) {
      return { success: true, data: result.data }
    }

    const errors: ValidationError[] = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }))

    return { success: false, errors }
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    }
  }
}

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  const result = validate(schema, data)
  return result.success ? result.data : null
}

export function createValidationErrorResponse(
  errors: ValidationError[]
): NextResponse<ApiResponse> {
  const errorMessage = errors.map((e) => `${e.field}: ${e.message}`).join(', ')
  return NextResponse.json(
    {
      success: false,
      error: `Validation failed: ${errorMessage}`,
    },
    { status: 400 }
  )
}

