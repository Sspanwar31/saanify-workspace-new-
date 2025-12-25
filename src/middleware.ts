import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper: JWT Token ko decode karne ke liye
function decodeJwtPayload(tokenValue: string) {
  try {
    const base64Url = tokenValue.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Public routes that don't require authentication
const publicRoutePatterns = [
  "/",
  "/login",
  "/signup", 
  "/api/auth",
  "/api/auth/",
  "/api/backup",
  "/api/admin/automation",
  "/api/integrations",
  "/api/health",
  "/api/test",
  "/api/check-users",
  "/api/force-create-user",
  "/api/fix-test-user",
  "/api/fix-client-role",
  "/api/customers",
  "/api/socket",
  "/api/notifications",
  "/api/supabase",
  "/api/database",
  "/api/run-migrations",
  "/api/security-test",
  "/api/create-demo",
  "/api/github-integration",
  "/api/check-supabase",
  "/api/glm",
  "/api/ai",
  "/api/users",
  "/api/clients",
  "/api/uploads",
  "/not-authorized",
  "/favicon.ico",
  "/_next"
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware entirely for API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow uploads directory without authentication
  if (pathname.startsWith('/uploads/')) {
    return NextResponse.next();
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return pathname.startsWith(pattern);
    }
    return pathname === pattern || pathname.startsWith(pattern + '/');
  });

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = req.cookies.get("auth-token");

  // If no token and not a public route, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Decode token to get user info
  const user = decodeJwtPayload(token.value);
  
  // If token is invalid, clear it and redirect to login
  if (!user) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("auth-token");
    return response;
  }

  const userRole = user?.role?.toUpperCase() || 'CLIENT';

  // Role-based routing logic
  if (pathname.startsWith("/admin")) {
    // Only ADMIN role can access admin routes
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL("/client", req.url));
    }
  }

  if (pathname.startsWith("/client")) {
    // Only CLIENT role can access client routes
    if (userRole !== 'CLIENT') {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
  }

  // Redirect old dashboard/client routes to new /client routes
  if (pathname.startsWith("/dashboard/client")) {
    const newPath = pathname.replace("/dashboard/client", "/client");
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  if (pathname.startsWith("/dashboard/admin")) {
    // Only ADMIN role can access admin dashboard
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL("/client", req.url));
    }
  }

  // Handle root dashboard redirect based on role
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    } else {
      return NextResponse.redirect(new URL("/client", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except API routes and static files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};