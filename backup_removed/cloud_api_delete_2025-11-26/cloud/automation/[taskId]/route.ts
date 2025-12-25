import { NextRequest, NextResponse } from 'next/server'
import AutomationService from '@/lib/automation-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const taskId = params.taskId

    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'Task ID is required'
      }, { status: 400 })
    }

    const automationService = AutomationService.getInstance()
    const result = await automationService.runTask(taskId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        task: {
          id: taskId,
          name: taskId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          status: 'completed',
          result: result.result
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to run automation task:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to start automation task'
    }, { status: 500 })
  }
}