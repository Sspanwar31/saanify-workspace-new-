import jwt from 'jsonwebtoken'
// Import db directly to avoid path alias issues in server-side
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'

export interface TokenPayload {
  userId: string
  email: string
  role: string
  type: 'access' | 'refresh'
}

export interface RefreshTokenPayload {
  userId: string
  email: string
  type: 'refresh'
}

// Generate access token
export const generateAccessToken = (user: { id: string; email: string; role: string }) => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'saanify',
    audience: 'saanify-users'
  })
}

// Generate refresh token
export const generateRefreshToken = (user: { id: string; email: string }) => {
  const payload: RefreshTokenPayload = {
    userId: user.id,
    email: user.email,
    type: 'refresh'
  }

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'saanify',
    audience: 'saanify-users'
  })
}

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'saanify',
      audience: 'saanify-users'
    }) as TokenPayload

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Access token verification failed:', error)
    return null
  }
}

// Verify refresh token
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'saanify',
      audience: 'saanify-users'
    }) as RefreshTokenPayload

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

// Refresh access token using refresh token
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      throw new Error('Invalid refresh token')
    }

    // Get user from database to ensure they still exist and are active
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive')
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    })

    return {
      accessToken,
      refreshToken // Return same refresh token
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw error
  }
}

// Generate token pair
export const generateTokenPair = (user: { id: string; email: string; role: string }) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  }
}

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.replace('Bearer ', '')
}

// Get token expiration time
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000)
    }
    return null
  } catch (error) {
    return null
  }
}

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token)
  if (!expiration) {
    return true
  }
  return expiration < new Date()
}