/**
 * Centralized API Client Service
 * Provides consistent error handling, request/response interceptors, and retry logic
 */

import { ApiResponse } from '@/lib/api/utils'

export interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
}

class ApiClient {
  private baseURL: string
  private defaultTimeout: number = 30000 // 30 seconds
  private defaultRetries: number = 1

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const controller = new AbortController()
    const timeout = config.timeout || this.defaultTimeout

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  private async retryRequest<T>(
    url: string,
    config: RequestConfig,
    attempt: number = 0
  ): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: ApiResponse<T> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Request failed')
      }

      return result.data as T
    } catch (error) {
      const retries = config.retries ?? this.defaultRetries
      if (attempt < retries && error instanceof Error) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
        return this.retryRequest<T>(url, config, attempt + 1)
      }
      throw error
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    config?: RequestConfig
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return this.retryRequest<T>(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    })
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    return this.retryRequest<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    return this.retryRequest<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    return this.retryRequest<T>(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    return this.retryRequest<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      ...config,
    })
  }
}

export const apiClient = new ApiClient('/api')

