/**
 * Import Optimization Utilities
 * Helper functions to optimize imports and reduce bundle size
 */

/**
 * Lazy import with error handling
 */
export async function lazyImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error("Failed to lazy import:", error);
    if (fallback) return fallback;
    throw error;
  }
}

/**
 * Batch imports to reduce initial load
 */
export async function batchImports<T extends Record<string, () => Promise<any>>>(
  imports: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>>["default"] }> {
  const entries = Object.entries(imports);
  const results = await Promise.all(
    entries.map(async ([key, importFn]) => {
      const module = await importFn();
      return [key, module.default];
    })
  );

  return Object.fromEntries(results) as any;
}

