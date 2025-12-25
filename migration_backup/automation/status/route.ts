import { NextRequest, NextResponse } from 'next/server'
import { AutomationService } from '@/lib/automation-service'

export async function GET() {
  try {
    const result = await AutomationService.getStatus()
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Status check failed',
        error: error.message 
      },
      { status: 500 }
    )
  }
}