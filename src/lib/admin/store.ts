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
  overviewData: any; // SQL View data ke liye

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
  overviewData: null,

  // ✅ UPDATED: refreshDashboard function (Aapka naya logic yahan lagaya hai)
  refreshDashboard: async () => {
    set({ isLoading: true });
    try {
      // 🚀 Sabhi views se data mangwayein
      const [kpiRes, trendsRes, plansRes] = await Promise.all([
        supabase.from('admin_dashboard_kpis').select('*').maybeSingle(),
        supabase.from('admin_analytics_trends').select('*'),
        supabase.from('admin_plan_stats').select('*')
      ]);

      const kpi = kpiRes.data;
      const trends = trendsRes.data || [];
      const plans = plansRes.data || [];

      if (kpi) {
        set({
          overviewData: {
            kpi: {
              totalClients: kpi.total_clients,
              revenue: kpi.revenue_mtd,
              totalRevenue: kpi.revenue_lifetime,
              activeTrials: kpi.active_trials,
              systemHealth: 'Healthy'
            },
            activities: [], // Earlier logic for activities
            alerts: []
          },
          kpiData: {
            totalRevenue: kpi.revenue_lifetime,
            activeUsers: kpi.total_clients,
            churnRate: kpi.churn_rate?.toString() || '0.0', // ✅ Churn Rate Fixed
          },
          analyticsData: {
            // ✅ Trend data ko mapping sahi ki (Charts will now work)
            revenueTrend: trends.map(t => ({ name: t.name, value: Number(t.revenue) })),
            userGrowth: trends.map(t => ({ name: t.name, active: Number(t.clients), total: kpi.total_clients })),
            planDistribution: plans.map(p => ({ name: p.name, value: Number(p.value) })), // ✅ Plan Chart Fixed
            clientStatus: [
                { name: 'Active Users', value: kpi.total_clients },
                { name: 'Trial Users', value: kpi.active_trials }
            ]
          }
        });
      }
    } catch (err) {
      console.error("Analytics Sync Error:", err);
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
