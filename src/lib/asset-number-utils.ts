'use client';

import { createClient } from '@/lib/supabase/client';

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
  const supabase = createClient();
  
  try {
    // Fetch all asset requests with asset_number
    const { data: assets, error } = await supabase
      .from('asset_requests')
      .select('asset_number')
      .not('asset_number', 'is', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching asset numbers:', error);
      // Fallback: start from ASS001 if query fails
      return 'ASS001';
    }

    // Find the highest number
    const highest = (assets || [])
      .map((asset) => extractNumericSuffix(asset.asset_number))
      .reduce((max, value) => (value > max ? value : max), 0);

    // Generate next number
    const nextNumber = highest + 1;
    return `ASS${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating asset number:', error);
    // Fallback: start from ASS001
    return 'ASS001';
  }
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

