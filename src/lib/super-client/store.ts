// Re-export the client store as super-client store for compatibility
// This maintains the existing API while using the consolidated client store

export { useClientStore as useSuperClientStore } from '@/lib/client/store';

// Re-export types for compatibility
export type {
  Member,
  PassbookEntry,
  Loan,
  LoanRequest,
  Expense,
  AdminFund,
  MaturityOverride,
  MaturityData,
  ReportData,
  AdminFundTransaction,
  ExpenseLedgerEntry,
  User,
  ActivityLog,
  Role,
  SubscriptionStatus,
  SubscriptionPlan,
  PremiumTrial,
  Permission,
  ClientState
} from '@/lib/client/store';

// Re-export constants
export { 
  SUBSCRIPTION_PLANS,
  PERMISSIONS,
  MOCK_ROLES
} from '@/lib/client/store';