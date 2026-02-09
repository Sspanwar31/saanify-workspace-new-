import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Apne DB connection ka path use kare

export async function GET() {
  try {
    // 1. Dates calculate karein (Current Month Revenue ke liye)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // 2. Parallel Database Queries run karein (Performance ke liye)
    const [
      totalClients, 
      newClientsThisMonth,
      totalRevenue,
      activeTrials,
      pendingPayments,
      recentLogs
    ] = await Promise.all([
      
      // Total Clients count
      prisma.society.count(), 
      
      // New Clients joined this month
      prisma.society.count({
        where: { createdAt: { gte: startOfMonth } }
      }),

      // Total Revenue (Month to Date) - Payments table se sum
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'SUCCESS',
          createdAt: { gte: startOfMonth }
        }
      }),

      // Active Trials (Maan lo jinka plan 'TRIAL' hai)
      prisma.society.count({
        where: { subscriptionStatus: 'TRIAL' }
      }),

      // Alerts: Pending Payments
      prisma.payment.count({
        where: { status: 'PENDING_VERIFICATION' }
      }),

      // Live Pulse: Activity Logs (Agar table hai, nahi toh user logins se nikalo)
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } } // User ka naam bhi layein
      })
    ]);

    // 3. Data ko Frontend ke format me structure karein
    const responseData = {
      kpi: {
        totalClients: totalClients,
        newClients: newClientsThisMonth,
        revenue: totalRevenue._sum.amount || 0,
        activeTrials: activeTrials,
        systemHealth: "98.5%" // Isko abhi ke liye static rakh sakte hain ya server uptime check laga sakte hain
      },
      alerts: [],
      activities: recentLogs.map(log => ({
        type: log.action, // e.g., "New Login", "Payment Received"
        client: log.user.name,
        time: log.createdAt.toISOString() // Frontend pe format karenge
      }))
    };

    // Agar pending payments hain to alert add karein
    if (pendingPayments > 0) {
      responseData.alerts.push({
        type: 'critical',
        message: `${pendingPayments} Manual payments pending verification`,
        action: '/admin/subscriptions'
      });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
