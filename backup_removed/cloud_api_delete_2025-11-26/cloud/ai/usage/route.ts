import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock AI usage data
    const usage = {
      totalCalls: 892,
      todayCalls: 156,
      avgResponseTime: '1.2s',
      cost: '$127.50',
      topModels: [
        { name: 'GPT-4', calls: 401, percentage: 45 },
        { name: 'Claude-3', calls: 267, percentage: 30 },
        { name: 'DALL-E 3', calls: 124, percentage: 15 }
      ],
      dailyTrend: [
        { date: '2024-01-15', calls: 892 },
        { date: '2024-01-14', calls: 756 },
        { date: '2024-01-13', calls: 623 }
      ]
    }
    
    return NextResponse.json(usage)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI usage' },
      { status: 500 }
    )
  }
}