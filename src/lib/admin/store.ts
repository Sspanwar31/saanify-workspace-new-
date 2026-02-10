import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// ✅ 1. Client Initialize (Bina Auth Helpers ke)
// Ye Vercel par bina error ke chalega
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

  // ✅ ACTION: Fetch Data
  refreshDashboard: async () => {
    set({ isLoading: true, error: null });
    
    // Agar Env variables nahi mile to error na de, bas log kare
    if (!supabaseUrl || !supabaseKey) {
      console.error("⚠️ Supabase Keys Missing in Environment Variables");
      set({ isLoading: false });
      return;
    }

    try {
      console.log("🔄 Store: Fetching data...");
      
      // 1. Fetch Clients
      // ✅ FINAL FIX: Added .eq('role', 'client') to filter out admins
      const { data: clientsData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_deleted', false) // Delete wale nahi chahiye
        .eq('role', 'client'); // ✅ ONLY REAL CLIENTS

      if (clientError) throw clientError;

      // 2. Fetch Plans
      const { data: plansData, error: planError } = await supabase
        .from('plans') 
        .select('*');

      if (planError) throw planError;

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

  // ✅ GETTER: Safe Calculation Logic
  getOverviewData: () => {
    const state = get();
    // Safety: Agar state undefined ho to crash na ho
    const clients = state.clients || [];
    const plans = state.plans || [];

    let totalRevenue = 0;
    let activeTrials = 0;
    
    // Logic
    clients.forEach((client: any) => {
      // Revenue
      if (client.plan_id) {
        const matchedPlan = plans.find((p: any) => p.id === client.plan_id);
        if (matchedPlan?.price) totalRevenue += Number(matchedPlan.price);
      }
      
      // Trials
      const pName = (client.plan_name || '').toLowerCase();
      const pCode = (client.plan || '').toLowerCase();
      if (pName.includes('trial') || pCode.includes('trial')) activeTrials++;
    });

    // Activities
    const activities = clients
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((client: any) => ({
        type: 'New Subscription',
        client: client.society_name || client.name || 'User',
        time: client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Just now'
      }));

    // Return Structure (Ye kabhi undefined return nahi karega)
    return {
      kpi: {
        totalClients: clients.length,
        revenue: totalRevenue,
        activeTrials: activeTrials,
        systemHealth: 'Healthy'
      },
      alerts: [],
      activities: activities,
      quickStats: { newClientsToday: 0, revenueToday: 0 }
    };
  }
}));
