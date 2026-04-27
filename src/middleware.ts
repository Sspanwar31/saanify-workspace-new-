import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- JWT DECODER FIX ---
function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // Buffer use karna server-side par zyada stable hai
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded;
  } catch (error) {
    return null;
  }
}

// --- CONFIGURATION ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (public uploads)
     */
    '/((?!api|_next/static|_next/image|uploads|favicon.ico).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 1. Get Token Value Safely
  const tokenObj = req.cookies.get('auth-token');
  const token = tokenObj?.value;

  // 2. Define Public Routes
  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/signup';

  // 3. LOGIC: Agar Token nahi hai aur rasta Protected hai -> Login par bhejo
  if (!token) {
    if (isPublicRoute) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. LOGIC: Agar Token hai toh Decode karo
  const user = decodeJwt(token);

  // 5. Agar Token kharab hai -> Cookie delete karo aur Login bhejo
  if (!user) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // 6. ROLE BASED ROUTING
  const userRole = (user.role || 'CLIENT').toUpperCase();

  // A. Agar login hai aur Login/Signup page kholne ki koshish kare -> Dashboard bhejo
  if (isPublicRoute) {
    const target = userRole === 'ADMIN' ? '/admin' : '/client/dashboard';
    return NextResponse.redirect(new URL(target, req.url));
  }

  // B. Admin routes protection
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/client/dashboard', req.url));
  }

  // C. Client routes protection
  if (pathname.startsWith('/client') && userRole === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // D. Root /dashboard shortcut handling
  if (pathname === '/dashboard') {
    const target = userRole === 'ADMIN' ? '/admin' : '/client/dashboard';
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}
