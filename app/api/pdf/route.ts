import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Sanitize the file path to prevent directory traversal attacks
    const sanitizedPath = filePath
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/^\//, '') // Remove leading slash
      .replace(/\\/g, '/') // Normalize path separators

    // Construct the full file path
    // Path should be relative to public/assets, e.g., "PRO-2025-001/Drawings-Yet-to-Release/filename.pdf"
    const fullPath = path.join(process.cwd(), 'public', 'assets', sanitizedPath)

    // Verify the file exists and is within the public/assets directory
    if (!fullPath.startsWith(path.join(process.cwd(), 'public', 'assets'))) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if it's a PDF file
    if (!fullPath.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(fullPath)

    // Return the PDF file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

