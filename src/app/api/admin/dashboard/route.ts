import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log("🟢 API Started...");

    // ==========================================
    // 1. KEY HANDLING (CRITICAL FIX)
    // ==========================================
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const b64Key = process.env.SUPABASE_SERVICE_ROLE_KEY_B64;

    // Agar normal key nahi hai, to B64 try karte hain
    if (!serviceKey && b64Key) {
      console.log("⚠️ Using B64 Key check...");
      // Check agar ye already decoded hai (JWT starts with eyJ)
      if (b64Key.startsWith('eyJ')) {
        serviceKey = b64Key;
      } else {
        // Agar encoded hai to decode karo
        try {
          serviceKey = Buffer.from(b64Key, 'base64').toString('utf-8').trim();
        } catch (e) {
          throw new Error("Failed to decode Base64 Key");
        }
      }
    }

    if (!serviceKey) {
      throw new Error("CRITICAL: Supabase Service Role Key is MISSING. Check Vercel Env Variables.");
    }

    // ==========================================
    // 2. SUPABASE CONNECTION
    // ==========================================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false } }
    );

    // ==========================================
    // 3. FETCH DATA (Plans & Clients)
    // ==========================================
    console.log("🟢 Fetching Data from DB...");

    // Parallel fetch
    const [clientsRes, plansRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('plans').select('*')
    ]);

    // Check for DB Errors
    if (clientsRes.error) throw new Error(`Clients Table Error: ${clientsRes.error.message}`);
    if (plansRes.error) throw new Error(`Plans Table Error: ${plansRes.error.message}`);

    const clients = clientsRes.data || [];
    const plans = plansRes.data || [];

    console.log(`✅ Data Fetched: ${clients.length} Clients, ${plans.length} Plans`);

    // ==========================================
    // 4. CALCULATIONS
    // ==========================================
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // A. Total Clients
    const totalClients = clients.length;

    // B. New Clients
    const newClients = clients.filter(c => c.created_at && new Date(c.created_at) >= startOfMonth).length;

    // C. Active Trials
    const activeTrials = clients.filter(c => {
      const planName = c.plan_name?.toLowerCase() || '';
      const status = c.status?.toLowerCase() || '';
      return status === 'active' && planName.includes('trial');
    }).length;

    // D. REVENUE CALCULATION
    let totalRevenue = 0;

    // Map Plans for fast access (Handle Price as String/Number)
    const planMap = new Map();
    plans.forEach(p => {
      // Aapke database me price string '7000' hai, usko Number me convert karna zaruri hai
      const price = parseFloat(p.price || '0'); 
      planMap.set(p.id, price);
    });

    clients.forEach(client => {
      if (client.status?.toLowerCase() === 'active') {
        // Agar Plan ID match kare
        if (client.plan_id && planMap.has(client.plan_id)) {
          totalRevenue += planMap.get(client.plan_id);
        } 
        // Fallback: Agar Plan ID match na ho, par Plan Name match ho jaye (Optional safety)
        else if (client.plan_name) {
           // Basic logic backup
           if (client.plan_name.toLowerCase().includes('enterprise')) totalRevenue += 10000;
           else if (client.plan_name.toLowerCase().includes('pro')) totalRevenue += 7000;
           else if (client.plan_name.toLowerCase().includes('basic')) totalRevenue += 4000;
        }
      }
    });

    console.log("✅ Calculations Done. Revenue:", totalRevenue);

    // ==========================================
    // 5. SUCCESS RESPONSE
    // ==========================================
    return NextResponse.json({
      kpi: {
        totalClients,
        newClients,
        revenue: totalRevenue,
        activeTrials,
        systemHealth: '100%'
      },
      alerts: [],
      activities: clients
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 5)
        .map(c => ({
           type: 'New Client',
           client: c.name || c.email || 'Unknown',
           time: c.created_at || new Date().toISOString()
        }))
    });

  } catch (err: any) {
    // ==========================================
    // 6. ERROR RESPONSE (Detailed)
    // ==========================================
    console.error('❌ API CRASH:', err.message);
    
    // Return actual error to Frontend so we can see it
    return NextResponse.json({ 
      error: 'Dashboard API Failed', 
      details: err.message,
      // Fallback data taaki dashboard bilkul blank na dikhe
      kpi: { totalClients: 0, revenue: 0, activeTrials: 0, systemHealth: 'Error' },
      alerts: [{ type: 'error', message: `API Error: ${err.message}`, action: '#' }],
      activities: []
    }, { status: 200 }); // Status 200 bhej rahe hain taaki frontend crash na ho, bas error dikhaye
  }
}
