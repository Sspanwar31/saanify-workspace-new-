// Enhanced Expenses Data for Saanify Society Management Platform
// Future-ready for API integration with comprehensive tracking

export interface Expense {
  id: string // UUID for future DB integration
  date: string // yyyy-mm-dd format
  category: 'maintenance' | 'repair' | 'event' | 'salary' | 'utilities' | 'tax' | 'insurance' | 'other'
  subcategory?: string
  amount: number
  mode: 'cash' | 'online' | 'cheque' | 'bankTransfer'
  description: string
  vendor?: string
  billNumber?: string
  receiptUrl?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  recurring: boolean
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  recurringEnd_date?: string
  tags: string[]
  addedBy: string // User ID who added this expense
  createdAt: string
  updatedAt: string
}

export interface Income {
  id: string // UUID for future DB integration
  date: string // yyyy-mm-dd format
  category: 'interest' | 'fine' | 'donation' | 'otherIncome'
  subcategory?: string
  amount: number
  mode: 'cash' | 'online' | 'cheque' | 'bankTransfer'
  description: string
  source?: string
  referenceId?: string // Reference to loan, member, etc.
  receiptUrl?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  recurring: boolean
  recurringFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  recurringEnd_date?: string
  tags: string[]
  addedBy: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseStats {
  totalExpenses: number
  totalIncome: number
  netBalance: number
  thisMonthExpenses: number
  thisMonthIncome: number
  pendingExpenses: number
  approvedExpenses: number
  rejectedExpenses: number
  topExpenseCategory: string
  topIncomeCategory: string
  categoryBreakdown: {
    category: string
    amount: number
    count: number
    percentage: number
  }[]
  incomeBreakdown: {
    category: string
    amount: number
    count: number
    percentage: number
  }[]
  monthlyTrend: {
    month: string
    expenses: number
    income: number
    net: number
  }[]
  paymentModeBreakdown: {
    mode: string
    expenses: number
    income: number
    total: number
  }[]
}

// Enhanced dummy expenses data
export const expensesData: Expense[] = [
  {
    id: 'exp-uuid-001',
    date: '2024-11-01',
    category: 'maintenance',
    subcategory: 'building',
    amount: 5000,
    mode: 'online',
    description: 'Monthly building maintenance and cleaning',
    vendor: 'ABC Maintenance Services',
    billNumber: 'BMS-2024-11-001',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: true,
    recurringFrequency: 'monthly',
    tags: ['maintenance', 'monthly', 'building'],
    addedBy: 'admin-001',
    createdAt: '2024-11-01T09:00:00Z',
    updatedAt: '2024-11-01T09:30:00Z'
  },
  {
    id: 'exp-uuid-002',
    date: '2024-11-05',
    category: 'utilities',
    subcategory: 'electricity',
    amount: 8500,
    mode: 'online',
    description: 'Monthly electricity bill for society',
    vendor: 'Electricity Board',
    billNumber: 'EB-2024-11-042',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: true,
    recurringFrequency: 'monthly',
    tags: ['utilities', 'electricity', 'monthly'],
    addedBy: 'admin-001',
    createdAt: '2024-11-05T14:20:00Z',
    updatedAt: '2024-11-05T14:45:00Z'
  },
  {
    id: 'exp-uuid-003',
    date: '2024-11-10',
    category: 'salary',
    subcategory: 'staff',
    amount: 25000,
    mode: 'bankTransfer',
    description: 'Monthly salary for society staff - security, cleaner, accountant',
    vendor: 'Staff Payments',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: true,
    recurringFrequency: 'monthly',
    tags: ['salary', 'staff', 'monthly'],
    addedBy: 'admin-001',
    createdAt: '2024-11-10T11:00:00Z',
    updatedAt: '2024-11-10T11:30:00Z'
  },
  {
    id: 'exp-uuid-004',
    date: '2024-11-12',
    category: 'repair',
    subcategory: 'plumbing',
    amount: 3500,
    mode: 'cash',
    description: 'Emergency plumbing repair in block B',
    vendor: 'Quick Fix Plumbing',
    billNumber: 'QFP-2024-11-023',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: false,
    tags: ['repair', 'plumbing', 'emergency'],
    addedBy: 'admin-001',
    createdAt: '2024-11-12T16:45:00Z',
    updatedAt: '2024-11-12T17:15:00Z'
  },
  {
    id: 'exp-uuid-005',
    date: '2024-11-15',
    category: 'event',
    subcategory: 'festival',
    amount: 12000,
    mode: 'cash',
    description: 'Diwali festival celebration - sweets, decorations, fireworks',
    vendor: 'Various Vendors',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: false,
    tags: ['event', 'festival', 'diwali'],
    addedBy: 'admin-001',
    createdAt: '2024-11-15T10:30:00Z',
    updatedAt: '2024-11-15T11:00:00Z'
  },
  {
    id: 'exp-uuid-006',
    date: '2024-11-18',
    category: 'insurance',
    subcategory: 'property',
    amount: 15000,
    mode: 'online',
    description: 'Annual property insurance premium',
    vendor: 'XYZ Insurance Company',
    billNumber: 'INS-2024-11-001',
    status: 'pending',
    recurring: true,
    recurringFrequency: 'yearly',
    tags: ['insurance', 'property', 'annual'],
    addedBy: 'admin-001',
    createdAt: '2024-11-18T13:20:00Z',
    updatedAt: '2024-11-18T13:20:00Z'
  },
  {
    id: 'exp-uuid-007',
    date: '2024-11-20',
    category: 'tax',
    subcategory: 'propertyTax',
    amount: 8000,
    mode: 'online',
    description: 'Quarterly property tax payment',
    vendor: 'Municipal Corporation',
    billNumber: 'MCT-2024-Q3-001',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: true,
    recurringFrequency: 'quarterly',
    tags: ['tax', 'property', 'quarterly'],
    addedBy: 'admin-001',
    createdAt: '2024-11-20T09:15:00Z',
    updatedAt: '2024-11-20T09:45:00Z'
  },
  {
    id: 'exp-uuid-008',
    date: '2024-11-22',
    category: 'other',
    subcategory: 'office',
    amount: 2500,
    mode: 'online',
    description: 'Office supplies - stationery, printer ink, files',
    vendor: 'Office Depot',
    billNumber: 'OD-2024-11-156',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: false,
    tags: ['office', 'supplies'],
    addedBy: 'admin-001',
    createdAt: '2024-11-22T15:30:00Z',
    updatedAt: '2024-11-22T16:00:00Z'
  }
]

// Income data (interest, fines, donations, etc.)
export const incomeData: Income[] = [
  {
    id: 'inc-uuid-001',
    date: '2024-11-01',
    category: 'interest',
    subcategory: 'depositInterest',
    amount: 4500,
    mode: 'bankTransfer',
    description: 'Monthly interest on member deposits',
    source: 'Member Deposits',
    status: 'approved',
    approvedBy: 'system-001',
    recurring: true,
    recurringFrequency: 'monthly',
    tags: ['interest', 'deposits', 'monthly'],
    addedBy: 'system-001',
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z'
  },
  {
    id: 'inc-uuid-002',
    date: '2024-11-05',
    category: 'fine',
    subcategory: 'latePayment',
    amount: 850,
    mode: 'cash',
    description: 'Late payment fines collected from members',
    source: 'Member Fines',
    referenceId: 'member-uuid-001',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: false,
    tags: ['fine', 'latePayment'],
    addedBy: 'admin-001',
    createdAt: '2024-11-05T14:20:00Z',
    updatedAt: '2024-11-05T14:20:00Z'
  },
  {
    id: 'inc-uuid-003',
    date: '2024-11-10',
    category: 'donation',
    subcategory: 'charity',
    amount: 5000,
    mode: 'online',
    description: 'Donation from local business for community development',
    source: 'Local Business',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: false,
    tags: ['donation', 'charity'],
    addedBy: 'admin-001',
    createdAt: '2024-11-10T11:30:00Z',
    updatedAt: '2024-11-10T12:00:00Z'
  },
  {
    id: 'inc-uuid-004',
    date: '2024-11-15',
    category: 'otherIncome',
    subcategory: 'rental',
    amount: 12000,
    mode: 'bankTransfer',
    description: 'Monthly rental income from society hall',
    source: 'Hall Rental',
    status: 'approved',
    approvedBy: 'admin-001',
    recurring: true,
    recurringFrequency: 'monthly',
    tags: ['rental', 'hall', 'monthly'],
    addedBy: 'admin-001',
    createdAt: '2024-11-15T09:00:00Z',
    updatedAt: '2024-11-15T09:30:00Z'
  }
]

// Calculate comprehensive expense and income statistics
export const getExpenseStats = (expenses: Expense[], income: Income[]): ExpenseStats => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
  const netBalance = totalIncome - totalExpenses

  // Calculate this month's expenses and income
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const thisMonthIncome = income
    .filter(inc => {
      const incomeDate = new Date(inc.date)
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
    })
    .reduce((sum, inc) => sum + inc.amount, 0)

  // Calculate status breakdown
  const pendingExpenses = expenses.filter(expense => expense.status === 'pending').length
  const approvedExpenses = expenses.filter(expense => expense.status === 'approved').length
  const rejectedExpenses = expenses.filter(expense => expense.status === 'rejected').length

  // Calculate expense category breakdown
  const expenseCategoryMap = new Map<string, { amount: number; count: number }>()
  expenses.forEach(expense => {
    const existing = expenseCategoryMap.get(expense.category) || { amount: 0, count: 0 }
    expenseCategoryMap.set(expense.category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1
    })
  })

  const categoryBreakdown = Array.from(expenseCategoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)

  // Calculate income category breakdown
  const incomeCategoryMap = new Map<string, { amount: number; count: number }>()
  income.forEach(inc => {
    const existing = incomeCategoryMap.get(inc.category) || { amount: 0, count: 0 }
    incomeCategoryMap.set(inc.category, {
      amount: existing.amount + inc.amount,
      count: existing.count + 1
    })
  })

  const incomeBreakdown = Array.from(incomeCategoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalIncome > 0 ? Math.round((data.amount / totalIncome) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)

  const topExpenseCategory = categoryBreakdown[0]?.category || 'N/A'
  const topIncomeCategory = incomeBreakdown[0]?.category || 'N/A'

  // Calculate monthly trend (last 6 months)
  const monthlyTrend = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    const monthExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === monthDate.getMonth() && 
               expenseDate.getFullYear() === monthDate.getFullYear()
      })
      .reduce((sum, expense) => sum + expense.amount, 0)

    const monthIncome = income
      .filter(inc => {
        const incomeDate = new Date(inc.date)
        return incomeDate.getMonth() === monthDate.getMonth() && 
               incomeDate.getFullYear() === monthDate.getFullYear()
      })
      .reduce((sum, inc) => sum + inc.amount, 0)

    monthlyTrend.push({
      month: monthName,
      expenses: monthExpenses,
      income: monthIncome,
      net: monthIncome - monthExpenses
    })
  }

  // Calculate payment mode breakdown
  const paymentModes = ['cash', 'online', 'cheque', 'bankTransfer']
  const paymentModeBreakdown = paymentModes.map(mode => ({
    mode,
    expenses: expenses.filter(e => e.mode === mode).reduce((sum, e) => sum + e.amount, 0),
    income: income.filter(i => i.mode === mode).reduce((sum, i) => sum + i.amount, 0),
    total: expenses.filter(e => e.mode === mode).reduce((sum, e) => sum + e.amount, 0) +
           income.filter(i => i.mode === mode).reduce((sum, i) => sum + i.amount, 0)
  }))

  return {
    totalExpenses,
    totalIncome,
    netBalance,
    thisMonthExpenses,
    thisMonthIncome,
    pendingExpenses,
    approvedExpenses,
    rejectedExpenses,
    topExpenseCategory,
    topIncomeCategory,
    categoryBreakdown,
    incomeBreakdown,
    monthlyTrend,
    paymentModeBreakdown
  }
}

// Get expenses by date range
export const getExpensesByDateRange = (expenses: Expense[], startDate: string, endDate: string) => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)
  })
}

// Get income by date range
export const getIncomeByDateRange = (income: Income[], startDate: string, endDate: string) => {
  return income.filter(inc => {
    const incomeDate = new Date(inc.date)
    return incomeDate >= new Date(startDate) && incomeDate <= new Date(endDate)
  })
}

// Get recurring expenses
export const getRecurringExpenses = (expenses: Expense[]) => {
  return expenses.filter(expense => expense.recurring)
}

// Get pending approvals
export const getPendingApprovals = (expenses: Expense[], income: Income[]) => {
  const pendingExpenses = expenses.filter(expense => expense.status === 'pending')
  const pendingIncome = income.filter(inc => inc.status === 'pending')
  
  return {
    expenses: pendingExpenses,
    income: pendingIncome,
    totalAmount: pendingExpenses.reduce((sum, e) => sum + e.amount, 0) + 
                  pendingIncome.reduce((sum, i) => sum + i.amount, 0)
  }
}

// Generate unique expense ID
export const generateExpenseId = () => {
  return 'exp-uuid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

// Generate unique income ID
export const generateIncomeId = () => {
  return 'inc-uuid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

// Validate expense form
export const validateExpenseForm = (expense: Partial<Expense>) => {
  const errors: string[] = []

  if (!expense.date) {
    errors.push('Date is required')
  }

  if (!expense.category) {
    errors.push('Category is required')
  }

  if (!expense.amount || expense.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }

  if (!expense.mode) {
    errors.push('Payment mode is required')
  }

  if (!expense.description || expense.description.trim().length < 3) {
    errors.push('Description must be at least 3 characters long')
  }

  return errors
}

// Validate income form
export const validateIncomeForm = (income: Partial<Income>) => {
  const errors: string[] = []

  if (!income.date) {
    errors.push('Date is required')
  }

  if (!income.category) {
    errors.push('Category is required')
  }

  if (!income.amount || income.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }

  if (!income.mode) {
    errors.push('Payment mode is required')
  }

  if (!income.description || income.description.trim().length < 3) {
    errors.push('Description must be at least 3 characters long')
  }

  return errors
}

// Category color mapping
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'maintenance':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'repair':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'event':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'salary':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'utilities':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
    case 'tax':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'insurance':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    case 'other':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Income category color mapping
export const getIncomeCategoryColor = (category: string) => {
  switch (category) {
    case 'interest':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'fine':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'donation':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
    case 'otherIncome':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
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
export const expenseAPI = {
  // Future API calls - currently returns mock data
  getAllExpenses: async (): Promise<Expense[]> => {
    return Promise.resolve(expensesData)
  },
  
  getAllIncome: async (): Promise<Income[]> => {
    return Promise.resolve(incomeData)
  },
  
  getStats: async (): Promise<ExpenseStats> => {
    return Promise.resolve(getExpenseStats(expensesData, incomeData))
  },
  
  createExpense: async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
    const newExpense: Expense = {
      ...expense,
      id: generateExpenseId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return Promise.resolve(newExpense)
  },
  
  createIncome: async (income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Promise<Income> => {
    const newIncome: Income = {
      ...income,
      id: generateIncomeId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return Promise.resolve(newIncome)
  }
}

export default expensesData