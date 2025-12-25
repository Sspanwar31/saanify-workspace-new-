import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'

export const POST = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    console.log('🧪 Testing automation task execution...')
    
    // Test backup-now task execution
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cloud/automation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run', taskId: 'backup-now' })
    })
    
    const result = await response.json()
    
    console.log('📊 Automation test result:', result)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Automation test successful',
        test_result: result,
        test_status: 'passed',
        task_id: 'backup-now',
        task_name: 'Backup Now',
        execution_time: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Automation test failed',
        test_result: result,
        test_status: 'failed',
        error: result.error || 'Unknown error'
      })
    }
    
  } catch (error) {
    console.error('💥 Automation test failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Network error during automation test',
      test_status: 'network_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})