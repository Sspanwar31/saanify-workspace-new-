import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize, AuthenticatedUser } from '@/lib/auth-helpers';

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

/**
 * Security middleware to prevent superadmin role creation/assignment
 * This provides an additional layer of protection beyond database constraints
 */
export function securityMiddleware(req: NextRequest) {
  const url = req.nextUrl;
  const method = req.method;

  // Only apply to user creation/modification endpoints
  const protectedEndpoints = [
    '/api/users',
    '/api/admin/users',
    '/api/auth/register',
    '/api/admin/create-user'
  ];

  const isProtectedEndpoint = protectedEndpoints.some(endpoint => 
    url.pathname.startsWith(endpoint)
  );

  if (!isProtectedEndpoint) {
    return NextResponse.next();
  }

  // Parse request body for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const body = req.body ? JSON.parse(req.body as any) : {};
      
      // Block any request containing superadmin role
      const roleToCheck = body?.role || body?.user?.role;
      
      if (roleToCheck && (
        roleToCheck === 'superadmin' || 
        roleToCheck.toLowerCase() === 'superadmin' ||
        roleToCheck.toUpperCase() === 'SUPERADMIN'
      )) {
        return NextResponse.json(
          { 
            error: "Superadmin role is permanently disabled for security reasons.",
            code: "SUPERADMIN_BLOCKED"
          }, 
          { status: 403 }
        );
      }

      // Additional check for role updates in nested objects
      if (body?.updates?.role || body?.data?.role) {
        const updateRole = body.updates?.role || body.data?.role;
        
        if (updateRole && (
          updateRole === 'superadmin' || 
          updateRole.toLowerCase() === 'superadmin' ||
          updateRole.toUpperCase() === 'SUPERADMIN'
        )) {
          return NextResponse.json(
            { 
              error: "Superadmin role assignment is permanently disabled.",
              code: "SUPERADMIN_UPDATE_BLOCKED"
            }, 
            { status: 403 }
          );
        }
      }

    } catch (error) {
      // If we can't parse the body, let it continue to other middleware
      console.warn('Security middleware: Could not parse request body');
    }
  }

  return NextResponse.next();
}

/**
 * Helper function to check if a role is blocked
 */
export function isBlockedRole(role: string): boolean {
  if (!role) return false;
  
  const blockedVariations = ['superadmin', 'Superadmin', 'SUPERADMIN'];
  return blockedVariations.includes(role);
}

/**
 * Wrapper for API routes to include security check
 */
export function withSecurity(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    // Apply security middleware
    const securityResult = securityMiddleware(req);
    
    // If security middleware returns a response, it means the request was blocked
    if (securityResult.status !== 200) {
      return securityResult;
    }

    // Continue with the original handler
    return handler(req, ...args);
  };
}

/**
 * Wrapper for API routes that require client authentication
 */
export function withClient(handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    // Authenticate and authorize user
    const authResult = await authenticateAndAuthorize(req, 'CLIENT');
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error.includes('token') ? 401 : 403 }
      );
    }

    // Add user to request object
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = authResult.user;

    // Continue with the original handler with all arguments
    return handler(authenticatedReq, ...args);
  };
}

/**
 * Wrapper for API routes that require admin authentication
 */
export function withAdmin(handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    // Authenticate and authorize user
    const authResult = await authenticateAndAuthorize(req, 'ADMIN');
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error.includes('token') ? 401 : 403 }
      );
    }

    // Add user to request object
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = authResult.user;

    // Continue with the original handler with all arguments
    return handler(authenticatedReq, ...args);
  };
}