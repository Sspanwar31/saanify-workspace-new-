// Central Export File for All Data Services
// Future-ready for API integration

// Core Data Modules
export { default as membersData, getMemberStats, getActiveMembers, getMemberById, isPhoneUnique, isAadharUnique, generateMemberId, validateMemberForm, getStatusColor, formatDate, formatCurrency } from './membersData'
export type { Member, MemberStats } from './membersData'

export { default as loansData, calculateEMI, calculateTotalInterest, checkLoanEligibility, getLoanStats, getLoansByMemberId, getActiveLoansByMemberId, hasPendingLoans, generateLoanId, validateLoanForm, getStatusColor, formatDate, formatCurrency, loanAPI } from './loansData'
export type { Loan, LoanStats } from './loansData'

export { default as passbookData, generateDepositTransaction, generateLoanDisbursementTransaction, generateEMIPaymentTransaction, calculateLateFine, generateFineTransaction, calculateMonthlyInterest, generateInterestTransaction, getPassbookStats, getEntriesByMemberId, getCurrentBalance, generatePassbookId, validatePassbookForm, getTypeColor, getReferenceColor, formatDate, formatCurrency, passbookAPI } from './passbookData'
export type { PassbookEntry, PassbookStats, MemberPassbookSummary } from './passbookData'

export { default as expensesData, default as incomeData, getExpenseStats, getExpensesByDateRange, getIncomeByDateRange, getRecurringExpenses, getPendingApprovals, generateExpenseId, generateIncomeId, validateExpenseForm, validateIncomeForm, getCategoryColor, getIncomeCategoryColor, getPaymentModeColor, getStatusColor, formatDate, formatCurrency, expenseAPI } from './expensesData'
export type { Expense, Income, ExpenseStats } from './expensesData'

export { default as adminFundData, getAdminFundSummary, getFundFlowReport, getMonthlyFundFlow, getPendingTransactions, getTransactionsByType, getTransactionsByDateRange, generateAdminFundId, validateAdminFundForm, getTransactionTypeColor, getStatusColor, getPaymentModeColor, formatDate, formatCurrency, adminFundAPI } from './adminFundData'
export type { AdminFundTransaction, AdminFundSummary, FundFlowReport } from './adminFundData'

export { getDashboardMetrics, getRecentActivities, getMemberLoanSummaries, getMonthlyTrend, getTopPerformers, dashboardAPI } from './dashboardData'
export type { DashboardMetrics, RecentActivity, MemberLoanSummary } from './dashboardData'

export { getProfitLossStatement, getMemberPerformanceReport, getLoanPerformanceReport, getSocietyFinancialReport, getTrendAnalysis, getAnnualReport, getPerformanceColor, getStatusColor, formatDate, formatCurrency, reportsAPI } from './reportsData'
export type { ProfitLossStatement, MemberPerformanceReport, LoanPerformanceReport, SocietyFinancialReport, TrendAnalysis } from './reportsData'

export { default as usersData, hasPermission, hasModuleAccess, canAccessResource, getUserById, getUserByEmail, getUserByUsername, getActiveUsers, getUsersByRole, getActiveSessions, getUserSessions, getAuditLogs, getRolePermissions, validateUserForm, generateUserId, generateSessionId, generateAuditLogId, getStatusColor, getRoleColor, formatDate, userManagementAPI } from './userManagementData'
export type { User, Permission, Role, Session, AuditLog } from './userManagementData'

// API Service
export { apiClient, saanifyAPI, apiMigrationHelper, developmentHelper, APIClient, SaanifyAPIService, useSaanifyAPI } from './apiService'
export type { APIConfig, APIResponse, PaginationParams, FilterParams } from './apiService'

// Re-export all data for direct access
export {
  membersData as members,
  loansData as loans,
  passbookData as passbook,
  expensesData as expenses,
  incomeData as income,
  adminFundData as adminFund,
  usersData as users
} from './membersData'

// Utility functions
export const utils = {
  // Date utilities
  formatDate: (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }),
  
  formatDateTime: (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }),
  
  // Currency utilities
  formatCurrency: (amount: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount),
  
  formatNumber: (number: number) => new Intl.NumberFormat('en-IN').format(number),
  
  // Validation utilities
  validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  validatePhone: (phone: string) => /^\+?[\d\s-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10,
  validateAadhar: (aadhar: string) => /^\d{4}-\d{4}-\d{4}$/.test(aadhar),
  
  // Generate utilities
  generateId: (prefix: string = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
  
  // Calculate utilities
  calculatePercentage: (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0,
  calculateGrowth: (current: number, previous: number) => previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0,
  
  // Date utilities
  addDays: (date: string, days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  },
  
  addMonths: (date: string, months: number) => {
    const d = new Date(date)
    d.setMonth(d.getMonth() + months)
    return d.toISOString().split('T')[0]
  },
  
  isDateInRange: (date: string, start: string, end: string) => {
    const d = new Date(date)
    const s = new Date(start)
    const e = new Date(end)
    return d >= s && d <= e
  },
  
  // Array utilities
  groupBy: <T>(array: T[], key: keyof T) => {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },
  
  sortBy: <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  },
  
  unique: <T>(array: T[]) => [...new Set(array)],
  
  // String utilities
  truncate: (text: string, length: number) => text.length > length ? text.substring(0, length) + '...' : text,
  capitalize: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
  slugify: (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Constants
export const constants = {
  // Status constants
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
    SUSPENDED: 'suspended'
  },
  
  // Role constants
  ROLES: {
    SUPERADMIN: 'superAdmin',
    ADMIN: 'admin',
    TREASURER: 'treasurer',
    CLIENT: 'client'
  },
  
  // Transaction types
  TRANSACTIONTYPES: {
    CREDIT: 'credit',
    DEBIT: 'debit'
  },
  
  // Payment modes
  PAYMENTMODES: {
    CASH: 'cash',
    ONLINE: 'online',
    CHEQUE: 'cheque',
    BANKTRANSFER: 'bankTransfer'
  },
  
  // Categories
  EXPENSECATEGORIES: {
    MAINTENANCE: 'maintenance',
    REPAIR: 'repair',
    EVENT: 'event',
    SALARY: 'salary',
    UTILITIES: 'utilities',
    TAX: 'tax',
    INSURANCE: 'insurance',
    OTHER: 'other'
  },
  
  INCOMECATEGORIES: {
    INTEREST: 'interest',
    FINE: 'fine',
    DONATION: 'donation',
    OTHERINCOME: 'otherIncome'
  },
  
  // Pagination defaults
  PAGINATION: {
    DEFAULTPAGE: 1,
    DEFAULTLIMIT: 20,
    MAXLIMIT: 100
  },
  
  // Validation rules
  VALIDATION: {
    MINPASSWORD_LENGTH: 8,
    MAXPHONE_LENGTH: 15,
    MINAGE: 18,
    MAXLOAN_AMOUNT: 1000000,
    MINLOAN_AMOUNT: 1000,
    MAXINTEREST_RATE: 50,
    MININTEREST_RATE: 0
  }
}

// Development helpers
export const devHelpers = {
  // Generate test data
  generateTestData: () => ({
    members: membersData.slice(0, 3),
    loans: loansData.slice(0, 3),
    passbook: passbookData.slice(0, 5),
    expenses: expensesData.slice(0, 3),
    users: usersData.slice(0, 3)
  }),
  
  // Validate data integrity
  validateDataIntegrity: () => {
    const issues = []
    
    // Check member references in loans
    loansData.forEach(loan => {
      if (!membersData.find(m => m.id === loan.memberId)) {
        issues.push(`Loan ${loan.id} references non-existent member ${loan.memberId}`)
      }
    })
    
    // Check member references in passbook
    passbookData.forEach(entry => {
      if (!membersData.find(m => m.id === entry.memberId)) {
        issues.push(`Passbook entry ${entry.id} references non-existent member ${entry.memberId}`)
      }
    })
    
    return {
      isValid: issues.length === 0,
      issues
    }
  },
  
  // Get data statistics
  getDataStats: () => ({
    members: membersData.length,
    loans: loansData.length,
    passbookEntries: passbookData.length,
    expenses: expensesData.length,
    income: incomeData.length,
    adminFundTransactions: adminFundData.length,
    users: usersData.length
  })
}

// Default export with all services
const dataServices = {
  // Data modules
  members: membersData,
  loans: loansData,
  passbook: passbookData,
  expenses: expensesData,
  income: incomeData,
  adminFund: adminFundData,
  users: usersData,
  
  // API services
  api: saanifyAPI,
  migration: apiMigrationHelper,
  dev: developmentHelper,
  
  // Utilities
  utils,
  constants,
  devHelpers
}

export default dataServices