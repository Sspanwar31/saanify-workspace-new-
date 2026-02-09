import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    /* =========================
       SERVICE ROLE KEY (SAFE)
    ========================= */

    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey && process.env.SUPABASE_SERVICE_ROLE_KEY_B64) {
      const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
      if (!b64Key.startsWith('eyJ')) {
        serviceKey = Buffer.from(b64Key, 'base64')
          .toString('utf-8')
          .trim();
      } else {
        serviceKey = b64Key;
      }
    }

    if (!serviceKey) {
      throw new Error('CRITICAL: Service Role Key missing');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /* =========================
       DATE RANGE
    ========================= */

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    /* =========================
       PARALLEL QUERIES
    ========================= */

    const [
      totalClientsRes,
      newClientsRes,
      revenueRes,
      activeTrialsRes,
      pendingPaymentsRes,
    ] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),

      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),

      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'SUCCESS'),

      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'TRIAL'),

      supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
    ]);

    /* =========================
       ERROR CHECK
    ========================= */

    if (
      totalClientsRes.error ||
      newClientsRes.error ||
      revenueRes.error ||
      activeTrialsRes.error ||
      pendingPaymentsRes.error
    ) {
      console.error('Dashboard Query Error', {
        totalClientsRes,
        newClientsRes,
        revenueRes,
        activeTrialsRes,
        pendingPaymentsRes,
      });

      return NextResponse.json(
        { error: 'Failed to load dashboard data' },
        { status: 500 }
      );
    }

    /* =========================
       CALCULATIONS
    ========================= */

    const totalRevenue =
      revenueRes.data?.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
      ) ?? 0;

    /* =========================
       RESPONSE
    ========================= */

    return NextResponse.json({
      kpi: {
        totalClients: totalClientsRes.count ?? 0,
        newClientsThisMonth: newClientsRes.count ?? 0,
        totalRevenue,
        activeTrials: activeTrialsRes.count ?? 0,
        systemHealth: '99.9%',
      },
      alerts:
        (pendingPaymentsRes.count ?? 0) > 0
          ? [
              {
                type: 'warning',
                message: `${pendingPaymentsRes.count} payments pending verification`,
                action: '/admin/payments',
              },
            ]
          : [],
      activities: [],
    });
  } catch (err: any) {
    console.error('Dashboard API Crash:', err.message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
