/**
 * Performance utilities for debouncing, throttling, and request optimization
 */

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * React hook for debounced values
 */
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for throttled values
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastRan, setLastRan] = useState<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan >= limit) {
        setThrottledValue(value);
        setLastRan(Date.now());
      }
    }, limit - (Date.now() - lastRan));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit, lastRan]);

  return throttledValue;
}

/**
 * Batch multiple API requests into a single request
 */
export class RequestBatcher<T, R> {
  private batch: Array<{ key: string; params: T; resolve: (value: R) => void; reject: (error: Error) => void }> = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private readonly batchFn: (items: Array<{ key: string; params: T }>) => Promise<Map<string, R>>;

  constructor(
    batchFn: (items: Array<{ key: string; params: T }>) => Promise<Map<string, R>>,
    options: { batchSize?: number; batchDelay?: number } = {}
  ) {
    this.batchFn = batchFn;
    this.batchSize = options.batchSize ?? 10;
    this.batchDelay = options.batchDelay ?? 50;
  }

  async request(key: string, params: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push({ key, params, resolve, reject });

      if (this.batch.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      const results = await this.batchFn(currentBatch.map((item) => ({ key: item.key, params: item.params })));
      currentBatch.forEach((item) => {
        const result = results.get(item.key);
        if (result !== undefined) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result for key: ${item.key}`));
        }
      });
    } catch (error) {
      currentBatch.forEach((item) => {
        item.reject(error instanceof Error ? error : new Error("Batch request failed"));
      });
    }
  }
}

