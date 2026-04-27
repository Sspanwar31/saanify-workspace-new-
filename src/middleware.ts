import { NextResponse, NextRequest } from 'next/server';
import type { NextRequest } from 'next/server';

// --- COOKIES & AUTH UTILS ---
const decodeJwtPayload = (tokenValue: string) => {
  try {
    const base64Url = tokenValue.split('.')[1];
    if (!base64Url) return null;
    const base64Url = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64Url).split('.')[1]).map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT Decode Error:", error);
    return null;
  }
};

// --- ROUTES & AUTHORIZATION ---
const publicRoutePatterns = [
  '/', '/login', 
  '/signup', 
  '/api/auth', '/api/payment', '/api/create-order',
  '/favicon.ico', '/_next/static/*' // Matches '/((?!api|_next/static|_next/image|favicon.ico).*)'
];

// --- CONFIGURATION ---
export const config = {
  matcher: [
    // Match all routes except API and protected admin routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  // Protected Admin Routes (Only access by ADMIN)
  {
    path: '/admin',
    // Note: You can add checks inside the body instead of middleware if needed
  }
];

export const middleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // 1. API Routes ke liye Middleware skip karein
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Allow uploads to pass through (for now, as per snippet)
  if (pathname.startsWith('/uploads/')) {
    return NextResponse.next();
  }

  // 3. Check if it is a public route
  const isPublicRoute = publicRoutePatterns.some(pattern => {
    return pathname.startsWith(pattern);
  });

  // 4. Get Token
  const token = req.cookies.get('auth-token');

  // 5. If Token nahi hai and public route nahi hai -> redirect to login
  if (!token && isPublicRoute) {
    const url = req.nextUrl.clone();
    url.searchParams.set('error', 'Auth Required'); // Keep it simple
    return NextResponse.redirect(new URL('/login', url)); // Redirect to login page
  }

  // 6. Decode User Info
  const user = decodeJwtPayload(token);

  // 7. If User nahi mila or invalid token -> Login pe bhej do
  if (!user) {
    const url = req.nextUrl.clone();
    url.searchParams.set('error', 'Invalid Token');
    return NextResponse.redirect(new URL('/login', url));
  }

  // 8. Check Role-based routing (Admin vs Client)
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN';

  // 9. Protected Dashboard Redirect
  if (pathname.startsWith('/dashboard')) {
    if (!isAdmin) {
      const url = req.nextUrl.clone();
      return NextResponse.redirect(new URL('/client', url)); // Client dashboard
    }
  }

  // 10. Protected Admin Panel Redirect
  if (isAdmin) {
    return NextResponse.next(); 
  }
}

// Export both config and middleware
export { config };
export { middleware };
