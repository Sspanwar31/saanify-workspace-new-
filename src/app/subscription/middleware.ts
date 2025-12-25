import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decodeJwtPayload } from '@/lib/auth-helpers'

// Middleware to check trial expiry
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for non-subscription routes and client subscription routes
  if (!pathname.startsWith('/subscription') || pathname.startsWith('/client/subscription')) {
    return NextResponse.next()
  }

  try {
    // Get user from session
    const cookies = request.cookies.getAll()
    const authCookie = cookies.find(cookie => cookie.name === 'auth-token')
    const token = authCookie?.value

    if (!token) {
      return NextResponse.next()
    }

    // Get user from token
    let user = null
    try {
      user = decodeJwtPayload(token)
    } catch (error) {
      console.log(`🔐 Middleware: JWT verification failed, trying decode fallback`)
      user = decodeJwtPayload(token)
    }

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const userRole = user?.role?.toUpperCase() || 'CLIENT'
    console.log(`🔐 Middleware: User role detected as ${userRole} for ${pathname}`)

    // Check user's trial expiry
    const societyAccount = await db.societyAccount.findFirst({
      where: { userId: user.userId }
    })

    if (!societyAccount || societyAccount.subscriptionPlan !== 'TRIAL') {
      return NextResponse.next()
    }

    const trialEndsAt = societyAccount.trialEndsAt ? new Date(societyAccount.trialEndsAt) : null
    const daysRemaining = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 24)) : 0

    // If trial expires in 3 days, send warning
    if (daysRemaining <= 3 && daysRemaining > 0) {
      await db.notification.create({
        data: {
          userId: user.userId,
          type: 'TRIAL_EXPIRY_WARNING',
          title: 'Trial Expiring Soon',
          message: `Your trial period expires in ${daysRemaining} days. Please subscribe to continue using our services.`,
          data: {
            daysRemaining,
            expiryDate: trialEndsAt
          }
        }
      })
    }

    return NextResponse.next()
  } catch (error) {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/subscription/:path*',
    '/dashboard/:path*',
    '!/client/subscription/:path*',
  ],
};