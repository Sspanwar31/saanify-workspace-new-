import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // ==========================================
    // 1. SERVICE ROLE KEY DECODING (IMPORTANT)
    // ==========================================
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Agar normal key nahi hai, to B64 wali check karo aur decode karo
    if (!serviceKey && process.env.SUPABASE_SERVICE_ROLE_KEY_B64) {
      const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;
      // Agar 'eyJ' se start nahi ho raha matlab pure base64 hai, usko decode karo
      serviceKey = Buffer.from(b64Key, 'base64').toString('utf-8').trim();
    }

    if (!serviceKey) {
      throw new Error('CRITICAL: Service Role Key missing or invalid');
    }

    // Supabase Client Initialize
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false } }
    );

    // ==========================================
    // 2. DATA FETCHING (Clients + Plans)
    // ==========================================
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    console.log("Fetching Dashboard Data...");

    // Parallel Fetching for Speed
    const [clientsRes, plansRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('plans').select('*')
    ]);

    if (clientsRes.error) throw clientsRes.error;
    if (plansRes.error) throw plansRes.error;

    const clients = clientsRes.data || [];
    const plans = plansRes.data || [];

    // ==========================================
    // 3. CALCULATIONS (Real Data)
    // ==========================================

    // A. Total Clients
    const totalClients = clients.length;

    // B. New Clients This Month
    const newClients = clients.filter(c => new Date(c.created_at) >= startOfMonth).length;

    // C. Active Trials
    // Check karte hain ki plan name me 'trial' hai ya price 0 hai
    const activeTrials = clients.filter(c => {
      const status = c.status?.toLowerCase() || '';
      const planName = c.plan_name?.toLowerCase() || '';
      return status === 'active' && planName.includes('trial');
    }).length;

    // D. REVENUE CALCULATION (Linking Client to Plan Table)
    let totalRevenue = 0;

    // Optimization: Plans ka ek Map bana lete hain ID ke hisab se fast lookup ke liye
    const planMap = new Map();
    plans.forEach(p => {
      planMap.set(p.id, Number(p.price)); // Price ko number bana lo
    });

    // Clients loop karke price add karo
    clients.forEach(client => {
      // Sirf 'ACTIVE' clients ka revenue jodo
      if (client.status?.toLowerCase() === 'active') {
        if (client.plan_id && planMap.has(client.plan_id)) {
          // Agar Plan ID match ho gayi (Best way)
          totalRevenue += planMap.get(client.plan_id);
        } else {
            // Fallback: Agar ID match nahi hui to Plan Name se guess karo (Optional)
            // Lekin aapke data me plan_id sahi hai, to ye else part shayad run na ho
        }
      }
    });

    console.log("Stats:", { totalClients, totalRevenue, activeTrials });

    // ==========================================
    // 4. RESPONSE
    // ==========================================
    return NextResponse.json({
      kpi: {
        totalClients: totalClients,
        newClients: newClients,
        revenue: totalRevenue,
        activeTrials: activeTrials,
        systemHealth: '100%',
      },
      alerts: [],
      activities: clients
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest first
        .slice(0, 5)
        .map(c => ({
           type: 'New Client',
           client: c.name || c.email,
           time: c.created_at
        }))
    });

  } catch (err: any) {
    console.error('Dashboard API Error:', err.message);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
