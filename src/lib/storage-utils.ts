export function deriveStoragePath(urlOrPath: string, bucket: string): string | null {
  if (!urlOrPath) return null;
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath.replace(/^\/+/, '');
  }

  try {
    const parsed = new URL(urlOrPath);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const bucketIndex = segments.findIndex((segment) => segment === bucket);
    if (bucketIndex >= 0) {
      return decodeURIComponent(segments.slice(bucketIndex + 1).join('/'));
    }
  } catch (error) {
    console.warn('[storage-utils] Failed to derive storage path from URL', urlOrPath, error);
  }

  return null;
}

export async function getSignedUrlsFromServer(
  bucket: string,
  urlsOrPaths: string[],
  expiresInSeconds = 600
): Promise<string[]> {
  const paths = urlsOrPaths
    .map((value) => deriveStoragePath(value, bucket))
    .filter((value): value is string => Boolean(value));

  if (!paths.length) {
    return urlsOrPaths;
  }

  const response = await fetch('/api/storage/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket,
      paths,
      expiresIn: expiresInSeconds,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch signed URLs');
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.urls)) {
    throw new Error('Invalid response from sign endpoint');
  }

  return payload.urls;
}

