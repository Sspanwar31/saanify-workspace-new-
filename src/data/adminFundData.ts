// Admin Fund Module for Personal Fund Tracking
// Future-ready for API integration

export interface AdminFundTransaction {
  id: string // UUID for future DB integration
  type: 'personalIn' | 'personalOut' | 'societyLoan_in' | 'societyLoan_out' | 'societyFund_in' | 'societyFund_out'
  amount: number
  date: string // yyyy-mm-dd format
  description: string
  reference?: string // Reference to member, loan, etc.
  mode: 'cash' | 'online' | 'cheque' | 'bankTransfer'
  category: string // For better categorization
  tags: string[]
  receiptUrl?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  addedBy: string // User ID who added this transaction
  createdAt: string
  updatedAt: string
}

export interface AdminFundSummary {
  personalFunds: {
    totalIn: number
    totalOut: number
    balance: number
  }
  societyLoans: {
    totalGiven: number
    totalReceived: number
    balance: number
  }
  societyFunds: {
    totalIn: number
    totalOut: number
    balance: number
  }
  overall: {
    totalTransactions: number
    totalVolume: number
    netBalance: number
  }
  thisMonth: {
    personalIn: number
    personalOut: number
    societyLoanIn: number
    societyLoanOut: number
    societyFundIn: number
    societyFundOut: number
  }
}

export interface FundFlowReport {
  period: string
  personalFlow: {
    in: number
    out: number
    net: number
  }
  societyLoanFlow: {
    in: number
    out: number
    net: number
  }
  societyFundFlow: {
    in: number
    out: number
    net: number
  }
  totalFlow: {
    in: number
    out: number
    net: number
  }
}

// Dummy admin fund transactions
export const adminFundData: AdminFundTransaction[] = [
  // Personal fund transactions
  {
    id: 'af-uuid-001',
    type: 'personalIn',
    amount: 50000,
    date: '2024-01-01',
    description: 'Initial personal fund contribution',
    mode: 'bankTransfer',
    category: 'initialContribution',
    tags: ['personal', 'initial'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:30:00Z'
  },
  {
    id: 'af-uuid-002',
    type: 'personalOut',
    amount: 15000,
    date: '2024-02-15',
    description: 'Personal expense - office equipment',
    mode: 'online',
    category: 'officeExpense',
    tags: ['personal', 'equipment'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-02-15T14:20:00Z',
    updatedAt: '2024-02-15T14:45:00Z'
  },
  {
    id: 'af-uuid-003',
    type: 'personalIn',
    amount: 25000,
    date: '2024-03-10',
    description: 'Additional personal fund contribution',
    mode: 'cash',
    category: 'additionalContribution',
    tags: ['personal', 'additional'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-03-10T11:30:00Z',
    updatedAt: '2024-03-10T12:00:00Z'
  },
  
  // Society loan transactions
  {
    id: 'af-uuid-004',
    type: 'societyLoan_in',
    amount: 100000,
    date: '2024-01-15',
    description: 'Loan given to society for emergency fund',
    reference: 'society-emergency-001',
    mode: 'bankTransfer',
    category: 'emergencyLoan',
    tags: ['society', 'loan', 'emergency'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:30:00Z'
  },
  {
    id: 'af-uuid-005',
    type: 'societyLoan_out',
    amount: 25000,
    date: '2024-04-01',
    description: 'Partial repayment of society loan',
    reference: 'society-emergency-001',
    mode: 'online',
    category: 'loanRepayment',
    tags: ['society', 'repayment'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-04-01T16:45:00Z',
    updatedAt: '2024-04-01T17:15:00Z'
  },
  {
    id: 'af-uuid-006',
    type: 'societyLoan_out',
    amount: 25000,
    date: '2024-05-01',
    description: 'Second installment of society loan repayment',
    reference: 'society-emergency-001',
    mode: 'bankTransfer',
    category: 'loanRepayment',
    tags: ['society', 'repayment'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-05-01T10:15:00Z',
    updatedAt: '2024-05-01T10:45:00Z'
  },
  
  // Society fund transactions
  {
    id: 'af-uuid-007',
    type: 'societyFund_in',
    amount: 75000,
    date: '2024-02-01',
    description: 'Contribution to society development fund',
    mode: 'online',
    category: 'developmentFund',
    tags: ['society', 'development'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-02-01T13:20:00Z',
    updatedAt: '2024-02-01T13:50:00Z'
  },
  {
    id: 'af-uuid-008',
    type: 'societyFund_out',
    amount: 20000,
    date: '2024-03-15',
    description: 'Society fund used for community event',
    mode: 'cash',
    category: 'communityEvent',
    tags: ['society', 'event'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-03-15T15:30:00Z',
    updatedAt: '2024-03-15T16:00:00Z'
  },
  {
    id: 'af-uuid-009',
    type: 'societyFund_in',
    amount: 30000,
    date: '2024-06-01',
    description: 'Additional contribution to society welfare fund',
    mode: 'bankTransfer',
    category: 'welfareFund',
    tags: ['society', 'welfare'],
    status: 'approved',
    approvedBy: 'admin-001',
    addedBy: 'admin-001',
    createdAt: '2024-06-01T11:45:00Z',
    updatedAt: '2024-06-01T12:15:00Z'
  },
  {
    id: 'af-uuid-010',
    type: 'personalOut',
    amount: 8000,
    date: '2024-07-10',
    description: 'Personal travel expense for society work',
    mode: 'online',
    category: 'travelExpense',
    tags: ['personal', 'travel', 'societyWork'],
    status: 'pending',
    addedBy: 'admin-001',
    createdAt: '2024-07-10T14:20:00Z',
    updatedAt: '2024-07-10T14:20:00Z'
  }
]

// Calculate admin fund summary
export const getAdminFundSummary = (transactions: AdminFundTransaction[]): AdminFundSummary => {
  // Personal funds calculations
  const personalIn = transactions
    .filter(t => t.type === 'personalIn' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const personalOut = transactions
    .filter(t => t.type === 'personalOut' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const personalBalance = personalIn - personalOut

  // Society loans calculations
  const societyLoanIn = transactions
    .filter(t => t.type === 'societyLoan_in' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const societyLoanOut = transactions
    .filter(t => t.type === 'societyLoan_out' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const societyLoanBalance = societyLoanIn - societyLoanOut

  // Society funds calculations
  const societyFundIn = transactions
    .filter(t => t.type === 'societyFund_in' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const societyFundOut = transactions
    .filter(t => t.type === 'societyFund_out' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const societyFundBalance = societyFundIn - societyFundOut

  // Overall calculations
  const totalTransactions = transactions.length
  const totalVolume = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netBalance = personalBalance + societyLoanBalance + societyFundBalance

  // This month calculations
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear && 
           t.status === 'approved'
  })

  const thisMonthPersonalIn = thisMonthTransactions
    .filter(t => t.type === 'personalIn')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const thisMonthPersonalOut = thisMonthTransactions
    .filter(t => t.type === 'personalOut')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const thisMonthSocietyLoanIn = thisMonthTransactions
    .filter(t => t.type === 'societyLoan_in')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const thisMonthSocietyLoanOut = thisMonthTransactions
    .filter(t => t.type === 'societyLoan_out')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const thisMonthSocietyFundIn = thisMonthTransactions
    .filter(t => t.type === 'societyFund_in')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const thisMonthSocietyFundOut = thisMonthTransactions
    .filter(t => t.type === 'societyFund_out')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    personalFunds: {
      totalIn: personalIn,
      totalOut: personalOut,
      balance: personalBalance
    },
    societyLoans: {
      totalGiven: societyLoanIn,
      totalReceived: societyLoanOut,
      balance: societyLoanBalance
    },
    societyFunds: {
      totalIn: societyFundIn,
      totalOut: societyFundOut,
      balance: societyFundBalance
    },
    overall: {
      totalTransactions,
      totalVolume,
      netBalance
    },
    thisMonth: {
      personalIn: thisMonthPersonalIn,
      personalOut: thisMonthPersonalOut,
      societyLoanIn: thisMonthSocietyLoanIn,
      societyLoanOut: thisMonthSocietyLoanOut,
      societyFundIn: thisMonthSocietyFundIn,
      societyFundOut: thisMonthSocietyFundOut
    }
  }
}

// Get fund flow report for a specific period
export const getFundFlowReport = (
  transactions: AdminFundTransaction[], 
  startDate: string, 
  endDate: string
): FundFlowReport => {
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= new Date(startDate) && 
           transactionDate <= new Date(endDate) && 
           t.status === 'approved'
  })

  const personalIn = periodTransactions
    .filter(t => t.type === 'personalIn')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const personalOut = periodTransactions
    .filter(t => t.type === 'personalOut')
    .reduce((sum, t) => sum + t.amount, 0)

  const societyLoanIn = periodTransactions
    .filter(t => t.type === 'societyLoan_in')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const societyLoanOut = periodTransactions
    .filter(t => t.type === 'societyLoan_out')
    .reduce((sum, t) => sum + t.amount, 0)

  const societyFundIn = periodTransactions
    .filter(t => t.type === 'societyFund_in')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const societyFundOut = periodTransactions
    .filter(t => t.type === 'societyFund_out')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIn = personalIn + societyLoanIn + societyFundIn
  const totalOut = personalOut + societyLoanOut + societyFundOut

  return {
    period: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    personalFlow: {
      in: personalIn,
      out: personalOut,
      net: personalIn - personalOut
    },
    societyLoanFlow: {
      in: societyLoanIn,
      out: societyLoanOut,
      net: societyLoanIn - societyLoanOut
    },
    societyFundFlow: {
      in: societyFundIn,
      out: societyFundOut,
      net: societyFundIn - societyFundOut
    },
    totalFlow: {
      in: totalIn,
      out: totalOut,
      net: totalIn - totalOut
    }
  }
}

// Get monthly fund flow trend
export const getMonthlyFundFlow = (transactions: AdminFundTransaction[], months: number = 6) => {
  const trend = []
  const now = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString().split('T')[0]
    const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString().split('T')[0]
    
    const report = getFundFlowReport(transactions, startDate, endDate)
    
    trend.push({
      month: monthName,
      ...report
    })
  }
  
  return trend
}

// Get pending transactions
export const getPendingTransactions = (transactions: AdminFundTransaction[]) => {
  return transactions.filter(t => t.status === 'pending')
}

// Get transactions by type
export const getTransactionsByType = (transactions: AdminFundTransaction[], type: string) => {
  return transactions.filter(t => t.type === type)
}

// Get transactions by date range
export const getTransactionsByDateRange = (
  transactions: AdminFundTransaction[], 
  startDate: string, 
  endDate: string
) => {
  return transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate)
  })
}

// Generate unique transaction ID
export const generateAdminFundId = () => {
  return 'af-uuid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

// Validate admin fund form
export const validateAdminFundForm = (transaction: Partial<AdminFundTransaction>) => {
  const errors: string[] = []

  if (!transaction.type) {
    errors.push('Transaction type is required')
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }

  if (!transaction.date) {
    errors.push('Date is required')
  }

  if (!transaction.description || transaction.description.trim().length < 3) {
    errors.push('Description must be at least 3 characters long')
  }

  if (!transaction.mode) {
    errors.push('Payment mode is required')
  }

  if (!transaction.category) {
    errors.push('Category is required')
  }

  return errors
}

// Transaction type color mapping
export const getTransactionTypeColor = (type: string) => {
  switch (type) {
    case 'personalIn':
    case 'societyLoan_in':
    case 'societyFund_in':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'personalOut':
    case 'societyLoan_out':
    case 'societyFund_out':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Payment mode color mapping
export const getPaymentModeColor = (mode: string) => {
  switch (mode) {
    case 'cash':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'online':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'cheque':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'bankTransfer':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
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

// API-ready functions for future integration
export const adminFundAPI = {
  // Future API calls - currently returns mock data
  getAll: async (): Promise<AdminFundTransaction[]> => {
    return Promise.resolve(adminFundData)
  },
  
  getSummary: async (): Promise<AdminFundSummary> => {
    return Promise.resolve(getAdminFundSummary(adminFundData))
  },
  
  getFundFlow: async (startDate: string, endDate: string): Promise<FundFlowReport> => {
    return Promise.resolve(getFundFlowReport(adminFundData, startDate, endDate))
  },
  
  create: async (transaction: Omit<AdminFundTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminFundTransaction> => {
    const newTransaction: AdminFundTransaction = {
      ...transaction,
      id: generateAdminFundId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return Promise.resolve(newTransaction)
  }
}

export default adminFundData