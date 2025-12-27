'use client';
import { useState, useEffect, useMemo } from 'react';
import { useClientStore } from '@/lib/client/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, Users, CreditCard, AlertTriangle, Calendar, Filter, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { getAuditData, members, loans, passbookEntries } = useClientStore();
  
  // Global Filter State
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [transactionMode, setTransactionMode] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');
  
  // Get audit data based on date filters
  const auditData = getAuditData(startDate, endDate);

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

  // Calculate derived metrics with safe math
  const totalIncome = (auditData.summary.income.interest || 0) + (auditData.summary.income.fine || 0) + (auditData.summary.income.other || 0);
  const totalExpenses = (auditData.summary.expenses.ops || 0) + (auditData.summary.expenses.maturityInt || 0);
  const netProfit = totalIncome - totalExpenses;
  const totalDeposits = auditData.summary.assets.deposits || 0;
  const emiCollected = auditData.summary.loans.recovered || 0;
  const fineCollected = auditData.summary.income.fine || 0;
  const loansIssued = auditData.summary.loans.issued || 0;
  const loansPending = auditData.summary.loans.pending || 0;
  const activeMembersCount = members.filter(m => m.status === 'active').length;

  // Safe currency formatter
  const formatCurrency = (value: number) => {
    const safeValue = value || 0;
    return fmt(safeValue);
  };

  // Summary data structure for P&L
  const summary = {
    income: {
      interest: auditData.summary.income.interest || 0,
      fine: auditData.summary.income.fine || 0,
      other: auditData.summary.income.other || 0,
      total: totalIncome
    },
    expense: {
      ops: auditData.summary.expenses.ops || 0,
      maturity: auditData.summary.expenses.maturityInt || 0,
      total: totalExpenses
    },
    netProfit: netProfit
  };

  // Chart data
  // Monthly Income vs Expense data
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyIncomeExpense = months.map((month, index) => {
      const monthStartDate = new Date(currentYear, index, 1);
      const monthEndDate = new Date(currentYear, index + 1, 0);
      
      const monthTransactions = auditData.dailyLedger.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStartDate && entryDate <= monthEndDate;
      });
      
      const totalIncome = monthTransactions.reduce((sum, entry) => sum + (entry.cashIn || 0), 0);
      const totalExpense = monthTransactions.reduce((sum, entry) => sum + (entry.cashOut || 0), 0);
      
      return {
        name: month,
        income: totalIncome,
        expense: totalExpense
      };
    });
    
    return monthlyIncomeExpense;
  })();

  const incomeExpenseData = [
    { name: 'Interest Income', value: auditData.summary.income.interest || 0, fill: '#10b981' },
    { name: 'Fine Income', value: auditData.summary.income.fine || 0, fill: '#3b82f6' },
    { name: 'Other Income', value: auditData.summary.income.other || 0, fill: '#8b5cf6' },
    { name: 'Operating Expense', value: auditData.summary.expenses.ops || 0, fill: '#ef4444' },
  ];

  const loanPortfolioData = [
    { name: 'Issued', value: auditData.summary.loans.issued || 0, fill: '#3b82f6' },
    { name: 'Recovered', value: auditData.summary.loans.recovered || 0, fill: '#10b981' },
    { name: 'Pending', value: auditData.summary.loans.pending || 0, fill: '#f59e0b' },
  ];

  // Payment Modes data for Pie Chart
  const paymentModesData = [
    { name: 'Cash', value: auditData.modeStats.cashBal || 0, fill: '#10b981' },
    { name: 'UPI', value: auditData.modeStats.upiBal || 0, fill: '#3b82f6' },
    { name: 'Bank', value: auditData.modeStats.bankBal || 0, fill: '#8b5cf6' },
  ];

  // Graph data structure for new layout
  const graphData = {
    incomeVsExpense: [
      { name: 'Income', value: totalIncome, fill: '#10b981' },
      { name: 'Expense', value: totalExpenses, fill: '#ef4444' }
    ],
    loanTrends: [
      { name: 'Issued', value: loansIssued },
      { name: 'Recovered', value: emiCollected },
      { name: 'Pending', value: loansPending }
    ],
    paymentModes: paymentModesData
  };

  // Enhanced defaulters with status calculation
  const enhancedDefaulters = auditData.defaulters.map(defaulter => {
    const member = members.find(m => m.id === defaulter.memberId);
    const daysOverdue = Math.floor(Math.random() * 90) + 1; // Mock calculation
    const status = daysOverdue > 60 ? 'Critical' : daysOverdue > 30 ? 'Warning' : 'Overdue';
    
    return {
      ...defaulter,
      memberName: member?.name || 'Unknown',
      memberPhone: member?.phone || '',
      daysOverdue,
      status
    };
  });

  // --- FILTERING LOGIC FOR TABS ---
  // Applying Member, Type, and Mode filters to the data displayed in tabs

  const filteredPassbookEntries = passbookEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const dateMatch = entryDate >= start && entryDate <= end;
    const memberMatch = selectedMember === 'ALL' || entry.memberId === selectedMember;
    const modeMatch = transactionMode === 'all' || (entry.paymentMode && entry.paymentMode.toLowerCase() === transactionMode);
    const typeMatch = transactionType === 'all' || (entry.type && entry.type.toLowerCase() === transactionType);

    return dateMatch && memberMatch && modeMatch && typeMatch;
  });

  const filteredLoans = auditData.loans.filter(loan => 
    selectedMember === 'ALL' || loan.memberId === selectedMember
  );

  const filteredMemberReports = auditData.memberReports.filter(report => {
    // Assuming memberReports has memberId or we match by finding the member
    const member = members.find(m => m.name === report.name); // Fallback match by name if ID missing in report
    const memberId = member ? member.id : report.memberId;
    return selectedMember === 'ALL' || memberId === selectedMember;
  });

  const filteredDefaulters = enhancedDefaulters.filter(defaulter => 
    selectedMember === 'ALL' || defaulter.memberId === selectedMember
  );

  const filteredMaturity = auditData.maturity.filter(item => {
     const member = members.find(m => m.name === item.memberName);
     return selectedMember === 'ALL' || (member && member.id === selectedMember);
  });

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="border-b border-border/40 bg-white/60 dark:bg-black/40 backdrop-blur-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            REPORTS
          </h1>
          <div className="flex gap-2">
            <Select value="all" onValueChange={() => {}}>
              <SelectTrigger className="w-40 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export All</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export CSV</SelectItem>
                <SelectItem value="pdf">Export PDF</SelectItem>
                <SelectItem value="excel">Export Excel</SelectItem>
                <SelectItem value="print">Print Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="border-b border-border/20 bg-white/80 dark:bg-black/60 backdrop-blur-sm -mx-6 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>

          {/* Date Range Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 w-36 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
            />
          </div>

          {/* End Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 w-36 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
            />
          </div>

          {/* Member Filter */}
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-40 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Members</SelectItem>
              {members.map(member => (
                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Transaction Mode Filter */}
          <Select value={transactionMode} onValueChange={setTransactionMode}>
            <SelectTrigger className="w-40 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
              <SelectValue placeholder="Transaction Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={transactionType} onValueChange={setTransactionType}>
            <SelectTrigger className="w-32 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="loan">Loan</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 8-Tab Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 h-auto gap-1 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Summary</TabsTrigger>
          <TabsTrigger value="daily" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Daily Ledger</TabsTrigger>
          <TabsTrigger value="cashbook" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Cashbook</TabsTrigger>
          <TabsTrigger value="passbook" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Passbook</TabsTrigger>
          <TabsTrigger value="loans" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Loans</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Members</TabsTrigger>
          <TabsTrigger value="maturity" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Maturity</TabsTrigger>
          <TabsTrigger value="defaulters" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs">Defaulters</TabsTrigger>
        </TabsList>

        {/* TAB 1: SUMMARY */}
        <TabsContent value="summary" className="space-y-8">
          
          {/* A. CARDS ROW (Use safe values) */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-800">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {formatCurrency(summary.income.total)}
                </div>
                <p className="text-sm text-muted-foreground">All income sources</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-800">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">
                  {formatCurrency(summary.expense.total)}
                </div>
                <p className="text-sm text-muted-foreground">Operating expenses</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-800">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(summary.netProfit)}
                </div>
                <p className="text-sm text-muted-foreground">Income - Expenses</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-800">Active Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">
                  {activeMembersCount}
                </div>
                <p className="text-sm text-muted-foreground">Current members</p>
              </CardContent>
            </Card>
          </div>

          {/* B. PROFIT & LOSS STATEMENT (NEW SECTION) */}
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">Profit & Loss Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* INCOME SIDE */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-700 border-b pb-2 text-lg">INCOME (Credits)</h4>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Interest Income</span>
                    <span className="font-medium">{formatCurrency(summary.income.interest)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Fine Income</span>
                    <span className="font-medium">{formatCurrency(summary.income.fine)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Other Fees</span>
                    <span className="font-medium">{formatCurrency(summary.income.other)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-lg text-green-700">
                    <span>Total Income</span>
                    <span>{formatCurrency(summary.income.total)}</span>
                  </div>
                </div>

                {/* EXPENSE SIDE */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-red-700 border-b pb-2 text-lg">EXPENSES (Debits)</h4>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Operational Cost</span>
                    <span className="font-medium">{formatCurrency(summary.expense.ops)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Maturity Liability</span>
                    <span className="font-medium">{formatCurrency(summary.expense.maturity)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-lg text-red-700">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(summary.expense.total)}</span>
                  </div>
                </div>
              </div>
              
              {/* BOTTOM LINE */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center border">
                <span className="text-xl font-bold text-gray-700">NET PROFIT</span>
                <span className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netProfit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* C. GRAPHS ROW (Fixed Recharts) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 h-[350px]">
            {/* Income vs Expense Bar Chart */}
            <Card className="p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Income vs Expense</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphData.incomeVsExpense}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#8884d8">
                      {graphData.incomeVsExpense.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Loan Line Chart */}
            <Card className="p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Loan Portfolio</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphData.loanTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Payment Mode Pie */}
            <Card className="p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Payment Modes</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graphData.paymentModes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {graphData.paymentModes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: DAILY LEDGER */}
        <TabsContent value="daily" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Daily Ledger - The Operational Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-green-600">Deposit</TableHead>
                      <TableHead className="text-green-600">EMI</TableHead>
                      <TableHead className="text-red-600">Loan Out</TableHead>
                      <TableHead className="text-green-600">Interest</TableHead>
                      <TableHead className="text-green-600">Fine</TableHead>
                      <TableHead className="text-green-600">Cash IN</TableHead>
                      <TableHead className="text-red-600">Cash OUT</TableHead>
                      <TableHead>Net Flow</TableHead>
                      <TableHead>Running Bal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData.dailyLedger.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.deposit || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.emi || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(entry.loanOut || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.interest || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.fine || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.cashIn || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(entry.cashOut || 0)}</TableCell>
                        <TableCell className={entry.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(entry.netFlow || 0)}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">{formatCurrency(entry.runningBal || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CASHBOOK */}
        <TabsContent value="cashbook" className="space-y-6 mt-6">
          {/* Mode Balance Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-xl border-green-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(auditData.modeStats.cashBal || 0)}</div>
                <p className="text-xs text-muted-foreground">Physical cash</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(auditData.modeStats.bankBal || 0)}</div>
                <p className="text-xs text-muted-foreground">Bank accounts</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-purple-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">UPI Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(auditData.modeStats.upiBal || 0)}</div>
                <p className="text-xs text-muted-foreground">Digital wallets</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-orange-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Liquidity</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency((auditData.modeStats.cashBal || 0) + (auditData.modeStats.bankBal || 0) + (auditData.modeStats.upiBal || 0))}
                </div>
                <p className="text-xs text-muted-foreground">All funds combined</p>
              </CardContent>
            </Card>
          </div>

          {/* Cashbook Table */}
          <Card className="rounded-xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Cashbook - The Tally View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-green-600">Cash IN</TableHead>
                      <TableHead className="text-red-600">Cash OUT</TableHead>
                      <TableHead className="text-green-600">Bank IN</TableHead>
                      <TableHead className="text-red-600">Bank OUT</TableHead>
                      <TableHead className="text-green-600">UPI IN</TableHead>
                      <TableHead className="text-red-600">UPI OUT</TableHead>
                      <TableHead>Closing Bal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData.cashbook.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.cashIn || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(entry.cashOut || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.bankIn || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(entry.bankOut || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(entry.upiIn || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(entry.upiOut || 0)}</TableCell>
                        <TableCell className="text-blue-600 font-medium">{formatCurrency(entry.closing || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PASSBOOK */}
        <TabsContent value="passbook" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Passbook Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPassbookEntries.map((entry, i) => {
                      const member = members.find(m => m.id === entry.memberId);
                      return (
                        <TableRow key={i}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>{member?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant={entry.type === 'DEPOSIT' ? 'default' : 'secondary'}>
                              {entry.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className={entry.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}>
                            {fmt(Math.abs(entry.amount))}
                          </TableCell>
                          <TableCell>{entry.paymentMode || 'CASH'}</TableCell>
                          <TableCell className="text-blue-600 font-medium">{fmt(entry.balance)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: LOAN PORTFOLIO */}
        <TabsContent value="loans" className="space-y-6 mt-6">
          {/* Loan Portfolio Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-xl border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issued</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{fmt(loansIssued)}</div>
                <p className="text-xs text-muted-foreground">Total loans</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl border-green-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recovered</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{fmt(emiCollected)}</div>
                <p className="text-xs text-muted-foreground">EMI collected</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-yellow-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{fmt(loansPending)}</div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-purple-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rate %</CardTitle>
                <Percent className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">12%</div>
                <p className="text-xs text-muted-foreground">Interest rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Loans Table */}
          <Card className="rounded-xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Loan Portfolio Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Principal Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan, i) => {
                      const member = members.find(m => m.id === loan.memberId);
                      return (
                        <TableRow key={i}>
                          <TableCell>{member?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-blue-600">{fmt(loan.amount)}</TableCell>
                          <TableCell className="text-green-600">{fmt(loan.amount - loan.remainingBalance)}</TableCell>
                          <TableCell className="text-red-600 font-medium">{fmt(loan.remainingBalance)}</TableCell>
                          <TableCell>{loan.interestRate}%</TableCell>
                          <TableCell>
                            <Badge 
                              variant={loan.status === 'active' ? 'destructive' : 
                                       loan.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {loan.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: MEMBERS REPORT */}
        <TabsContent value="members" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Members Report - Financial Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Deposit</TableHead>
                      <TableHead>Loan Taken</TableHead>
                      <TableHead>Principal Paid</TableHead>
                      <TableHead>Interest Paid</TableHead>
                      <TableHead>Fine Paid</TableHead>
                      <TableHead>Pending Loan</TableHead>
                      <TableHead>Net Worth</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMemberReports.map((member, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.fatherName}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">{fmt(member.totalDeposits || 0)}</TableCell>
                        <TableCell className="text-blue-600 font-medium">{fmt(member.loanTaken)}</TableCell>
                        <TableCell className="text-purple-600 font-medium">{fmt(member.principalPaid || 0)}</TableCell>
                        <TableCell className="text-orange-600 font-medium">{fmt(member.interestPaid || 0)}</TableCell>
                        <TableCell className="text-red-600 font-medium">{fmt(member.finePaid || 0)}</TableCell>
                        <TableCell className="text-orange-600 font-medium">{fmt(member.activeLoanBal || 0)}</TableCell>
                        <TableCell className={`font-bold ${member.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt(member.netWorth)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
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
        </TabsContent>

        {/* TAB 7: MATURITY PROJECTIONS */}
        <TabsContent value="maturity" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Maturity Projections - Fixed Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Current Deposit</TableHead>
                      <TableHead>Target Deposit</TableHead>
                      <TableHead>Projected Int.</TableHead>
                      <TableHead>Maturity Amount</TableHead>
                      <TableHead>Outstanding Loan</TableHead>
                      <TableHead>Net Payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaturity.map((maturity, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{maturity.memberName}</TableCell>
                        <TableCell>{new Date(maturity.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-green-600">{fmt(maturity.currentDeposit)}</TableCell>
                        <TableCell className="text-blue-600">{fmt(maturity.targetDeposit)}</TableCell>
                        <TableCell className="text-purple-600">{fmt(maturity.projectedInterest)}</TableCell>
                        <TableCell className="text-orange-600 font-medium">{fmt(maturity.maturityAmount)}</TableCell>
                        <TableCell className="text-red-600">{fmt(maturity.outstandingLoan)}</TableCell>
                        <TableCell className={`font-medium ${maturity.netPayable >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt(maturity.netPayable)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 8: DEFAULTERS LIST */}
        <TabsContent value="defaulters" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Defaulters List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Overdue Days</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDefaulters.map((defaulter, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{defaulter.memberName}</TableCell>
                        <TableCell>{defaulter.memberPhone}</TableCell>
                        <TableCell className="text-blue-600">{fmt(defaulter.amount)}</TableCell>
                        <TableCell className="text-red-600 font-medium">{fmt(defaulter.remainingBalance)}</TableCell>
                        <TableCell className="text-orange-600">{defaulter.daysOverdue}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={defaulter.status === 'Critical' ? 'destructive' : 
                                     defaulter.status === 'Warning' ? 'secondary' : 'outline'}
                          >
                            {defaulter.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
