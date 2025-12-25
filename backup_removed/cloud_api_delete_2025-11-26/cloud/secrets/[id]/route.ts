import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

// Temporary bypass for demo - remove in production
const DEMO_MODE = true

export const GET = DEMO_MODE ? async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    const secret = await db.secret.findUnique({
      where: { id }
    })
    
    if (!secret) {
      return NextResponse.json({
        success: false,
        error: 'Secret not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      secret: {
        id: secret.id,
        name: secret.key,
        value: secret.value,
        description: secret.description,
        lastRotated: secret.lastRotated?.toISOString(),
        createdAt: secret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch secret' },
      { status: 500 }
    )
  }
} : withAdmin(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    
    const secret = await db.secret.findUnique({
      where: { id }
    })
    
    if (!secret) {
      return NextResponse.json({
        success: false,
        error: 'Secret not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      secret: {
        id: secret.id,
        name: secret.key,
        value: secret.value,
        description: secret.description,
        lastRotated: secret.lastRotated?.toISOString(),
        createdAt: secret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch secret' },
      { status: 500 }
    )
  }
})

export const PUT = DEMO_MODE ? async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json()
    
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

    // Update secret, preserving lastRotated date unless value changed
    const updateData: any = {
      description: body.description,
      updatedAt: new Date()
    }

    // Only update lastRotated if value changed (rotation)
    if (body.value && body.value !== existingSecret.value) {
      updateData.value = body.value
      updateData.lastRotated = new Date()
    }

    const updatedSecret = await db.secret.update({
      where: { id },
      data: updateData
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
    console.error('Failed to update secret:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update secret'
    }, { status: 500 })
  }
} : withAdmin(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params
    const body = await request.json()
    
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

    // Update secret, preserving lastRotated date unless value changed
    const updateData: any = {
      description: body.description,
      updatedAt: new Date()
    }

    // Only update lastRotated if value changed (rotation)
    if (body.value && body.value !== existingSecret.value) {
      updateData.value = body.value
      updateData.lastRotated = new Date()
    }

    const updatedSecret = await db.secret.update({
      where: { id },
      data: updateData
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
    console.error('Failed to update secret:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update secret'
    }, { status: 500 })
  }
})

export const DELETE = DEMO_MODE ? async (
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

    // Delete to secret
    await db.secret.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      secret: {
        id: existingSecret.id,
        name: existingSecret.key,
        value: existingSecret.value,
        description: existingSecret.description,
        lastRotated: existingSecret.lastRotated?.toISOString(),
        createdAt: existingSecret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to delete secret:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete secret'
    }, { status: 500 })
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

    // Delete the secret
    await db.secret.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      secret: {
        id: existingSecret.id,
        name: existingSecret.key,
        value: existingSecret.value,
        description: existingSecret.description,
        lastRotated: existingSecret.lastRotated?.toISOString(),
        createdAt: existingSecret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to delete secret:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete secret'
    }, { status: 500 })
  }
})