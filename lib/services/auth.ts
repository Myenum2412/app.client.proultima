/**
 * Authentication Service
 * Handles authentication workflows and user session management
 */

import { createServerClient } from '@/lib/supabase/server'
import { DatabaseService } from './database'

export interface AuthUser {
  id: string
  email: string
  role?: string
  metadata?: Record<string, any>
}

export class AuthService {
  private supabase = createServerClient()
  private db = new DatabaseService()

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { user, error } = await this.db.getCurrentUser()

      if (error || !user) {
        return { user: null, error: error?.message || 'Not authenticated' }
      }

      return {
        user: {
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role,
          metadata: user.user_metadata,
        },
        error: null,
      }
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }
    }
  }

  /**
   * Verify user is authenticated
   */
  async requireAuth(): Promise<{ user: AuthUser; error: null } | { user: null; error: string }> {
    const { user, error } = await this.getCurrentUser()

    if (error || !user) {
      return {
        user: null,
        error: error || 'Authentication required',
      }
    }

    return { user, error: null }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    const { user } = await this.getCurrentUser()
    return user?.role === role
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Sign out failed',
      }
    }
  }
}

export const authService = new AuthService()

