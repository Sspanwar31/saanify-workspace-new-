import { NextRequest, NextResponse } from 'next/server'

// Generate mock log data
function generateLogs(level: string = 'all', date?: string, limit: number = 100) {
  const levels = ['info', 'warn', 'error', 'debug']
  const services = ['api', 'database', 'auth', 'storage', 'functions', 'ai']
  const messages = [
    'User authentication successful',
    'Database connection established',
    'File uploaded to storage',
    'Function deployed successfully',
    'AI model inference completed',
    'Cache cleared successfully',
    'Backup process started',
    'Schema sync completed',
    'Payment processed successfully',
    'Notification sent to user',
    'API rate limit exceeded',
    'Database query timeout',
    'Invalid authentication token',
    'Storage quota exceeded',
    'Function execution failed'
  ]

  const logs = []
  const now = new Date()

  for (let i = 0; i < limit; i++) {
    const timestamp = new Date(now.getTime() - i * 60000) // Each log 1 minute apart
    const logLevel = level === 'all' ? levels[Math.floor(Math.random() * levels.length)] : level
    const service = services[Math.floor(Math.random() * services.length)]
    const message = messages[Math.floor(Math.random() * messages.length)]

    // Filter by date if provided
    if (date && timestamp.toDateString() !== new Date(date).toDateString()) {
      continue
    }

    logs.push({
      id: `log_${Date.now() - i * 1000}`,
      timestamp: timestamp.toISOString(),
      level: logLevel,
      service,
      message,
      requestId: `req_${Math.random().toString(36).substring(2, 15)}`,
      userId: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 1000)}` : null,
      duration: Math.floor(Math.random() * 1000) + 50,
      statusCode: logLevel === 'error' ? [400, 401, 404, 500][Math.floor(Math.random() * 4)] : 200
    })
  }

  return logs
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') || 'all'
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    let logs = generateLogs(level, date, limit * 2) // Generate more for filtering

    // Filter by search term
    if (search) {
      logs = logs.filter(log =>
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.service.toLowerCase().includes(search.toLowerCase()) ||
        log.requestId.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedLogs = logs.slice(startIndex, endIndex)

    // Calculate stats
    const stats = {
      total: logs.length,
      info: logs.filter(log => log.level === 'info').length,
      warn: logs.filter(log => log.level === 'warn').length,
      error: logs.filter(log => log.level === 'error').length,
      debug: logs.filter(log => log.level === 'debug').length
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        stats,
        pagination: {
          page,
          limit,
          total: logs.length,
          totalPages: Math.ceil(logs.length / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const before = searchParams.get('before')

    // Simulate log deletion
    const deletionResult = {
      deletedCount: Math.floor(Math.random() * 10000) + 1000,
      level: level || 'all',
      before: before || 'all_time',
      deletedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: deletionResult,
      message: 'Logs deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete logs' },
      { status: 500 }
    )
  }
}