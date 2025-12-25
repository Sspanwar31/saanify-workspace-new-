// Centralized error handling system for Next.js API routes
import { NextResponse } from 'next/server';

// Custom API Error class with additional context
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any,
    public category: 'validation' | 'database' | 'authentication' | 'authorization' | 'business' | 'system' = 'system'
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Ensure proper error capture
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// Specific error types for better categorization
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details, 'validation');
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details, 'database');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, identifier }, 'business');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details, 'business');
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', undefined, 'authentication');
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', undefined, 'authorization');
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR', undefined, 'system');
  }
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Enhanced error context for logging
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  duration?: number;
  additionalData?: Record<string, any>;
}

// Main error handler function
export const handleApiError = (
  error: unknown,
  context?: Partial<ErrorContext>
): NextResponse => {
  // Generate request ID if not provided
  const requestId = context?.requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Build full error context
  const fullContext: ErrorContext = {
    requestId,
    timestamp: new Date().toISOString(),
    ...context
  };

  // Log the error with context
  logError(error, fullContext);

  // Handle different error types
  if (error instanceof ApiError) {
    return handleKnownApiError(error, fullContext);
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error, fullContext);
  }

  // Handle generic errors
  return handleGenericError(error, fullContext);
};

// Handle known API errors
const handleKnownApiError = (error: ApiError, context: ErrorContext): NextResponse => {
  const responseBody = {
    error: error.message,
    code: error.code,
    category: error.category,
    requestId: context.requestId,
    timestamp: context.timestamp,
    ...(process.env.NODE_ENV === 'development' && {
      details: error.details,
      stack: error.stack
    })
  };

  console.log(`📡 [API_ERROR] Sending response`, {
    requestId: context.requestId,
    statusCode: error.statusCode,
    category: error.category,
    code: error.code
  });

  return NextResponse.json(responseBody, {
    status: error.statusCode,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Error-Category': error.category,
      'X-Error-Code': error.code || 'UNKNOWN'
    }
  });
};

// Handle Prisma-specific errors
const handlePrismaError = (error: any, context: ErrorContext): NextResponse => {
  console.error('🗄️ [PRISMA_ERROR] Prisma error detected', {
    error: error.message,
    code: error.code,
    meta: error.meta,
    requestId: context.requestId
  });

  // Map Prisma error codes to API errors
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return handleKnownApiError(
        new ConflictError(
          'Resource already exists',
          {
            field: error.meta?.target?.[0],
            value: error.meta?.target?.[1]
          }
        ),
        context
      );

    case 'P2025':
      // Record not found
      return handleKnownApiError(
        new NotFoundError(
          error.meta?.modelName || 'Resource',
          error.meta?.where?.id?.toString()
        ),
        context
      );

    case 'P2003':
      // Foreign key constraint violation
      return handleKnownApiError(
        new ValidationError(
          'Referenced resource does not exist',
          {
            field: error.meta?.field_name,
            constraint: error.meta?.constraint_name
          }
        ),
        context
      );

    case 'P2014':
      // Relation violation
      return handleKnownApiError(
        new ValidationError(
          'Cannot delete resource due to existing relations',
          {
            relations: error.meta?.relation_name
          }
        ),
        context
      );

    default:
      return handleKnownApiError(
        new DatabaseError(
          'Database operation failed',
          {
            prismaCode: error.code,
            prismaMeta: error.meta
          }
        ),
        context
      );
  }
};

// Handle generic errors
const handleGenericError = (error: unknown, context: ErrorContext): NextResponse => {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  const stack = error instanceof Error ? error.stack : undefined;

  console.error('💥 [GENERIC_ERROR] Generic error caught', {
    error: message,
    stack,
    requestId: context.requestId,
    type: error instanceof Error ? error.constructor.name : typeof error
  });

  const responseBody = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: context.requestId,
    timestamp: context.timestamp,
    ...(process.env.NODE_ENV === 'development' && {
      details: message,
      stack
    })
  };

  return NextResponse.json(responseBody, {
    status: 500,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Error-Category': 'system',
      'X-Error-Code': 'INTERNAL_ERROR'
    }
  });
};

// Check if error is a Prisma error
const isPrismaError = (error: any): boolean => {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('P')
  );
};

// Enhanced logging function
const logError = (error: unknown, context: ErrorContext): void => {
  const severity = determineErrorSeverity(error);
  
  const logData = {
    severity,
    requestId: context.requestId,
    timestamp: context.timestamp,
    method: context.method,
    url: context.url,
    userId: context.userId,
    userAgent: context.userAgent,
    ip: context.ip,
    duration: context.duration,
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      category: (error as ApiError)?.category
    },
    additionalData: context.additionalData
  };

  // Log based on severity
  switch (severity) {
    case 'critical':
      console.error('🚨 [CRITICAL_ERROR]', logData);
      break;
    case 'high':
      console.error('❌ [HIGH_ERROR]', logData);
      break;
    case 'medium':
      console.warn('⚠️ [MEDIUM_ERROR]', logData);
      break;
    case 'low':
      console.info('ℹ️ [LOW_ERROR]', logData);
      break;
  }
};

// Determine error severity based on error type and status code
const determineErrorSeverity = (error: unknown): ErrorSeverity => {
  if (error instanceof ApiError) {
    switch (error.category) {
      case 'system':
        return error.statusCode >= 500 ? 'critical' : 'high';
      case 'database':
        return error.statusCode >= 500 ? 'high' : 'medium';
      case 'authentication':
      case 'authorization':
        return 'medium';
      case 'validation':
        return 'low';
      case 'business':
        return error.statusCode >= 500 ? 'medium' : 'low';
    }
  }

  if (isPrismaError(error)) {
    const prismaError = error as any;
    switch (prismaError.code) {
      case 'P2002':
      case 'P2025':
        return 'low';
      case 'P2003':
      case 'P2014':
        return 'medium';
      default:
        return 'high';
    }
  }

  // Default to high for unknown errors
  return 'high';
};

// Middleware for error handling in API routes
export const withErrorHandling = (
  handler: (req: Request, context?: any) => Promise<Response>,
  options?: {
    includeRequestData?: boolean;
    logRequestBody?: boolean;
  }
) => {
  return async (req: Request, context?: any) => {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract request context
    const url = req.url;
    const method = req.method;
    const userAgent = req.headers.get('user-agent') || undefined;
    const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';

    try {
      console.log(`🚀 [API_REQUEST] ${method} ${url}`, {
        requestId,
        method,
        url,
        userAgent,
        ip
      });

      // Execute the handler
      const response = await handler(req, context);

      // Log successful completion
      const duration = Date.now() - startTime;
      console.log(`✅ [API_SUCCESS] ${method} ${url}`, {
        requestId,
        duration: `${duration}ms`,
        status: response.status
      });

      // Add request ID to response headers
      if (response instanceof Response) {
        response.headers.set('X-Request-ID', requestId);
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle the error with context
      return handleApiError(error, {
        requestId,
        method,
        url,
        userAgent,
        ip,
        duration,
        additionalData: options?.includeRequestData ? {
          headers: Object.fromEntries(req.headers.entries()),
          ...(options?.logRequestBody && { body: await getRequestBody(req) })
        } : undefined
      });
    }
  };
};

// Helper to get request body safely
const getRequestBody = async (req: Request): Promise<any> => {
  try {
    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await req.clone().json();
    }
    return '[Non-JSON body]';
  } catch {
    return '[Unparseable body]';
  }
};

// Error monitoring and analytics
export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorsByStatus: Record<number, number>;
  recentErrors: Array<{
    timestamp: string;
    code: string;
    category: string;
    message: string;
  }>;
}

class ErrorMonitor {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCategory: {},
    errorsByCode: {},
    errorsByStatus: {},
    recentErrors: []
  };

  recordError(error: ApiError | any): void {
    this.metrics.totalErrors++;
    
    const category = error.category || 'unknown';
    const code = error.code || 'UNKNOWN';
    const status = error.statusCode || 500;
    
    this.metrics.errorsByCategory[category] = (this.metrics.errorsByCategory[category] || 0) + 1;
    this.metrics.errorsByCode[code] = (this.metrics.errorsByCode[code] || 0) + 1;
    this.metrics.errorsByStatus[status] = (this.metrics.errorsByStatus[status] || 0) + 1;
    
    this.metrics.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      code,
      category,
      message: error.message
    });
    
    // Keep only last 50 errors
    if (this.metrics.recentErrors.length > 50) {
      this.metrics.recentErrors = this.metrics.recentErrors.slice(0, 50);
    }
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByCode: {},
      errorsByStatus: {},
      recentErrors: []
    };
  }
}

export const errorMonitor = new ErrorMonitor();

// Export convenience functions
export const createValidationError = (message: string, details?: any) => new ValidationError(message, details);
export const createDatabaseError = (message: string, details?: any) => new DatabaseError(message, details);
export const createNotFoundError = (resource: string, identifier?: string) => new NotFoundError(resource, identifier);
export const createConflictError = (message: string, details?: any) => new ConflictError(message, details);
export const createAuthError = (message?: string) => new AuthenticationError(message);
export const createAuthzError = (message?: string) => new AuthorizationError(message);
export const createRateLimitError = (message?: string) => new RateLimitError(message);

console.log('🔧 Centralized error handling system initialized');