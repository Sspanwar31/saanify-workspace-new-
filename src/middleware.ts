import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- JWT DECODER ---
function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded;
  } catch (error) {
    return null;
  }
}

// --- CONFIGURATION ---
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|uploads|favicon.ico).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 1. Get Token Safely
  const tokenObj = req.cookies.get('auth-token');
  const token = tokenObj?.value;

  // ❌ REMOVED: const isImpersonating = req.cookies.get('impersonating')?.value === 'true';

  // 2. Define Public Routes
  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/signup';

  // 3. LOGIC: No Token -> Go to Login
  if (!token) {
    if (isPublicRoute) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. LOGIC: Valid Token -> Check Role
  const user = decodeJwt(token);

  if (!user) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('auth-token');
    return response;
  }

  const userRole = (user.role || 'CLIENT').toUpperCase();

  // 🚀 5. REDIRECT LOGIC
  
  // A. Agar login hai aur Login/Signup page par hai -> Sahi dashboard par bhejo
  if (isPublicRoute) {
    const target = userRole === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(target, req.url));
  }

  // B. Admin routes protection
  if (pathname.startsWith('/admin')) {
    // No need for explicit impersonation check here anymore.
    // If real impersonation is active, the userRole will be 'CLIENT', so this check handles it.
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // C. Old /client routes protection
  if (pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ✅ UPDATED: /dashboard logic (Clean Version)
  if (pathname === '/dashboard') {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}
