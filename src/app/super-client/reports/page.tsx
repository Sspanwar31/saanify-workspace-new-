'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  HandCoins,
  Receipt,
  Calendar,
  PieChart,
  BarChart3,
  Activity,
  Target,
  AlertCircle,
  Filter,
  RefreshCw,
  CalendarDays,
  FileSpreadsheet,
  Lock,
  Crown,
  BookOpen,
  UserCheck,
  AlertTriangle,
  Phone,
  MessageSquare,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  PiggyBank,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { FeatureLock } from '@/components/ui/FeatureLock'
import { useSuperClientStore, ReportData } from '@/lib/super-client/store'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899']

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Initialize with current year range for better data visibility
  const currentYear = new Date().getFullYear()
  const [startDate, setStartDate] = useState<Date>(new Date(currentYear, 0, 1)) // Jan 1st
  const [endDate, setEndDate] = useState<Date>(new Date(currentYear, 11, 31)) // Dec 31st
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { 
    members, 
    loans, 
    expenses, 
    passbookEntries, 
    getReportData: fetchReportData,
    getAnalyticsData,
    getMaturityData,
    getCashbookData,
    getMemberSummaryData,
    getDefaultersData,
    subscription,
    premiumTrial,
    resetTrialState,
  } = useSuperClientStore()

  // Check trial status on mount
  useEffect(() => {
    if (premiumTrial) {
      resetTrialState()
    }
  }, [])

  useEffect(() => {
    loadReportData()
  }, [startDate, endDate])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const start = startDate || new Date(currentYear, 0, 1)
      const end = endDate || new Date(currentYear, 11, 31)
      
      const data = getAnalyticsData(
        start.toISOString().split('T')[0], 
        end.toISOString().split('T')[0]
      )
      setReportData(data)
    } catch (error) {
      toast.error('Failed to load report data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = (format: 'csv' | 'excel') => {
    if (!reportData) return
    toast.success(`Report exported as ${format.toUpperCase()}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Get filtered data based on date range
  const getFilteredPassbookData = () => {
    const start = startDate || new Date(currentYear, 0, 1)
    const end = endDate || new Date(currentYear, 11, 31)
    
    return passbookEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= start && entryDate <= end
    })
  }

  const getFilteredLoansData = () => {
    const start = startDate || new Date(currentYear, 0, 1)
    const end = endDate || new Date(currentYear, 11, 31)
    
    return loans.filter(loan => {
      const loanDate = new Date(loan.startDate)
      return loanDate >= start && loanDate <= end
    })
  }

  const maturityData = getMaturityData()
  const cashbookData = getCashbookData()
  const memberSummaryData = getMemberSummaryData()
  const defaultersData = getDefaultersData()

  // Calculate summary metrics
  const totalIncome = (reportData?.financials.totalCollected || 0) + (reportData?.financials.totalInterestCollected || 0)
  const totalExpense = reportData?.financials.totalExpenses || 0
  const netProfit = totalIncome - totalExpense
  const totalDeposits = getFilteredPassbookData()
    .filter(entry => entry.type === 'credit' && entry.reference === 'deposit')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const emiCollected = getFilteredPassbookData()
    .filter(entry => entry.reference === 'emiPayment')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const fineCollected = getFilteredPassbookData()
    .filter(entry => entry.reference === 'fine')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const loansIssued = getFilteredLoansData()
    .reduce((sum, loan) => sum + loan.amount, 0)
  const loanPending = getFilteredLoansData()
    .filter(loan => loan.status === 'active')
    .reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0)
  const activeMembersCount = members.filter(member => member.status === 'active').length

  // Chart data
  const incomeVsExpenseData = [
    { name: 'Income', amount: totalIncome, fill: '#10B981' },
    { name: 'Expense', amount: totalExpense, fill: '#EF4444' }
  ]

  const loanVsRecoveryData = [
    { month: 'Jan', issued: 45000, recovered: 38000 },
    { month: 'Feb', issued: 52000, recovered: 48000 },
    { month: 'Mar', issued: 48000, recovered: 51000 },
    { month: 'Apr', issued: 61000, recovered: 55000 },
    { month: 'May', issued: 58000, recovered: 59000 },
    { month: 'Jun', issued: 67000, recovered: 62000 }
  ]

  const cashFlowData = [
    { date: '2025-01-01', cashIn: 120000, cashOut: 80000, balance: 400000 },
    { date: '2025-01-15', cashIn: 95000, cashOut: 110000, balance: 385000 },
    { date: '2025-02-01', cashIn: 135000, cashOut: 95000, balance: 425000 },
    { date: '2025-02-15', cashIn: 108000, cashOut: 125000, balance: 408000 },
    { date: '2025-03-01', cashIn: 142000, cashOut: 105000, balance: 445000 }
  ]

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            REPORTS
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive financial analytics and insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {startDate ? startDate.toLocaleDateString() : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {endDate ? endDate.toLocaleDateString() : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Select>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadReportData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Apply Filter
          </Button>
        </div>
      </div>

      {/* Page Content */}
      <div className="space-y-8">
        {/* SECTION 1: SUMMARY CARDS (3x3 Grid) */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-800">SUMMARY</h2>
          
          {/* Row 1: Financial Summary */}
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card className="shadow-sm border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </div>
                <p className="text-xs text-gray-500">Deposits + Interest + Fines</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Expense</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpense)}
                </div>
                <p className="text-xs text-gray-500">Operational costs</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-gray-500">Income - Expenses</p>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Collection Summary */}
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card className="shadow-sm border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Deposits</CardTitle>
                <PiggyBank className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalDeposits)}
                </div>
                <p className="text-xs text-gray-500">Member deposits</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">EMI Collected</CardTitle>
                <CreditCard className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(emiCollected)}
                </div>
                <p className="text-xs text-gray-500">Loan repayments</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Fine Collected</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(fineCollected)}
                </div>
                <p className="text-xs text-gray-500">Late payment fees</p>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Operations Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm border-l-4 border-l-indigo-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Loans Issued</CardTitle>
                <HandCoins className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(loansIssued)}
                </div>
                <p className="text-xs text-gray-500">Total loan amount</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-rose-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Loan Pending</CardTitle>
                <Clock className="h-4 w-4 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">
                  {formatCurrency(loanPending)}
                </div>
                <p className="text-xs text-gray-500">Outstanding amount</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-teal-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
                <Users className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">
                  {activeMembersCount}
                </div>
                <p className="text-xs text-gray-500">Total active members</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 2: SUMMARY GRAPHS */}
        <section>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Income vs Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeVsExpenseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Loan Issued vs Recovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={loanVsRecoveryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="issued" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="recovered" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 3: DAILY LEDGER */}
        <section>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  DAILY LEDGER
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Comprehensive daily transaction record</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold text-green-600">Deposit</TableHead>
                      <TableHead className="font-bold text-blue-600">EMI</TableHead>
                      <TableHead className="font-bold text-purple-600">Loan Out</TableHead>
                      <TableHead className="font-bold text-orange-600">Interest</TableHead>
                      <TableHead className="font-bold text-red-600">Fine</TableHead>
                      <TableHead className="font-bold text-green-600">IN</TableHead>
                      <TableHead className="font-bold text-red-600">OUT</TableHead>
                      <TableHead className="font-bold">Net</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredPassbookData().slice(0, 10).map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-green-600">
                          {entry.reference === 'deposit' ? formatCurrency(entry.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {entry.reference === 'emiPayment' ? formatCurrency(entry.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-purple-600">
                          {entry.reference === 'loan' ? formatCurrency(entry.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {entry.reference === 'interest' ? formatCurrency(entry.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {entry.reference === 'fine' ? formatCurrency(entry.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {entry.type === 'credit' ? formatCurrency(entry.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {entry.type === 'debit' ? formatCurrency(entry.amount) : '-'}
                        </TableCell>
                        <TableCell className={entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(entry.balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 4: CASHBOOK */}
        <section>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  CASHBOOK
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Mode-wise transaction ledger</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Cash in Hand</p>
                        <p className="text-2xl font-bold text-green-700">₹2,45,000</p>
                      </div>
                      <Wallet className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Bank Balance</p>
                        <p className="text-2xl font-bold text-blue-700">₹8,75,000</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">UPI Balance</p>
                        <p className="text-2xl font-bold text-purple-700">₹1,25,000</p>
                      </div>
                      <Smartphone className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Daily Cash Flow</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="balance" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cashbook Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold">Date</TableHead>
                        <TableHead className="font-bold text-green-600">Cash IN</TableHead>
                        <TableHead className="font-bold text-red-600">Cash OUT</TableHead>
                        <TableHead className="font-bold text-green-600">Bank IN</TableHead>
                        <TableHead className="font-bold text-red-600">Bank OUT</TableHead>
                        <TableHead className="font-bold text-green-600">UPI IN</TableHead>
                        <TableHead className="font-bold text-red-600">UPI OUT</TableHead>
                        <TableHead className="font-bold">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashFlowData.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(entry.cashIn)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(entry.cashOut)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(entry.cashIn * 0.6)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(entry.cashOut * 0.6)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(entry.cashIn * 0.4)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(entry.cashOut * 0.4)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(entry.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 5: PASSBOOK */}
        <section>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Member Passbook
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Individual member transaction records</p>
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {members.slice(0, 5).map(member => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="emi">EMI</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">Type</TableHead>
                      <TableHead className="font-bold">Mode</TableHead>
                      <TableHead className="font-bold">Amount</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                      <TableHead className="font-bold">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredPassbookData().slice(0, 10).map((entry, index) => {
                      const member = members.find(m => m.id === entry.memberId)
                      return (
                        <TableRow key={index}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={entry.type === 'credit' ? 'default' : 'secondary'}>
                              {entry.reference}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.paymentMode || 'Cash'}</TableCell>
                          <TableCell className={entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                            {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                          </TableCell>
                          <TableCell className="font-bold">{formatCurrency(entry.balance || 0)}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {member?.name || entry.memberId}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 6: LOAN PORTFOLIO */}
        <section>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandCoins className="h-5 w-5" />
                Loan Portfolio Overview
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Complete loan portfolio analysis</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Portfolio Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-600">Total Issued</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(loansIssued)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">Total Recovered</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(loansIssued - loanPending)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-600">Pending Loan</p>
                      <p className="text-2xl font-bold text-red-700">{formatCurrency(loanPending)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-purple-600">Recovery Rate</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {loansIssued > 0 ? Math.round(((loansIssued - loanPending) / loansIssued) * 100) : 0}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Loan Portfolio Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold">Member</TableHead>
                      <TableHead className="font-bold">Loan Amount</TableHead>
                      <TableHead className="font-bold">Paid</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                      <TableHead className="font-bold">Interest Rate</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredLoansData().slice(0, 10).map(loan => {
                      const member = members.find(m => m.id === loan.memberId)
                      const paidAmount = loan.amount - (loan.remainingBalance || 0)
                      return (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{member?.name || loan.memberId}</TableCell>
                          <TableCell>{formatCurrency(loan.amount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(paidAmount)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(loan.remainingBalance || 0)}</TableCell>
                          <TableCell>{loan.interest}%</TableCell>
                          <TableCell>
                            <Badge className={
                              loan.status === 'active' ? 'bg-green-100 text-green-800' :
                              loan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 7: MEMBERS FINANCIAL SUMMARY */}
        <section>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Financial Health
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Complete financial overview of all members</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold text-green-600">Total Deposit</TableHead>
                      <TableHead className="font-bold text-blue-600">Loan Taken</TableHead>
                      <TableHead className="font-bold text-purple-600">Principal Paid</TableHead>
                      <TableHead className="font-bold text-orange-600">Interest Paid</TableHead>
                      <TableHead className="font-bold text-red-600">Fine Paid</TableHead>
                      <TableHead className="font-bold text-red-600">Pending Loan</TableHead>
                      <TableHead className="font-bold text-green-600">Net Worth</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberSummaryData.slice(0, 10).map((member, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(member.totalDeposits || 0)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(member.totalLoans || 0)}</TableCell>
                        <TableCell className="text-purple-600">{formatCurrency(member.principalPaid || 0)}</TableCell>
                        <TableCell className="text-orange-600">{formatCurrency(member.interestPaid || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(member.finePaid || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(member.pendingLoan || 0)}</TableCell>
                        <TableCell className="text-green-600 font-bold">{formatCurrency(member.netWorth || 0)}</TableCell>
                        <TableCell>
                          <Badge className={
                            member.status === 'active' ? 'bg-green-100 text-green-800' :
                            member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {member.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 8: MATURITY PROJECTIONS */}
        <section>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Maturity Projections
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Future maturity calculations and projections</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold">Member</TableHead>
                      <TableHead className="font-bold">Join Date</TableHead>
                      <TableHead className="font-bold text-green-600">Current Deposit</TableHead>
                      <TableHead className="font-bold text-blue-600">Target Deposit</TableHead>
                      <TableHead className="font-bold text-purple-600">Projected Interest</TableHead>
                      <TableHead className="font-bold text-orange-600">Maturity Amount</TableHead>
                      <TableHead className="font-bold text-red-600">Outstanding Loan</TableHead>
                      <TableHead className="font-bold text-green-600">Net Payable</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maturityData.slice(0, 10).map((maturity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{maturity.memberName}</TableCell>
                        <TableCell>{new Date(maturity.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(maturity.currentDeposit)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(maturity.targetDeposit)}</TableCell>
                        <TableCell className="text-purple-600">{formatCurrency(maturity.projectedInterest)}</TableCell>
                        <TableCell className="text-orange-600 font-bold">{formatCurrency(maturity.maturityAmount)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(maturity.outstandingLoan || 0)}</TableCell>
                        <TableCell className="text-green-600 font-bold">{formatCurrency(maturity.netPayable)}</TableCell>
                        <TableCell>
                          <Badge className={
                            maturity.status === 'matured' ? 'bg-green-100 text-green-800' :
                            maturity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {maturity.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 9: DEFAULTERS LIST */}
        <section>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Defaulters List
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Members with overdue loan payments</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold">Member</TableHead>
                      <TableHead className="font-bold">Phone</TableHead>
                      <TableHead className="font-bold">Loan Amount</TableHead>
                      <TableHead className="font-bold">Balance</TableHead>
                      <TableHead className="font-bold">Days Overdue</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaultersData.slice(0, 10).map((defaulter, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{defaulter.memberName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {defaulter.phone}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(defaulter.loanAmount)}</TableCell>
                        <TableCell className="text-red-600 font-bold">{formatCurrency(defaulter.balance)}</TableCell>
                        <TableCell>
                          <Badge className={defaulter.daysOverdue > 60 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {defaulter.daysOverdue} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            defaulter.status === 'critical' ? 'bg-red-100 text-red-800' :
                            defaulter.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }>
                            {defaulter.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm">
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Page Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 text-center text-sm text-gray-600">
        © 2025 — Saanify Microfinance OS | Powered by Fintech Engine v2.0
      </footer>
    </div>
  )
}