import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AnalyticsData {
  revenueTrend: { name: string; value: number }[];
  userGrowth: { name: string; active: number; total: number }[];
  planDistribution: { name: string; value: number }[];
  clientStatus: { name: string; value: number }[];
}

interface KpiData {
  totalRevenue: number;
  activeUsers: number;
  churnRate: string;
}

interface AdminState {
  isLoading: boolean;
  error: string | null;
  clients: any[];
  plans: any[];
  analyticsData: AnalyticsData | null;
  kpiData: KpiData | null;
  overviewData: any; // ✅ ADDED: Naye SQL View data ke liye

  refreshDashboard: () => Promise<void>;
  getOverviewData: () => any; 
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isLoading: false,
  error: null,
  clients: [],
  plans: [],
  analyticsData: null,
  kpiData: null,
  overviewData: null, // ✅ ADDED: Initial state

  // ✅ UPDATED: refreshDashboard function (SQL View logic + Overview Data)
  refreshDashboard: async () => {
    set({ isLoading: true });
    try {
      // 🚀 1. Fetch KPI Data (From SQL View)
      const { data: kpi } = await supabase.from('admin_dashboard_kpis').select('*').maybeSingle();
      
      // 🚀 2. Fetch Trends Data (For Charts)
      const { data: trends } = await supabase.from('admin_analytics_trends').select('*');

      // 🚀 3. Fetch Recent Activities (For Dashboard "Live Pulse")
      const { data: recentClients } = await supabase
        .from('clients')
        .select('name, society_name, created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5);

      // 🚀 4. Fetch Plan Distribution (For Analytics Page Donut Chart)
      let planDistributionData: { name: string; value: number }[] = [];
      
      try {
        // Try RPC first
        const { data: rpcPlans } = await supabase.rpc('get_plan_distribution');
        if (rpcPlans) planDistributionData = rpcPlans;
      } catch (rpcError) {
        console.log("RPC failed, using fallback logic", rpcError);
        // Agar RPC nahi hai toh manual calculation
        const { data: clientPlans } = await supabase.from('clients').select('plan');
        if (clientPlans) {
           const counts: Record<string, number> = {};
           clientPlans.forEach((c: any) => {
             if(c.plan) counts[c.plan] = (counts[c.plan] || 0) + 1;
           });
           planDistributionData = Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
        }
      }

      if (kpi) {
        // 🔥 ASLI FIX: overviewData ko populate karein taaki Dashboard khali na dikhe
        const overview = {
          kpi: {
            totalClients: kpi.total_clients,
            revenue: kpi.revenue_mtd,           // Current Month
            totalRevenue: kpi.revenue_lifetime,  // Lifetime
            activeTrials: kpi.active_trials,
            systemHealth: 'Healthy'
          },
          activities: (recentClients || []).map(c => ({
            type: 'New Client Added',
            client: c.society_name || c.name,
            time: new Date(c.created_at!).toLocaleDateString()
          })),
          alerts: []
        };

        set({
          overviewData: overview, // ✅ Dashboard fixed
          kpiData: {
            totalRevenue: kpi.revenue_lifetime,
            activeUsers: kpi.total_clients,
            churnRate: '0.0',
          },
          analyticsData: {
            revenueTrend: (trends || []).map(t => ({ name: t.name, value: t.revenue })),
            userGrowth: (trends || []).map(t => ({ name: t.name, active: t.clients, total: kpi.total_clients })),
            planDistribution: planDistributionData, // Merged logic for Analytics page
            clientStatus: [
                { name: 'Active', value: kpi.total_clients },
                { name: 'Trial', value: kpi.active_trials }
            ]
          }
        });
      }
    } catch (err) {
      console.error("Store Refresh Error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ UPDATED: Ab ye overviewData ko check karega agar naya data hai to use return karega
  getOverviewData: () => {
    const state = get();
    
    // Agar SQL view se data load ho chuka hai, to use wahi return karo
    if (state.overviewData) {
      return state.overviewData;
    }

    // Fallback: Agar data nahi hai to purane client-side calculation ka use kare
    const clients = state.clients || [];
    const plans = state.plans || [];

    let totalRevenue = 0;
    let activeTrials = 0;
    
    clients.forEach((client: any) => {
      if (client.plan_id) {
        const matchedPlan = plans.find((p: any) => p.id === client.plan_id);
        if (matchedPlan?.price) totalRevenue += Number(matchedPlan.price);
      }
      const pName = (client.plan_name || '').toLowerCase();
      const pCode = (client.plan || '').toLowerCase();
      if (pName.includes('trial') || pCode.includes('trial')) activeTrials++;
    });

    const activities = [...clients]
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
      activities: activities,
      quickStats: { newClientsToday: 0, revenueToday: 0 }
    };
  }
}));
