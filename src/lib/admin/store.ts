import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase client initialize karein
const supabase = createClientComponentClient();

interface AdminState {
  isLoading: boolean;
  error: string | null;
  
  // Data containers
  clients: any[];
  plans: any[];
  
  // Actions
  refreshDashboard: () => Promise<void>;
  getOverviewData: () => any;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isLoading: false,
  error: null,
  clients: [],
  plans: [],

  // ✅ ACTION: Data Fetching directly from Supabase
  refreshDashboard: async () => {
    set({ isLoading: true, error: null });
    console.log("🔄 Store: Fetching data from Supabase...");

    try {
      // 1. Fetch Clients (Jo delete nahi hue hain)
      const { data: clientsData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_deleted', false);

      if (clientError) throw new Error(`Clients Error: ${clientError.message}`);

      // 2. Fetch Plans (Price calculate karne ke liye)
      const { data: plansData, error: planError } = await supabase
        .from('plan')
        .select('*');

      if (planError) throw new Error(`Plans Error: ${planError.message}`);

      console.log(`✅ Success: Found ${clientsData?.length} clients and ${plansData?.length} plans.`);

      // Store me save karein
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

  // ✅ GETTER: Calculation Logic (Dashboard ke liye data prepare karna)
  getOverviewData: () => {
    const { clients, plans } = get();
    
    // Safety check
    const safeClients = clients || [];
    const safePlans = plans || [];

    // --- 1. Calculate Revenue & Stats ---
    let totalRevenue = 0;
    let activeTrials = 0;
    
    // Current Month Growth Calculation
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let newClientsThisMonth = 0;

    safeClients.forEach((client) => {
      // Revenue Logic: Client ke plan_id se Plan table ka price dhundo
      if (client.plan_id) {
        const matchedPlan = safePlans.find(p => p.id === client.plan_id);
        if (matchedPlan && matchedPlan.price) {
          totalRevenue += Number(matchedPlan.price);
        }
      }

      // Trial Logic: Case insensitive check
      const planName = (client.plan_name || '').toLowerCase();
      const planCode = (client.plan || '').toLowerCase(); // Kabhi kabhi code 'plan' column me hota hai
      
      if (planName.includes('trial') || planCode.includes('trial')) {
        activeTrials++;
      }

      // Growth Logic
      if (client.created_at) {
        const createdDate = new Date(client.created_at);
        if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
          newClientsThisMonth++;
        }
      }
    });

    // --- 2. Generate Activity Log from Client Data ---
    // Kyuki abhi activity table nahi hai, hum 'created_at' se fake logs banayenge
    const activities = safeClients
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest first
      .slice(0, 5)
      .map(client => ({
        type: 'New Subscription',
        client: client.society_name || client.name || 'Unknown User',
        time: new Date(client.created_at).toLocaleDateString()
      }));

    // --- 3. Return Final Object for Dashboard ---
    return {
      kpi: {
        totalClients: safeClients.length,
        revenue: totalRevenue,
        activeTrials: activeTrials,
        systemHealth: 'Healthy'
      },
      alerts: [], // Future me yahan logic add kar sakte hain
      activities: activities,
      quickStats: {
        newClientsToday: 0, // Placeholder
        revenueToday: 0     // Placeholder
      }
    };
  }
}));
