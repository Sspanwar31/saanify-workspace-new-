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
  
  // 🚀 STEP 1: Pehle Impersonation Token check karein, fir normal auth-token
  const impToken = req.cookies.get('impersonation_token')?.value;
  const authToken = req.cookies.get('auth-token')?.value;
  
  // Jo bhi token mile use use karein (Impersonation ko priority dein)
  const token = impToken || authToken;

  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/signup';

  // 2. No Token -> Go to Login
  if (!token) {
    if (isPublicRoute) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. Decode Token
  const user = decodeJwt(token);
  if (!user) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('auth-token');
    response.cookies.delete('impersonation_token');
    return response;
  }

  // Impersonation ke waqt hum hamesha usey 'authenticated' (Client) maante hain
  const userRole = (user.role || 'CLIENT').toUpperCase();

  // 🚀 4. REDIRECT LOGIC
  
  if (isPublicRoute) {
    // Agar Impersonating hai toh seedha dashboard
    if (impToken) return NextResponse.redirect(new URL('/dashboard', req.url));
    const target = userRole === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Dashboard protection
  if (pathname.startsWith('/dashboard')) {
    // Agar Admin bina impersonation ke yahan aaye toh wapas bhejo
    if (userRole === 'ADMIN' && !impToken) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Agar impersonation chal raha hai toh Admin panel allow nahi hai (kyunki ab aap client ho)
    if (userRole !== 'ADMIN' || impToken) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // C. Old /client routes protection (Retained from original code)
  if (pathname.startsWith('/client')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}
