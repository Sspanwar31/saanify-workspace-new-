import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Quick setup test endpoint working',
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Quick setup POST test working',
      sql: '-- Test SQL script for automation_logs\nCREATE TABLE IF NOT EXISTS automation_logs (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  task_name TEXT NOT NULL,\n  status TEXT NOT NULL,\n  duration_ms INTEGER,\n  details TEXT,\n  error TEXT,\n  run_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);',
      instructions: [
        '1. This is a test response',
        '2. The real quick-setup should work similarly',
        '3. Check browser console for errors'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}