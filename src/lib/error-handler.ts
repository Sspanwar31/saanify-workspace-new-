export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, true, code)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTH_FAILED')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'ACCESS_DENIED')
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT')
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, true, 'DATABASE_ERROR')
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error') {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED')
  }
}

export function handleApiError(error: unknown): {
  statusCode: number
  message: string
  code?: string
  details?: any
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.isOperational ? undefined : { stack: error.stack }
    }
  }

  if (error instanceof Error) {
    console.error('Unexpected error:', error)
    return {
      statusCode: 500,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? { 
        stack: error.stack,
        message: error.message 
      } : undefined
    }
  }

  console.error('Unknown error:', error)
  return {
    statusCode: 500,
    message: 'Internal server error'
  }
}

export function createErrorResponse(error: unknown): Response {
  const { statusCode, message, code, details } = handleApiError(error)
  
  return new Response(
    JSON.stringify({
      error: message,
      code,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  )
}

export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      
      if (error instanceof Error) {
        console.error('Handler error:', error)
        throw new AppError(
          process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
          500,
          true
        )
      }
      
      throw new AppError('Internal server error', 500, true)
    }
  }
}

export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field])
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      'MISSING_FIELDS'
    )
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'INVALID_EMAIL')
  }
}

export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters`,
      'INVALID_LENGTH'
    )
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function logError(error: Error, context?: any): void {
  const logData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context
  }
  
  console.error('Application Error:', JSON.stringify(logData, null, 2))
}

export function setupGlobalErrorHandlers(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      logError(
        event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason)),
        { type: 'unhandledrejection' }
      )
    })
  }
}