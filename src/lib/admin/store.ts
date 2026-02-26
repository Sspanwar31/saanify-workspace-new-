import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ UPDATE KIYA GAYA INTERFACE
interface AnalyticsData {
  revenueTrend: { name: string; value: number }[];
  userGrowth: { name: string; active: number; total: number }[];
  planDistribution: { name: string; value: number }[]; // NAYA
  clientStatus: { name: string; value: number }[];     // NAYA
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

  refreshDashboard: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isLoading: false,
  error: null,
  clients: [],
  plans: [],
  analyticsData: null,
  kpiData: null,

  refreshDashboard: async () => {
    set({ isLoading: true, error: null });
    
    if (!supabaseUrl || !supabaseKey) {
      set({ error: "Supabase Keys Missing", isLoading: false });
      return;
    }

    try {
      const { data: allClientsData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('role', 'client');

      if (clientError) throw clientError;

      const { data: plansData, error: planError } = await supabase
        .from('plans') 
        .select('*');

      if (planError) throw planError;

      const allClients = allClientsData || [];
      const plans = plansData || [];

      const activeClients = allClients.filter(c => c.is_deleted !== true);
      const deletedClients = allClients.filter(c => c.is_deleted === true);

      // --- KPIs ---
      let calculatedRevenue = 0;
      activeClients.forEach(client => {
        if (client.plan_id) {
          const matchedPlan = plans.find((p: any) => p.id === client.plan_id);
          if (matchedPlan && matchedPlan.price) {
            calculatedRevenue += Number(matchedPlan.price);
          }
        }
      });

      const totalClientCount = allClients.length > 0 ? allClients.length : 1;
      const churnPercentage = ((deletedClients.length / totalClientCount) * 100).toFixed(1);

      const kpiData = {
        totalRevenue: calculatedRevenue,
        activeUsers: activeClients.length,
        churnRate: churnPercentage
      };

      // --- CHARTS DATA ---
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const growthMap: Record<string, { active: number; total: number; revenue: number }> = {};
      let runningTotal = 0;

      const sortedClients = [...activeClients].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedClients.forEach(client => {
        const date = new Date(client.created_at);
        const monthName = months[date.getMonth()];
        
        let clientRev = 0;
        if (client.plan_id) {
           const p = plans.find(x => x.id === client.plan_id);
           if(p) clientRev = Number(p.price || 0);
        }

        if (!growthMap[monthName]) {
          growthMap[monthName] = { active: 0, total: runningTotal, revenue: 0 };
        }
        
        growthMap[monthName].active += 1;
        runningTotal += 1;
        growthMap[monthName].total = runningTotal;
        growthMap[monthName].revenue += clientRev;
      });

      const userGrowth = Object.keys(growthMap).map(key => ({
        name: key,
        active: growthMap[key].active,
        total: growthMap[key].total
      }));

      const revenueTrend = Object.keys(growthMap).map(key => ({
        name: key,
        value: growthMap[key].revenue
      }));

      // ✅ 1. PLAN DISTRIBUTION (Naya Pie Chart logic)
      const planCounts: Record<string, number> = {};
      activeClients.forEach(client => {
        let planName = 'Trial / Free';
        if (client.plan_id) {
          const matchedPlan = plans.find((p: any) => p.id === client.plan_id);
          if (matchedPlan && matchedPlan.name) planName = matchedPlan.name;
        }
        planCounts[planName] = (planCounts[planName] || 0) + 1;
      });

      const planDistribution = Object.keys(planCounts).map(key => ({
        name: key,
        value: planCounts[key]
      }));

      // ✅ 2. CLIENT STATUS (Naya Chart logic)
      const clientStatus = [
        { name: 'Active Users', value: activeClients.length },
        { name: 'Deleted Users', value: deletedClients.length }
      ];

      set({ 
        clients: activeClients, 
        plans: plans,
        kpiData: kpiData,
        analyticsData: { revenueTrend, userGrowth, planDistribution, clientStatus },
        isLoading: false 
      });

    } catch (error: any) {
      console.error("Fetch Error:", error);
      set({ error: error.message, isLoading: false });
    }
  }
}));
