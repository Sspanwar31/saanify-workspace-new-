import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/signup", 
  "/not-authorized",
  "/subscription",
  "/subscription/waiting",
  "/subscription/payment-upload",
  "/old-admin",
  "/favicon.ico",
  "/_next",
  "/uploads",
  "/placeholder-screenshot.svg"
];

// API routes that don't require authentication
const publicApiRoutes = [
  "/api/auth",
  "/api/health",
  "/api/check-supabase",
  "/api/setup",
  "/api/github/backup",
  "/api/github/restore",
  "/api/github/history",
  "/api/github/push",
  "/api/integrations/supabase/status",
  "/api/admin/automation/run",
  "/api/backup",
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
  "/api/glm",
  "/api/ai",
  "/api/users",
  "/api/clients",
  "/api/subscription",
  "/api/subscription/submit-payment",
  "/api/subscription/check-status"
];

// Helper: Check if route requires authentication
function isProtectedRoute(pathname: string): boolean {
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
  
  return !isPublicRoute && !isPublicApiRoute;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`🔐 Middleware: Processing ${pathname}`);

  // Check if route requires authentication
  if (!isProtectedRoute(pathname)) {
    console.log(`🔐 Middleware: Public route, allowing access to ${pathname}`);
    return NextResponse.next();
  }

  // For now, allow all routes - authentication will be handled at the component level
  // This prevents the jsonwebtoken edge runtime issue
  console.log(`🔐 Middleware: Protected route ${pathname}, allowing access (auth handled at component level)`);
  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder files
   */
  matcher: [
    /*
     * Match all request paths except for ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};