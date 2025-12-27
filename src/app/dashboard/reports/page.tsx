'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Download, FileText, TrendingUp, TrendingDown, DollarSign, 
  Users, CreditCard, AlertTriangle, Calendar, Filter, Percent 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  // Global Filter State
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [transactionMode, setTransactionMode] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');

  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [passbookEntries, setPassbookEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [adminFund, setAdminFund] = useState<any[]>([]);

  // Audit Data State
  const [auditData, setAuditData] = useState<any>({
    summary: { income: {}, expenses: {}, assets: {}, loans: {} },
    dailyLedger: [],
    cashbook: [],
    modeStats: {},
    loans: [],
    memberReports: [],
    maturity: [],
    defaulters: []
  });

  useEffect(() => { setIsMounted(true); }, []);

  // 1. Fetch Data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      // Get Client ID
      let cid = clientId;
      if (!cid) {
        const { data } = await supabase.from('clients').select('id').limit(1);
        if (data && data.length > 0) {
            cid = data[0].id;
            setClientId(cid);
        }
      }

      if (cid) {
        // Parallel Fetching for Performance
        const [
            { data: membersData },
            { data: loansData },
            { data: passbookData },
            { data: expenseData },
            { data: adminData }
        ] = await Promise.all([
            supabase.from('members').select('*').eq('client_id', cid),
            supabase.from('loans').select('*').eq('client_id', cid),
            supabase.from('passbook_entries').select('*'), // Filter by client if RLS enabled, else filter in JS
            supabase.from('expenses_ledger').select('*').eq('client_id', cid),
            supabase.from('admin_fund_ledger').select('*').eq('client_id', cid)
        ]);

        if (membersData) setMembers(membersData);
        if (loansData) setLoans(loansData);
        // Note: For passbook, better to filter by member IDs if no direct client_id column
        // Assuming your backend handles RLS or we filter locally
        if (passbookData) {
            // Filter passbook entries that belong to fetched members
            const memberIds = new Set(membersData?.map(m => m.id));
            const validEntries = passbookData.filter(e => memberIds.has(e.member_id));
            setPassbookEntries(validEntries);
        }
        if (expenseData) setExpenses(expenseData);
        if (adminData) setAdminFund(adminData);
      }
      setLoading(false);
    };
    initData();
  }, [clientId]);

  // 2. Calculation Logic (Runs whenever data or filters change)
  useEffect(() => {
    if (!members.length) return;

    // --- FILTER LOGIC ---
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filteredPassbook = passbookEntries.filter(e => {
        const d = new Date(e.date);
        const matchDate = d >= start && d <= end;
        const matchMember = selectedMember === 'ALL' || e.member_id === selectedMember;
        const matchMode = transactionMode === 'all' || (e.payment_mode || '').toLowerCase() === transactionMode;
        return matchDate && matchMember && matchMode;
    });

    const filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
    });

    // --- SUMMARY CALCULATION ---
    let totalInterest = 0, totalFine = 0, totalOtherIncome = 0;
    let totalDepositCollection = 0, totalInstallmentCollection = 0;

    filteredPassbook.forEach(e => {
        totalDepositCollection += (e.deposit_amount || 0);
        totalInstallmentCollection += (e.installment_amount || 0);
        totalInterest += (e.interest_amount || 0);
        totalFine += (e.fine_amount || 0);
    });

    // Income from Expenses Ledger (Type = INCOME)
    filteredExpenses.forEach(e => {
        if (e.type === 'INCOME') totalOtherIncome += Number(e.amount);
    });

    // Expenses
    let totalOpsExpense = 0;
    filteredExpenses.forEach(e => {
        if (e.type === 'EXPENSE') totalOpsExpense += Number(e.amount);
    });

    // --- LOAN STATS ---
    const issuedLoans = loans.reduce((acc, l) => acc + (l.amount || 0), 0);
    const pendingLoans = loans.reduce((acc, l) => acc + (l.remaining_balance || 0), 0);
    const recoveredLoans = issuedLoans - pendingLoans; // Simple logic

    // --- DAILY LEDGER GENERATION ---
    // Combine all transactions by date
    const ledgerMap = new Map();

    const addToLedger = (date: string, type: string, amount: number) => {
        if (!ledgerMap.has(date)) {
            ledgerMap.set(date, { date, deposit: 0, emi: 0, loanOut: 0, interest: 0, fine: 0, cashIn: 0, cashOut: 0 });
        }
        const entry = ledgerMap.get(date);
        
        if (type === 'DEPOSIT') { entry.deposit += amount; entry.cashIn += amount; }
        if (type === 'EMI') { entry.emi += amount; entry.cashIn += amount; }
        if (type === 'INTEREST') { entry.interest += amount; entry.cashIn += amount; }
        if (type === 'FINE') { entry.fine += amount; entry.cashIn += amount; }
        if (type === 'LOAN_OUT') { entry.loanOut += amount; entry.cashOut += amount; }
        if (type === 'EXPENSE') { entry.cashOut += amount; } // Add expense to cash out
    };

    filteredPassbook.forEach(e => {
        const dateStr = e.date; // Ensure format YYYY-MM-DD
        if (e.deposit_amount > 0) addToLedger(dateStr, 'DEPOSIT', e.deposit_amount);
        if (e.installment_amount > 0) addToLedger(dateStr, 'EMI', e.installment_amount);
        if (e.interest_amount > 0) addToLedger(dateStr, 'INTEREST', e.interest_amount);
        if (e.fine_amount > 0) addToLedger(dateStr, 'FINE', e.fine_amount);
    });

    // Add Loans Issued to Ledger
    loans.forEach(l => {
        const d = new Date(l.start_date);
        if (d >= start && d <= end) {
            addToLedger(l.start_date, 'LOAN_OUT', l.amount);
        }
    });

    // Sort and Calculate Running Balance
    const sortedLedger = Array.from(ledgerMap.values()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBal = 0;
    const finalLedger = sortedLedger.map((e: any) => {
        const net = e.cashIn - e.cashOut;
        runningBal += net;
        return { ...e, netFlow: net, runningBal };
    });

    // --- CASHBOOK LOGIC ---
    // Categorize by Mode (Cash, Bank, UPI)
    let cashBal = 0, bankBal = 0, upiBal = 0;
    // Simple logic: Assume passbook 'payment_mode' determines bucket
    filteredPassbook.forEach(e => {
        const mode = (e.payment_mode || 'CASH').toUpperCase();
        const total = e.total_amount || 0;
        if (mode.includes('CASH')) cashBal += total;
        if (mode.includes('BANK')) bankBal += total;
        if (mode.includes('UPI') || mode.includes('ONLINE')) upiBal += total;
    });

    // --- MEMBER REPORTS ---
    const memberReports = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.member_id === m.id);
        const dep = mEntries.reduce((acc, e) => acc + (e.deposit_amount || 0), 0);
        const intPaid = mEntries.reduce((acc, e) => acc + (e.interest_amount || 0), 0);
        const finePaid = mEntries.reduce((acc, e) => acc + (e.fine_amount || 0), 0);
        
        // Loans for this member
        const mLoans = loans.filter(l => l.member_id === m.id);
        const loanTaken = mLoans.reduce((acc, l) => acc + (l.amount || 0), 0);
        const loanPending = mLoans.reduce((acc, l) => acc + (l.remaining_balance || 0), 0);
        const principalPaid = loanTaken - loanPending;

        return {
            name: m.name,
            fatherName: m.phone, // Using phone as subtitle
            totalDeposits: dep,
            loanTaken,
            principalPaid,
            interestPaid: intPaid,
            finePaid,
            activeLoanBal: loanPending,
            netWorth: dep - loanPending,
            status: m.status || 'active'
        };
    });

    // --- MATURITY DATA (From Maturity Logic) ---
    const maturityData = members.map(m => {
        const tenure = 36; 
        const monthly = m.monthly_deposit_amount || 0;
        const target = monthly * tenure;
        const projected = target * 0.12;
        const maturityAmt = target + projected;
        const net = maturityAmt - (m.outstanding_loan || 0);
        
        return {
            memberName: m.name,
            joinDate: m.join_date || m.created_at,
            currentDeposit: m.total_deposits || 0,
            targetDeposit: target,
            projectedInterest: projected,
            maturityAmount: maturityAmt,
            outstandingLoan: m.outstanding_loan || 0,
            netPayable: net
        };
    });

    // --- DEFAULTERS ---
    const defaulters = loans
        .filter(l => l.status === 'active' && l.remaining_balance > 0)
        .map(l => ({
            memberId: l.member_id,
            amount: l.amount,
            remainingBalance: l.remaining_balance,
            // Mock logic for days overdue (since we don't have due dates in simple schema yet)
            daysOverdue: Math.floor(Math.random() * 10), 
        }));

    // SET STATE
    setAuditData({
        summary: {
            income: { interest: totalInterest, fine: totalFine, other: totalOtherIncome },
            expenses: { ops: totalOpsExpense, maturity: 0 },
            loans: { issued: issuedLoans, recovered: recoveredLoans, pending: pendingLoans },
            assets: { deposits: totalDepositCollection }
        },
        dailyLedger: finalLedger,
        cashbook: [], // Can implement similarly if needed
        modeStats: { cashBal, bankBal, upiBal },
        loans: loans.map(l => ({ ...l, interestRate: 12 })), // Add static rate for UI
        memberReports,
        maturity: maturityData,
        defaulters
    });

  }, [members, loans, passbookEntries, expenses, startDate, endDate, selectedMember, transactionMode]);

  if (!isMounted) return null;

  // --- UI CONSTANTS & FORMATTERS ---
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const formatCurrency = (value: number) => fmt(value || 0);

  // Totals for UI
  const totalIncome = (auditData.summary.income.interest || 0) + (auditData.summary.income.fine || 0) + (auditData.summary.income.other || 0);
  const totalExpenses = (auditData.summary.expenses.ops || 0);
  const netProfit = totalIncome - totalExpenses;

  // Chart Data
  const graphData = {
    incomeVsExpense: [
      { name: 'Income', value: totalIncome, fill: '#10b981' },
      { name: 'Expense', value: totalExpenses, fill: '#ef4444' }
    ],
    loanTrends: [
      { name: 'Issued', value: auditData.summary.loans.issued },
      { name: 'Recovered', value: auditData.summary.loans.recovered },
      { name: 'Pending', value: auditData.summary.loans.pending }
    ],
    paymentModes: [
        { name: 'Cash', value: auditData.modeStats.cashBal || 0, fill: '#10b981' },
        { name: 'UPI', value: auditData.modeStats.upiBal || 0, fill: '#3b82f6' },
        { name: 'Bank', value: auditData.modeStats.bankBal || 0, fill: '#8b5cf6' },
    ]
  };

  const enhancedDefaulters = auditData.defaulters.map((defaulter: any) => {
    const member = members.find(m => m.id === defaulter.memberId);
    return {
      ...defaulter,
      memberName: member?.name || 'Unknown',
      memberPhone: member?.phone || '',
      status: 'Warning' // Default status
    };
  });

  // --- RENDER ---
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
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="border-b border-border/20 bg-white/80 dark:bg-black/60 backdrop-blur-sm -mx-6 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Members" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Members</SelectItem>
              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 h-auto gap-1 bg-gray-100 p-1 rounded-xl">
          {['Summary', 'Daily', 'Cashbook', 'Passbook', 'Loans', 'Members', 'Maturity', 'Defaulters'].map(t => (
              <TabsTrigger key={t.toLowerCase()} value={t.toLowerCase()} className="text-xs">{t}</TabsTrigger>
          ))}
        </TabsList>

        {/* TAB 1: SUMMARY */}
        <TabsContent value="summary" className="space-y-8 mt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-green-50"><CardHeader><CardTitle className="text-green-800">Total Income</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-700">{formatCurrency(totalIncome)}</div></CardContent></Card>
            <Card className="bg-red-50"><CardHeader><CardTitle className="text-red-800">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-700">{formatCurrency(totalExpenses)}</div></CardContent></Card>
            <Card className="bg-blue-50"><CardHeader><CardTitle className="text-blue-800">Net Profit</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-700">{formatCurrency(netProfit)}</div></CardContent></Card>
            <Card className="bg-purple-50"><CardHeader><CardTitle className="text-purple-800">Active Members</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-purple-700">{members.length}</div></CardContent></Card>
          </div>

          {/* Graphs */}
          <div className="grid gap-6 md:grid-cols-3 h-[300px]">
             <Card className="p-4"><ResponsiveContainer><BarChart data={graphData.incomeVsExpense}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" fill="#8884d8"><Cell fill="#10b981"/><Cell fill="#ef4444"/></Bar></BarChart></ResponsiveContainer></Card>
             <Card className="p-4"><ResponsiveContainer><BarChart data={graphData.loanTrends}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" fill="#3b82f6"/></BarChart></ResponsiveContainer></Card>
             <Card className="p-4"><ResponsiveContainer><PieChart><Pie data={graphData.paymentModes} dataKey="value" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">{graphData.paymentModes.map((e, i) => <Cell key={i} fill={e.fill}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></Card>
          </div>
        </TabsContent>

        {/* TAB 2: DAILY LEDGER */}
        <TabsContent value="daily" className="mt-6">
            <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>IN</TableHead><TableHead>OUT</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader>
            <TableBody>
                {auditData.dailyLedger.map((row: any, i: number) => (
                    <TableRow key={i}>
                        <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="outline">Ledger</Badge></TableCell>
                        <TableCell className="text-green-600">{formatCurrency(row.cashIn)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(row.cashOut)}</TableCell>
                        <TableCell className="font-bold text-blue-600">{formatCurrency(row.runningBal)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table></CardContent></Card>
        </TabsContent>

        {/* TAB 3: PASSBOOK */}
        <TabsContent value="passbook" className="mt-6">
            <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
            <TableBody>
                {passbookEntries.map((e: any) => (
                    <TableRow key={e.id}>
                        <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                        <TableCell>{members.find(m => m.id === e.member_id)?.name}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(e.total_amount)}</TableCell>
                        <TableCell><Badge>{e.payment_mode}</Badge></TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table></CardContent></Card>
        </TabsContent>

        {/* OTHER TABS (Placeholder Logic applied above) */}
        <TabsContent value="members" className="mt-6">
             <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Deposits</TableHead><TableHead>Loan Pending</TableHead><TableHead>Net Worth</TableHead></TableRow></TableHeader>
             <TableBody>
                {auditData.memberReports.map((m: any, i: number) => (
                    <TableRow key={i}>
                        <TableCell>{m.name}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(m.totalDeposits)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(m.activeLoanBal)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(m.netWorth)}</TableCell>
                    </TableRow>
                ))}
             </TableBody></Table></CardContent></Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
