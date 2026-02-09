import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ab ye line error nahi degi

export async function GET() {
  try {
    // 1. Dates calculate karein
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // 2. Parallel Database Queries
    // NOTE: Make sure aapke schema.prisma me 'Society', 'Payment', 'ActivityLog' naam ke models hon.
    const [
      totalClients, 
      newClientsThisMonth,
      totalRevenue,
      activeTrials,
      pendingPayments,
      recentLogs
    ] = await Promise.all([
      
      // Total Clients
      prisma.society.count(), 
      
      // New Clients this month
      prisma.society.count({
        where: { createdAt: { gte: startOfMonth } }
      }),

      // Total Revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'SUCCESS',
          createdAt: { gte: startOfMonth }
        }
      }),

      // Active Trials
      prisma.society.count({
        where: { subscriptionStatus: 'TRIAL' }
      }),

      // Pending Payments
      prisma.payment.count({
        where: { status: 'PENDING_VERIFICATION' }
      }),

      // Recent Activity Logs (Fallback to empty array if table doesn't exist yet)
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } }
      }).catch(() => []) // Agar table nahi hai to crash nahi karega, empty array dega
    ]);

    // 3. Response Structure
    const responseData: any = {
      kpi: {
        totalClients: totalClients,
        newClients: newClientsThisMonth,
        revenue: totalRevenue._sum.amount || 0,
        activeTrials: activeTrials,
        systemHealth: "98.5%" 
      },
      alerts: [],
      activities: recentLogs.map((log: any) => ({
        type: log.action, 
        client: log.user?.name || 'Unknown',
        time: log.createdAt.toISOString()
      }))
    };

    // Add Alerts
    if (pendingPayments > 0) {
      responseData.alerts.push({
        type: 'critical',
        message: `${pendingPayments} Manual payments pending verification`,
        action: '/admin/subscriptions'
      });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Dashboard API Error:", error); // Terminal me error dikhega
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: String(error) }, 
      { status: 500 }
    );
  }
}
