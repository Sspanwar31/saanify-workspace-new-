import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Member {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
  email: string;
  address: string;
  joinDate: string;
  status: 'active' | 'inactive';
  totalDeposits?: number;
  totalLoans?: number;
  hasPaidMaintenance?: boolean;
}

export interface PassbookEntry {
  id: string;
  memberId: string;
  date: string;
  type: 'deposit' | 'loan' | 'interest' | 'withdrawal' | 'installment' | 'fine' | 'DEPOSIT' | 'INSTALLMENT';
  amount: number;
  description: string;
  balance: number;
  depositAmount?: number;
  installmentAmount?: number;
  interestAmount?: number;
  fineAmount?: number;
  paymentMode?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  interestRate: number;
  tenure: number;
  startDate: string;
  maturityDate: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted';
  emiAmount: number;
  remainingBalance: number;
  remainingAmount?: number;
  purpose: string;
}

export interface LoanRequest {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  purpose: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  totalDeposits: number;
  approvedAmount?: number;
  approvedDate?: string;
  rejectionReason?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  approvedBy: string;
}

export interface AdminFund {
  totalFunds: number;
  memberDeposits: number;
  loanDisbursed: number;
  expenses: number;
  interestEarned: number;
  lastUpdated: string;
}

export interface MaturityOverride {
  memberId: string;
  manualInterest: number;
  isOverride: boolean;
  updatedAt: string;
}

export interface MaturityData {
  memberId: string;
  memberName: string;
  joinDate: string;
  currentDeposit: number;
  outstandingLoan: number;
  tenure: number;
  monthsCompleted: number;
  monthlyDeposit: number;
  targetDeposit: number;
  projectedInterest: number;
  manualInterest: number;
  settledInterest: number;
  monthlyInterestShare: number;
  currentAccruedInterest: number;
  maturityAmount: number;
  netPayable: number;
  status: 'running' | 'matured';
  isOverride: boolean;
}

export interface ReportData {
  financials: {
    totalCollected: number;
    totalInterestCollected: number;
    totalExpenses: number;
    netProfit: number;
  };
  loanHealth: {
    totalDisbursed: number;
    totalRecovered: number;
    recoveryRate: number;
  };
  trends: {
    monthlyCollection: Array<{ month: string; amount: number }>;
    monthlyExpense: Array<{ month: string; amount: number }>;
  };
  filteredLoans?: Loan[];
  filteredPassbook?: PassbookEntry[];
}

// Add Helper Interface
export interface AuditFilter {
  dateRange: { from: Date; to: Date };
  memberId: string | 'ALL';
  type: string | 'ALL';
  mode: string | 'ALL';
}

export interface AdminFundTransaction {
  id: string;
  date: string;
  type: 'INJECT' | 'WITHDRAW';
  amount: number;
  description: string;
  runningBalance: number;
  createdAt: string;
}

export interface ExpenseLedgerEntry {
  id: string;
  date: string;
  description: string;
  memberId?: string;
  memberName?: string;
  category: 'MAINTENANCE_FEE' | 'STATIONERY' | 'PRINTING' | 'LOAN_FORMS' | 'REFRESHMENTS' | 'OTHER';
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  createdAt: string;
}

// User Management Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TREASURER' | 'MEMBER' | 'CLIENT_ADMIN' | {
    id: 'ADMIN' | 'TREASURER' | 'MEMBER' | 'CLIENT_ADMIN';
    name: string;
    permissions: string[];
  };
  status: 'ACTIVE' | 'BLOCKED';
  linkedMemberId?: string;
  lastLogin: string;
  avatar?: string;
  createdAt: string;
  phone?: string;
  department?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: {
    before?: string;
    after?: string;
    target?: string;
  };
  timestamp: string;
  ip: string;
  userAgent?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  color: string;
}

export interface SubscriptionStatus {
  currentPlan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  expiryDate: string;
  memberCount: number;
  subscriptionDate?: string;
}

export interface SubscriptionPlan {
  id: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  name: string;
  price: number;
  durationDays: number;
  maxMembers: number;
  features: string[];
  color: string;
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: Record<'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE', SubscriptionPlan> = {
  TRIAL: {
    id: 'TRIAL',
    name: 'Trial',
    price: 0,
    durationDays: 15,
    maxMembers: 100,
    features: ['Up to 100 Members', '15 Days', 'Basic Support', 'Limited Features'],
    color: 'bg-gray-100 text-gray-800'
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    price: 4000,
    durationDays: 30,
    maxMembers: 200,
    features: ['Up to 200 Members', '30 Days', 'Basic Support', 'Monthly Reports'],
    color: 'bg-gray-100 text-gray-800'
  },
  PRO: {
    id: 'PRO',
    name: 'Professional',
    price: 7000,
    durationDays: 30,
    maxMembers: 2000,
    features: ['Up to 2,000 Members', '30 Days', 'Priority Support', 'Advanced Analytics', 'API Access'],
    color: 'bg-blue-100 text-blue-800'
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 10000,
    durationDays: 30,
    maxMembers: Infinity,
    features: ['Unlimited Members', '30 Days', '24/7 Support', 'Custom Features', 'White Label'],
    color: 'bg-purple-100 text-purple-800'
  }
};

export interface PremiumTrial {
  used: boolean;
  active: boolean;
  startDate: Date | null;
}

// Settings Interface for Control Center
export interface Settings {
  // Society Profile (Branding)
  societyName: string;
  registrationNumber: string;
  societyAddress: string;
  contactEmail: string;
  currency: string;
  
  // Financial Configuration
  interestRate: number; // e.g. 12%
  loanLimitPercent: number; // e.g. 80%
  fineAmount: number; // e.g. ₹10 per day
  gracePeriodDay: number; // e.g. 15th of month
  
  // System Settings
  theme: 'light' | 'dark';
  autoBackup: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// Granular Permissions
export const PERMISSIONS = {
  // Module Access (Ghost Mode triggers)
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_PASSBOOK: 'view_passbook',
  VIEW_LOANS: 'view_loans',
  VIEW_MEMBERS: 'view_members',
  VIEW_REPORTS: 'view_reports',
  VIEW_SETTINGS: 'view_settings',
  VIEW_USERS: 'view_users', // Controls User Mgmt Tab Visibility
  
  // Actions
  MANAGE_FINANCE: 'manage_finance', // Approve loans, add entries
  MANAGE_USERS: 'manage_users',     // Add/Edit/Block users
  MANAGE_SYSTEM: 'manage_system',   // Settings, Subscription
};

export type Permission = 
  // Module Access (Ghost Mode triggers)
  | 'VIEW_DASHBOARD'
  | 'VIEW_PASSBOOK'
  | 'VIEW_LOANS'
  | 'VIEW_MEMBERS'
  | 'VIEW_REPORTS'
  | 'VIEW_SETTINGS'
  | 'VIEW_USERS' // <--- NEW: Controls User Mgmt Tab Visibility
  
  // Actions
  | 'MANAGE_FINANCE' // Approve loans, add entries
  | 'MANAGE_USERS'    // Add/Edit/Block users
  | 'MANAGE_SYSTEM'  // Settings, Subscription
  
  // Legacy permissions for backward compatibility
  | 'MANAGE_LOANS'
  | 'EXPORT_DATA'
  | 'MANAGE_MEMBERS'
  | 'MANAGE_EXPENSES'
  | 'MANAGE_SUBSCRIPTION'
  | 'VIEW_ACTIVITY_LOGS'
  | 'MANAGE_ROLES'
  | 'GHOST_MODE'
  | 'APPROVE_LOANS'
  | 'MANAGE_PASSBOOK'
  | 'MANAGE_ADMIN_FUND';



export interface ClientState {
  // Auth State
  isLoggedIn: boolean;
  currentUser: User | null;
  
  // Subscription State
  subscription: SubscriptionStatus;
  premiumTrial: PremiumTrial;
  
  // Settings State
  settings: Settings;
  
  // Data
  members: Member[];
  passbook: PassbookEntry[];
  passbookEntries: PassbookEntry[];
  loans: Loan[];
  loanRequests: LoanRequest[];
  expenses: Expense[];
  adminFund: AdminFund;
  adminFundLedger: AdminFundTransaction[];
  expenseLedger: ExpenseLedgerEntry[];
  maturityOverrides: MaturityOverride[];
  
  // User Management Data
  users: User[];
  activityLogs: ActivityLog[];
  roles: Role[];
  
  // Actions
  login: (email: string, password: string) => boolean;
  logout: () => void;
  
  // Member Actions
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  
  // Passbook Actions
  addEntry: (entry: Omit<PassbookEntry, 'id' | 'balance'>) => void;
  addPassbookEntry: (entry: Omit<PassbookEntry, 'id' | 'balance'>) => void;
  getMemberBalance: (memberId: string) => number;
  getMemberPassbook: (memberId: string) => PassbookEntry[];
  getMemberDepositBalance: (memberId: string) => number;
  getMemberOutstandingLoan: (memberId: string) => number;
  
  // Loan Actions
  requestLoan: (loan: Omit<Loan, 'id' | 'status' | 'remainingAmount'>) => { success: boolean; message: string };
  approveLoan: (requestId: string, approvedAmount: number, overrideEnabled: boolean) => void;
  rejectLoan: (requestId: string, reason: string) => void;
  calculateMaturity: (memberId: string) => { maturityAmount: number; totalInterest: number };
  deleteLoan: (id: string) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  
  // Fund Actions
  updateAdminFund: (updates: Partial<AdminFund>) => void;
  
  // Admin Fund Actions
  addAdminTransaction: (amount: number, type: 'INJECT' | 'WITHDRAW', description: string) => void;
  deleteAdminTransaction: (id: string) => void;
  getAdminFundSummary: () => {
    netBalance: number;
    totalInjected: number;
    totalWithdrawn: number;
  };

  // Expense Ledger Actions
  collectMaintenanceFee: (memberId: string) => void;
  addExpense: (amount: number, category: 'STATIONERY' | 'PRINTING' | 'LOAN_FORMS' | 'REFRESHMENTS' | 'OTHER', description: string) => void;
  deleteExpenseEntry: (id: string) => void;
  getMaintenanceStats: () => {
    totalFeesCollected: number;
    totalExpenses: number;
    netBalance: number;
    membersPaidCount: number;
  };
  
  // Utility Actions
  getActiveMembers: () => Member[];
  getInactiveMembers: () => Member[];
  getPendingLoans: () => LoanRequest[];
  getActiveLoans: () => Loan[];
  getTotalDeposits: () => number;
  getTotalLoans: () => number;
  getTotalExpenses: () => number;
  
  // Maturity Actions
  getMaturityData: () => MaturityData[];
  setMaturityOverride: (memberId: string, amount: number) => void;
  clearMaturityOverride: (memberId: string) => void;
  
  // User Management Actions
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
  linkMember: (userId: string, memberId: string) => void;
  unlinkMember: (userId: string) => void;
  deleteUser: (id: string) => void;
  getUsersByRole: (role: User['role']) => User[];
  getActiveUsers: () => User[];
  getBlockedUsers: () => User[];
  
  // Activity Log Actions
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  getActivityLogsByUser: (userId: string) => ActivityLog[];
  getActivityLogsByAction: (action: string) => ActivityLog[];
  
  // Role Management Actions
  hasPermission: (userId: string, permission: string) => boolean;
  canAccess: (userId: string, feature: string) => boolean;
  togglePermission: (roleId: string, permissionId: string) => void;
  
  // Ghost Mode (Impersonation)
  impersonateUser: (userId: string) => void;
  stopImpersonation: () => void;
  
  // Society Cash in Hand Calculator
  getSocietyCashInHand: () => number;
  
  // NEW REPORT SELECTORS FOR CASHBOOK, MEMBER SUMMARY, AND DEFAULTERS
  getCashbookData: (startDate?: string, endDate?: string) => Array<{
    date: string;
    type: 'IN' | 'OUT';
    description: string;
    amount: number;
    category: string;
    balance: number;
  }>;
  getMemberSummaryData: () => Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    status: 'active' | 'inactive';
    totalDeposits: number;
    totalLoans: number;
    principalPaid: number;
    interestPaid: number;
    finePaid: number;
    pendingLoan: number;
    netWorth: number;
    joinDate: string;
  }>;
  getDefaultersData: () => Array<{
    loanId: string;
    memberId: string;
    memberName: string;
    memberPhone: string;
    loanAmount: number;
    remainingBalance: number;
    pendingEmi: number;
    daysOverdue: number;
    status: 'Critical' | 'Warning' | 'Overdue';
    nextEmiDate: string;
  }>;
  
  // NEW AUDIT REPORTS SELECTOR
  getAuditData: (startDate?: string, endDate?: string) => {
    dailyLedger: Array<{
      date: string;
      deposit: number;
      emi: number;
      interest: number;
      fine: number;
      loanOut: number;
      cashIn: number;
      cashOut: number;
      netFlow: number;
      runningBal: number;
    }>;
    cashbook: Array<{
      date: string;
      cashIn: number;
      cashOut: number;
      bankIn: number;
      bankOut: number;
      upiIn: number;
      upiOut: number;
      closing: number;
    }>;
    summary: {
      income: {
        interest: number;
        fine: number;
        other: number;
      };
      expenses: {
        ops: number;
        maturityInt: number;
      };
      loans: {
        issued: number;
        recovered: number;
        pending: number;
      };
      assets: {
        deposits: number;
      };
    };
    memberReports: Array<{
      id: string;
      name: string;
      fatherName: string;
      phone: string;
      email: string;
      address: string;
      joinDate: string;
      status: 'active' | 'inactive';
      totalDeposits?: number;
      totalLoans?: number;
      hasPaidMaintenance?: boolean;
      loanTaken: number;
      principalPaid: number;
      interestPaid: number;
      finePaid: number;
      netWorth: number;
      activeLoanBal: number;
    }>;
    defaulters: Loan[];
    maturity: MaturityData[];
    loans: Loan[];
    modeStats: {
      cashBal: number;
      bankBal: number;
      upiBal: number;
    };
  };
  
  // Settings Actions
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  exportData: () => string;
  importData: (jsonData: string) => { success: boolean; message: string };
  factoryReset: () => void;
};

// --- REMOVE ANY OTHER 'mockUsers' or 'mockRoles' DEFINITIONS ---

// 1. EXPORT MOCK_ROLES (Renamed from DEFAULT_ROLES)
export const MOCK_ROLES: Role[] = [
  {
    id: 'CLIENT_ADMIN',
    name: 'Client Admin',
    permissions: ['VIEW_DASHBOARD', 'VIEW_PASSBOOK', 'VIEW_LOANS', 'VIEW_MEMBERS', 'VIEW_REPORTS', 'VIEW_SETTINGS', 'VIEW_USERS', 'MANAGE_FINANCE', 'MANAGE_USERS', 'MANAGE_SYSTEM', 'VIEW_ACTIVITY_LOGS', 'MANAGE_ROLES'],
    description: 'Society Owner - Full Access',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'TREASURER',
    name: 'Treasurer',
    permissions: ['VIEW_DASHBOARD', 'VIEW_PASSBOOK', 'VIEW_LOANS', 'VIEW_MEMBERS', 'VIEW_REPORTS', 'MANAGE_FINANCE'],
    description: 'Financial Management',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'MEMBER',
    name: 'Member',
    permissions: ['VIEW_DASHBOARD'],
    description: 'Read-only Portal Access',
    color: 'bg-gray-100 text-gray-800'
  }
];

// 2. DEFINE DEFAULT USER (To ensure Total Users = 1)
const mockUsers: User[] = [
  {
    id: 'CLIENT_001',
    name: 'Super Client',
    email: 'super@saanify.com',
    role: 'CLIENT_ADMIN',
    status: 'ACTIVE',
    avatar: '',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'TREASURER_001',
    name: 'Test Treasurer',
    email: 'treasurer@saanify.com',
    role: 'TREASURER',
    status: 'ACTIVE',
    avatar: '',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

// 3. OTHER EMPTY MOCKS (Keep these empty)
const mockMembers: Member[] = [];
const mockLoans: Loan[] = [];
const mockPassbook: PassbookEntry[] = [];
const mockExpenses: Expense[] = [];
const mockLoanRequests: LoanRequest[] = [];
const mockAdminFundLedger: AdminFundTransaction[] = [];
const mockExpenseLedger: ExpenseLedgerEntry[] = [];
const mockMaturityOverrides: MaturityOverride[] = [];
const mockActivityLogs: ActivityLog[] = [];
const mockRoles: Role[] = MOCK_ROLES;
const mockSubscription: SubscriptionStatus = {
  currentPlan: 'BASIC',
  status: 'ACTIVE',
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  memberCount: 0,
  subscriptionDate: new Date().toISOString().split('T')[0]
};
const mockPremiumTrial: PremiumTrial = { used: false, active: false, startDate: null };
const mockAdminFund: AdminFund = {
  totalFunds: 0,
  memberDeposits: 0,
  loanDisbursed: 0,
  expenses: 0,
  interestEarned: 0,
  lastUpdated: new Date().toISOString()
};

// Default Settings
const mockSettings: Settings = {
  // Society Profile (Branding)
  societyName: 'Saanify Society',
  registrationNumber: '',
  societyAddress: '',
  contactEmail: 'admin@saanify.com',
  currency: 'INR',
  
  // Financial Configuration
  interestRate: 12,
  loanLimitPercent: 80,
  fineAmount: 10,
  gracePeriodDay: 15,
  
  // System Settings
  theme: 'light',
  autoBackup: true,
  emailNotifications: true,
  smsNotifications: false,
};

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      // --- FORCE LOGGED IN STATE (PERMANENT FIX FOR NOW) ---
      isLoggedIn: true, 
      
      currentUser: {
        id: 'CLIENT_001',
        name: 'Super Client',
        email: 'super@saanify.com',
        role: 'CLIENT_ADMIN', // Ensure this matches the MOCK_ROLES ID
        status: 'ACTIVE',
        avatar: '',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      subscription: mockSubscription,
      premiumTrial: mockPremiumTrial,
      settings: mockSettings,
      members: mockMembers,
      passbook: mockPassbook,
      passbookEntries: mockPassbook,
      loans: mockLoans,
      loanRequests: mockLoanRequests,
      expenses: mockExpenses,
      adminFund: mockAdminFund,
      adminFundLedger: mockAdminFundLedger,
      expenseLedger: mockExpenseLedger,
      maturityOverrides: mockMaturityOverrides,
      users: mockUsers,
      activityLogs: mockActivityLogs,
      roles: mockRoles,
      
      // Login action with hardcoded admin check
      login: (email: string, password: string) => {
        // Hardcoded admin login for 'super@saanify.com'
        if (email === 'super@saanify.com') {
          set({
            isLoggedIn: true,
            currentUser: {
              id: 'CLIENT_001',
              name: 'Super Client',
              email: 'super@saanify.com',
              role: 'CLIENT_ADMIN',
              status: 'ACTIVE',
              avatar: '',
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }
          });
          return true;
        }
        
        // Check users array for other logins
        const user = get().users.find(u => u.email === email && u.status === 'ACTIVE');
        if (user) {
          set({
            isLoggedIn: true,
            currentUser: user
          });
          return true;
        }
        
        return false;
      },
      
      logout: () => {
        set({
          isLoggedIn: false,
          currentUser: null
        });
      },
      
      // Member Actions
      addMember: (memberData) => {
        const state = get();
        
        // 1. Validation
        if (state.members.some(m => m.phone === memberData.phone)) {
          throw new Error("Phone already exists");
        }

        // 2. Create Member
        const newMemberId = `M${Date.now()}`;
        const newMember: Member = { 
          ...memberData, 
          id: newMemberId, 
          totalDeposits: 0, 
          totalLoans: 0, 
          status: 'active' 
        };
        
        // 3. CREATE LINKED USER (Crucial Step)
        const newUser: User = {
          id: `USR_${newMemberId}`,
          name: memberData.name,
          email: memberData.email,
          role: 'MEMBER', // Assign Member Role
          status: 'ACTIVE',
          linkedMemberId: newMemberId, // Link to Profile
          lastLogin: '',
          createdAt: new Date().toISOString(),
          // Password defaults to Phone Number
          password: memberData.phone 
        } as any;

        // 4. Update Both Arrays
        set(state => ({
          members: [newMember, ...state.members],
          users: [...state.users, newUser], // <--- Now it will show in User Management
          subscription: { ...state.subscription, memberCount: state.members.length + 1 }
        }));
      },
      
      updateMember: (id, updates) => {
        set(state => ({
          members: state.members.map(member =>
            member.id === id ? { ...member, ...updates } : member
          )
        }));
      },
      
      // Passbook Actions
      addEntry: (entry) => {
        const newEntry: PassbookEntry = {
          ...entry,
          id: `P${Date.now()}`,
          balance: get().getMemberBalance(entry.memberId) + entry.amount
        };
        set(state => ({
          passbook: [...state.passbook, newEntry],
          passbookEntries: [...state.passbookEntries, newEntry]
        }));
      },
      
      addPassbookEntry: (entry) => {
        console.log("💰 Processing Entry:", entry);
        
        set((state) => {
          // 1. Create New Passbook Entry
          const newEntry = { ...entry, id: `P${Date.now()}`, balance: 0 };
          const newPassbook = [newEntry, ...state.passbookEntries];

          // 2. UPDATE MEMBER DEPOSITS
          const updatedMembers = state.members.map(m => 
            m.id === entry.memberId 
              ? { ...m, totalDeposits: (m.totalDeposits || 0) + (entry.depositAmount || 0) } 
              : m
          );

          // 3. UPDATE LOAN BALANCE (CRITICAL FIX)
          let updatedLoans = state.loans;
          
          if (entry.installmentAmount && entry.installmentAmount > 0) {
            console.log("📉 Deducting Loan Amount:", entry.installmentAmount);
            
            updatedLoans = state.loans.map(loan => {
              // Find ACTIVE loan for this member
              if (loan.memberId === entry.memberId && loan.status === 'active') {
                const newBalance = loan.remainingBalance - entry.installmentAmount;
                console.log(`Loan ${loan.id}: ${loan.remainingBalance} -> ${newBalance}`);
                
                return { 
                  ...loan, 
                  remainingBalance: Math.max(0, newBalance), // Prevent negative
                  status: newBalance <= 0 ? 'completed' : 'active' // Auto-close if paid
                };
              }
              return loan;
            });
          }

          // 4. RETURN NEW STATE
          return {
            passbook: newPassbook,
            passbookEntries: newPassbook,
            members: updatedMembers,
            loans: updatedLoans
          };
        });
      },
      
      getMemberBalance: (memberId) => {
        const { passbook } = get();
        const memberEntries = passbook.filter(entry => entry.memberId === memberId);
        if (memberEntries.length === 0) return 0;
        return memberEntries[memberEntries.length - 1].balance;
      },
      
      getMemberPassbook: (memberId) => {
        const { passbook } = get();
        return passbook.filter(entry => entry.memberId === memberId);
      },
      
      getMemberDepositBalance: (memberId) => {
        const { passbook } = get();
        return passbook
          .filter(entry => entry.memberId === memberId && entry.type === 'deposit')
          .reduce((sum, entry) => sum + entry.amount, 0);
      },
      
      getMemberOutstandingLoan: (memberId) => {
        const { loans } = get();
        const memberLoans = loans.filter(loan => loan.memberId === memberId && loan.status === 'active');
        return memberLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
      },
      
      // Loan Actions
      requestLoan: (loanData) => {
        const state = get();
        
        // 1. FIND THE MEMBER
        const member = state.members.find(m => m.id === loanData.memberId);
        
        // Validation
        if (!member) {
          console.error("❌ Request Failed: Member ID not found:", loanData.memberId);
          return { success: false, message: 'Member not found. Please try again.' };
        }

        // 2. CREATE REQUEST WITH REAL NAME
        const newRequest: LoanRequest = {
          ...loanData,
          id: `LR${Date.now()}`,
          memberId: member.id,
          memberName: member.name, // <--- CRITICAL: Bind the Real Name
          amount: Number(loanData.amount),
          purpose: loanData.purpose || 'Loan Request',
          requestedDate: new Date().toISOString(),
          status: 'pending',
          totalDeposits: member.totalDeposits || 0
        };

        // 3. SAVE TO STORE
        set((state) => ({
          loanRequests: [newRequest, ...state.loanRequests]
        }));

        console.log("✅ Loan Request Created for:", member.name);
        return { success: true, message: 'Loan request submitted successfully' };
      },
      
      approveLoan: (requestId, approvedAmount, overrideEnabled) => {
        const request = get().loanRequests.find(req => req.id === requestId);
        if (!request) return;
        
        const newLoan: Loan = {
          id: `L${Date.now()}`,
          memberId: request.memberId,
          amount: approvedAmount,
          interestRate: 12,
          tenure: 12,
          startDate: new Date().toISOString().split('T')[0],
          maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
          emiAmount: approvedAmount / 12,
          remainingBalance: approvedAmount,
          purpose: request.purpose
        };
        
        set(state => ({
          loans: [...state.loans, newLoan],
          loanRequests: state.loanRequests.map(req =>
            req.id === requestId
              ? { ...req, status: 'approved' as const, approvedAmount, approvedDate: new Date().toISOString().split('T')[0] }
              : req
          )
        }));
      },
      
      rejectLoan: (requestId, reason) => {
        set(state => ({
          loanRequests: state.loanRequests.map(req =>
            req.id === requestId
              ? { ...req, status: 'rejected' as const, rejectionReason: reason }
              : req
          )
        }));
      },
      
      calculateMaturity: (memberId) => {
        const deposits = get().getMemberDepositBalance(memberId);
        const loans = get().getMemberOutstandingLoan(memberId);
        const interest = (deposits * 8 * 12) / 100 / 12;
        return { maturityAmount: deposits + interest, totalInterest: interest };
      },

      deleteLoan: (id) => {
        set((state) => ({
          loans: state.loans.filter(l => l.id !== id)
        }));
        console.log("✅ Loan Deleted:", id);
      },

      updateLoan: (id, updates) => {
        set((state) => ({
          loans: state.loans.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
        console.log("✅ Loan Updated:", id, updates);
      },
      
      // Fund Actions
      updateAdminFund: (updates) => {
        set(state => ({
          adminFund: { ...state.adminFund, ...updates, lastUpdated: new Date().toISOString() }
        }));
      },
      
      // Admin Fund Actions
      addAdminTransaction: (amount, type, description) => {
        const newTransaction: AdminFundTransaction = {
          id: `AF${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type,
          amount,
          description,
          runningBalance: get().adminFund.totalFunds + (type === 'INJECT' ? amount : -amount),
          createdAt: new Date().toISOString()
        };
        
        set(state => ({
          adminFundLedger: [...state.adminFundLedger, newTransaction],
          adminFund: {
            ...state.adminFund,
            totalFunds: state.adminFund.totalFunds + (type === 'INJECT' ? amount : -amount),
            lastUpdated: new Date().toISOString()
          }
        }));
      },
      
      deleteAdminTransaction: (id) => {
        set(state => ({
          adminFundLedger: state.adminFundLedger.filter(transaction => transaction.id !== id)
        }));
      },
      
      getAdminFundSummary: () => {
        const { adminFundLedger } = get();
        const totalInjected = adminFundLedger
          .filter(t => t.type === 'INJECT')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawn = adminFundLedger
          .filter(t => t.type === 'WITHDRAW')
          .reduce((sum, t) => sum + t.amount, 0);
        const netBalance = totalInjected - totalWithdrawn;
        
        return { netBalance, totalInjected, totalWithdrawn };
      },

      // Expense Ledger Actions
      collectMaintenanceFee: (memberId) => {
        const member = get().members.find(m => m.id === memberId);
        if (!member) return;
        
        const newEntry: ExpenseLedgerEntry = {
          id: `EXP${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: `Maintenance fee from ${member.name}`,
          memberId,
          memberName: member.name,
          category: 'MAINTENANCE_FEE',
          type: 'INCOME',
          amount: 200,
          createdAt: new Date().toISOString()
        };
        
        set(state => ({
          expenseLedger: [...state.expenseLedger, newEntry],
          members: state.members.map(m =>
            m.id === memberId ? { ...m, hasPaidMaintenance: true } : m
          )
        }));
      },
      
      addExpense: (amount, category, description) => {
        const newEntry: ExpenseLedgerEntry = {
          id: `EXP${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description,
          category,
          type: 'EXPENSE',
          amount,
          createdAt: new Date().toISOString()
        };
        
        set(state => ({
          expenseLedger: [...state.expenseLedger, newEntry]
        }));
      },
      
      deleteExpenseEntry: (id) => {
        set(state => ({
          expenseLedger: state.expenseLedger.filter(entry => entry.id !== id)
        }));
      },
      
      getMaintenanceStats: () => {
        const { expenseLedger, members } = get();
        const totalFeesCollected = expenseLedger
          .filter(e => e.category === 'MAINTENANCE_FEE' && e.type === 'INCOME')
          .reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = expenseLedger
          .filter(e => e.type === 'EXPENSE')
          .reduce((sum, e) => sum + e.amount, 0);
        const membersPaidCount = members.filter(m => m.hasPaidMaintenance).length;
        const netBalance = totalFeesCollected - totalExpenses;

        return { totalFeesCollected, totalExpenses, netBalance, membersPaidCount };
      },
      
      // Utility Actions
      getActiveMembers: () => {
        const { members } = get();
        return members.filter(member => member.status === 'active');
      },
      
      getInactiveMembers: () => {
        const { members } = get();
        return members.filter(member => member.status === 'inactive');
      },
      
      getPendingLoans: () => {
        const { loanRequests } = get();
        return loanRequests.filter(request => request.status === 'pending');
      },
      
      getActiveLoans: () => {
        const { loans } = get();
        return loans.filter(loan => loan.status === 'active');
      },
      
      getTotalDeposits: () => {
        const { members } = get();
        return members.reduce((total, member) => total + (member.totalDeposits || 0), 0);
      },
      
      getTotalLoans: () => {
        const { loans } = get();
        return loans.reduce((total, loan) => total + loan.amount, 0);
      },
      
      getTotalExpenses: () => {
        const { expenses } = get();
        return expenses.reduce((total, expense) => total + expense.amount, 0);
      },
      
      // Maturity Actions
      getMaturityData: () => {
        const { members, maturityOverrides } = get();
        return members.map(member => {
          const currentDeposit = get().getMemberDepositBalance(member.id);
          const outstandingLoan = get().getMemberOutstandingLoan(member.id);
          const memberPassbook = get().getMemberPassbook(member.id);
          const override = maturityOverrides.find(ov => ov.memberId === member.id);
          
          // 1. DETERMINE MONTHLY DEPOSIT (SHARE VALUE)
          // Sort passbook by date ascending to find the very first entry
          const sortedPassbook = memberPassbook.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const firstDepositEntry = sortedPassbook.find(e => e.type === 'DEPOSIT' || e.type === 'deposit' || e.depositAmount > 0);

          // If found, use that amount. If no deposit yet, default to 0.
          const monthlyDeposit = firstDepositEntry ? (firstDepositEntry.depositAmount || firstDepositEntry.amount) : 0;

          // 2. CALCULATE TARGETS BASED ON SHARE VALUE
          const targetDeposit = monthlyDeposit * 36;
          const projectedInterest = (targetDeposit * 12) / 100; // 12% Flat on Target

          // 3. SETTLED INTEREST & REVERSE CALCULATION (Same as before)
          const isOverride = override?.isOverride || false;
          const manualInterest = override?.manualInterest || 0;

          const settledInterest = isOverride ? manualInterest : projectedInterest;

          // Monthly Interest Share (Allocated per month)
          const monthlyInterestShare = settledInterest / 36;

          // Current Accrued (Based on time passed)
          const monthsCompleted = Math.min(
            Math.floor((new Date().getTime() - new Date(member.joinDate).getTime()) / (30 * 24 * 60 * 60 * 1000)),
            36
          );
          const currentAccruedInterest = monthlyInterestShare * monthsCompleted;

          // Final Totals
          const maturityAmount = targetDeposit + settledInterest;
          const netPayable = maturityAmount - outstandingLoan;
          
          return {
            memberId: member.id,
            memberName: member.name,
            joinDate: member.joinDate,
            currentDeposit,
            outstandingLoan,
            tenure: 36,
            monthsCompleted,
            monthlyDeposit, // This is now Dynamic
            targetDeposit,
            projectedInterest,
            manualInterest,
            settledInterest,      // Value used for calc
            monthlyInterestShare, // New Column 9
            currentAccruedInterest, // New Column 10
            maturityAmount,       // New Column 11
            netPayable,
            status: monthsCompleted >= 36 ? 'matured' : 'running',
            isOverride
          };
        });
      },
      
      setMaturityOverride: (memberId, amount) => {
        const newOverride: MaturityOverride = {
          memberId,
          manualInterest: amount,
          isOverride: true,
          updatedAt: new Date().toISOString()
        };
        
        set(state => ({
          maturityOverrides: [
            ...state.maturityOverrides.filter(o => o.memberId !== memberId),
            newOverride
          ]
        }));
      },
      
      clearMaturityOverride: (memberId) => {
        set(state => ({
          maturityOverrides: state.maturityOverrides.filter(o => o.memberId !== memberId)
        }));
      },
      
      // Subscription Actions
      upgradePlan: (planId) => {
        set(state => ({
          subscription: {
            ...state.subscription,
            currentPlan: planId,
            status: 'ACTIVE',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }));
      },
      
      checkSubscriptionStatus: () => {
        return get().subscription;
      },
      
      setSubscriptionStatus: (status) => {
        set(state => ({
          subscription: {
            ...state.subscription,
            status
          }
        }));
      },
      
      simulateExpiry: () => {
        set(state => ({
          subscription: {
            ...state.subscription,
            status: 'EXPIRED',
            expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }));
      },
      
      forceUnlock: () => {
        set(state => ({
          subscription: {
            ...state.subscription,
            status: 'ACTIVE'
          }
        }));
      },
      
      activatePremiumTrial: () => {
        set(state => ({
          premiumTrial: {
            used: true,
            active: true,
            startDate: new Date()
          }
        }));
      },
      
      checkPremiumTrialStatus: () => {
        return get().premiumTrial;
      },
      
      resetTrialState: () => {
        set(state => ({
          premiumTrial: {
            used: false,
            active: false,
            startDate: null
          }
        }));
      },
      
      // Reports Actions
      getReportData: (startDate, endDate) => {
        const { members, loans, passbook, expenses } = get();
        
        const totalCollected = passbook
          .filter(entry => entry.type === 'deposit')
          .reduce((sum, entry) => sum + entry.amount, 0);
          
        const totalInterestCollected = passbook
          .filter(entry => entry.type === 'interest')
          .reduce((sum, entry) => sum + entry.amount, 0);
          
        const totalExpenses = expenses
          .reduce((sum, expense) => sum + expense.amount, 0);
          
        const netProfit = totalCollected + totalInterestCollected - totalExpenses;
        
        const totalDisbursed = loans
          .reduce((sum, loan) => sum + loan.amount, 0);
          
        const totalRecovered = loans
          .filter(loan => loan.status === 'completed')
          .reduce((sum, loan) => sum + loan.amount, 0);
          
        const recoveryRate = totalDisbursed > 0 ? (totalRecovered / totalDisbursed) * 100 : 0;
        
        return {
          financials: {
            totalCollected,
            totalInterestCollected,
            totalExpenses,
            netProfit
          },
          loanHealth: {
            totalDisbursed,
            totalRecovered,
            recoveryRate
          },
          trends: {
            monthlyCollection: [],
            monthlyExpense: []
          }
        };
      },
      
      getAuditData: (startDate?: string, endDate?: string) => {
        const state = get();
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31);
        start.setHours(0,0,0,0); end.setHours(23,59,59,999);

        const { passbookEntries, loans, members, expenseLedger, adminFundLedger, getMaturityData } = state;

        // 1. MASTER TRANSACTION LIST (Merged & Sorted)
        const allTxns = [
          ...passbookEntries.map(e => ({ ...e, category: 'PASSBOOK', mode: e.paymentMode || 'CASH' })),
          ...loans.map(l => ({ ...l, date: l.startDate, amount: l.amount, type: 'LOAN_GIVEN', category: 'LOAN', mode: 'CASH' })),
          ...expenseLedger.map(e => ({ ...e, category: 'EXPENSE', mode: 'CASH' })),
          ...adminFundLedger.map(e => ({ ...e, category: 'ADMIN', mode: 'CASH' }))
        ].filter(t => new Date(t.date) >= start && new Date(t.date) <= end)
         .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. DAILY LEDGER LOGIC (Running Balance)
        let runningBal = 0;
        const dailyLedger = allTxns.map(t => {
          const isCredit = ['DEPOSIT', 'INSTALLMENT', 'INTEREST', 'FINE', 'INCOME', 'INJECT'].includes(t.type.toUpperCase());
          const val = Math.abs(t.amount);
          
          // Components
          const deposit = t.type === 'DEPOSIT' ? val : 0;
          const emi = t.type === 'INSTALLMENT' ? val : 0;
          const loanOut = t.type === 'LOAN_GIVEN' ? val : 0;
          const interest = t.type === 'INTEREST' ? val : 0;
          const fine = t.type === 'FINE' ? val : 0;

          const cashIn = deposit + emi + interest + fine; // Pure Inflow
          const cashOut = loanOut; // Pure Outflow
          const netFlow = cashIn - cashOut;
          
          runningBal += (isCredit ? val : -val);

          return { date: t.date, deposit, emi, loanOut, interest, fine, cashIn, cashOut, netFlow, runningBal };
        });

        // 3. CASHBOOK (Tally Style Mode-Wise)
        let cashBal = 0, bankBal = 0, upiBal = 0;
        const cashbook = allTxns.map(t => {
          const m = t.mode.toLowerCase();
          const isCredit = ['DEPOSIT', 'INSTALLMENT', 'INTEREST', 'FINE', 'INCOME', 'INJECT'].includes(t.type.toUpperCase());
          const val = Math.abs(t.amount);

          let cashIn=0, cashOut=0, bankIn=0, bankOut=0, upiIn=0, upiOut=0;

          if(m.includes('bank')) { 
            if (isCredit) { 
              bankIn = val; 
              bankBal += val; 
            } else { 
              bankOut = val; 
              bankBal -= val; 
            } 
          }
          else if(m.includes('upi')) { 
            if (isCredit) { 
              upiIn = val; 
              upiBal += val; 
            } else { 
              upiOut = val; 
              upiBal -= val; 
            } 
          }
          else { 
            if (isCredit) { 
              cashIn = val; 
              cashBal += val; 
            } else { 
              cashOut = val; 
              cashBal -= val; 
            } 
          }

          return { date: t.date, cashIn, cashOut, bankIn, bankOut, upiIn, upiOut, closing: cashBal+bankBal+upiBal };
        });

        // 4. SUMMARY METRICS
        const summary = {
          income: {
            interest: passbookEntries.filter(e => e.type === 'INTEREST').reduce((s,c) => s+c.amount, 0),
            fine: passbookEntries.filter(e => e.type === 'FINE').reduce((s,c) => s+c.amount, 0),
            other: expenseLedger.filter(e => e.type === 'INCOME').reduce((s,c) => s+c.amount, 0),
          },
          expenses: {
            ops: expenseLedger.filter(e => e.type === 'EXPENSE').reduce((s,c) => s+c.amount, 0),
            maturityInt: getMaturityData().reduce((s, m) => s + m.finalInterest, 0),
          },
          loans: {
            issued: loans.reduce((s, l) => s + l.amount, 0),
            recovered: passbookEntries.filter(e => e.type === 'INSTALLMENT').reduce((s,c) => s+Math.abs(c.amount), 0),
            pending: loans.filter(l => l.status === 'active').reduce((s, l) => s + l.remainingBalance, 0),
          },
          assets: {
            deposits: members.reduce((s, m) => s + (m.totalDeposits || 0), 0)
          }
        };

        // 5. MEMBER REPORT
        const memberReports = members.map(m => {
          const activeLoan = loans.find(l => l.memberId === m.id && l.status === 'active');
          const memberPassbookEntries = passbookEntries.filter(entry => entry.memberId === m.id);
          
          // Calculate interest and fine paid from passbook entries
          const interestPaid = memberPassbookEntries
            .filter(entry => entry.type === 'payment' && entry.subtype === 'interest')
            .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
            
          const finePaid = memberPassbookEntries
            .filter(entry => entry.type === 'payment' && entry.subtype === 'fine')
            .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
            
          // Calculate principal paid from passbook entries
          const principalPaid = memberPassbookEntries
            .filter(entry => entry.type === 'payment' && entry.subtype === 'principal')
            .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
          
          return {
            ...m,
            loanTaken: loans.filter(l => l.memberId === m.id).reduce((s,l) => s+l.amount, 0),
            principalPaid: principalPaid,
            interestPaid: interestPaid,
            finePaid: finePaid,
            netWorth: (m.totalDeposits || 0) - (activeLoan?.remainingBalance || 0),
            activeLoanBal: activeLoan?.remainingBalance || 0
          };
        });

        // 6. DEFAULTERS
        const defaulters = loans.filter(l => l.status === 'active' && l.remainingBalance > 0); // Add Date logic

        return { summary, dailyLedger, cashbook, memberReports, defaulters, maturity: getMaturityData(), loans, modeStats: { cashBal, bankBal, upiBal } };
      },

    // User Management Actions
    addUser: (user) => {
        const newUser = {
          ...user,
          id: `U${Date.now()}`,
          createdAt: new Date().toISOString()
        } as User;
        set(state => ({
          users: [...state.users, newUser]
        }));
    },
    
    updateUser: (id, updates) => {
      set(state => ({
        users: state.users.map(user =>
          user.id === id ? { ...user, ...updates } : user
        )
      }));
    },
    
    blockUser: (id) => {
      set(state => ({
        users: state.users.map(user =>
          user.id === id ? { ...user, status: 'BLOCKED' as const } : user
        )
      }));
    },
    
    unblockUser: (id) => {
      set(state => ({
        users: state.users.map(user =>
          user.id === id ? { ...user, status: 'ACTIVE' as const } : user
        )
      }));
    },
    
    linkMember: (userId, memberId) => {
      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, linkedMemberId: memberId } : user
        )
      }));
    },
    
    unlinkMember: (userId) => {
      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, linkedMemberId: undefined } : user
        )
      }));
    },
    
    deleteUser: (id) => {
      set(state => ({
        users: state.users.filter(user => user.id !== id)
      }));
    },
    
    getUsersByRole: (role) => {
      const { users } = get();
      return users.filter(user => user.role === role);
    },
    
    getActiveUsers: () => {
      const { users } = get();
      return users.filter(user => user.status === 'ACTIVE');
    },
    
    getBlockedUsers: () => {
      const { users } = get();
      return users.filter(user => user.status === 'BLOCKED');
    },
    
    // Activity Log Actions
    addActivityLog: (log) => {
      const newLog: ActivityLog = {
        ...log,
        id: `AL${Date.now()}`,
        timestamp: new Date().toISOString(),
        ip: '192.168.1.100',
        userAgent: navigator.userAgent
      };
      
      set(state => ({
        activityLogs: [...state.activityLogs, newLog]
      }));
    },
    
    getActivityLogsByUser: (userId) => {
      const { activityLogs } = get();
      return activityLogs.filter(log => log.userId === userId);
    },
    
    getActivityLogsByAction: (action) => {
      const { activityLogs } = get();
      return activityLogs.filter(log => log.action === action);
    },
    
    // Role Management Actions
    hasPermission: (userId, permission) => {
        const user = get().users.find(u => u.id === userId);
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === 'SUPER_ADMIN') return true;
        
        // Check role-based permissions (simplified)
        const rolePermissions: Record<string, string[]> = {
          'ADMIN': ['manage_users', 'manage_finance', 'manage_system'],
          'TREASURER': ['manage_finance'],
          'MEMBER': []
        };
        
        return rolePermissions[user.role]?.includes(permission) || false;
      },
    
    canAccess: (userId, feature) => {
      return get().hasPermission(userId, `view_${feature}`);
    },
    
    togglePermission: (roleId, permissionId) => {
      set(state => ({
        roles: state.roles.map(role => {
          if (role.id === roleId) {
            const hasPermission = role.permissions.includes(permissionId);
            return {
              ...role,
              permissions: hasPermission
                ? role.permissions.filter(p => p !== permissionId)
                : [...role.permissions, permissionId]
            };
          }
          return role;
        })
      }));
    },
    
    // Ghost Mode (Impersonation)
    impersonateUser: (userId) => {
      const user = get().users.find(u => u.id === userId);
      if (user) {
        get().addActivityLog({
          userId: 'U001',
          userName: 'Current User',
          action: 'GHOST_MODE_ACTIVATED',
          details: {
            target: user.name,
            after: `Impersonating user: ${user.email}`
          },
          ip: '192.168.1.100',
          userAgent: navigator.userAgent
        });
      }
    },
    
    stopImpersonation: () => {
      get().addActivityLog({
        userId: 'U001',
        userName: 'Current User',
        action: 'GHOST_MODE_DEACTIVATED',
        details: {
          after: 'Stopped impersonation'
        },
        ip: '192.168.1.100',
        userAgent: navigator.userAgent
      });
    },
    
    // Society Cash in Hand Calculator
    getSocietyCashInHand: () => {
        const state = get();

        // 1. CASH INFLOWS (+)
        const passbookInflow = state.passbook.reduce((sum, entry) => {
          // Sum up everything that brings money IN (Deposits, Installments, Interest, Fines)
          // Using Math.abs to ensure positive addition regardless of storage format
          if (['DEPOSIT', 'INSTALLMENT', 'INTEREST', 'FINE'].includes(entry.type.toUpperCase())) {
            return sum + Math.abs(entry.amount);
          }
          return sum;
        }, 0);

        const adminInjections = state.adminFundLedger
          .filter(t => t.type === 'INJECT')
          .reduce((sum, t) => sum + t.amount, 0);

        const maintenanceFees = state.expenseLedger
          .filter(e => e.type === 'INCOME')
          .reduce((sum, e) => sum + e.amount, 0);

        // 2. CASH OUTFLOWS (-)
        const loansDisbursed = state.loans.reduce((sum, loan) => sum + loan.amount, 0);

        const expenses = state.expenseLedger
          .filter(e => e.type === 'EXPENSE')
          .reduce((sum, e) => sum + e.amount, 0);

        const adminWithdrawals = state.adminFundLedger
          .filter(t => t.type === 'WITHDRAW')
          .reduce((sum, t) => sum + t.amount, 0);

        // 3. NET CALCULATION
        const totalIn = passbookInflow + adminInjections + maintenanceFees;
        const totalOut = loansDisbursed + expenses + adminWithdrawals;

        return totalIn - totalOut;
      },

    // NEW REPORT SELECTORS FOR CASHBOOK, MEMBER SUMMARY, AND DEFAULTERS
    
    // A. Cashbook Logic (All Transactions Chronologically)
    getCashbookData: (startDate?: string, endDate?: string) => {
      const state = get();
      const cashbookEntries = [];
      
      // 1. Passbook Entries (Deposits, Loans, Installments, Interest, etc.)
      state.passbook.forEach(entry => {
        const entryDate = entry.date;
        const dateInRange = (!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate);
        
        if (dateInRange) {
          const isIncome = ['deposit', 'DEPOSIT', 'installment', 'INSTALLMENT', 'interest', 'INTEREST', 'fine', 'FINE'].includes(entry.type);
          cashbookEntries.push({
            date: entryDate,
            type: isIncome ? 'IN' : 'OUT',
            description: entry.description || `${entry.type} - ${entry.memberId}`,
            amount: Math.abs(entry.amount),
            category: entry.type === 'deposit' || entry.type === 'DEPOSIT' ? 'Deposit' :
                    entry.type === 'installment' || entry.type === 'INSTALLMENT' ? 'Loan Installment' :
                    entry.type === 'interest' || entry.type === 'INTEREST' ? 'Interest Income' :
                    entry.type === 'fine' || entry.type === 'FINE' ? 'Fine' : 'Other',
            balance: 0 // Will be calculated after sorting
          });
        }
      });
      
      // 2. Expense Ledger Entries
      state.expenseLedger.forEach(entry => {
        const entryDate = entry.date;
        const dateInRange = (!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate);
        
        if (dateInRange) {
          cashbookEntries.push({
            date: entryDate,
            type: entry.type === 'INCOME' ? 'IN' : 'OUT',
            description: entry.description,
            amount: Math.abs(entry.amount),
            category: entry.category === 'MAINTENANCE_FEE' ? 'Maintenance Fee' :
                    entry.category === 'STATIONERY' ? 'Stationery' :
                    entry.category === 'PRINTING' ? 'Printing' :
                    entry.category === 'LOAN_FORMS' ? 'Loan Forms' :
                    entry.category === 'REFRESHMENTS' ? 'Refreshments' : 'Other Expense',
            balance: 0
          });
        }
      });
      
      // 3. Admin Fund Ledger Entries
      state.adminFundLedger.forEach(entry => {
        const entryDate = entry.date;
        const dateInRange = (!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate);
        
        if (dateInRange) {
          cashbookEntries.push({
            date: entryDate,
            type: entry.type === 'INJECT' ? 'IN' : 'OUT',
            description: entry.description,
            amount: Math.abs(entry.amount),
            category: entry.type === 'INJECT' ? 'Admin Fund Injection' : 'Admin Fund Withdrawal',
            balance: 0
          });
        }
      });
      
      // Sort by date (descending)
      cashbookEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Calculate running balance
      let runningBalance = 0;
      cashbookEntries.forEach(entry => {
        if (entry.type === 'IN') {
          runningBalance += entry.amount;
        } else {
          runningBalance -= entry.amount;
        }
        entry.balance = runningBalance;
      });
      
      return cashbookEntries;
    },
    
    // B. Member Summary Logic
    getMemberSummaryData: () => {
      const state = get();
      const memberSummary = [];
      
      state.members.forEach(member => {
        // Calculate Total Deposits
        const totalDeposits = state.passbook
          .filter(entry => entry.memberId === member.id && 
                  (entry.type === 'deposit' || entry.type === 'DEPOSIT'))
          .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
        
        // Calculate Total Loan Taken
        const totalLoans = state.loans
          .filter(loan => loan.memberId === member.id)
          .reduce((sum, loan) => sum + loan.amount, 0);
        
        // Calculate Active Loan Amount (Pending Loan)
        const activeLoans = state.loans.filter(loan => 
          loan.memberId === member.id && loan.status === 'active'
        );
        const pendingLoan = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
        
        // Calculate Principal Paid
        const principalPaid = state.loans
          .filter(loan => loan.memberId === member.id)
          .reduce((sum, loan) => sum + (loan.amount - (loan.remainingBalance || 0)), 0);
        
        // Calculate Interest Paid
        const interestPaid = state.passbook
          .filter(entry => entry.memberId === member.id && 
                  (entry.type === 'interest' || entry.type === 'INTEREST'))
          .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
        
        // Calculate Fine Paid
        const finePaid = state.passbook
          .filter(entry => entry.memberId === member.id && 
                  (entry.type === 'fine' || entry.type === 'FINE'))
          .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
        
        // Calculate Net Worth (Total Deposits - Pending Loan)
        const netWorth = totalDeposits - pendingLoan;
        
        memberSummary.push({
          id: member.id,
          name: member.name,
          phone: member.phone,
          email: member.email,
          status: member.status,
          totalDeposits,
          totalLoans,
          principalPaid,
          interestPaid,
          finePaid,
          pendingLoan,
          netWorth,
          joinDate: member.joinDate
        });
      });
      
      return memberSummary.sort((a, b) => b.netWorth - a.netWorth);
    },
    
    // C. Defaulter Logic
    getDefaultersData: () => {
      const state = get();
      const defaulters = [];
      const today = new Date();
      
      state.loans.forEach(loan => {
        if (loan.status === 'active' && loan.remainingBalance > 0) {
          // For demo purposes, mark 20% of active loans as overdue
          const isOverdue = Math.random() > 0.8;
          
          if (isOverdue) {
            // Calculate days overdue (mock data)
            const daysOverdue = Math.floor(Math.random() * 90) + 1; // 1-90 days
            
            // Calculate pending EMI (simplified)
            const pendingEmi = loan.emiAmount || (loan.amount / loan.tenure);
            
            const member = state.members.find(m => m.id === loan.memberId);
            
            defaulters.push({
              loanId: loan.id,
              memberId: loan.memberId,
              memberName: member?.name || 'Unknown Member',
              memberPhone: member?.phone || '',
              loanAmount: loan.amount,
              remainingBalance: loan.remainingBalance,
              pendingEmi,
              daysOverdue,
              status: daysOverdue > 60 ? 'Critical' : daysOverdue > 30 ? 'Warning' : 'Overdue',
              nextEmiDate: loan.maturityDate // Using maturity date as placeholder
            });
          }
        }
      });
      
      return defaulters.sort((a, b) => b.daysOverdue - a.daysOverdue);
    },
    
    // Settings Actions
    updateSettings: (updates: Partial<Settings>) => {
      set((state) => ({
        settings: { ...state.settings, ...updates }
      }));
    },
    
    resetSettings: () => {
      set({
        settings: mockSettings
      });
    },
    
    exportData: () => {
      const state = get();
      const exportData = {
        settings: state.settings,
        members: state.members,
        passbook: state.passbook,
        passbookEntries: state.passbookEntries,
        loans: state.loans,
        loanRequests: state.loanRequests,
        expenses: state.expenses,
        adminFund: state.adminFund,
        adminFundLedger: state.adminFundLedger,
        expenseLedger: state.expenseLedger,
        maturityOverrides: state.maturityOverrides,
        users: state.users,
        activityLogs: state.activityLogs,
        roles: state.roles,
        subscription: state.subscription,
        premiumTrial: state.premiumTrial,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    },
    
    importData: (jsonData: string) => {
      try {
        const importData = JSON.parse(jsonData);
        
        // Validate required structure
        if (!importData.version || !importData.settings) {
          return { success: false, message: 'Invalid backup file format' };
        }
        
        // Import all data
        set({
          settings: importData.settings || mockSettings,
          members: importData.members || [],
          passbook: importData.passbook || [],
          passbookEntries: importData.passbookEntries || [],
          loans: importData.loans || [],
          loanRequests: importData.loanRequests || [],
          expenses: importData.expenses || [],
          adminFund: importData.adminFund || mockAdminFund,
          adminFundLedger: importData.adminFundLedger || [],
          expenseLedger: importData.expenseLedger || [],
          maturityOverrides: importData.maturityOverrides || [],
          users: importData.users || [],
          activityLogs: importData.activityLogs || [],
          roles: importData.roles || [],
          subscription: importData.subscription || mockSubscription,
          premiumTrial: importData.premiumTrial || mockPremiumTrial,
        });
        
        return { success: true, message: 'Data imported successfully' };
      } catch (error) {
        return { success: false, message: 'Failed to parse backup file' };
      }
    },
    
    factoryReset: () => {
      set({
        settings: mockSettings,
        members: [],
        passbook: [],
        passbookEntries: [],
        loans: [],
        loanRequests: [],
        expenses: [],
        adminFund: mockAdminFund,
        adminFundLedger: [],
        expenseLedger: [],
        maturityOverrides: [],
        users: [],
        activityLogs: [],
        roles: [],
        subscription: mockSubscription,
        premiumTrial: mockPremiumTrial,
      });
    }
    }),
    {
      name: 'saanify-client-prod-v3-FORCED', // <--- NEW KEY
    }
  )
);