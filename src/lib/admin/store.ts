import { create } from 'zustand';
// ✅ FIX: "auth-helpers" hata diya, simple "supabase-js" use kar rahe hain jo installed hoga
import { createClient } from '@supabase/supabase-js';

// ✅ Initialize Client (Standard Way)
// Dhyan rahe: Yahan ANON KEY hi use karein. RLS Policy se permission manage karein.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface AdminState {
  isLoading: boolean;
  error: string | null;
  clients: any[];
  plans: any[];
  refreshDashboard: () => Promise<void>;
  getOverviewData: () => any;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isLoading: false,
  error: null,
  clients: [],
  plans: [],

  // ✅ ACTION: Data Fetching
  refreshDashboard: async () => {
    set({ isLoading: true, error: null });
    console.log("🔄 Store: Fetching data from Supabase...", supabaseUrl ? "URL Found" : "URL Missing");

    try {
      // 1. Fetch Clients
      const { data: clientsData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_deleted', false); // Sirf active clients

      if (clientError) {
        // Agar permission error aye to console me clear bataye
        console.error("Permission Error? Check RLS Policies in Supabase.");
        throw new Error(`Clients Error: ${clientError.message}`);
      }

      // 2. Fetch Plans
      const { data: plansData, error: planError } = await supabase
        .from('plan')
        .select('*');

      if (planError) throw new Error(`Plans Error: ${planError.message}`);

      console.log(`✅ Success: Found ${clientsData?.length} clients and ${plansData?.length} plans.`);

      set({ 
        clients: clientsData || [], 
        plans: plansData || [],
        isLoading: false 
      });

    } catch (error: any) {
      console.error("❌ Store Error:", error.message);
      set({ error: error.message, isLoading: false });
    }
  },

  // ✅ GETTER: Calculation Logic
  getOverviewData: () => {
    const { clients, plans } = get();
    
    const safeClients = clients || [];
    const safePlans = plans || [];

    let totalRevenue = 0;
    let activeTrials = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    safeClients.forEach((client: any) => {
      // Revenue Logic
      if (client.plan_id) {
        const matchedPlan = safePlans.find((p: any) => p.id === client.plan_id);
        if (matchedPlan && matchedPlan.price) {
          totalRevenue += Number(matchedPlan.price);
        }
      }

      // Trial Logic
      const planName = (client.plan_name || '').toLowerCase();
      const planCode = (client.plan || '').toLowerCase();
      if (planName.includes('trial') || planCode.includes('trial')) {
        activeTrials++;
      }
    });

    // Fake Activities from Created Dates
    const activities = safeClients
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((client: any) => ({
        type: 'New Subscription',
        client: client.society_name || client.name || 'User',
        time: client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Just now'
      }));

    return {
      kpi: {
        totalClients: safeClients.length,
        revenue: totalRevenue,
        activeTrials: activeTrials,
        systemHealth: 'Healthy'
      },
      alerts: [],
      activities: activities,
      quickStats: {
        newClientsToday: 0,
        revenueToday: 0
      }
    };
  }
}));
