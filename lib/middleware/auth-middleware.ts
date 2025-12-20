/**
 * Authentication Middleware
 * Reusable middleware for protecting API routes
 */

import { NextRequest } from 'next/server'
import { authService, AuthUser } from '@/lib/services/auth'
import { createErrorResponse } from '@/lib/api/utils'

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest
): Promise<
  | { user: AuthUser; error: null }
  | { user: null; error: Response }
> {
  const { user, error } = await authService.requireAuth()

  if (error || !user) {
    return {
      user: null,
      error: createErrorResponse(error || 'Authentication required', 401),
    }
  }

  return { user, error: null }
}

/**
 * Middleware to optionally get user (doesn't fail if not authenticated)
 */
export async function optionalAuth(
  request: NextRequest
): Promise<{ user: AuthUser | null; error: null }> {
  const { user } = await authService.getCurrentUser()
  return { user, error: null }
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  request: NextRequest,
  role: string
): Promise<
  | { user: AuthUser; error: null }
  | { user: null; error: Response }
> {
  const authResult = await requireAuth(request)

  if (authResult.error) {
    return authResult
  }

  const hasRole = await authService.hasRole(role)

  if (!hasRole) {
    return {
      user: null,
      error: createErrorResponse('Insufficient permissions', 403),
    }
  }

  return { user: authResult.user, error: null }
}

