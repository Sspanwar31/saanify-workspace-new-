import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

// Temporary bypass for demo - remove in production
const DEMO_MODE = true

export const GET = DEMO_MODE ? async (request: NextRequest) => {
  try {
    // Fetch secrets from database including values for demo
    const secrets = await db.secret.findMany({
      orderBy: {
        key: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      secrets: secrets.map(secret => ({
        id: secret.id,
        name: secret.key,
        value: secret.value,
        description: secret.description,
        lastRotated: secret.lastRotated?.toISOString(),
        createdAt: secret.createdAt?.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching secrets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch secrets' },
      { status: 500 }
    )
  }
} : withAdmin(async (request: AuthenticatedRequest) => {
  try {
    // Fetch secrets from database including values for authenticated admins
    const secrets = await db.secret.findMany({
      orderBy: {
        key: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      secrets: secrets.map(secret => ({
        id: secret.id,
        name: secret.key,
        value: secret.value,
        description: secret.description,
        lastRotated: secret.lastRotated?.toISOString(),
        createdAt: secret.createdAt?.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching secrets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch secrets' },
      { status: 500 }
    )
  }
})

export const POST = DEMO_MODE ? async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { name: key, value, description } = body

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: 'Name and value are required' },
        { status: 400 }
      )
    }

    // Check if secret with this key already exists
    const existingSecret = await db.secret.findUnique({
      where: { key }
    })

    if (existingSecret) {
      return NextResponse.json(
        { success: false, error: 'Secret with this key already exists' },
        { status: 409 }
      )
    }

    const newSecret = await db.secret.create({
      data: {
        key,
        value,
        description: description || '',
        lastRotated: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      secret: {
        id: newSecret.id,
        name: newSecret.key,
        value: newSecret.value,
        description: newSecret.description,
        lastRotated: newSecret.lastRotated?.toISOString(),
        createdAt: newSecret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create secret' },
      { status: 500 }
    )
  }
} : withAdmin(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { name: key, value, description } = body

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: 'Name and value are required' },
        { status: 400 }
      )
    }

    // Check if secret with this key already exists
    const existingSecret = await db.secret.findUnique({
      where: { key }
    })

    if (existingSecret) {
      return NextResponse.json(
        { success: false, error: 'Secret with this key already exists' },
        { status: 409 }
      )
    }

    const newSecret = await db.secret.create({
      data: {
        key,
        value,
        description: description || '',
        lastRotated: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      secret: {
        id: newSecret.id,
        name: newSecret.key,
        value: newSecret.value,
        description: newSecret.description,
        lastRotated: newSecret.lastRotated?.toISOString(),
        createdAt: newSecret.createdAt?.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create secret' },
      { status: 500 }
    )
  }
})

export const DELETE = DEMO_MODE ? async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Secret ID is required' },
        { status: 400 }
      )
    }

    // Check if secret exists
    const existingSecret = await db.secret.findUnique({
      where: { id }
    })

    if (!existingSecret) {
      return NextResponse.json(
        { success: false, error: 'Secret not found' },
        { status: 404 }
      )
    }

    // Delete secret
    await db.secret.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Secret deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete secret' },
      { status: 500 }
    )
  }
} : withAdmin(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Secret ID is required' },
        { status: 400 }
      )
    }

    // Check if secret exists
    const existingSecret = await db.secret.findUnique({
      where: { id }
    })

    if (!existingSecret) {
      return NextResponse.json(
        { success: false, error: 'Secret not found' },
        { status: 404 }
      )
    }

    // Delete the secret
    await db.secret.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Secret deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting secret:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete secret' },
      { status: 500 }
    )
  }
})