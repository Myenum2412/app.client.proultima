/**
 * Cache cleanup utility to prevent QuotaExceededError
 * This helps manage browser storage limits for PWA functionality
 */

export const clearBrowserCache = async () => {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
        // Clear IndexedDB if available
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
              return Promise.resolve();
            })
          );
        }
    
    // Clear service worker cache if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // console.log('✅ Browser cache cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear browser cache:', error);
    return false;
  }
};

export const clearServiceWorkerCache = async () => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      // console.log('✅ Service worker cache cleared successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to clear service worker cache:', error);
    return false;
  }
};

export const getStorageUsage = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? (estimate.usage || 0) / estimate.quota * 100 : 0
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return null;
  }
};

export const isStorageNearLimit = async (threshold = 80) => {
  const usage = await getStorageUsage();
  if (!usage) return false;
  return usage.percentage > threshold;
};
