import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthenticatedUser {
  userId: string
  email: string
  name: string
  role: string
}

export async function authenticateAndAuthorize(request: NextRequest, requiredRole: string = 'ADMIN'): Promise<{ user: AuthenticatedUser; error?: string }> {
  // Get token from cookie
  const token = request.cookies.get("auth-token")?.value

  console.log('🔐 [DEBUG] authenticateAndAuthorize called:')
  console.log('  - Required Role:', requiredRole)
  console.log('  - Token from cookie:', token ? 'EXISTS' : 'MISSING')
  console.log('  - All cookies:', request.cookies.getAll())

  if (!token) {
    console.log('❌ [DEBUG] No authentication token found')
    return { user: null as any, error: 'No authentication token found' }
  }

  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
    console.log('✅ [DEBUG] JWT verification successful')
    console.log('  - Decoded userId:', decoded.userId)
    console.log('  - Decoded email:', decoded.email)
    console.log('  - Decoded role:', decoded.role)
  } catch (error) {
    console.log('❌ [DEBUG] JWT verification failed:', error.message)
    return { user: null as any, error: 'Invalid or expired token' }
  }

  const userRole = decoded.role?.toUpperCase() || ""
  console.log('🔍 [DEBUG] User role after normalization:', userRole)

  // Check if user has required role
  if (requiredRole === 'ADMIN' && userRole !== 'ADMIN') {
    console.log('❌ [DEBUG] Access denied - ADMIN privileges required')
    return { user: null as any, error: 'Access denied - ADMIN privileges required' }
  }

  if (requiredRole === 'ADMIN' && userRole !== 'ADMIN' && userRole !== 'ADMIN') {
    console.log('❌ [DEBUG] Access denied - Admin privileges required (duplicate check)')
    return { user: null as any, error: 'Access denied - Admin privileges required' }
  }

  if (requiredRole === 'CLIENT' && userRole !== 'CLIENT' && userRole !== 'ADMIN') {
    console.log('❌ [DEBUG] Access denied - Client privileges required')
    return { user: null as any, error: 'Access denied - Client privileges required' }
  }

  console.log('✅ [DEBUG] Authentication and authorization successful')
  return {
    user: {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: userRole
    }
  }
}

export function createUnauthorizedResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}

export function createForbiddenResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}