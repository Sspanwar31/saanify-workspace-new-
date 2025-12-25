import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  return NextResponse.json({
    success: true,
    message: 'Authentication test successful',
    user: req.user,
    timestamp: new Date().toISOString()
  })
})

export const POST = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    return NextResponse.json({
      success: true,
      message: 'POST authentication test successful',
      received_data: body,
      user: req.user,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request body',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
})