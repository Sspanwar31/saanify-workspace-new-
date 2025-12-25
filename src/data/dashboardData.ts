// Dashboard Data Service - Dynamic Calculations from Dummy Data
// Future-ready for API integration

import { membersData, getMemberStats } from './membersData'
import { loansData, getLoanStats } from './loansData'
import { passbookData, getPassbookStats, getCurrentBalance } from './passbookData'
import { expensesData, getExpenseStats } from './expensesData'

export interface DashboardMetrics {
  // Member Metrics
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  newMembersThisMonth: number

  // Financial Metrics
  totalDeposits: number
  totalLoanAmount: number
  totalOutstandingLoans: number
  availableFunds: number
  totalExpenses: number

  // Loan Metrics
  activeLoans: number
  pendingLoans: number
  completedLoans: number
  rejectedLoans: number
  averageLoanAmount: number
  totalEMICollected: number

  // Passbook Metrics
  totalCredits: number
  totalDebits: number
  netBalance: number
  totalFines: number
  totalInterest: number

  // Expense Metrics
  thisMonthExpenses: number
  topExpenseCategory: string
  expenseBreakdown: {
    category: string
    amount: number
    percentage: number
  }[]

  // Performance Metrics
  profitThisMonth: number
  lossThisMonth: number
  netProfitLoss: number
  topPerformer: string

  // Collection Metrics
  collectionEfficiency: number
    overdueEMIs: number
  totalOverdueAmount: number

  // Fund Utilization
  fundUtilizationRate: number
  loanToDepositRatio: number
}

export interface RecentActivity {
  id: string
  type: 'member' | 'loan' | 'deposit' | 'expense' | 'emi'
  title: string
  description: string
  amount?: number
  date: string
  status: 'success' | 'pending' | 'warning' | 'error'
}

export interface MemberLoanSummary {
  memberId: string
  memberName: string
  totalDeposits: number
  totalLoans: number
  currentBalance: number
  activeLoanCount: number
  outstandingAmount: number
  nextEMIDate?: string
  nextEMIAmount?: number
}

// Calculate comprehensive dashboard metrics
export const getDashboardMetrics = (): DashboardMetrics => {
  // Get stats from all modules
  const memberStats = getMemberStats(membersData)
  const loanStats = getLoanStats(loansData)
  const passbookStats = getPassbookStats(passbookData)
  const expenseStats = getExpenseStats(expensesData)

  // Calculate total deposits from passbook
  const totalDeposits = passbookStats.totalDeposits

  // Calculate total outstanding loans
  const totalOutstandingLoans = loansData
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.remainingBalance, 0)

  // Calculate available funds
  const availableFunds = totalDeposits - totalOutstandingLoans - expenseStats.totalExpenses

  // Calculate total EMI collected (from passbook debits with EMI reference)
  const totalEMICollected = passbookData
    .filter(entry => entry.reference === 'emiPayment')
    .reduce((sum, entry) => sum + entry.amount, 0)

  // Calculate expense breakdown with percentages
  const totalExpenseAmount = expenseStats.totalExpenses
  const expenseBreakdown = expenseStats.categoryBreakdown.map(category => ({
    category: category.category,
    amount: category.amount,
    percentage: totalExpenseAmount > 0 ? Math.round((category.amount / totalExpenseAmount) * 100) : 0
  }))

  // Calculate profit/loss
  const loanInterestIncome = loansData
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => {
      const totalInterest = calculateTotalInterest(loan.amount, loan.emi, loan.duration)
      const monthlyInterest = totalInterest / loan.duration
      return sum + monthlyInterest
    }, 0)

  const fineIncome = passbookStats.totalFines
  const depositInterestExpense = passbookStats.totalInterest

  const profitThisMonth = loanInterestIncome + fineIncome - expenseStats.thisMonthExpenses
  const lossThisMonth = depositInterestExpense
  const netProfitLoss = profitThisMonth - lossThisMonth

  // Calculate collection efficiency
  const expectedEMI = loansData
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.emi, 0)

  const collectionEfficiency = expectedEMI > 0 ? Math.round((totalEMICollected / expectedEMI) * 100) : 0

  // Calculate overdue EMIs
  const overdueEMIs = loansData.filter(loan => {
    if (loan.status !== 'active') return false
    const nextEMIDate = new Date(loan.nextEmiDate)
    const today = new Date()
    return nextEMIDate < today
  }).length

  const totalOverdueAmount = loansData
    .filter(loan => loan.status === 'active' && new Date(loan.nextEmiDate) < new Date())
    .reduce((sum, loan) => sum + loan.emi, 0)

  // Calculate fund utilization
  const fundUtilizationRate = totalDeposits > 0 ? Math.round((totalOutstandingLoans / totalDeposits) * 100) : 0
  const loanToDepositRatio = totalDeposits > 0 ? Math.round((loanStats.totalLoanAmount / totalDeposits) * 100) : 0

  return {
    // Member Metrics
    totalMembers: memberStats.totalMembers,
    activeMembers: memberStats.activeMembers,
    inactiveMembers: memberStats.inactiveMembers,
    newMembersThisMonth: memberStats.newMembersThisMonth,

    // Financial Metrics
    totalDeposits,
    totalLoanAmount: loanStats.totalLoanAmount,
    totalOutstandingLoans,
    availableFunds,
    totalExpenses: expenseStats.totalExpenses,

    // Loan Metrics
    activeLoans: loanStats.activeLoans,
    pendingLoans: loanStats.pendingLoans,
    completedLoans: loanStats.completedLoans,
    rejectedLoans: loanStats.rejectedLoans,
    averageLoanAmount: loanStats.averageLoanAmount,
    totalEMICollected,

    // Passbook Metrics
    totalCredits: passbookStats.totalCredits,
    totalDebits: passbookStats.totalDebits,
    netBalance: passbookStats.netBalance,
    totalFines: passbookStats.totalFines,
    totalInterest: passbookStats.totalInterest,

    // Expense Metrics
    thisMonthExpenses: expenseStats.thisMonthExpenses,
    topExpenseCategory: expenseStats.topCategory,
    expenseBreakdown,

    // Performance Metrics
    profitThisMonth,
    lossThisMonth,
    netProfitLoss,
    topPerformer: passbookStats.topDepositor,

    // Collection Metrics
    collectionEfficiency,
    overdueEMIs,
    totalOverdueAmount,

    // Fund Utilization
    fundUtilizationRate,
    loanToDepositRatio
  }
}

// Get recent activities across all modules
export const getRecentActivities = (limit: number = 10): RecentActivity[] => {
  const activities: RecentActivity[] = []

  // Add recent member activities
  membersData
    .filter(member => new Date(member.createdAt || member.joinDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .forEach(member => {
      activities.push({
        id: member.id,
        type: 'member',
        title: 'New Member Joined',
        description: `${member.name} joined the society`,
        date: member.createdAt || member.joinDate,
        status: 'success'
      })
    })

  // Add recent loan activities
  loansData
    .filter(loan => new Date(loan.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .forEach(loan => {
      const member = membersData.find(m => m.id === loan.memberId)
      activities.push({
        id: loan.id,
        type: 'loan',
        title: `Loan ${loan.status === 'pending' ? 'Applied' : loan.status === 'approved' ? 'Approved' : 'Updated'}`,
        description: `${member?.name || 'Unknown'} - ₹${loan.amount.toLocaleString('en-IN')}`,
        amount: loan.amount,
        date: loan.createdAt,
        status: loan.status === 'pending' ? 'pending' : loan.status === 'rejected' ? 'error' : 'success'
      })
    })

  // Add recent deposit activities
  passbookData
    .filter(entry => entry.reference === 'deposit' && new Date(entry.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .forEach(entry => {
      const member = membersData.find(m => m.id === entry.memberId)
      activities.push({
        id: entry.id,
        type: 'deposit',
        title: 'Deposit Received',
        description: `${member?.name || 'Unknown'} deposited ₹${entry.amount.toLocaleString('en-IN')}`,
        amount: entry.amount,
        date: entry.createdAt,
        status: 'success'
      })
    })

  // Add recent expense activities
  expensesData
    .filter(expense => new Date(expense.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .forEach(expense => {
      activities.push({
        id: expense.id,
        type: 'expense',
        title: 'Expense Recorded',
        description: `${expense.category} - ₹${expense.amount.toLocaleString('en-IN')}`,
        amount: expense.amount,
        date: expense.createdAt,
        status: 'warning'
      })
    })

  // Add recent EMI activities
  passbookData
    .filter(entry => entry.reference === 'emiPayment' && new Date(entry.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .forEach(entry => {
      const member = membersData.find(m => m.id === entry.memberId)
      activities.push({
        id: entry.id,
        type: 'emi',
        title: 'EMI Payment Received',
        description: `${member?.name || 'Unknown'} paid EMI #${entry.emiNumber}`,
        amount: entry.amount,
        date: entry.createdAt,
        status: 'success'
      })
    })

  // Sort by date (most recent first) and limit
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

// Get member loan summaries
export const getMemberLoanSummaries = (): MemberLoanSummary[] => {
  return membersData.map(member => {
    const memberLoans = loansData.filter(loan => loan.memberId === member.id)
    const activeLoans = memberLoans.filter(loan => loan.status === 'active')
    const currentBalance = getCurrentBalance(passbookData, member.id)
    
    const totalDeposits = passbookData
      .filter(entry => entry.memberId === member.id && entry.reference === 'deposit')
      .reduce((sum, entry) => sum + entry.amount, 0)

    const totalLoans = memberLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const outstandingAmount = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0)

    const nextLoan = activeLoans
      .filter(loan => loan.nextEmiDate)
      .sort((a, b) => new Date(a.nextEmiDate).getTime() - new Date(b.nextEmiDate).getTime())[0]

    return {
      memberId: member.id,
      memberName: member.name,
      totalDeposits,
      totalLoans,
      currentBalance,
      activeLoanCount: activeLoans.length,
      outstandingAmount,
      nextEMIDate: nextLoan?.nextEmiDate,
      nextEMIAmount: nextLoan?.emi
    }
  })
}

// Helper function to calculate total interest
const calculateTotalInterest = (principal: number, emi: number, months: number): number => {
  return Math.round((emi * months - principal) * 100) / 100
}

// Get monthly trend data
export const getMonthlyTrend = (months: number = 6) => {
  const trend = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    const monthDeposits = passbookData
      .filter(entry => {
        const entryDate = new Date(entry.date)
        return entry.reference === 'deposit' && 
               entryDate.getMonth() === monthDate.getMonth() && 
               entryDate.getFullYear() === monthDate.getFullYear()
      })
      .reduce((sum, entry) => sum + entry.amount, 0)
    
    const monthExpenses = expensesData
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === monthDate.getMonth() && 
               expenseDate.getFullYear() === monthDate.getFullYear()
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const monthLoans = loansData
      .filter(loan => {
        const loanDate = new Date(loan.createdAt)
        return loanDate.getMonth() === monthDate.getMonth() && 
               loanDate.getFullYear() === monthDate.getFullYear()
      })
      .reduce((sum, loan) => sum + loan.amount, 0)

    trend.push({
      month: monthName,
      deposits: monthDeposits,
      expenses: monthExpenses,
      loans: monthLoans,
      net: monthDeposits - monthExpenses
    })
  }
  
  return trend
}

// Get top performers
export const getTopPerformers = () => {
  const memberPerformance = membersData.map(member => {
    const totalDeposits = passbookData
      .filter(entry => entry.memberId === member.id && entry.reference === 'deposit')
      .reduce((sum, entry) => sum + entry.amount, 0)
    
    const timelyEMIs = passbookData
      .filter(entry => entry.memberId === member.id && entry.reference === 'emiPayment')
      .length

    return {
      memberId: member.id,
      memberName: member.name,
      totalDeposits,
      timelyEMIs,
      currentBalance: getCurrentBalance(passbookData, member.id)
    }
  })

  return memberPerformance
    .sort((a, b) => b.totalDeposits - a.totalDeposits)
    .slice(0, 5)
}

// API-ready service for future integration
export const dashboardAPI = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    return Promise.resolve(getDashboardMetrics())
  },
  
  getRecentActivities: async (limit?: number): Promise<RecentActivity[]> => {
    return Promise.resolve(getRecentActivities(limit))
  },
  
  getMemberLoanSummaries: async (): Promise<MemberLoanSummary[]> => {
    return Promise.resolve(getMemberLoanSummaries())
  },
  
  getMonthlyTrend: async (months?: number) => {
    return Promise.resolve(getMonthlyTrend(months))
  },
  
  getTopPerformers: async () => {
    return Promise.resolve(getTopPerformers())
  }
}

export {
  membersData,
  loansData,
  passbookData,
  expensesData
}