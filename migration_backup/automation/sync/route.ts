import { NextRequest, NextResponse } from 'next/server'
import { AutomationService } from '@/lib/automation-service'

export async function POST() {
  try {
    const result = await AutomationService.syncSchema()
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Schema sync error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Schema sync failed',
        error: error.message 
      },
      { status: 500 }
    )
  }
}