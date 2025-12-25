// Database connection health check and monitoring utilities
import { db } from '@/lib/db';

export interface DatabaseHealthStatus {
  connected: boolean
  error?: string
  responseTime?: number
  timestamp: string
  details?: {
    totalMembers?: number
    totalLoans?: number
    lastSync?: string
  }
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  database: DatabaseHealthStatus
  timestamp: string
  uptime: number
  memory?: {
    used: number
    total: number
    percentage: number
  }
}

// Test database connection with a simple query
export const checkDatabaseConnection = async (): Promise<DatabaseHealthStatus> => {
  const startTime = Date.now();
  
  try {
    console.log('🗄️ [DB] Testing database connection...');
    
    // Test query to verify database connectivity
    const result = await db.$queryRaw`SELECT 1 as connection_test`;
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ [DB] Database connection successful', {
      responseTime: `${responseTime}ms`,
      result
    });

    // Get some basic stats for additional health info
    try {
      const [memberCount, loanCount] = await Promise.all([
        db.member.count(),
        db.loan.count()
      ]);

      return { 
        connected: true, 
        error: null,
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          totalMembers: memberCount,
          totalLoans: loanCount,
          lastSync: new Date().toISOString()
        }
      };
    } catch (statsError) {
      console.warn('⚠️ [DB] Could not fetch stats, but connection is working', {
        error: statsError instanceof Error ? statsError.message : statsError
      });
      
      return { 
        connected: true, 
        error: null,
        responseTime,
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [DB] Database connection failed', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`
    });
    
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
      timestamp: new Date().toISOString()
    };
  }
};

// Middleware to check DB connection before processing requests
export const withDatabaseCheck = (handler: (req: Request, ...args: any[]) => Promise<Response> | Response) => {
  return async (req: Request, ...args: any[]) => {
    const dbHealth = await checkDatabaseConnection();
    
    if (!dbHealth.connected) {
      console.error('❌ [MIDDLEWARE] Database unavailable', {
        error: dbHealth.error,
        responseTime: dbHealth.responseTime
      });
      
      return new Response(
        JSON.stringify({
          error: 'Database service unavailable',
          details: dbHealth.error,
          timestamp: new Date().toISOString()
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // If response time is too high, log warning but continue
    if (dbHealth.responseTime && dbHealth.responseTime > 1000) {
      console.warn('⚠️ [MIDDLEWARE] Slow database response', {
        responseTime: `${dbHealth.responseTime}ms`,
        threshold: '1000ms'
      });
    }
    
    return handler(req, ...args);
  };
};

// Comprehensive health check including database and system stats
export const performHealthCheck = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  
  try {
    console.log('🏥 [HEALTH] Starting comprehensive health check...');
    
    // Check database health
    const dbHealth = await checkDatabaseConnection();
    
    // Determine overall health status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (!dbHealth.connected) {
      status = 'unhealthy';
    } else if (dbHealth.responseTime && dbHealth.responseTime > 2000) {
      status = 'degraded';
    }
    
    // Get memory usage if available
    let memory;
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        memory = {
          used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        };
      }
    } catch (memError) {
      console.warn('⚠️ [HEALTH] Could not get memory usage', {
        error: memError instanceof Error ? memError.message : memError
      });
    }
    
    const duration = Date.now() - startTime;
    
    const healthResult: HealthCheckResult = {
      status,
      database: dbHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory
    };
    
    console.log('📊 [HEALTH] Health check completed', {
      status,
      duration: `${duration}ms`,
      dbConnected: dbHealth.connected,
      dbResponseTime: dbHealth.responseTime,
      memoryUsage: memory?.percentage
    });
    
    return healthResult;
    
  } catch (error) {
    console.error('💥 [HEALTH] Health check failed', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
};

// Database performance monitoring
export const monitorDatabasePerformance = async () => {
  const startTime = Date.now();
  
  try {
    console.log('📈 [DB_PERF] Starting performance monitoring...');
    
    // Test various database operations
    const tests = [
      {
        name: 'Simple Query',
        operation: () => db.$queryRaw`SELECT 1 as test`
      },
      {
        name: 'Member Count',
        operation: () => db.member.count()
      },
      {
        name: 'Member Search',
        operation: () => db.member.findMany({
          take: 10,
          select: { id: true, name: true }
        })
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const testStart = Date.now();
      try {
        await test.operation();
        const testDuration = Date.now() - testStart;
        results.push({
          name: test.name,
          success: true,
          duration: testDuration
        });
      } catch (error) {
        const testDuration = Date.now() - testStart;
        results.push({
          name: test.name,
          success: false,
          duration: testDuration,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    console.log('📊 [DB_PERF] Performance monitoring completed', {
      totalDuration: `${totalDuration}ms`,
      results
    });
    
    return {
      success: true,
      totalDuration,
      results
    };
    
  } catch (error) {
    console.error('💥 [DB_PERF] Performance monitoring failed', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Database connection pool monitoring (if available)
export const getConnectionPoolStats = async () => {
  try {
    console.log('🔗 [DB_POOL] Checking connection pool stats...');
    
    // This would depend on your database setup
    // For Prisma, you can get some insights from the engine
    const engineStats = await (db as any)._engine?.getConfig?.();
    
    if (engineStats) {
      console.log('📊 [DB_POOL] Connection pool stats available', { engineStats });
      return {
        available: true,
        stats: engineStats
      };
    }
    
    return {
      available: false,
      message: 'Connection pool stats not available'
    };
    
  } catch (error) {
    console.warn('⚠️ [DB_POOL] Could not get connection pool stats', {
      error: error instanceof Error ? error.message : error
    });
    
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Auto-recovery mechanism for database connections
export const attemptDatabaseRecovery = async (maxAttempts: number = 3): Promise<boolean> => {
  console.log('🔄 [DB_RECOVERY] Starting database recovery attempts...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 [DB_RECOVERY] Recovery attempt ${attempt}/${maxAttempts}`);
      
      const health = await checkDatabaseConnection();
      
      if (health.connected) {
        console.log('✅ [DB_RECOVERY] Database connection recovered', {
          attempt,
          responseTime: health.responseTime
        });
        return true;
      }
      
      if (attempt < maxAttempts) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ [DB_RECOVERY] Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`❌ [DB_RECOVERY] Recovery attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : error
      });
    }
  }
  
  console.error('💥 [DB_RECOVERY] All recovery attempts failed');
  return false;
};

// Export all functions
export {
  checkDatabaseConnection as dbHealthCheck,
  withDatabaseCheck as withDbCheck,
  performHealthCheck as healthCheck,
  monitorDatabasePerformance as dbPerfMonitor,
  getConnectionPoolStats as dbPoolStats,
  attemptDatabaseRecovery as dbRecovery
};