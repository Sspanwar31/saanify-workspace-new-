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

  // ✅ UPDATED: refreshDashboard function (SQL View logic with .maybeSingle)
  refreshDashboard: async () => {
    set({ isLoading: true });
    try {
      // 🚀 ASLI FIX: Hamare naye SQL View se data lo
      const { data: kpis, error } = await supabase
        .from('admin_dashboard_kpis')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (kpis) {
        set({
          overviewData: {
            kpi: {
              totalClients: kpis.total_clients,
              revenue: kpis.revenue_mtd,          // Current Month
              totalRevenue: kpis.revenue_lifetime, // Lifetime Total
              activeTrials: kpis.active_trials,
              systemHealth: 'Healthy'
            },
            alerts: [] 
          }
        });
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
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
