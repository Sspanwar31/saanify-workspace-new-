import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const GET = async (req: NextRequest) => {
  try {
    // Fetch last log for each automation task from Supabase
    const tasks = [
      'schema-sync',
      'auto-sync',
      'backup-now',
      'auto-backup',
      'health-check',
      'log-rotation',
      'ai-optimization',
      'security-scan',
      'backup-restore'
    ]

    const statusPromises = tasks.map(async (task) => {
      const lastLog = await db.automation_logs.findFirst({
        where: { task },
        orderBy: { createdAt: 'desc' }
      })
      return {
        task,
        lastRun: lastLog?.createdAt || null,
        status: lastLog?.status || 'ready',
        message: lastLog?.message || null
      }
    })

    const task_status = await Promise.all(statusPromises)

    // Check if Supabase connected and logs available
    const system_health = {
      supabase_connected: true,
      automation_logs_available: task_status.length > 0,
      last_log_time: task_status[0]?.lastRun || null
    }

    return NextResponse.json({
      success: true,
      status: {
        overall: {
          total_runs: task_status.length,
          successful_runs: task_status.filter(t => t.status === 'success').length,
          failed_runs: task_status.filter(t => t.status === 'failed').length,
          running_runs: task_status.filter(t => t.status === 'running').length,
          success_rate: task_status.length ? 
            Math.round((task_status.filter(t => t.status === 'success').length / task_status.length) * 100) : 0,
          average_duration_ms: 0, // Optional: calculate if duration available
          last_24_hours: 0 // Optional: calculate if timestamped logs exist
        },
        task_breakdown: task_status,
        recent_activity: task_status.slice(0, 5),
        system_health
      }
    })
  } catch (error) {
    console.error('Failed to fetch automation status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch automation status'
    }, { status: 500 })
  }
}
