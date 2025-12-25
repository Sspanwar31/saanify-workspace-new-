import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function getClientAuth(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return { 
        authenticated: false, 
        error: 'No authentication token found',
        user: null 
      }
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      return { 
        authenticated: false, 
        error: 'Invalid authentication token',
        user: null 
      }
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        subscriptionStatus: true,
        plan: true,
        trialEndsAt: true,
        expiryDate: true,
        createdAt: true
      }
    })

    if (!user) {
      return { 
        authenticated: false, 
        error: 'User not found in database',
        user: null 
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return { 
        authenticated: false, 
        error: 'Account is inactive',
        user: null 
      }
    }

    // Check if user is a legitimate client (demo or real)
    const isLegitimateClient = 
      user.role === 'CLIENT' && 
      (user.email === 'client1@gmail.com' || // Demo client
       user.email === 'client@saanify.com' || // Demo client
       user.subscriptionStatus === 'TRIAL' || // Real trial user
       user.subscriptionStatus === 'ACTIVE')   // Real paid user

    if (!isLegitimateClient) {
      return { 
        authenticated: false, 
        error: 'Access denied. Only legitimate clients can access this panel.',
        user: null 
      }
    }

    // Check subscription validity
    const now = new Date()
    const expiryDate = user.expiryDate || user.trialEndsAt

    if (expiryDate && new Date(expiryDate) < now) {
      return { 
        authenticated: false, 
        error: 'Subscription has expired',
        user: null 
      }
    }

    return { 
      authenticated: true, 
      error: null,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        plan: user.plan,
        trialEndsAt: user.trialEndsAt,
        expiryDate: user.expiryDate
      }
    }

  } catch (error) {
    console.error('Client authentication error:', error)
    return { 
      authenticated: false, 
      error: 'Authentication system error',
      user: null 
    }
  }
}

// Middleware function to protect client routes
export async function withClientAuth(request: NextRequest) {
  const auth = await getClientAuth(request)
  
  if (!auth.authenticated) {
    return NextResponse.json({
      success: false,
      error: auth.error || 'Authentication failed',
      redirectTo: '/login'
    }, { status: 401 })
  }

  return { user: auth.user }
}