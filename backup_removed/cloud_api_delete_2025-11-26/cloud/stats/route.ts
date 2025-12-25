import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock data for cloud statistics
    const stats = {
      storageUsed: 45.2 + Math.random() * 5, // GB
      storageLimit: 100, // GB
      functionsDeployed: 12 + Math.floor(Math.random() * 5),
      aiCalls: 15420 + Math.floor(Math.random() * 1000),
      aiCost: 127.50 + Math.random() * 20,
      aiTokens: 2450000 + Math.floor(Math.random() * 100000)
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cloud stats'
    }, { status: 500 })
  }
}