import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Check if we're in a development/preview environment that needs iframe support
  const isDevEnvironment = process.env.NODE_ENV === 'development' || 
                          request.headers.get('user-agent')?.includes('Z.ai') ||
                          request.headers.get('user-agent')?.includes('StackBlitz') ||
                          request.headers.get('referer')?.includes('stackblitz') ||
                          request.headers.get('referer')?.includes('z-ai')

  // Security headers to prevent iframe vulnerabilities
  const securityHeaders = {
    // Content Security Policy to control iframe permissions
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.tailwindcss.com https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.github.com https://checkout.razorpay.com https://api.razorpay.com",
      "frame-src 'self' https://checkout.razorpay.com https://api.github.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests"
    ].join('; '),

    // Permissions Policy for browser features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'payment=(self)',
      'clipboard-write=(self)',
      'web-share=(self)',
      'publickey-credentials-get=(self)',
      'publickey-credentials-create=(self)',
      'fullscreen=(self)',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'geolocation=()',
      'interest-cohort=()',
      'browsing-topics=()',
      'attribution-reporting=()'
    ].join(', '),

    // Additional security headers
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  }

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Set X-Frame-Options based on environment
  if (isDevEnvironment) {
    // In development/preview environments, allow iframe embedding
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    response.headers.set('Content-Security-Policy', 
      securityHeaders['Content-Security-Policy'].replace('frame-src \'self\'', 'frame-src *')
    )
  } else {
    // In production, use SAMEORIGIN for security
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }

  // Special handling for Razorpay and GitHub integration routes
  if (request.nextUrl.pathname.startsWith('/api/payment') || 
      request.nextUrl.pathname.startsWith('/api/github-integration-component')) {
    
    // More permissive CSP for payment and GitHub integration
    response.headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.tailwindcss.com https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
      "img-src 'self' data: blob: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://api.github.com https://checkout.razorpay.com https://api.razorpay.com; " +
      "frame-src 'self' https://checkout.razorpay.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    )

    // Allow specific permissions for payment processing
    response.headers.set('Permissions-Policy',
      'camera=(self), ' +
      'microphone=(self), ' +
      'payment=(self), ' +
      'clipboard-write=(self), ' +
      'web-share=(self), ' +
      'publickey-credentials-get=(self), ' +
      'publickey-credentials-create=(self), ' +
      'fullscreen=(self), ' +
      'accelerometer=(), ' +
      'gyroscope=(), ' +
      'magnetometer=(), ' +
      'geolocation=()'
    )
  }

  // Special handling for GitHub integration popup
  if (request.nextUrl.pathname.startsWith('/api/github-integration-component')) {
    // Remove X-Frame-Options to allow preview window display
    response.headers.delete('X-Frame-Options')
    response.headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://api.github.com; " +
      "frame-src 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}