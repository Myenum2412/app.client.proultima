/**
 * Utility functions for handling PDF URLs, especially Google Drive URLs
 */

/**
 * Converts a Google Drive sharing URL to a preview/view URL (not download)
 * @param url - Google Drive sharing URL or any PDF URL
 * @param useEmbed - If true, returns embed viewer URL (better for iframes), otherwise preview URL
 * @returns PDF preview URL that can be viewed in browser/iframe without downloading
 */
export function convertGoogleDriveUrl(url: string, useEmbed = false): string {
  // Check if it's a Google Drive URL
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    
    if (useEmbed) {
      // Use Google Drive's preview URL for iframe (view only, no download)
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // Use Google Drive's preview URL (for viewing, not downloading)
    // This format allows viewing in browser without triggering download
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  // If not a Google Drive URL, return as-is
  return url;
}

/**
 * Checks if a URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com');
}

/**
 * Gets the Google Drive file ID from a URL
 */
export function getGoogleDriveFileId(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

