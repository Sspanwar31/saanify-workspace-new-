import { create } from 'zustand';
// Note: 'persist' hata diya kyunki dashboard hamesha fresh data dikhana chahiye

// ... (Interfaces same rahenge, unko waisa hi rehne dein) ...
// ... (Bas INTERFACES copy kar lijiye purane file se) ...

interface AdminState {
  // Data States
  stats: any;
  clients: any[];
  invoices: any[]; // Type Invoice[] use karein
  plans: any[];
  auditLogs: any[];
  isLoading: boolean; // Loading state add kiya

  // Actions
  refreshDashboard: () => Promise<void>; // Async function
  deleteClient: (id: number) => Promise<void>;
  verifyPayment: (id: string, action: 'APPROVE' | 'REJECT') => Promise<void>;
  
  // Getter
  getOverviewData: () => any;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // 1. Initial State ab Empty rahega (kyunki data DB se aayega)
  stats: { totalRevenue: 0, activeClients: 0, totalClients: 0, uptime: '0%' },
  clients: [],
  invoices: [],
  plans: [],
  auditLogs: [],
  isLoading: false,

  // 2. Fetch Data from Backend (API Route jo humne pichle javab me discuss kiya)
  refreshDashboard: async () => {
    set({ isLoading: true });
    try {
      // Backend API call
      const response = await fetch('/api/admin/dashboard'); 
      const data = await response.json();

      if (response.ok) {
        set({
          stats: data.kpi,         // Backend se KPI
          auditLogs: data.activities, // Backend se Logs
          // clients aur invoices ke liye alag API call lag sakti hai agar data bada hai
          // For now, maan lete hain dashboard API sab bhej raha hai:
          clients: data.recentClients || [], 
          invoices: data.pendingInvoices || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 3. Delete Client (Real Database Delete)
  deleteClient: async (id) => {
    // Pehle UI se hata do (Optimistic Update) taki fast lage
    const oldClients = get().clients;
    set({ clients: oldClients.filter(c => c.id !== id) });

    try {
      // Backend ko bolo delete karne ko
      await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Agar fail hua, toh wapas add kar do
      set({ clients: oldClients }); 
      alert("Failed to delete client");
    }
  },

  // 4. Verify Payment (Real Database Update)
  verifyPayment: async (id, action) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: action === 'APPROVE' ? 'PAID' : 'FAILED' })
      });
      
      if (res.ok) {
        // Store update karo
        set(state => ({
          invoices: state.invoices.map(inv => 
            inv.id === id ? { ...inv, status: action === 'APPROVE' ? 'PAID' : 'FAILED' } : inv
          )
        }));
        // Dashboard stats refresh karo taki revenue update ho jaye
        get().refreshDashboard();
      }
    } catch (error) {
      console.error("Payment verification failed", error);
    }
  },

  // ... Baki functions bhi aise hi async banenge ...

  getOverviewData: () => {
    const { stats, invoices, clients, auditLogs } = get();
    
    // Logic wahi rahega, bas ab ye real data use karega
    const pendingPayments = invoices.filter((i: any) => i.status === 'PENDING').length;

    return {
      kpi: {
        totalClients: stats.totalClients || 0,
        revenue: stats.revenue || 0,
        activeTrials: stats.activeTrials || 0,
        systemHealth: stats.systemHealth || '100%'
      },
      alerts: pendingPayments > 0 ? [{
        type: 'critical',
        message: `${pendingPayments} Manual payments pending verification`,
        action: '/admin/subscriptions'
      }] : [],
      quickStats: {
        newClientsToday: 0, // Backend se lana padega
        revenueToday: 0
      }
    };
  }
}));
