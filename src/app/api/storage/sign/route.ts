import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SignPayload {
  bucket?: string;
  paths?: string[];
  expiresIn?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { bucket, paths, expiresIn = 60 } = (await request.json()) as SignPayload;

    if (!bucket || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: 'bucket and paths are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (error) {
      console.error('[storage:sign] Error creating signed URLs', error);
      return NextResponse.json(
        { error: 'Failed to generate signed URLs' },
        { status: 500 }
      );
    }

    const urls = (data || []).map((entry) => entry.signedUrl);

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('[storage:sign] Unexpected error', error);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

