/**
 * API optimization utilities for payload compression and request optimization
 */

/**
 * Compress large payloads by removing unnecessary fields
 */
export function optimizePayload<T extends Record<string, any>>(
  data: T,
  fieldsToRemove: (keyof T)[] = []
): Partial<T> {
  const optimized = { ...data };
  fieldsToRemove.forEach((field) => {
    delete optimized[field];
  });
  return optimized;
}

/**
 * Batch multiple API requests
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((req) => req()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Create a request deduplication map
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

/**
 * Optimize query parameters for smaller URLs
 */
export function optimizeQueryParams(params: Record<string, any>): string {
  const optimized: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      optimized[key] = String(value);
    }
  });
  
  return new URLSearchParams(optimized).toString();
}

