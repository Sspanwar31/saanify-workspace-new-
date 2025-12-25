// Enhanced Reports Module with Comprehensive Profit/Loss Calculations
// Future-ready for API integration

import { membersData } from './membersData'
import { loansData } from './loansData'
import { passbookData } from './passbookData'
import { expensesData, incomeData } from './expensesData'
import { adminFundData } from './adminFundData'

export interface ProfitLossStatement {
  period: string
  income: {
    loanInterest: number
    lateFines: number
    depositInterest: number
    otherIncome: number
    totalIncome: number
  }
  expenses: {
    operatingExpenses: number
    administrativeExpenses: number
    maintenanceExpenses: number
    loanLossProvision: number
    totalExpenses: number
  }
  profit: {
    grossProfit: number
    netProfit: number
    profitMargin: number
  }
  metrics: {
    returnOnAssets: number
    returnOnEquity: number
    operatingRatio: number
  }
}

export interface MemberPerformanceReport {
  memberId: string
  memberName: string
  joinDate: string
  totalDeposits: number
  totalLoans: number
    currentBalance: number
    timelyEMIPayments: number
    delayedEMIPayments: number
    finesPaid: number
    creditScore: number
  status: 'excellent' | 'good' | 'average' | 'poor'
}

export interface LoanPerformanceReport {
  loanId: string
  memberId: string
  memberName: string
  amount: number
    interestRate: number
    duration: number
    emi: number
    totalInterest: number
    paidEMIs: number
    pendingEMIs: number
    paidAmount: number
    pendingAmount: number
    overdueDays: number
    status: 'performing' | 'delayed' | 'npl' | 'closed'
    performance: 'excellent' | 'good' | 'average' | 'poor'
}

export interface SocietyFinancialReport {
  period: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  liquidity: {
    currentAssets: number
    currentLiabilities: number
    currentRatio: number
    quickRatio: number
  }
  efficiency: {
    assetTurnover: number
    loanToDepositRatio: number
    operatingEfficiency: number
  }
  profitability: {
    returnOnAssets: number
    returnOnEquity: number
    netInterestMargin: number
  }
}

export interface TrendAnalysis {
  period: string
  deposits: number
  loans: number
  expenses: number
  income: number
  profit: number
  members: number
  growthRates: {
    depositGrowth: number
    loanGrowth: number
    expenseGrowth: number
    incomeGrowth: number
    profitGrowth: number
    memberGrowth: number
  }
}

// Calculate comprehensive profit/loss statement
export const getProfitLossStatement = (
  startDate: string, 
  endDate: string,
  maturityData?: any[] // Pass maturity data if available
): ProfitLossStatement => {
  // Filter data by date range
  const periodPassbook = passbookData.filter(entry => 
    entry.date >= startDate && entry.date <= endDate
  )
  const periodExpenses = expensesData.filter(expense => 
    expense.date >= startDate && expense.date <= endDate && expense.status === 'approved'
  )
  const periodIncome = incomeData.filter(income => 
    income.date >= startDate && income.date <= endDate && income.status === 'approved'
  )
  const periodLoans = loansData.filter(loan => 
    loan.startDate >= startDate && loan.startDate <= endDate && loan.status === 'active'
  )

  // Calculate income components
  const loanInterest = periodLoans.reduce((sum, loan) => {
    const totalInterest = (loan.emi * loan.duration) - loan.amount
    const monthlyInterest = totalInterest / loan.duration
    return sum + monthlyInterest
  }, 0)

  const lateFines = periodPassbook
    .filter(entry => entry.reference === 'fine')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const depositInterest = periodIncome
    .filter(inc => inc.category === 'interest')
    .reduce((sum, inc) => sum + inc.amount, 0)

  // Add maturity interest as projected expense
  const maturityInterestExpense = maturityData ? 
    Math.round(maturityData.reduce((sum, data) => sum + data.finalInterest, 0) / 36) : 0

  const otherIncome = periodIncome
    .filter(inc => inc.category !== 'interest')
    .reduce((sum, inc) => sum + inc.amount, 0)

  const totalIncome = loanInterest + lateFines + depositInterest + otherIncome

  // Calculate expense components
  const operatingExpenses = periodExpenses
    .filter(expense => ['maintenance', 'repair', 'utilities'].includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0)

  const administrativeExpenses = periodExpenses
    .filter(expense => ['salary', 'tax', 'insurance'].includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0)

  const maintenanceExpenses = periodExpenses
    .filter(expense => expense.category === 'maintenance')
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate loan loss provision (1% of outstanding loans)
  const outstandingLoans = loansData
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.remainingBalance, 0)
  const loanLossProvision = Math.round(outstandingLoans * 0.01)

  const totalExpenses = operatingExpenses + administrativeExpenses + maintenanceExpenses + loanLossProvision + maturityInterestExpense

  // Calculate profit metrics
  const grossProfit = totalIncome - operatingExpenses
  const netProfit = grossProfit - administrativeExpenses - maintenanceExpenses - loanLossProvision - maturityInterestExpense
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0

  // Calculate financial metrics
  const totalAssets = periodPassbook
    .filter(entry => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const totalLiabilities = outstandingLoans
  const returnOnAssets = totalAssets > 0 ? Math.round((netProfit / totalAssets) * 100) : 0
  const returnOnEquity = totalAssets > totalLiabilities ? 
    Math.round((netProfit / (totalAssets - totalLiabilities)) * 100) : 0
  const operatingRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0

  return {
    period: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    income: {
      loanInterest,
      lateFines,
      depositInterest,
      otherIncome,
      totalIncome
    },
    expenses: {
      operatingExpenses,
      administrativeExpenses,
      maintenanceExpenses,
      loanLossProvision: loanLossProvision + maturityInterestExpense, // Include maturity interest
      totalExpenses
    },
    profit: {
      grossProfit,
      netProfit,
      profitMargin
    },
    metrics: {
      returnOnAssets,
      returnOnEquity,
      operatingRatio
    }
  }
}

// Generate member performance report
export const getMemberPerformanceReport = (): MemberPerformanceReport[] => {
  return membersData.map(member => {
    const memberPassbook = passbookData.filter(entry => entry.memberId === member.id)
    const memberLoans = loansData.filter(loan => loan.memberId === member.id)

    const totalDeposits = memberPassbook
      .filter(entry => entry.reference === 'deposit')
      .reduce((sum, entry) => sum + entry.amount, 0)

    const totalLoans = memberLoans
      .reduce((sum, loan) => sum + loan.amount, 0)

    const currentBalance = memberPassbook.length > 0 ? 
      Math.max(...memberPassbook.map(entry => entry.balance)) : 0

    const timelyEMIPayments = memberPassbook
      .filter(entry => entry.reference === 'emiPayment')
      .length

    const delayedEMIPayments = memberPassbook
      .filter(entry => entry.reference === 'fine')
      .length

    const finesPaid = memberPassbook
      .filter(entry => entry.reference === 'fine')
      .reduce((sum, entry) => sum + entry.amount, 0)

    // Calculate credit score (0-100)
    let creditScore = 750 // Base score
    if (member.status === 'active') creditScore += 50
    if (totalDeposits > 50000) creditScore += 25
    if (delayedEMIPayments === 0) creditScore += 50
    if (delayedEMIPayments > 0) creditScore -= delayedEMIPayments * 10
    if (finesPaid > 0) creditScore -= Math.min(finesPaid / 100, 25)
    creditScore = Math.max(300, Math.min(900, creditScore))

    // Determine status
    let status: 'excellent' | 'good' | 'average' | 'poor'
    if (creditScore >= 800) status = 'excellent'
    else if (creditScore >= 700) status = 'good'
    else if (creditScore >= 600) status = 'average'
    else status = 'poor'

    return {
      memberId: member.id,
      memberName: member.name,
      joinDate: member.joinDate,
      totalDeposits,
      totalLoans,
      currentBalance,
      timelyEMIPayments,
      delayedEMIPayments,
      finesPaid,
      creditScore,
      status
    }
  })
}

// Generate loan performance report
export const getLoanPerformanceReport = (): LoanPerformanceReport[] => {
  return loansData.map(loan => {
    const member = membersData.find(m => m.id === loan.memberId)
    const totalInterest = (loan.emi * loan.duration) - loan.amount
    const paidAmount = loan.emi * (loan.duration - Math.ceil(loan.remainingBalance / loan.emi))
    const pendingAmount = loan.remainingBalance

    // Calculate overdue days
    const today = new Date()
    const nextEMIDate = new Date(loan.nextEmiDate)
    const overdueDays = nextEMIDate < today ? 
      Math.ceil((today.getTime() - nextEMIDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

    // Determine loan status
    let status: 'performing' | 'delayed' | 'npl' | 'closed'
    if (loan.status === 'completed') status = 'closed'
    else if (overdueDays > 90) status = 'npl'
    else if (overdueDays > 30) status = 'delayed'
    else status = 'performing'

    // Determine performance rating
    let performance: 'excellent' | 'good' | 'average' | 'poor'
    if (status === 'closed' && overdueDays === 0) performance = 'excellent'
    else if (status === 'performing') performance = 'good'
    else if (status === 'delayed') performance = 'average'
    else performance = 'poor'

    return {
      loanId: loan.id,
      memberId: loan.memberId,
      memberName: member?.name || 'Unknown',
      amount: loan.amount,
      interestRate: loan.interest,
      duration: loan.duration,
      emi: loan.emi,
      totalInterest,
      paidEMIs: loan.duration - Math.ceil(loan.remainingBalance / loan.emi),
      pendingEMIs: Math.ceil(loan.remainingBalance / loan.emi),
      paidAmount,
      pendingAmount,
      overdueDays,
      status,
      performance
    }
  })
}

// Generate society financial report
export const getSocietyFinancialReport = (): SocietyFinancialReport => {
  const totalDeposits = passbookData
    .filter(entry => entry.reference === 'deposit')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const totalLoanAmount = loansData
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.amount, 0)

  const totalOutstandingLoans = loansData
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.remainingBalance, 0)

  const totalExpenses = expensesData
    .filter(expense => expense.status === 'approved')
    .reduce((sum, expense) => sum + expense.amount, 0)

  const totalAssets = totalDeposits
  const totalLiabilities = totalOutstandingLoans
  const netWorth = totalAssets - totalLiabilities

  // Liquidity ratios
  const currentAssets = totalDeposits - totalOutstandingLoans
  const currentLiabilities = totalOutstandingLoans
  const currentRatio = currentLiabilities > 0 ? Math.round((currentAssets / currentLiabilities) * 100) / 100 : 0
  const quickRatio = currentLiabilities > 0 ? Math.round(((currentAssets - 0) / currentLiabilities) * 100) / 100 : 0

  // Efficiency ratios
  const assetTurnover = totalAssets > 0 ? Math.round((totalLoanAmount / totalAssets) * 100) / 100 : 0
  const loanToDepositRatio = totalDeposits > 0 ? Math.round((totalOutstandingLoans / totalDeposits) * 100) / 100 : 0
  const operatingEfficiency = totalLoanAmount > 0 ? 
    Math.round(((totalLoanAmount - totalExpenses) / totalLoanAmount) * 100) : 0

  // Profitability ratios
  const netIncome = totalLoanAmount - totalExpenses
  const returnOnAssets = totalAssets > 0 ? Math.round((netIncome / totalAssets) * 100) : 0
  const returnOnEquity = netWorth > 0 ? Math.round((netIncome / netWorth) * 100) : 0
  const netInterestMargin = totalLoanAmount > 0 ? 
    Math.round(((totalLoanAmount * 0.12 - totalExpenses) / totalLoanAmount) * 100) : 0

  return {
    period: `As of ${formatDate(new Date().toISOString().split('T')[0])}`,
    totalAssets,
    totalLiabilities,
    netWorth,
    liquidity: {
      currentAssets,
      currentLiabilities,
      currentRatio,
      quickRatio
    },
    efficiency: {
      assetTurnover,
      loanToDepositRatio,
      operatingEfficiency
    },
    profitability: {
      returnOnAssets,
      returnOnEquity,
      netInterestMargin
    }
  }
}

// Generate trend analysis
export const getTrendAnalysis = (months: number = 12): TrendAnalysis[] => {
  const trend = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0]
    const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0]
    
    // Calculate month-specific metrics
    const monthDeposits = passbookData
      .filter(entry => entry.reference === 'deposit' && entry.date >= startDate && entry.date <= endDate)
      .reduce((sum, entry) => sum + entry.amount, 0)
    
    const monthLoans = loansData
      .filter(loan => loan.startDate >= startDate && loan.startDate <= endDate)
      .reduce((sum, loan) => sum + loan.amount, 0)
    
    const monthExpenses = expensesData
      .filter(expense => expense.date >= startDate && expense.date <= endDate && expense.status === 'approved')
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const monthIncome = incomeData
      .filter(inc => inc.date >= startDate && inc.date <= endDate && inc.status === 'approved')
      .reduce((sum, inc) => sum + inc.amount, 0)
    
    const monthProfit = monthIncome - monthExpenses
    
    const monthMembers = membersData
      .filter(member => member.joinDate >= startDate && member.joinDate <= endDate)
      .length

    // Calculate growth rates (compared to previous month)
    let growthRates = {
      depositGrowth: 0,
      loanGrowth: 0,
      expenseGrowth: 0,
      incomeGrowth: 0,
      profitGrowth: 0,
      memberGrowth: 0
    }

    if (i < months - 1) { // Not the first month, so we can calculate growth
      const prevMonthData = trend[trend.length - 1]
      if (prevMonthData) {
        growthRates = {
          depositGrowth: prevMonthData.deposits > 0 ? 
            Math.round(((monthDeposits - prevMonthData.deposits) / prevMonthData.deposits) * 100) : 0,
          loanGrowth: prevMonthData.loans > 0 ? 
            Math.round(((monthLoans - prevMonthData.loans) / prevMonthData.loans) * 100) : 0,
          expenseGrowth: prevMonthData.expenses > 0 ? 
            Math.round(((monthExpenses - prevMonthData.expenses) / prevMonthData.expenses) * 100) : 0,
          incomeGrowth: prevMonthData.income > 0 ? 
            Math.round(((monthIncome - prevMonthData.income) / prevMonthData.income) * 100) : 0,
          profitGrowth: prevMonthData.profit !== 0 ? 
            Math.round(((monthProfit - prevMonthData.profit) / Math.abs(prevMonthData.profit)) * 100) : 0,
          memberGrowth: prevMonthData.members > 0 ? 
            Math.round(((monthMembers - prevMonthData.members) / prevMonthData.members) * 100) : 0
        }
      }
    }

    trend.push({
      period: monthName,
      deposits: monthDeposits,
      loans: monthLoans,
      expenses: monthExpenses,
      income: monthIncome,
      profit: monthProfit,
      members: monthMembers,
      growthRates
    })
  }
  
  return trend
}

// Generate comprehensive annual report
export const getAnnualReport = (year: number) => {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  
  return {
    profitLoss: getProfitLossStatement(startDate, endDate),
    memberPerformance: getMemberPerformanceReport(),
    loanPerformance: getLoanPerformanceReport(),
    societyFinancial: getSocietyFinancialReport(),
    trendAnalysis: getTrendAnalysis(12)
  }
}

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format currency for display
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Performance color mapping
export const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case 'excellent':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'good':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'average':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'poor':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'performing':
    case 'active':
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'delayed':
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'npl':
    case 'rejected':
    case 'closed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// API-ready functions for future integration
export const reportsAPI = {
  getProfitLoss: async (startDate: string, endDate: string) => {
    return Promise.resolve(getProfitLossStatement(startDate, endDate))
  },
  
  getMemberPerformance: async () => {
    return Promise.resolve(getMemberPerformanceReport())
  },
  
  getLoanPerformance: async () => {
    return Promise.resolve(getLoanPerformanceReport())
  },
  
  getSocietyFinancial: async () => {
    return Promise.resolve(getSocietyFinancialReport())
  },
  
  getTrendAnalysis: async (months?: number) => {
    return Promise.resolve(getTrendAnalysis(months))
  },
  
  getAnnualReport: async (year: number) => {
    return Promise.resolve(getAnnualReport(year))
  }
}

// Sample reports data for demo purposes
export const reportsData = [
  {
    id: 'report-1',
    title: 'Monthly Financial Report',
    type: 'FINANCIAL',
    period: 'December 2024',
    status: 'completed',
    generatedAt: '2024-12-01T10:00:00Z',
    size: '2.4 MB',
    downloads: 12
  },
  {
    id: 'report-2',
    title: 'Member Performance Analysis',
    type: 'MEMBER',
    period: 'December 2024',
    status: 'completed',
    generatedAt: '2024-12-01T09:30:00Z',
    size: '1.8 MB',
    downloads: 8
  },
  {
    id: 'report-3',
    title: 'Loan Portfolio Summary',
    type: 'LOAN',
    period: 'December 2024',
    status: 'pending',
    generatedAt: '2024-12-01T08:45:00Z',
    size: '3.1 MB',
    downloads: 0
  },
  {
    id: 'report-4',
    title: 'Expense Breakdown Report',
    type: 'EXPENSE',
    period: 'November 2024',
    status: 'completed',
    generatedAt: '2024-11-30T16:20:00Z',
    size: '1.2 MB',
    downloads: 15
  },
  {
    id: 'report-5',
    title: 'Society Summary Report',
    type: 'SUMMARY',
    period: 'November 2024',
    status: 'completed',
    generatedAt: '2024-11-30T14:15:00Z',
    size: '4.7 MB',
    downloads: 23
  }
]

const reportsService = {
  getProfitLossStatement,
  getMemberPerformanceReport,
  getLoanPerformanceReport,
  getSocietyFinancialReport,
  getTrendAnalysis,
  getAnnualReport,
  reportsData
}

export default reportsService