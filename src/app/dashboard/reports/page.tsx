'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; // Supabase Connection
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, Users, CreditCard, AlertTriangle, Calendar, Filter, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { differenceInMonths } from 'date-fns';

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Data from Backend
  const [members, setMembers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [passbookEntries, setPassbookEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Global Filter State
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [transactionMode, setTransactionMode] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');
  
  // Calculated Audit Data
  const [auditData, setAuditData] = useState<any>({
    summary: { 
        income: { interest: 0, fine: 0, other: 0, total: 0 }, 
        expenses: { ops: 0, maturityInt: 0 },
        assets: { deposits: 0 },
        loans: { issued: 0, recovered: 0, pending: 0 }
    },
    dailyLedger: [],
    cashbook: [],
    modeStats: { cashBal: 0, bankBal: 0, upiBal: 0 },
    loans: [],
    memberReports: [],
    maturity: [],
    defaulters: []
  });

  useEffect(() => { setIsMounted(true); }, []);

  // 1. Fetch Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        // Get Client ID
        let cid = clientId;
        if (!cid) {
            const { data: clients } = await supabase.from('clients').select('id').limit(1);
            if (clients && clients.length > 0) {
                cid = clients[0].id;
                setClientId(cid);
            }
        }

        if (cid) {
            const [membersRes, loansRes, passbookRes, expenseRes] = await Promise.all([
                supabase.from('members').select('*').eq('client_id', cid),
                supabase.from('loans').select('*').eq('client_id', cid),
                supabase.from('passbook_entries').select('*').order('date', { ascending: true }),
                supabase.from('expenses_ledger').select('*').eq('client_id', cid)
            ]);

            if (membersRes.data) setMembers(membersRes.data);
            if (loansRes.data) setLoans(loansRes.data);
            if (passbookRes.data) {
                // Filter passbook by client members (if no client_id in passbook table)
                const memberIds = new Set(membersRes.data?.map(m => m.id));
                const validEntries = passbookRes.data.filter(e => memberIds.has(e.member_id));
                setPassbookEntries(validEntries);
            }
            if (expenseRes.data) setExpenses(expenseRes.data);
        }
        setLoading(false);
    };
    fetchData();
  }, [clientId]);

  // 2. Logic & Calculation Engine (Replaces getAuditData from store)
  useEffect(() => {
    if (loading || !members.length) return;

    // --- FILTERS ---
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filteredPassbook = passbookEntries.filter(e => {
        const d = new Date(e.date);
        const dateMatch = d >= start && d <= end;
        const memberMatch = selectedMember === 'ALL' || e.member_id === selectedMember;
        const modeMatch = transactionMode === 'all' || (e.payment_mode || '').toLowerCase() === transactionMode;
        return dateMatch && memberMatch && modeMatch;
    });

    const filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
    });

    // --- CALCULATIONS ---

    // 1. Summary Metrics
    let interestIncome = 0, fineIncome = 0, depositTotal = 0, otherIncome = 0, opsExpense = 0;
    
    filteredPassbook.forEach(e => {
        interestIncome += (e.interest_amount || 0);
        fineIncome += (e.fine_amount || 0);
        depositTotal += (e.deposit_amount || 0);
    });

    filteredExpenses.forEach(e => {
        if (e.type === 'INCOME') otherIncome += Number(e.amount);
        if (e.type === 'EXPENSE') opsExpense += Number(e.amount);
    });

    const totalIncome = interestIncome + fineIncome + otherIncome;

    // 2. Loans Metrics
    const loansIssuedTotal = loans.reduce((acc, l) => acc + (l.amount || 0), 0);
    const loansPendingTotal = loans.reduce((acc, l) => acc + (l.remaining_balance || 0), 0);
    const loansRecoveredTotal = loansIssuedTotal - loansPendingTotal;

    // 3. Daily Ledger
    const ledgerMap = new Map();
    const addToLedger = (dateStr: string, field: string, value: number) => {
        if (!ledgerMap.has(dateStr)) {
            ledgerMap.set(dateStr, { date: dateStr, deposit: 0, emi: 0, loanOut: 0, interest: 0, fine: 0, cashIn: 0, cashOut: 0 });
        }
        const entry = ledgerMap.get(dateStr);
        entry[field] += value;
        if (['deposit', 'emi', 'interest', 'fine'].includes(field)) entry.cashIn += value;
        if (['loanOut'].includes(field)) entry.cashOut += value;
    };

    filteredPassbook.forEach(e => {
        if (e.deposit_amount > 0) addToLedger(e.date, 'deposit', e.deposit_amount);
        if (e.installment_amount > 0) addToLedger(e.date, 'emi', e.installment_amount);
        if (e.interest_amount > 0) addToLedger(e.date, 'interest', e.interest_amount);
        if (e.fine_amount > 0) addToLedger(e.date, 'fine', e.fine_amount);
    });

    filteredExpenses.forEach(e => {
        if (!ledgerMap.has(e.date)) ledgerMap.set(e.date, { date: e.date, deposit: 0, emi: 0, loanOut: 0, interest: 0, fine: 0, cashIn: 0, cashOut: 0 });
        const entry = ledgerMap.get(e.date);
        if (e.type === 'EXPENSE') { entry.cashOut += Number(e.amount); }
        if (e.type === 'INCOME') { entry.cashIn += Number(e.amount); }
    });

    loans.forEach(l => {
        if (l.start_date >= startDate && l.start_date <= endDate) {
            addToLedger(l.start_date, 'loanOut', l.amount);
        }
    });

    const sortedLedger = Array.from(ledgerMap.values()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBal = 0;
    const finalLedger = sortedLedger.map((e: any) => {
        const netFlow = e.cashIn - e.cashOut;
        runningBal += netFlow;
        return { ...e, netFlow, runningBal };
    });

    // 4. Cashbook & Mode Stats
    let cashBal = 0, bankBal = 0, upiBal = 0;
    // Calculate total from ALL time passbook (not just filtered) for accurate Balance
    passbookEntries.forEach(e => {
        const mode = (e.payment_mode || 'CASH').toLowerCase();
        const amt = e.total_amount || 0;
        if (mode.includes('cash')) cashBal += amt;
        if (mode.includes('bank')) bankBal += amt;
        if (mode.includes('upi') || mode.includes('online')) upiBal += amt;
    });
    // Subtract expenses from cash (assuming expenses are cash for simplicity, or add mode to expense table)
    const totalExp = expenses.filter(e => e.type === 'EXPENSE').reduce((acc, e) => acc + Number(e.amount), 0);
    cashBal -= totalExp; // Adjust logic as needed

    const cashbook = finalLedger.map((e: any) => ({
        date: e.date,
        cashIn: e.cashIn, // Simplified: assuming all IN is cash/mix
        cashOut: e.cashOut,
        bankIn: 0, bankOut: 0, upiIn: 0, upiOut: 0, // Would need detailed mode tracking in ledger map
        closing: e.runningBal
    }));

    // 5. Member Reports
    const memberReports = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.member_id === m.id);
        const dep = mEntries.reduce((acc, e) => acc + (e.deposit_amount || 0), 0);
        const intPaid = mEntries.reduce((acc, e) => acc + (e.interest_amount || 0), 0);
        const finePaid = mEntries.reduce((acc, e) => acc + (e.fine_amount || 0), 0);
        
        const mLoans = loans.filter(l => l.member_id === m.id);
        const loanTaken = mLoans.reduce((acc, l) => acc + (l.amount || 0), 0);
        const loanPending = mLoans.reduce((acc, l) => acc + (l.remaining_balance || 0), 0);
        
        return {
            id: m.id,
            name: m.name,
            fatherName: m.phone,
            totalDeposits: dep,
            loanTaken,
            principalPaid: loanTaken - loanPending,
            interestPaid: intPaid,
            finePaid,
            activeLoanBal: loanPending,
            netWorth: dep - loanPending,
            status: m.status || 'active'
        };
    });

    // 6. Maturity
    const maturity = members.map(m => {
        // Logic from Maturity Page
        const memberEntries = passbookEntries.filter(e => e.member_id === m.id && e.deposit_amount > 0);
        let monthly = 0;
        if (memberEntries.length > 0) monthly = Number(memberEntries[0].deposit_amount); // First deposit as Monthly
        
        const tenure = 36;
        const target = monthly * tenure;
        const projected = target * 0.12;
        const currentDep = m.total_deposits || 0;
        const maturityAmt = target + projected;
        const outstanding = m.outstanding_loan || 0;

        return {
            memberName: m.name,
            joinDate: m.join_date || m.created_at,
            currentDeposit: currentDep,
            targetDeposit: target,
            projectedInterest: projected,
            maturityAmount: maturityAmt,
            outstandingLoan: outstanding,
            netPayable: maturityAmt - outstanding
        };
    });

    // 7. Defaulters
    const defaulters = loans
        .filter(l => l.status === 'active' && l.remaining_balance > 0)
        .map(l => ({
            memberId: l.member_id,
            amount: l.amount,
            remainingBalance: l.remaining_balance,
            daysOverdue: Math.floor((new Date().getTime() - new Date(l.start_date).getTime()) / (1000 * 3600 * 24))
        }));

    // Update State
    setAuditData({
        summary: {
            income: { interest: interestIncome, fine: fineIncome, other: otherIncome },
            expenses: { ops: opsExpense, maturityInt: 0 },
            assets: { deposits: depositTotal },
            loans: { issued: loansIssuedTotal, recovered: loansRecoveredTotal, pending: loansPendingTotal }
        },
        dailyLedger: finalLedger,
        cashbook,
        modeStats: { cashBal, bankBal, upiBal },
        loans: loans.map(l => ({ ...l, interestRate: 12, memberId: l.member_id })),
        memberReports,
        maturity,
        defaulters
    });

  }, [members, loans, passbookEntries, expenses, startDate, endDate, selectedMember, transactionMode, loading]);

  if (!isMounted) return null;

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const formatCurrency = (value: number) => {
    const safeValue = value || 0;
    return fmt(safeValue);
  };

  const totalIncome = (auditData.summary.income.interest || 0) + (auditData.summary.income.fine || 0) + (auditData.summary.income.other || 0);
  const totalExpenses = (auditData.summary.expenses.ops || 0) + (auditData.summary.expenses.maturityInt || 0);
  const netProfit = totalIncome - totalExpenses;
  const loansIssued = auditData.summary.loans.issued || 0;
  const emiCollected = auditData.summary.loans.recovered || 0;
  const loansPending = auditData.summary.loans.pending || 0;
  const activeMembersCount = members.filter(m => m.status === 'active').length;

  const summary = {
    income: { ...auditData.summary.income, total: totalIncome },
    expense: { ...auditData.summary.expenses, total: totalExpenses },
    netProfit
  };

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
    paymentModes: [
      { name: 'Cash', value: auditData.modeStats.cashBal || 0, fill: '#10b981' },
      { name: 'UPI', value: auditData.modeStats.upiBal || 0, fill: '#3b82f6' },
      { name: 'Bank', value: auditData.modeStats.bankBal || 0, fill: '#8b5cf6' },
    ]
  };

  const enhancedDefaulters = auditData.defaulters.map((defaulter: any) => {
    const member = members.find(m => m.id === defaulter.memberId);
    const status = defaulter.daysOverdue > 60 ? 'Critical' : defaulter.daysOverdue > 30 ? 'Warning' : 'Overdue';
    return {
      ...defaulter,
      memberName: member?.name || 'Unknown',
      memberPhone: member?.phone || '',
      status
    };
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
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10 w-36 bg-white/50" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10 w-36 bg-white/50" />
          </div>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-40 bg-white/50"><SelectValue placeholder="All Members" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Members</SelectItem>
              {members.map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={transactionMode} onValueChange={setTransactionMode}>
            <SelectTrigger className="w-40 bg-white/50"><SelectValue placeholder="Transaction Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 8-Tab Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 h-auto gap-1 bg-gray-100 p-1 rounded-xl">
          {['Summary', 'Daily', 'Cashbook', 'Passbook', 'Loans', 'Members', 'Maturity', 'Defaulters'].map(t => (
              <TabsTrigger key={t.toLowerCase()} value={t.toLowerCase()} className="text-xs">{t}</TabsTrigger>
          ))}
        </TabsList>

        {/* TAB 1: SUMMARY */}
        <TabsContent value="summary" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-green-50 border-green-200"><CardHeader className="pb-2"><CardTitle className="text-green-800">Total Income</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-700">{formatCurrency(summary.income.total)}</div><p className="text-sm text-muted-foreground">All income sources</p></CardContent></Card>
            <Card className="bg-red-50 border-red-200"><CardHeader className="pb-2"><CardTitle className="text-red-800">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-700">{formatCurrency(summary.expense.total)}</div><p className="text-sm text-muted-foreground">Operating expenses</p></CardContent></Card>
            <Card className="bg-blue-50 border-blue-200"><CardHeader className="pb-2"><CardTitle className="text-blue-800">Net Profit</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-700">{formatCurrency(summary.netProfit)}</div><p className="text-sm text-muted-foreground">Income - Expenses</p></CardContent></Card>
            <Card className="bg-purple-50 border-purple-200"><CardHeader className="pb-2"><CardTitle className="text-purple-800">Active Members</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-purple-700">{activeMembersCount}</div><p className="text-sm text-muted-foreground">Current members</p></CardContent></Card>
          </div>

          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader><CardTitle className="text-xl font-bold text-gray-800">Profit & Loss Statement</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-700 border-b pb-2 text-lg">INCOME (Credits)</h4>
                  <div className="flex justify-between py-2"><span className="text-gray-600">Interest Income</span><span className="font-medium">{formatCurrency(summary.income.interest)}</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-600">Fine Income</span><span className="font-medium">{formatCurrency(summary.income.fine)}</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-600">Other Fees</span><span className="font-medium">{formatCurrency(summary.income.other)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2 text-lg text-green-700"><span>Total Income</span><span>{formatCurrency(summary.income.total)}</span></div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-red-700 border-b pb-2 text-lg">EXPENSES (Debits)</h4>
                  <div className="flex justify-between py-2"><span className="text-gray-600">Operational Cost</span><span className="font-medium">{formatCurrency(summary.expense.ops)}</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-600">Maturity Liability</span><span className="font-medium">{formatCurrency(summary.expense.maturity)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2 text-lg text-red-700"><span>Total Expenses</span><span>{formatCurrency(summary.expense.total)}</span></div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center border">
                <span className="text-xl font-bold text-gray-700">NET PROFIT</span>
                <span className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(summary.netProfit)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 h-[350px]">
            <Card className="p-4"><CardHeader className="pb-2"><CardTitle className="text-sm">Income vs Expense</CardTitle></CardHeader><CardContent className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={graphData.incomeVsExpense}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(value) => formatCurrency(Number(value))}/><Bar dataKey="value" fill="#8884d8">{graphData.incomeVsExpense.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill}/>)}</Bar></BarChart></ResponsiveContainer></CardContent></Card>
            <Card className="p-4"><CardHeader className="pb-2"><CardTitle className="text-sm">Loan Portfolio</CardTitle></CardHeader><CardContent className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={graphData.loanTrends}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={(value) => formatCurrency(Number(value))}/><Bar dataKey="value" fill="#3b82f6"/></BarChart></ResponsiveContainer></CardContent></Card>
            <Card className="p-4"><CardHeader className="pb-2"><CardTitle className="text-sm">Payment Modes</CardTitle></CardHeader><CardContent className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={graphData.paymentModes} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">{graphData.paymentModes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill}/>)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))}/></PieChart></ResponsiveContainer></CardContent></Card>
          </div>
        </TabsContent>

        {/* TAB 2: DAILY LEDGER */}
        <TabsContent value="daily" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Daily Ledger</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Date</TableHead><TableHead className="text-green-600">Deposit</TableHead><TableHead className="text-green-600">EMI</TableHead><TableHead className="text-red-600">Loan Out</TableHead><TableHead className="text-green-600">Interest</TableHead><TableHead className="text-green-600">Fine</TableHead><TableHead className="text-green-600">Cash IN</TableHead><TableHead className="text-red-600">Cash OUT</TableHead><TableHead>Net Flow</TableHead><TableHead>Running Bal</TableHead></TableRow></TableHeader><TableBody>{auditData.dailyLedger.map((entry: any, i: number) => (<TableRow key={i}><TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.deposit)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.emi)}</TableCell><TableCell className="text-red-600">{formatCurrency(entry.loanOut)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.interest)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.fine)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.cashIn)}</TableCell><TableCell className="text-red-600">{formatCurrency(entry.cashOut)}</TableCell><TableCell className={entry.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(entry.netFlow)}</TableCell><TableCell className="text-blue-600 font-medium">{formatCurrency(entry.runningBal)}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        {/* Other Tabs (Kept minimal for brevity, logic follows same structure) */}
        <TabsContent value="cashbook" className="mt-6"><Card><CardContent>Cashbook data available in daily ledger</CardContent></Card></TabsContent>
        
        <TabsContent value="passbook" className="mt-6">
            <Card><CardHeader><CardTitle>Passbook Entries</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead></TableRow></TableHeader><TableBody>{passbookEntries.map((e: any, i: number) => (<TableRow key={i}><TableCell>{new Date(e.date).toLocaleDateString()}</TableCell><TableCell>{members.find(m => m.id === e.member_id)?.name}</TableCell><TableCell><Badge>{e.deposit_amount > 0 ? 'DEPOSIT' : 'PAYMENT'}</Badge></TableCell><TableCell>{formatCurrency(e.total_amount)}</TableCell><TableCell>{e.payment_mode}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="loans" className="mt-6">
            <Card><CardHeader><CardTitle>Loan Portfolio</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Amount</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{loans.map((l: any, i: number) => (<TableRow key={i}><TableCell>{members.find(m => m.id === l.member_id)?.name}</TableCell><TableCell>{formatCurrency(l.amount)}</TableCell><TableCell>{formatCurrency(l.remaining_balance)}</TableCell><TableCell><Badge>{l.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
            <Card><CardHeader><CardTitle>Members Report</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Deposits</TableHead><TableHead>Loan</TableHead><TableHead>Net Worth</TableHead></TableRow></TableHeader><TableBody>{auditData.memberReports.map((m: any, i: number) => (<TableRow key={i}><TableCell>{m.name}</TableCell><TableCell className="text-green-600">{formatCurrency(m.totalDeposits)}</TableCell><TableCell className="text-red-600">{formatCurrency(m.activeLoanBal)}</TableCell><TableCell className="font-bold">{formatCurrency(m.netWorth)}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="maturity" className="mt-6">
            <Card><CardHeader><CardTitle>Maturity Report</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Maturity Amt</TableHead><TableHead>Net Payable</TableHead></TableRow></TableHeader><TableBody>{auditData.maturity.map((m: any, i: number) => (<TableRow key={i}><TableCell>{m.memberName}</TableCell><TableCell>{formatCurrency(m.maturityAmount)}</TableCell><TableCell className="font-bold text-green-600">{formatCurrency(m.netPayable)}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="defaulters" className="mt-6">
            <Card><CardHeader><CardTitle>Defaulters List</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Balance</TableHead><TableHead>Overdue Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{enhancedDefaulters.map((d: any, i: number) => (<TableRow key={i}><TableCell>{d.memberName}</TableCell><TableCell className="text-red-600">{formatCurrency(d.remainingBalance)}</TableCell><TableCell>{d.daysOverdue}</TableCell><TableCell><Badge variant="destructive">{d.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
