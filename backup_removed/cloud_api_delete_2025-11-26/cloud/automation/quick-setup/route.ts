import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'
import SupabaseService from '@/lib/supabase-service'

// Simple SQL for creating just the automation_logs table
const AUTOMATION_LOGS_SQL = `
-- Create automation_logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  details TEXT,
  error TEXT,
  run_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_logs_task_name ON automation_logs(task_name);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_run_time ON automation_logs(run_time);

-- Enable Row Level Security
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role full access" ON automation_logs;

-- Create policy for service role
CREATE POLICY "Service role full access" ON automation_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
`

export const POST = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    const supabaseService = SupabaseService.getInstance()
    const client = await supabaseService.getClient()

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client. Please check your secrets configuration.',
        step: 'client_creation_failed'
      }, { status: 500 })
    }

    // First, try to create the table using a direct approach
    try {
      // Check if table exists
      const { data: tableCheck, error: checkError } = await client
        .from('automation_logs')
        .select('count')
        .limit(1)

      if (checkError && checkError.code === 'PGRST116') {
        // Table doesn't exist, we need to create it
        console.log('Table does not exist, attempting to create...')
        
        // Since we can't execute raw SQL directly, we'll use the REST API approach
        return NextResponse.json({
          success: true,
          message: 'Table creation SQL generated',
          sql: AUTOMATION_LOGS_SQL,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the SQL script below',
            '4. Execute the script',
            '5. Test automation tasks again'
          ],
          step: 'sql_generated'
        })
      } else {
        // Table exists, return success
        return NextResponse.json({
          success: true,
          message: 'automation_logs table already exists',
          step: 'table_exists'
        })
      }
    } catch (error) {
      console.error('Error checking table:', error)
      
      return NextResponse.json({
        success: true,
        message: 'Table creation SQL generated (error occurred during check)',
        sql: AUTOMATION_LOGS_SQL,
        error: error instanceof Error ? error.message : 'Unknown error',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL script below',
          '4. Execute the script',
          '5. Test automation tasks again'
        ],
        step: 'sql_generated_fallback'
      })
    }

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'setup_failed'
    }, { status: 500 })
  }
})

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    const supabaseService = SupabaseService.getInstance()
    const client = await supabaseService.getClient()

    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client',
        client_exists: false
      })
    }

    // Test table access
    const { data, error } = await client
      .from('automation_logs')
      .select('count')
      .limit(1)

    const tableExists = !error || error.code !== 'PGRST116'

    return NextResponse.json({
      success: true,
      table_exists: tableExists,
      error: error?.message,
      test_result: tableExists ? 'Table accessible' : 'Table not accessible'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      table_exists: false
    }, { status: 500 })
  }
})