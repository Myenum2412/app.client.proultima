'use client';

import { useEffect, useState } from 'react';
import { getSignedUrlsFromServer } from '@/lib/storage-utils';

interface Options {
  bucket?: string;
  expiresInSeconds?: number;
  enabled?: boolean;
}

export function useSignedReceiptUrls(
  urls: string[] | undefined,
  { bucket = 'cash-receipts', expiresInSeconds = 600, enabled = true }: Options = {}
) {
  const [signedUrls, setSignedUrls] = useState<string[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!enabled || !urls || urls.length === 0) {
        setSignedUrls(urls);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getSignedUrlsFromServer(bucket, urls, expiresInSeconds);
        if (isMounted) {
          setSignedUrls(result);
        }
      } catch (err) {
        console.error('[useSignedReceiptUrls] Failed to fetch signed URLs', err);
        if (isMounted) {
          setError('Failed to fetch secure proof links.');
          setSignedUrls(urls);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [urls, bucket, expiresInSeconds, enabled]);

  return { signedUrls, isLoading, error };
}

