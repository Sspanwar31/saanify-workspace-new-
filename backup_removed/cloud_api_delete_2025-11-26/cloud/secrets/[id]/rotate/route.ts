import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

// Temporary bypass for demo - remove in production
const DEMO_MODE = true

export const POST = DEMO_MODE ? async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    // Check if secret exists
    const existingSecret = await db.secret.findUnique({
      where: { id }
    })
    
    if (!existingSecret) {
      return NextResponse.json({
        success: false,
        error: 'Secret not found'
      }, { status: 404 })
    }

    // Generate new secret value (in production, use proper cryptographic methods)
    const newValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Math.random().toString(36).substring(2, 15) + '.' + Math.random().toString(36).substring(2, 15)
    
    // Update secret with new value and rotation timestamp
    const updatedSecret = await db.secret.update({
      where: { id },
      data: {
        value: newValue,
        lastRotated: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      secret: {
        id: updatedSecret.id,
        name: updatedSecret.key,
        value: updatedSecret.value,
        description: updatedSecret.description,
        lastRotated: updatedSecret.lastRotated?.toISOString(),
        createdAt: updatedSecret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error rotating secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to rotate secret' },
      { status: 500 }
    )
  }
} : withAdmin(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    // Check if secret exists
    const existingSecret = await db.secret.findUnique({
      where: { id }
    })
    
    if (!existingSecret) {
      return NextResponse.json({
        success: false,
        error: 'Secret not found'
      }, { status: 404 })
    }

    // Generate new secret value (in production, use proper cryptographic methods)
    const newValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Math.random().toString(36).substring(2, 15) + '.' + Math.random().toString(36).substring(2, 15)
    
    // Update secret with new value and rotation timestamp
    const updatedSecret = await db.secret.update({
      where: { id },
      data: {
        value: newValue,
        lastRotated: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      secret: {
        id: updatedSecret.id,
        name: updatedSecret.key,
        value: updatedSecret.value,
        description: updatedSecret.description,
        lastRotated: updatedSecret.lastRotated?.toISOString(),
        createdAt: updatedSecret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error rotating secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to rotate secret' },
      { status: 500 }
    )
  }
})