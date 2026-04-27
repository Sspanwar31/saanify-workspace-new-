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

  // 🚀 5. REDIRECT LOGIC (NEW)
  
  // A. Agar login hai aur Login/Signup page par hai -> Sahi dashboard par bhejo
  if (isPublicRoute) {
    const target = userRole === 'ADMIN' ? '/admin' : '/dashboard'; // ✅ Client to /dashboard
    return NextResponse.redirect(new URL(target, req.url));
  }

  // B. Admin routes protection
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url)); // ✅ Redirect non-admins to /dashboard
  }

  // C. Old /client routes protection (Cleanup)
  if (pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/dashboard', req.url)); // ✅ Old links to new /dashboard
  }

  // D. Handle root /dashboard redirect based on Admin role
  if (pathname === '/dashboard') {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    // Clients remain on /dashboard
    return NextResponse.next();
  }

  return NextResponse.next();
}
