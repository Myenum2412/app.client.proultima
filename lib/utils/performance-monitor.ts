/**
 * Performance Monitoring Utilities
 * Track and measure performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = process.env.NODE_ENV === "development";

  /**
   * Measure function execution time
   */
  measure<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric({
      name,
      value: duration,
      unit: "ms",
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn();

    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric({
      name,
      value: duration,
      unit: "ms",
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`);
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average metric value by name
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function usePerformanceMeasure(name: string) {
  if (typeof window === "undefined") return;

  React.useEffect(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      performanceMonitor.recordMetric({
        name: `render:${name}`,
        value: end - start,
        unit: "ms",
        timestamp: Date.now(),
      });
    };
  });
}

// Import React for the hook
import * as React from "react";

