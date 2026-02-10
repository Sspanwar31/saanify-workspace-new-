import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// 1. Client Initialize
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

  // ACTION: Fetch Data
  refreshDashboard: async () => {
    set({ isLoading: true, error: null });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("⚠️ Supabase Keys Missing");
      set({ isLoading: false });
      return;
    }

    try {
      // Fetch Clients
      const { data: clientsData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_deleted', false)
        .eq('role', 'client'); // Only Clients

      if (clientError) throw clientError;

      // Fetch Plans
      const { data: plansData, error: planError } = await supabase
        .from('plan') // Table name check karlena (plan ya plans)
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

  // GETTER: Calculation Logic
  getOverviewData: () => {
    const state = get();
    const clients = state.clients || [];
    const plans = state.plans || [];

    let totalRevenue = 0;
    let activeTrials = 0;
    
    clients.forEach((client: any) => {
      // Revenue Calculation
      if (client.plan_id) {
        const matchedPlan = plans.find((p: any) => p.id === client.plan_id);
        if (matchedPlan?.price) totalRevenue += Number(matchedPlan.price);
      }
      // Trial Count
      const pName = (client.plan_name || '').toLowerCase();
      const pCode = (client.plan || '').toLowerCase();
      if (pName.includes('trial') || pCode.includes('trial')) activeTrials++;
    });

    // Recent Activity
    const activities = clients
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((client: any) => ({
        type: 'New Subscription',
        client: client.society_name || client.name || 'User',
        time: client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Just now'
      }));

    return {
      kpi: {
        totalClients: clients.length,
        revenue: totalRevenue,
        activeTrials: activeTrials,
        systemHealth: 'Healthy'
      },
      alerts: [],
      activities: activities
    };
  }
}));
