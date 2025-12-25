import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for functions
let functions: any[] = [
  {
    id: 'func_1',
    name: 'user-authentication',
    description: 'Handles user authentication and JWT token generation',
    status: 'active',
    runtime: 'nodejs18',
    memory: 256,
    timeout: 30,
    invocations: 1247,
    errors: 3,
    avgLatency: 145,
    lastDeployed: new Date('2024-01-15T10:30:00Z').toISOString(),
    endpoint: 'https://api.saanify.cloud/functions/user-authentication'
  },
  {
    id: 'func_2',
    name: 'payment-processor',
    description: 'Processes payment transactions and updates financial records',
    status: 'active',
    runtime: 'nodejs18',
    memory: 512,
    timeout: 60,
    invocations: 892,
    errors: 12,
    avgLatency: 280,
    lastDeployed: new Date('2024-01-14T15:45:00Z').toISOString(),
    endpoint: 'https://api.saanify.cloud/functions/payment-processor'
  },
  {
    id: 'func_3',
    name: 'notification-service',
    description: 'Sends email and push notifications to users',
    status: 'inactive',
    runtime: 'python3.9',
    memory: 128,
    timeout: 15,
    invocations: 456,
    errors: 8,
    avgLatency: 95,
    lastDeployed: new Date('2024-01-12T09:20:00Z').toISOString(),
    endpoint: 'https://api.saanify.cloud/functions/notification-service'
  },
  {
    id: 'func_4',
    name: 'data-export',
    description: 'Exports data in various formats (CSV, JSON, Excel)',
    status: 'active',
    runtime: 'nodejs18',
    memory: 1024,
    timeout: 300,
    invocations: 234,
    errors: 1,
    avgLatency: 1250,
    lastDeployed: new Date('2024-01-16T14:15:00Z').toISOString(),
    endpoint: 'https://api.saanify.cloud/functions/data-export'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let filteredFunctions = functions
    if (status && status !== 'all') {
      filteredFunctions = functions.filter(func => func.status === status)
    }

    return NextResponse.json({
      success: true,
      data: filteredFunctions,
      total: filteredFunctions.length
    })
  } catch (error) {
    console.error('Error fetching functions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch functions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, functionId, config } = body

    switch (action) {
      case 'deploy':
        // Simulate function deployment
        const deployResult = {
          deployId: `deploy_${Date.now()}`,
          status: 'started',
          startTime: new Date().toISOString(),
          estimatedDuration: '2-4 minutes',
          functionId,
          steps: [
            { name: 'Building', status: 'in_progress' },
            { name: 'Uploading', status: 'pending' },
            { name: 'Configuring', status: 'pending' },
            { name: 'Activating', status: 'pending' }
          ]
        }

        // Simulate deployment completion
        setTimeout(() => {
          const funcIndex = functions.findIndex(f => f.id === functionId)
          if (funcIndex !== -1) {
            functions[funcIndex].lastDeployed = new Date().toISOString()
            functions[funcIndex].status = 'active'
          }
        }, 120000)

        return NextResponse.json({
          success: true,
          data: deployResult,
          message: 'Function deployment started'
        })

      case 'test':
        // Simulate function testing
        const testResult = {
          testId: `test_${Date.now()}`,
          functionId,
          status: 'running',
          startTime: new Date().toISOString(),
          tests: [
            { name: 'Authentication', status: 'passed', duration: 145 },
            { name: 'Input validation', status: 'passed', duration: 23 },
            { name: 'Business logic', status: 'passed', duration: 89 },
            { name: 'Error handling', status: 'passed', duration: 156 }
          ]
        }

        return NextResponse.json({
          success: true,
          data: testResult,
          message: 'Function tests completed successfully'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing function request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}