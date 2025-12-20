/**
 * Database Service Layer
 * Provides type-safe, reusable database operations with error handling
 */

import { createServerClient } from '@/lib/supabase/server'
import { PostgrestError } from '@supabase/supabase-js'

export interface DatabaseError {
  message: string
  code?: string
  details?: string
}

export class DatabaseService {
  private supabase = createServerClient()

  /**
   * Generic select operation with error handling
   */
  async select<T>(
    table: string,
    options?: {
      select?: string
      filters?: Record<string, any>
      orderBy?: { column: string; ascending?: boolean }
      limit?: number
      offset?: number
    }
  ): Promise<{ data: T[] | null; error: DatabaseError | null }> {
    try {
      let query = this.supabase.from(table).select(options?.select || '*')

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && 'gte' in value) {
              query = query.gte(key, value.gte)
            } else if (typeof value === 'object' && 'lte' in value) {
              query = query.lte(key, value.lte)
            } else if (typeof value === 'object' && 'gt' in value) {
              query = query.gt(key, value.gt)
            } else if (typeof value === 'object' && 'lt' in value) {
              query = query.lt(key, value.lt)
            } else if (typeof value === 'object' && 'eq' in value) {
              query = query.eq(key, value.eq)
            } else if (typeof value === 'object' && 'in' in value) {
              query = query.in(key, value.in)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        })
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        )
      }

      const { data, error } = await query

      if (error) {
        return {
          data: null,
          error: this.formatError(error),
        }
      }

      return { data: data as T[], error: null }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error as PostgrestError),
      }
    }
  }

  /**
   * Generic insert operation
   */
  async insert<T>(
    table: string,
    records: T | T[]
  ): Promise<{ data: T[] | null; error: DatabaseError | null }> {
    try {
      const recordsArray = Array.isArray(records) ? records : [records]
      const { data, error } = await this.supabase
        .from(table)
        .insert(recordsArray)
        .select()

      if (error) {
        return {
          data: null,
          error: this.formatError(error),
        }
      }

      return { data: data as T[], error: null }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error as PostgrestError),
      }
    }
  }

  /**
   * Generic update operation
   */
  async update<T>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<{ data: T | null; error: DatabaseError | null }> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: this.formatError(error),
        }
      }

      return { data: data as T, error: null }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error as PostgrestError),
      }
    }
  }

  /**
   * Generic delete operation
   */
  async delete(
    table: string,
    id: string
  ): Promise<{ error: DatabaseError | null }> {
    try {
      const { error } = await this.supabase.from(table).delete().eq('id', id)

      if (error) {
        return {
          error: this.formatError(error),
        }
      }

      return { error: null }
    } catch (error) {
      return {
        error: this.formatError(error as PostgrestError),
      }
    }
  }

  /**
   * Batch delete operation
   */
  async deleteMany(
    table: string,
    ids: string[]
  ): Promise<{ error: DatabaseError | null }> {
    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .in('id', ids)

      if (error) {
        return {
          error: this.formatError(error),
        }
      }

      return { error: null }
    } catch (error) {
      return {
        error: this.formatError(error as PostgrestError),
      }
    }
  }

  /**
   * Count records
   */
  async count(
    table: string,
    filters?: Record<string, any>
  ): Promise<{ count: number | null; error: DatabaseError | null }> {
    try {
      let query = this.supabase.from(table).select('*', { count: 'exact', head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const { count, error } = await query

      if (error) {
        return {
          count: null,
          error: this.formatError(error),
        }
      }

      return { count: count ?? 0, error: null }
    } catch (error) {
      return {
        count: null,
        error: this.formatError(error as PostgrestError),
      }
    }
  }

  /**
   * Format Supabase errors to a consistent format
   */
  private formatError(error: PostgrestError): DatabaseError {
    return {
      message: error.message || 'Database operation failed',
      code: error.code,
      details: error.details,
    }
  }

  /**
   * Get authenticated user
   */
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error) {
        return { user: null, error: this.formatError(error as any) }
      }

      return { user, error: null }
    } catch (error) {
      return {
        user: null,
        error: this.formatError(error as PostgrestError),
      }
    }
  }
}

export const db = new DatabaseService()

