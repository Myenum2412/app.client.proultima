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

/**
 * Extract the first letter from a product name for numbering
 * Handles edge cases like empty strings, non-alphabetic characters
 */
function getFirstLetter(productName: string | null | undefined): string {
  if (!productName || productName.trim().length === 0) {
    return 'X'; // Default letter for empty product names
  }
  
  const trimmed = productName.trim();
  const firstChar = trimmed[0].toUpperCase();
  
  // Check if first character is alphabetic
  if (/[A-Z]/.test(firstChar)) {
    return firstChar;
  }
  
  // If not alphabetic, use 'X' as default
  return 'X';
}

/**
 * Generate asset numbers based on first letter of product name + sequential number
 * Numbers are grouped by first letter (M1, M2, M3... K1, K2...)
 */
export function generateFirstLetterNumbers(
  requests: Array<{ id: string; product_name: string; created_at?: string; requested_date?: string }>
): Map<string, string> {
  const numberMap = new Map<string, string>();
  
  // Group requests by first letter (case-insensitive)
  const groupedByLetter = new Map<string, Array<{ id: string; product_name: string; created_at?: string; requested_date?: string }>>();
  
  requests.forEach((request) => {
    const firstLetter = getFirstLetter(request.product_name);
    
    if (!groupedByLetter.has(firstLetter)) {
      groupedByLetter.set(firstLetter, []);
    }
    
    groupedByLetter.get(firstLetter)!.push(request);
  });
  
  // Sort each group by date (oldest first)
  // Prefer created_at, fallback to requested_date
  groupedByLetter.forEach((group) => {
    group.sort((a, b) => {
      const dateA = a.created_at || a.requested_date || '';
      const dateB = b.created_at || b.requested_date || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  });
  
  // Assign sequential numbers within each group
  groupedByLetter.forEach((group, firstLetter) => {
    group.forEach((request, index) => {
      const number = `${firstLetter}${index + 1}`;
      numberMap.set(request.id, number);
    });
  });
  
  return numberMap;
}

