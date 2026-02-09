import { create } from 'zustand';
// persist hata diya hai taaki live data load ho sake

// --- INTERFACES (Same as before) ---
// (Interfaces wahi purane rakhein, bas code niche se update karein)

interface AdminState {
  // Data States
  stats: any;
  clients: any[];
  invoices: any[];
  auditLogs: any[];
  isLoading: boolean;

  // Actions
  refreshDashboard: () => Promise<void>;
  
  // Getter
  getOverviewData: () => any;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // 1. Initial State (Safe Defaults)
  stats: { totalRevenue: 0, activeClients: 0, totalClients: 0, uptime: '100%' },
  clients: [],
  invoices: [],
  plans: [],
  auditLogs: [], // Default empty array
  isLoading: false,

  // 2. Fetch Data from Backend
  refreshDashboard: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/admin/dashboard'); 
      if (res.ok) {
        const data = await res.json();
        set({
          stats: data.kpi || {},
          auditLogs: data.activities || [], // Agar undefined aaya to empty array
          isLoading: false
        });
      } else {
        console.error("API Error:", res.status);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Fetch failed", error);
      set({ isLoading: false });
    }
  },

  // ... (Baki actions jaise deleteClient, verifyPayment same rahenge) ...

  // 3. SAFE SELECTOR (Yahan Error aa raha tha)
  getOverviewData: () => {
    const { stats, invoices, clients, auditLogs } = get();
    
    // Safety Checks: Agar koi data undefined hai to empty array/object use karein
    const safeInvoices = invoices || [];
    const safeClients = clients || [];
    const safeLogs = auditLogs || [];
    const safeStats = stats || {};

    // Logic
    const pendingPayments = safeInvoices.filter((i: any) => i.status === 'PENDING').length;

    return {
      kpi: {
        totalClients: safeStats.totalClients || safeClients.length || 0,
        revenue: safeStats.revenue || 0,
        activeTrials: safeStats.activeTrials || 0,
        systemHealth: safeStats.systemHealth || '100%'
      },
      alerts: pendingPayments > 0 ? [{
        type: 'critical',
        message: `${pendingPayments} Manual payments pending verification`,
        action: '/admin/subscriptions'
      }] : [],
      // ✅ FIX: "slice" error yahan fix hua hai
      activities: safeLogs.slice(0, 5).map((log: any) => ({
         type: log.action || log.type || 'Activity',
         client: log.user || log.client || 'System',
         time: log.timestamp || log.time || new Date().toISOString()
      })),
      quickStats: {
        newClientsToday: 0,
        revenueToday: 0
      }
    };
  }
}));
