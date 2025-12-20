import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Test endpoint to verify Supabase connection and data fetching
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Test connection by fetching invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(5)
    
    if (error) {
      return Response.json({
        success: false,
        error: error.message,
        details: error,
        message: 'Failed to fetch invoices from Supabase'
      }, { status: 500 })
    }
    
    return Response.json({
      success: true,
      message: 'Successfully connected to Supabase',
      count: invoices?.length || 0,
      data: invoices || [],
      tableExists: true
    })
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
      message: 'Error connecting to Supabase',
      checkEnv: 'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set'
    }, { status: 500 })
  }
}

