import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- INTERFACES ---
export interface AdminPlan {
  id: string;
  name: string;
  price: number;
  limit: number;
  features: string[];
  color: string;
  isActive: boolean; // For Toggle
  isPopular?: boolean;
}

export interface Invoice {
  id: string;
  client: string;
  adminName: string;
  adminEmail: string;
  plan: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  method: 'RAZORPAY' | 'MANUAL_UPI' | 'BANK_TRANSFER';
  transactionId?: string;
  proofUrl?: string;
}

export interface GitHubConfig {
  username: string;
  repo: string;
  token: string;
  branch: string;
  lastBackup: string | null;
}

export interface SubAdmin {
  id: number;
  name: string;
  email: string;
  role: 'SUPPORT' | 'SALES' | 'MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SystemTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // e.g. "0 */6 * * *"
  lastRunStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  lastRunTime: string;
}

export interface CommRule {
  id: string;
  name: string;
  type: 'EMAIL' | 'PUSH';
  stats: { sent: number; pending: number; lastSent?: string };
  status: 'ACTIVE' | 'PAUSED';
}

// --- NEW INTERFACES ---
export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  resource: string;
  ip: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  timestamp: string;
}

export interface AnalyticsData {
  revenueTrend: { name: string; value: number }[];
  userGrowth: { name: string; active: number; total: number }[];
  deviceUsage: { name: string; value: number }[];
}

interface AdminState {
  stats: any;
  clients: any[];
  invoices: Invoice[];
  plans: AdminPlan[];
  activities: any[];
  githubConfig: GitHubConfig;
  admins: SubAdmin[];
  systemTasks: SystemTask[];
  commRules: CommRule[];
  auditLogs: AuditLog[];
  analyticsData: AnalyticsData;
  
  // Actions
  verifyPayment: (id: string, action: 'APPROVE' | 'REJECT') => void;
  deleteInvoice: (id: string) => void;
  deleteClient: (id: number) => void;
  updateClientStatus: (id: number, status: string) => void;
  addClient: (client: any) => void;
  togglePlanStatus: (id: string) => void;
  addPlan: (plan: AdminPlan) => void;
  updatePlan: (id: string, plan: Partial<AdminPlan>) => void;
  deletePlan: (id: string) => void;
  refreshDashboard: () => void;
  updateGithubConfig: (config: Partial<GitHubConfig>) => void;
  addAdmin: (admin: Omit<SubAdmin, 'id'>) => void;
  updateAdmin: (id: number, updates: Partial<SubAdmin>) => void;
  deleteAdmin: (id: number) => void;
  runTask: (id: string) => void;
  toggleCommRule: (id: string) => void;
  
  // New selector for overview data
  getOverviewData: () => {
    kpi: {
      totalClients: number;
      revenue: number;
      activeTrials: number;
      systemHealth: string;
    };
    alerts: Array<{
      type: 'warning' | 'critical' | 'error';
      message: string;
      action: string;
    }>;
    quickStats: {
      newClientsToday: number;
      revenueToday: number;
    };
  };
}

// --- FIXED MOCK DATA (FUTURE DATES) ---
// Note: subscriptionEndsAt set to 2026 to avoid negative days
const INITIAL_CLIENTS = [
  { id: 1, name: 'Green Valley Society', email: 'admin@green.com', status: 'ACTIVE', plan: 'PRO', revenue: 125000, members: 245, subscriptionEndsAt: '2025-12-31' },
  { id: 2, name: 'Royal Residency', email: 'admin@royal.com', status: 'ACTIVE', plan: 'BASIC', revenue: 45000, members: 89, subscriptionEndsAt: '2026-06-30' },
  { id: 3, name: 'Sunset Apts', email: 'admin@sun.com', status: 'EXPIRING', plan: 'PRO', revenue: 80000, members: 150, subscriptionEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() }, // Expires in 4 days
];

const INITIAL_PLANS: AdminPlan[] = [
  { id: 'TRIAL', name: 'Trial', price: 0, limit: 100, features: ['15 Days Access'], color: 'bg-slate-100', isActive: true },
  { id: 'BASIC', name: 'Basic', price: 4000, limit: 200, features: ['Daily Ledger', 'Excel'], color: 'bg-blue-50', isActive: true },
  { id: 'PRO', name: 'Professional', price: 7000, limit: 2000, features: ['Audit Reports', 'Loans'], isPopular: true, color: 'bg-purple-50', isActive: true },
  { id: 'ENTERPRISE', name: 'Enterprise', price: 10000, limit: 99999, features: ['API Access', 'White Label'], color: 'bg-orange-50', isActive: true }
];

const INITIAL_ADMINS: SubAdmin[] = [
  { id: 1, name: 'Super Admin', email: 'admin@saanify.com', role: 'ADMIN', status: 'ACTIVE' },
  { id: 2, name: 'John Doe', email: 'john@support.com', role: 'SUPPORT', status: 'ACTIVE' }
];

const INITIAL_TASKS: SystemTask[] = [
  { id: 'schema-sync', name: 'Schema Sync', description: 'Sync database schema changes', schedule: '0 */6 * * *', lastRunStatus: 'SUCCESS', lastRunTime: '2 hours ago' },
  { id: 'db-backup', name: 'Database Backup', description: 'Secure backup to Supabase Storage', schedule: 'Manual', lastRunStatus: 'SUCCESS', lastRunTime: '1 day ago' },
  { id: 'db-restore', name: 'Database Restore', description: 'Restore from backup files', schedule: 'Manual', lastRunStatus: 'PENDING', lastRunTime: 'Never' },
  { id: 'auto-sync', name: 'Auto Data Sync', description: 'Scheduled client data synchronization', schedule: '0 */2 * * *', lastRunStatus: 'FAILED', lastRunTime: '5 hours ago' },
  { id: 'health-check', name: 'System Health', description: 'Monitor connectivity & latency', schedule: '*/5 * * * *', lastRunStatus: 'SUCCESS', lastRunTime: '5 mins ago' },
];

const INITIAL_COMMS: CommRule[] = [
  // --- EMAILS (4) ---
  { id: 'email-welcome', name: 'Welcome Email', type: 'EMAIL', stats: { sent: 24, pending: 0 }, status: 'ACTIVE' },
  { id: 'email-trial', name: 'Trial Expiry Warning', type: 'EMAIL', stats: { sent: 12, pending: 3 }, status: 'ACTIVE' },
  { id: 'email-payment', name: 'Payment Failed Alert', type: 'EMAIL', stats: { sent: 2, pending: 1 }, status: 'ACTIVE' },
  { id: 'email-renew', name: 'Renewal Reminder', type: 'EMAIL', stats: { sent: 8, pending: 5 }, status: 'PAUSED' },

  // --- PUSH NOTIFICATIONS (4) ---
  { id: 'push-signup', name: 'New Client Signup', type: 'PUSH', stats: { sent: 15, pending: 0, lastSent: '2 hours ago' }, status: 'ACTIVE' },
  { id: 'push-renew', name: 'Subscription Renewed', type: 'PUSH', stats: { sent: 5, pending: 0, lastSent: '1 day ago' }, status: 'ACTIVE' },
  // The missing ones:
  { id: 'push-payment-fail', name: 'Payment Failed', type: 'PUSH', stats: { sent: 3, pending: 1, lastSent: '3 days ago' }, status: 'ACTIVE' },
  { id: 'push-maintenance', name: 'System Maintenance', type: 'PUSH', stats: { sent: 150, pending: 0, lastSent: '1 week ago' }, status: 'ACTIVE' }
];

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-001', client: 'Green Valley', adminName: 'Ramesh', adminEmail: 'r@gv.com', plan: 'PRO', amount: 7000, date: '2025-12-14', status: 'PAID', method: 'RAZORPAY', transactionId: 'pay_123' },
  { id: 'INV-002', client: 'Sunset Apts', adminName: 'Suresh', adminEmail: 's@sunset.com', plan: 'BASIC', amount: 4000, date: '2025-12-15', status: 'PENDING', method: 'MANUAL_UPI', transactionId: 'UPI-998877', proofUrl: 'dummy' },
];

// --- MOCK DATA FOR AUDIT LOGS AND ANALYTICS ---
const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'LOG-001', user: 'Super Admin', role: 'SUPER_ADMIN', action: 'System Backup', resource: 'Database', ip: '192.168.1.5', status: 'SUCCESS', timestamp: 'Just now' },
  { id: 'LOG-002', user: 'John Doe', role: 'SUPPORT', action: 'Reset Password', resource: 'User: rahul@gmail.com', ip: '10.0.0.42', status: 'SUCCESS', timestamp: '10 mins ago' },
  { id: 'LOG-003', user: 'System Bot', role: 'AUTOMATION', action: 'Schema Sync', resource: 'Supabase', ip: '127.0.0.1', status: 'FAILED', timestamp: '1 hour ago' },
  { id: 'LOG-004', user: 'Super Admin', role: 'SUPER_ADMIN', action: 'Update Settings', resource: 'Global Config', ip: '192.168.1.5', status: 'SUCCESS', timestamp: '2 hours ago' },
  { id: 'LOG-005', user: 'Unknown', role: 'GUEST', action: 'Failed Login', resource: 'Auth', ip: '45.22.19.11', status: 'WARNING', timestamp: '5 hours ago' },
];

const MOCK_ANALYTICS: AnalyticsData = {
  revenueTrend: [
    { name: 'Jan', value: 12000 }, { name: 'Feb', value: 19000 }, { name: 'Mar', value: 15000 },
    { name: 'Apr', value: 25000 }, { name: 'May', value: 32000 }, { name: 'Jun', value: 45000 }
  ],
  userGrowth: [
    { name: 'Mon', active: 120, total: 150 }, { name: 'Tue', active: 132, total: 160 },
    { name: 'Wed', active: 101, total: 170 }, { name: 'Thu', active: 134, total: 180 },
    { name: 'Fri', active: 190, total: 200 }, { name: 'Sat', active: 230, total: 220 },
    { name: 'Sun', active: 210, total: 230 }
  ],
  deviceUsage: [
    { name: 'Desktop', value: 65 }, { name: 'Mobile', value: 30 }, { name: 'Tablet', value: 5 }
  ]
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      stats: { totalRevenue: 145000, activeClients: 12, totalClients: 15, monthlyRevenue: 22000, uptime: '99.9%' },
      clients: INITIAL_CLIENTS,
      invoices: MOCK_INVOICES,
      plans: INITIAL_PLANS,
      activities: [],
      githubConfig: { username: '', repo: '', token: '', branch: 'main', lastBackup: null },
      admins: INITIAL_ADMINS,
      systemTasks: INITIAL_TASKS,
      commRules: INITIAL_COMMS,
      auditLogs: MOCK_AUDIT_LOGS,
      analyticsData: MOCK_ANALYTICS,

      verifyPayment: (id, action) => {
        set((state) => ({
          invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status: action === 'APPROVE' ? 'PAID' : 'FAILED' } : inv)
        }));
      },
      deleteInvoice: (id) => set((state) => ({ invoices: state.invoices.filter(i => i.id !== id) })),
      deleteClient: (id) => set((state) => ({ clients: state.clients.filter(c => c.id !== id) })),
      updateClientStatus: (id, status) => {
        set((state) => ({
          clients: state.clients.map(client => 
            client.id === id ? { ...client, status } : client
          )
        }));
      },
      addClient: (client) => set((state) => ({ 
        clients: [...state.clients, { ...client, id: Date.now() }] 
      })),
      togglePlanStatus: (id) => set((state) => ({ plans: state.plans.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p) })),
      addPlan: (p) => set((s) => ({ plans: [...s.plans, p] })),
      updatePlan: (id, updatedPlan) => set((state) => ({
        plans: state.plans.map(p => p.id === id ? { ...p, ...updatedPlan } : p)
      })),
      deletePlan: (id) => set((state) => ({ plans: state.plans.filter(p => p.id !== id) })),
      refreshDashboard: () => {}, // placeholder
      updateGithubConfig: (config) => set((state) => ({ 
        githubConfig: { ...state.githubConfig, ...config } 
      })),
      addAdmin: (admin) => set((state) => ({ 
        admins: [...state.admins, { ...admin, id: Date.now() }] 
      })),
      updateAdmin: (id, updates) => set((state) => ({ 
        admins: state.admins.map(admin => 
          admin.id === id ? { ...admin, ...updates } : admin
        )
      })),
      deleteAdmin: (id) => set((state) => ({ 
        admins: state.admins.filter(admin => admin.id !== id) 
      })),
      runTask: (id) => set(s => ({
        systemTasks: s.systemTasks.map(t => t.id === id ? { ...t, lastRunStatus: 'PENDING', lastRunTime: 'Running...' } : t)
      })),
      toggleCommRule: (id) => set(s => ({
        commRules: s.commRules.map(r => r.id === id ? { ...r, status: r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : r)
      })),
      
      // New selector implementation
      getOverviewData: () => {
        const { clients, invoices, stats, systemTasks } = get();

        // 1. CALCULATE KPIs
        const activeTrials = clients.filter(c => c.plan === 'TRIAL' && c.status === 'ACTIVE').length;
        const pendingPayments = invoices.filter(i => i.status === 'PENDING').length;
        
        // 2. GENERATE ALERTS (Smart Logic)
        const alerts = [];
        
        // A. Trial Expiry Alert
        const expiringTrials = clients.filter(c => {
          const days = Math.ceil((new Date(c.subscriptionEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return c.plan === 'TRIAL' && days <= 3 && days >= 0;
        });
        if (expiringTrials.length > 0) {
          alerts.push({ type: 'warning', message: `${expiringTrials.length} Trials expiring within 3 days`, action: '/admin/clients' });
        }

        // B. Payment Alert
        if (pendingPayments > 0) {
          alerts.push({ type: 'critical', message: `${pendingPayments} Manual payments pending verification`, action: '/admin/subscriptions' });
        }

        // C. System Alert (Mock Logic for Automation)
        const failedTasks = systemTasks?.filter(t => t.lastRunStatus === 'FAILED') || [];
        if (failedTasks.length > 0) {
          alerts.push({ type: 'error', message: `${failedTasks.length} System tasks failed recently`, action: '/admin/automation' });
        }

        return {
          kpi: {
            totalClients: clients.length,
            revenue: stats.totalRevenue,
            activeTrials,
            systemHealth: '99.9%'
          },
          alerts,
          quickStats: {
            newClientsToday: 2, // Mock for now
            revenueToday: 15000
          }
        };
      },
    }),
    {
      // CHANGING KEY TO V7 TO FORCE RELOAD OF INITIAL_COMMS
      name: 'saas-admin-storage-v7-COMMS-FIX', 
      
      partialize: (state) => ({
        stats: state.stats,
        clients: state.clients,
        invoices: state.invoices,
        plans: state.plans,
        activities: state.activities,
        githubConfig: state.githubConfig,
        admins: state.admins,
        systemTasks: state.systemTasks,
        commRules: state.commRules,
        auditLogs: state.auditLogs,
        analyticsData: state.analyticsData,
      }),
      
      onRehydrateStorage: () => (state) => {
         // Auto-Seed logic (Ensure this uses the NEW INITIAL_COMMS)
         if (state && (!state.commRules || state.commRules.length < 8)) {
            console.log("⚡ Forced Reseeding of Comm Rules");
            state.commRules = INITIAL_COMMS;
         }
      }
    }
  )
);