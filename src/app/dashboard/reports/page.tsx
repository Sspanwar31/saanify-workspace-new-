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
import { Label } from '@/components/ui/label';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, Users, CreditCard, AlertTriangle, Calendar, Filter, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [passbookEntries, setPassbookEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Filter States
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
        expenses: { ops: 0, maturityInt: 0, total: 0 },
        assets: { deposits: 0 },
        loans: { issued: 0, recovered: 0, pending: 0 },
        netProfit: 0
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

  // 1. Fetch All Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
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

  // 2. Logic Engine
  useEffect(() => {
    if (loading || !members.length) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // --- APPLY FILTERS ---
    const filteredPassbook = passbookEntries.filter(e => {
        const d = new Date(e.date);
        const dateMatch = d >= start && d <= end;
        const memberMatch = selectedMember === 'ALL' || e.member_id === selectedMember;
        const modeMatch = transactionMode === 'all' || (e.payment_mode || '').toLowerCase() === transactionMode;
        
        // Transaction Type Filter Logic
        let typeMatch = true;
        if(transactionType === 'deposit') typeMatch = (e.deposit_amount > 0);
        if(transactionType === 'loan') typeMatch = (e.installment_amount > 0); // Loan Repayment
        if(transactionType === 'expense') typeMatch = false; // Passbook entries aren't expenses

        return dateMatch && memberMatch && modeMatch && typeMatch;
    });

    const filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        const dateMatch = d >= start && d <= end;
        // Expenses don't usually have member_id or mode, but we filter Type
        let typeMatch = true;
        if(transactionType === 'deposit' || transactionType === 'loan') typeMatch = false;
        
        return dateMatch && typeMatch;
    });

    // --- CALCULATIONS ---
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

    const totalIncomeCalc = interestIncome + fineIncome + otherIncome;
    const totalExpensesCalc = opsExpense; 
    const netProfitCalc = totalIncomeCalc - totalExpensesCalc;

    // --- LOAN STATS ---
    const loansIssuedTotal = loans.reduce((acc, l) => acc + (l.amount || 0), 0);
    const loansPendingTotal = loans.reduce((acc, l) => acc + (l.remaining_balance || 0), 0);
    const loansRecoveredTotal = loansIssuedTotal - loansPendingTotal;

    // --- DAILY LEDGER & CASHBOOK ---
    const ledgerMap = new Map();
    const getOrSetEntry = (dateStr: string) => {
        if (!ledgerMap.has(dateStr)) {
            ledgerMap.set(dateStr, { 
                date: dateStr, deposit: 0, emi: 0, loanOut: 0, interest: 0, fine: 0, 
                cashIn: 0, cashOut: 0,
                cashInMode: 0, bankInMode: 0, upiInMode: 0,
                cashOutMode: 0, bankOutMode: 0, upiOutMode: 0
            });
        }
        return ledgerMap.get(dateStr);
    };

    filteredPassbook.forEach(e => {
        const entry = getOrSetEntry(e.date);
        const total = (e.deposit_amount||0) + (e.installment_amount||0) + (e.interest_amount||0) + (e.fine_amount||0);
        
        entry.deposit += (e.deposit_amount||0);
        entry.emi += (e.installment_amount||0);
        entry.interest += (e.interest_amount||0);
        entry.fine += (e.fine_amount||0);
        entry.cashIn += total;

        const mode = (e.payment_mode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) entry.cashInMode += total;
        else if (mode.includes('BANK')) entry.bankInMode += total;
        else entry.upiInMode += total;
    });

    filteredExpenses.forEach(e => {
        const entry = getOrSetEntry(e.date);
        const amt = Number(e.amount);
        if (e.type === 'EXPENSE') { 
            entry.cashOut += amt; 
            entry.cashOutMode += amt; 
        } else { 
            entry.cashIn += amt; 
            entry.cashInMode += amt; 
        }
    });

    loans.forEach(l => {
        if (l.start_date >= startDate && l.start_date <= endDate) {
            const entry = getOrSetEntry(l.start_date);
            entry.loanOut += l.amount;
            entry.cashOut += l.amount;
            entry.cashOutMode += l.amount; 
        }
    });

    const sortedLedger = Array.from(ledgerMap.values()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBal = 0;
    const finalLedger = sortedLedger.map((e: any) => {
        const netFlow = e.cashIn - e.cashOut;
        runningBal += netFlow;
        return { ...e, netFlow, runningBal };
    });

    // Cashbook Array Generation
    let closingBal = 0;
    const finalCashbook = sortedLedger.map((e: any) => {
        const dailyNet = (e.cashInMode + e.bankInMode + e.upiInMode) - (e.cashOutMode + e.bankOutMode + e.upiOutMode);
        closingBal += dailyNet;
        return {
            date: e.date,
            cashIn: e.cashInMode, cashOut: e.cashOutMode,
            bankIn: e.bankInMode, bankOut: e.bankOutMode,
            upiIn: e.upiInMode, upiOut: e.upiOutMode,
            closing: closingBal
        };
    });

    // Mode Stats (All Time)
    let cashBalTotal = 0, bankBalTotal = 0, upiBalTotal = 0;
    passbookEntries.forEach(e => {
        const amt = e.total_amount || 0;
        const mode = (e.payment_mode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) cashBalTotal += amt;
        else if (mode.includes('BANK')) bankBalTotal += amt;
        else upiBalTotal += amt;
    });
    const totalOut = expenses.filter(e => e.type === 'EXPENSE').reduce((a,b)=>a+Number(b.amount),0) + loans.reduce((a,b)=>a+Number(b.amount),0);
    cashBalTotal -= totalOut;

    // --- MEMBER REPORTS ---
    const memberReports = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.member_id === m.id);
        const dep = mEntries.reduce((acc, e) => acc + (e.deposit_amount || 0), 0);
        const intPaid = mEntries.reduce((acc, e) => acc + (e.interest_amount || 0), 0);
        const finePaid = mEntries.reduce((acc, e) => acc + (e.fine_amount || 0), 0);
        
        const mLoans = loans.filter(l => l.member_id === m.id);
        const lTaken = mLoans.reduce((acc, l) => acc + (l.amount || 0), 0);
        const lPend = mLoans.reduce((acc, l) => acc + (l.remaining_balance || 0), 0);
        
        return {
            id: m.id, name: m.name, fatherName: m.phone,
            totalDeposits: dep, loanTaken: lTaken, principalPaid: lTaken - lPend,
            interestPaid: intPaid, finePaid: fineP, activeLoanBal: lPend,
            netWorth: dep - lPend, status: m.status || 'active'
        };
    });

    // --- MATURITY DATA ---
    const maturity = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.member_id === m.id && e.deposit_amount > 0);
        let monthly = 0;
        if(mEntries.length > 0) monthly = Number(mEntries[0].deposit_amount); // First deposit logic
        
        const tenure = 36;
        const target = monthly * tenure;
        const projected = target * 0.12;
        const maturityAmt = target + projected;
        const outstanding = m.outstanding_loan || 0;

        return {
            memberName: m.name, joinDate: m.join_date || m.created_at,
            currentDeposit: m.total_deposits || 0, targetDeposit: target,
            projectedInterest: projected, maturityAmount: maturityAmt,
            outstandingLoan: outstanding, netPayable: maturityAmt - outstanding
        };
    });

    // --- DEFAULTERS ---
    const defaulters = loans
        .filter(l => l.status === 'active' && l.remaining_balance > 0)
        .map(l => ({
            memberId: l.member_id, amount: l.amount,
            remainingBalance: l.remaining_balance,
            daysOverdue: Math.floor((new Date().getTime() - new Date(l.start_date).getTime()) / (1000 * 3600 * 24))
        }));

    // Update State
    setAuditData({
        summary: {
            income: { interest: interestIncome, fine: fineIncome, other: otherIncome, total: totalIncomeCalc },
            expenses: { ops: opsExpense, maturityInt: 0, total: totalExpensesCalc },
            assets: { deposits: depositTotal },
            loans: { issued: loansIssuedTotal, recovered: loansRecoveredTotal, pending: loansPendingTotal },
            netProfit: netProfitCalc
        },
        dailyLedger: finalLedger,
        cashbook: finalCashbook,
        modeStats: { cashBal: cashBalTotal, bankBal: bankBalTotal, upiBal: upiBalTotal },
        loans: loans.map(l => ({ ...l, interestRate: 12, memberId: l.member_id })),
        memberReports, maturity, defaulters
    });

  }, [members, loans, passbookEntries, expenses, startDate, endDate, selectedMember, transactionMode, transactionType, loading]);

  // --- EXPORT HANDLER ---
  const handleExport = (format: string) => {
    if (format === 'csv') {
        const headers = ["Date", "Description", "Income", "Expense", "Balance"];
        const rows = auditData.dailyLedger.map((row: any) => [
            row.date,
            "Daily Summary",
            row.cashIn,
            row.cashOut,
            row.runningBal
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any[]) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
    } else if (format === 'print') {
        window.print();
    }
  };

  if (!isMounted) return null;

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const formatCurrency = (value: number) => fmt(value || 0);

  const { summary } = auditData;
  const activeMembersCount = members.filter(m => m.status === 'active').length;

  const graphData = {
    incomeVsExpense: [
      { name: 'Income', value: summary.income.total, fill: '#10b981' },
      { name: 'Expense', value: summary.expenses.total, fill: '#ef4444' }
    ],
    loanTrends: [
      { name: 'Issued', value: summary.loans.issued },
      { name: 'Recovered', value: summary.loans.recovered },
      { name: 'Pending', value: summary.loans.pending }
    ],
    paymentModes: [
      { name: 'Cash', value: auditData.modeStats.cashBal, fill: '#10b981' },
      { name: 'UPI', value: auditData.modeStats.upiBal, fill: '#3b82f6' },
      { name: 'Bank', value: auditData.modeStats.bankBal, fill: '#8b5cf6' },
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
      {/* Header */}
      <div className="border-b border-border/40 bg-white/60 dark:bg-black/40 backdrop-blur-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            REPORTS
          </h1>
          <div className="flex gap-2">
            <Select onValueChange={handleExport}>
              <SelectTrigger className="w-40 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export All</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export CSV</SelectItem>
                <SelectItem value="print">Print Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
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
          <Select value={transactionMode} onValueChange={setTransactionMode}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Transaction Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={transactionType} onValueChange={setTransactionType}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="loan">Loan</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 h-auto gap-1 bg-gray-100 p-1 rounded-xl">
          {['Summary', 'Daily', 'Cashbook', 'Passbook', 'Loans', 'Members', 'Maturity', 'Defaulters'].map(t => (
              <TabsTrigger key={t.toLowerCase()} value={t.toLowerCase()} className="text-xs">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="space-y-8 mt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-green-50 border-green-200"><CardHeader className="pb-2"><CardTitle className="text-green-800">Total Income</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-700">{formatCurrency(summary.income.total)}</div><p className="text-sm text-muted-foreground">All income sources</p></CardContent></Card>
            <Card className="bg-red-50 border-red-200"><CardHeader className="pb-2"><CardTitle className="text-red-800">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-700">{formatCurrency(summary.expenses.total)}</div><p className="text-sm text-muted-foreground">Operating expenses</p></CardContent></Card>
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
                  <div className="flex justify-between py-2"><span className="text-gray-600">Operational Cost</span><span className="font-medium">{formatCurrency(summary.expenses.ops)}</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-600">Maturity Liability</span><span className="font-medium">{formatCurrency(summary.expenses.maturityInt)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2 text-lg text-red-700"><span>Total Expenses</span><span>{formatCurrency(summary.expenses.total)}</span></div>
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

        <TabsContent value="daily" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Daily Ledger</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Date</TableHead><TableHead className="text-green-600">Deposit</TableHead><TableHead className="text-green-600">EMI</TableHead><TableHead className="text-red-600">Loan Out</TableHead><TableHead className="text-green-600">Interest</TableHead><TableHead className="text-green-600">Fine</TableHead><TableHead className="text-green-600">Cash IN</TableHead><TableHead className="text-red-600">Cash OUT</TableHead><TableHead>Net Flow</TableHead><TableHead>Running Bal</TableHead></TableRow></TableHeader><TableBody>{auditData.dailyLedger.map((entry: any, i: number) => (<TableRow key={i}><TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.deposit)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.emi)}</TableCell><TableCell className="text-red-600">{formatCurrency(entry.loanOut)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.interest)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.fine)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.cashIn)}</TableCell><TableCell className="text-red-600">{formatCurrency(entry.cashOut)}</TableCell><TableCell className={entry.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(entry.netFlow)}</TableCell><TableCell className="text-blue-600 font-medium">{formatCurrency(entry.runningBal)}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="cashbook" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-xl border-green-100 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cash Balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(auditData.modeStats.cashBal)}</div></CardContent></Card>
            <Card className="rounded-xl border-blue-100 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Bank Balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(auditData.modeStats.bankBal)}</div></CardContent></Card>
            <Card className="rounded-xl border-purple-100 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">UPI Balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{formatCurrency(auditData.modeStats.upiBal)}</div></CardContent></Card>
            <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Liquidity</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(auditData.modeStats.cashBal + auditData.modeStats.bankBal + auditData.modeStats.upiBal)}</div></CardContent></Card>
          </div>
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Cashbook Details</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Date</TableHead><TableHead className="text-green-600">Cash IN</TableHead><TableHead className="text-red-600">Cash OUT</TableHead><TableHead className="text-green-600">Bank IN</TableHead><TableHead className="text-red-600">Bank OUT</TableHead><TableHead className="text-green-600">UPI IN</TableHead><TableHead className="text-red-600">UPI OUT</TableHead><TableHead>Closing Bal</TableHead></TableRow></TableHeader><TableBody>{auditData.cashbook.map((entry: any, i: number) => (<TableRow key={i}><TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.cashIn)}</TableCell><TableCell className="text-red-600">{formatCurrency(entry.cashOut)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.bankIn)}</TableCell><TableCell className="text-red-600">{formatCurrency(entry.bankOut)}</TableCell><TableCell className="text-green-600">{formatCurrency(entry.upiIn)}</TableCell><TableCell className="text-red-600">{formatCurrency(entry.upiOut)}</TableCell><TableCell className="text-blue-600 font-medium">{formatCurrency(entry.closing)}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="passbook" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Passbook Entries</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Payment Mode</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader><TableBody>{passbookEntries.map((entry: any, i: number) => (<TableRow key={i}><TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell><TableCell>{members.find(m => m.id === entry.member_id)?.name}</TableCell><TableCell><Badge variant={entry.deposit_amount > 0 ? 'default' : 'secondary'}>{entry.deposit_amount > 0 ? 'DEPOSIT' : 'PAYMENT'}</Badge></TableCell><TableCell>{entry.note || 'Entry'}</TableCell><TableCell className={entry.deposit_amount > 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(entry.total_amount)}</TableCell><TableCell>{entry.payment_mode}</TableCell><TableCell className="text-blue-600 font-medium">{formatCurrency(entry.total_amount)}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="loans" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Loan Portfolio</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Member</TableHead><TableHead>Loan Amount</TableHead><TableHead>Principal Paid</TableHead><TableHead>Balance</TableHead><TableHead>Interest Rate</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{auditData.loans.map((loan: any, i: number) => {const member = members.find(m => m.id === loan.memberId); return (<TableRow key={i}><TableCell>{member?.name || 'Unknown'}</TableCell><TableCell className="text-blue-600">{formatCurrency(loan.amount)}</TableCell><TableCell className="text-green-600">{formatCurrency(loan.amount - loan.remaining_balance)}</TableCell><TableCell className="text-red-600 font-medium">{formatCurrency(loan.remaining_balance)}</TableCell><TableCell>{loan.interestRate}%</TableCell><TableCell><Badge variant={loan.status === 'active' ? 'destructive' : loan.status === 'completed' ? 'default' : 'secondary'}>{loan.status}</Badge></TableCell></TableRow>)})}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Members Report</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Name</TableHead><TableHead>Total Deposit</TableHead><TableHead>Loan Taken</TableHead><TableHead>Principal Paid</TableHead><TableHead>Interest Paid</TableHead><TableHead>Fine Paid</TableHead><TableHead>Pending Loan</TableHead><TableHead>Net Worth</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{auditData.memberReports.map((member: any, i: number) => (<TableRow key={i}><TableCell className="font-medium"><div><div className="font-semibold">{member.name}</div><div className="text-xs text-muted-foreground">{member.fatherName}</div></div></TableCell><TableCell className="text-green-600 font-medium">{formatCurrency(member.totalDeposits)}</TableCell><TableCell className="text-blue-600 font-medium">{formatCurrency(member.loanTaken)}</TableCell><TableCell className="text-purple-600 font-medium">{formatCurrency(member.principalPaid)}</TableCell><TableCell className="text-orange-600 font-medium">{formatCurrency(member.interestPaid)}</TableCell><TableCell className="text-red-600 font-medium">{formatCurrency(member.finePaid)}</TableCell><TableCell className="text-orange-600 font-medium">{formatCurrency(member.activeLoanBal)}</TableCell><TableCell className={`font-bold ${member.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(member.netWorth)}</TableCell><TableCell><Badge variant={member.status === 'active' ? 'default' : 'secondary'}>{member.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="maturity" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Maturity Projections</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Member</TableHead><TableHead>Join Date</TableHead><TableHead>Current Deposit</TableHead><TableHead>Target Deposit</TableHead><TableHead>Projected Int.</TableHead><TableHead>Maturity Amount</TableHead><TableHead>Outstanding Loan</TableHead><TableHead>Net Payable</TableHead></TableRow></TableHeader><TableBody>{auditData.maturity.map((maturity: any, i: number) => (<TableRow key={i}><TableCell className="font-medium">{maturity.memberName}</TableCell><TableCell>{new Date(maturity.joinDate).toLocaleDateString()}</TableCell><TableCell className="text-green-600">{formatCurrency(maturity.currentDeposit)}</TableCell><TableCell className="text-blue-600">{formatCurrency(maturity.targetDeposit)}</TableCell><TableCell className="text-purple-600">{formatCurrency(maturity.projectedInterest)}</TableCell><TableCell className="text-orange-600 font-medium">{formatCurrency(maturity.maturityAmount)}</TableCell><TableCell className="text-red-600">{formatCurrency(maturity.outstandingLoan)}</TableCell><TableCell className={`font-medium ${maturity.netPayable >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(maturity.netPayable)}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="defaulters" className="mt-6">
          <Card className="rounded-xl border-orange-100 shadow-sm"><CardHeader><CardTitle>Defaulters List</CardTitle></CardHeader><CardContent><div className="max-h-96 overflow-y-auto"><Table><TableHeader className="sticky top-0 bg-white"><TableRow><TableHead>Member</TableHead><TableHead>Phone</TableHead><TableHead>Loan Amount</TableHead><TableHead>Balance</TableHead><TableHead>Overdue Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{enhancedDefaulters.map((defaulter: any, i: number) => (<TableRow key={i}><TableCell className="font-medium">{defaulter.memberName}</TableCell><TableCell>{defaulter.memberPhone}</TableCell><TableCell className="text-blue-600">{formatCurrency(defaulter.amount)}</TableCell><TableCell className="text-red-600 font-medium">{formatCurrency(defaulter.remainingBalance)}</TableCell><TableCell className="text-orange-600">{defaulter.daysOverdue}</TableCell><TableCell><Badge variant={defaulter.status === 'Critical' ? 'destructive' : defaulter.status === 'Warning' ? 'secondary' : 'outline'}>{defaulter.status}</Badge></TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
