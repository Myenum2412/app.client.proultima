import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const createServerClient = (request?: NextRequest) => {
  // Get cookies from request if provided
  let accessToken: string | undefined
  let refreshToken: string | undefined

  if (request) {
    // Get cookies from NextRequest
    accessToken = request.cookies.get('sb-access-token')?.value
    refreshToken = request.cookies.get('sb-refresh-token')?.value
  }

  // Create Supabase client
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Set the access token if available
  if (accessToken) {
    // Use setSession to authenticate the client
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    } as any).catch(() => {
      // Silently fail if token is invalid - getUser() will handle the error
    })
  }

  return client
}

