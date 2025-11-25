/**
 * API error handler with retry logic and standardized error responses
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

export class ApiErrorHandler {
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Handle API errors with standardized format
   */
  async handleError(error: any, context?: string): Promise<ApiError> {
    const timestamp = new Date().toISOString();
    const requestId = this.generateRequestId();

    console.group(`🚨 API Error${context ? ` in ${context}` : ''}`);
    console.error('Error:', error);
    console.error('Request ID:', requestId);
    console.error('Timestamp:', timestamp);
    console.groupEnd();

    // Log to monitoring service
    this.logToMonitoringService(error, context, requestId);

    // Standardize error format
    if (error instanceof Response) {
      return await this.handleResponseError(error, requestId, timestamp);
    }

    if (error instanceof Error) {
      return this.handleGenericError(error, requestId, timestamp);
    }

    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
      details: error,
      timestamp,
      requestId,
    };
  }

  /**
   * Handle fetch response errors
   */
  private async handleResponseError(
    response: Response,
    requestId: string,
    timestamp: string
  ): Promise<ApiError> {
    let errorData: any = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData.message = await response.text();
      }
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
      errorData.message = 'Failed to parse error response';
    }

    return {
      message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      code: errorData.code || `HTTP_${response.status}`,
      status: response.status,
      details: errorData,
      timestamp,
      requestId,
    };
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(
    error: Error,
    requestId: string,
    timestamp: string
  ): ApiError {
    return {
      message: error.message || 'An unexpected error occurred',
      code: error.name || 'GENERIC_ERROR',
      status: 500,
      details: {
        stack: error.stack,
        name: error.name,
      },
      timestamp,
      requestId,
    };
  }

  /**
   * Retry failed requests with exponential backoff
   */
  async withRetry<T>(
    requestFn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw this.handleError(error, context);
        }
        
        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt),
          this.retryConfig.maxDelay
        );
        
        // console.log(`🔄 Retrying request in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`);
        
        await this.sleep(delay);
      }
    }
    
    throw this.handleError(lastError, context);
  }

  /**
   * Determine if an error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry client errors (4xx)
    if (error instanceof Response) {
      return error.status >= 400 && error.status < 500;
    }
    
    // Don't retry certain error types
    if (error instanceof Error) {
      const nonRetryableErrors = [
        'ValidationError',
        'AuthenticationError',
        'AuthorizationError',
        'NotFoundError',
        'BadRequestError',
      ];
      
      return nonRetryableErrors.includes(error.name);
    }
    
    return false;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Log errors to monitoring service
   */
  private logToMonitoringService(error: any, context?: string, requestId?: string) {
    try {
      // In a real application, you would send this to your monitoring service
      // For now, we'll just log it with structured data
      const errorData = {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        context,
        requestId,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
      };

      // console.log('📊 Error logged to monitoring service:', errorData);
      
      // Example: Send to monitoring service
      // monitoringService.captureException(error, {
      //   extra: errorData,
      //   tags: {
      //     context,
      //     requestId,
      //   }
      // });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  }

  /**
   * Create standardized API response
   */
  createSuccessResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(error: ApiError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        requestId: error.requestId,
        timestamp: error.timestamp,
      },
      // Only include details in development
      ...(process.env.NODE_ENV === 'development' && {
        details: error.details,
      }),
    };
  }
}

// Create singleton instance
export const apiErrorHandler = new ApiErrorHandler();

// Convenience functions
export const handleApiError = (error: any, context?: string) => 
  apiErrorHandler.handleError(error, context);

export const withApiRetry = <T>(
  requestFn: () => Promise<T>,
  context?: string
) => apiErrorHandler.withRetry(requestFn, context);

// Enhanced fetch wrapper with error handling and retry
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  context?: string
): Promise<Response> {
  return apiErrorHandler.withRetry(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw response;
    }
    
    return response;
  }, context);
}

// Enhanced fetch wrapper that returns parsed JSON
export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  context?: string
): Promise<T> {
  const response = await fetchWithErrorHandling(url, options, context);
  return response.json();
}
