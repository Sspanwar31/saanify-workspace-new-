// Authentication Middleware for Supabase
import { createMiddleware } from 'next-intl/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

export default createMiddleware(async (req) => {
  // ✅ CHANGE: Skip authentication for API routes and static files
  // Routes starting with /api/, /_next/, or static assets are skipped
  if (
    req.nextUrl.pathname.startsWith('/api/') ||
    req.nextUrl.pathname.startsWith('_next') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session token from cookies
  const token = req.cookies.get('sb-access-token');

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login'));
  }

  try {
    // For now, use SQLite authentication (existing system)
    // TODO: Replace with Supabase authentication when ready
    const prisma = new PrismaClient();
    
    // Verify token (simplified for now)
    const user = await prisma.user.findUnique({
      where: { email: 'ADMIN@saanify.com' }
    });
    
    if (!user) {
      // Clear invalid token
      const response = NextResponse.redirect(new URL('/login'));
      response.cookies.delete('sb-access-token');
      return response;
    }
    
    // Add user to request headers
    req.user = user;
    
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return NextResponse.redirect(new URL('/login'));
  }
});

export default authMiddleware;
