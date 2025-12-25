import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'
import SupabaseService from '@/lib/supabase-service'

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    const supabaseService = SupabaseService.getInstance()
    const client = await supabaseService.getClient()

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client. Please check your secrets configuration.',
        connection_status: 'failed'
      })
    }

    // Simple connection test
    try {
      const { error } = await client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1)

      // We expect this to work if connection is good
      if (error && !error.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: `Connection test failed: ${error.message}`,
          connection_status: 'failed'
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Supabase',
        connection_status: 'connected'
      })

    } catch (testError) {
      return NextResponse.json({
        success: false,
        error: `Connection test error: ${testError instanceof Error ? testError.message : 'Unknown error'}`,
        connection_status: 'failed'
      })
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: `Setup error: ${errorMsg}`,
      connection_status: 'failed'
    })
  }
})