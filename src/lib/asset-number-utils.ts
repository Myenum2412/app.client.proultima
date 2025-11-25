'use client';

/**
 * Extract numeric suffix from asset number (e.g., "ASS001" -> 1)
 */
function extractNumericSuffix(assetNumber: string | null | undefined): number {
  if (!assetNumber) return 0;
  
  const match = assetNumber.match(/(\d+)$/);
  if (!match) return 0;
  
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Generate the next available asset number (ASS001, ASS002, etc.)
 */
export async function getNextAssetNumber(): Promise<string> {
  // Since asset_number column doesn't exist in asset_requests table,
  // return a timestamp-based identifier instead
  const timestamp = Date.now();
  const suffix = timestamp.toString().slice(-3);
  return `ASS${suffix}`;
}

/**
 * Generate asset number for a list of asset requests based on their creation order
 */
export function generateAssetNumbersForRequests(requests: Array<{ id: string; created_at: string; asset_number?: string }>): Map<string, string> {
  const assetNumberMap = new Map<string, string>();
  
  // Sort by creation date
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // Assign asset numbers sequentially
  sortedRequests.forEach((request, index) => {
    if (!request.asset_number) {
      const assetNumber = `ASS${(index + 1).toString().padStart(3, '0')}`;
      assetNumberMap.set(request.id, assetNumber);
    } else {
      assetNumberMap.set(request.id, request.asset_number);
    }
  });
  
  return assetNumberMap;
}

