'use client';

import { useState } from 'react';
import { useReportLogic } from '@/hooks/useReportLogic'; // Importing Logic Hook
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Filter, Search, X, Calendar } from 'lucide-react';

// Import Tab Components
import SummaryTab from '@/components/client/reports/SummaryTab';
import DailyLedgerTab from '@/components/client/reports/DailyLedgerTab';
import CashbookTab from '@/components/client/reports/CashbookTab';
import PassbookTab from '@/components/client/reports/PassbookTab';
import LoanPortfolioTab from '@/components/client/reports/LoanPortfolioTab';
import MembersReportTab from '@/components/client/reports/MembersReportTab';
import MaturityTab from '@/components/client/reports/MaturityTab';
import DefaultersTab from '@/components/client/reports/DefaultersTab';

export default function ReportsPage() {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // 1. Get Data & Logic from Custom Hook
  const { 
    loading, 
    auditData, 
    members, 
    passbookEntries, 
    filters, 
    setFilters 
  } = useReportLogic();

  const [activeTab, setActiveTab] = useState('summary');

  // ❌ Manual formatCurrency function removed (Hook use ho raha hai)

  // --- PREPARE DATA & CALCULATE CARD TOTALS ---
  const { summary } = auditData;
  const activeMembersCount = members.filter(m => m.status === 'active').length;

  const graphData = {
    incomeVsExpense: [
      { name: 'Income', value: summary.income?.total || 0, fill: '#10b981' },
      { name: 'Expense', value: summary.expenses?.total || 0, fill: '#ef4444' }
    ],
    loanTrends: [
      { name: 'Issued', value: summary.loans?.issued || 0 },
      { name: 'Recovered', value: summary.loans?.recovered || 0 },
      { name: 'Pending', value: summary.loans?.pending || 0 }
    ],
    paymentModes: [
      { name: 'Cash', value: auditData.modeStats?.cashBal || 0, fill: '#10b981' },
      { name: 'UPI', value: auditData.modeStats?.upiBal || 0, fill: '#3b82f6' },
      { name: 'Bank', value: auditData.modeStats?.bankBal || 0, fill: '#8b5cf6' },
    ]
  };

  // --- TAB SPECIFIC CARD CALCULATIONS --- 
  
  // 1. Daily Ledger Cards
  const dailyTotalIn = auditData.dailyLedger.reduce((acc: number, row: any) => acc + (row.cashIn || 0), 0);
  const dailyTotalOut = auditData.dailyLedger.reduce((acc: number, row: any) => acc + (row.cashOut || 0), 0);
  const dailyNet = dailyTotalIn - dailyTotalOut;

  // 2. Passbook Cards
  const passbookDep = passbookEntries.reduce((acc: any, e: any) => acc + (e.depositAmount || 0), 0);
  const passbookInst = passbookEntries.reduce((acc: any, e: any) => acc + (e.installmentAmount || 0), 0);
  const passbookInt = passbookEntries.reduce((acc: any, e: any) => acc + (e.interestAmount || 0) + (e.fineAmount || 0), 0);

  // 3. Members Cards
  const memTotalDeposits = auditData.memberReports.reduce((acc: any, m: any) => acc + (m.totalDeposits || 0), 0);
  const memTotalLoans = auditData.memberReports.reduce((acc: any, m: any) => acc + (m.activeLoanBal || 0), 0);

  // 4. Maturity Cards
  const matTotalMaturity = auditData.maturity.reduce((acc: any, m: any) => acc + (m.maturityAmount || 0), 0);
  const matTotalLoan = auditData.maturity.reduce((acc: any, m: any) => acc + (m.outstandingLoan || 0), 0);
  const matNetPayable = auditData.maturity.reduce((acc: any, m: any) => acc + (m.netPayable || 0), 0);

  // 5. Defaulters Cards
  // Map defaulters to add status for calculation
  const enhancedDefaulters = (auditData.defaulters || []).map((d: any) => {
    const mem = members.find(m => m.id === d.memberId);
    return { ...d, memberName: mem?.name || 'Unknown', memberPhone: mem?.phone || '', status: d.daysOverdue > 90 ? 'Critical' : 'Overdue' };
  });
  const defTotalAmount = enhancedDefaulters.reduce((acc: any, d: any) => acc + (d.remainingBalance || 0), 0);
  const defCriticalCount = enhancedDefaulters.filter((d: any) => d.status === 'Critical').length;


  // --- EXPORT HANDLER ---
  const handleExport = (format: string) => {
    if (format === 'csv') {
        const headers = ["Date", "Description", "Income", "Expense", "Balance"];
        const rows = auditData.dailyLedger.map((row: any) => [
            row.date, "Daily Summary", row.cashIn, row.cashOut, row.runningBal
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any[]) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${filters.startDate}.csv`);
        document.body.appendChild(link);
        link.click();
    } else if (format === 'print') {
        window.print();
    }
  };

  const resetFilters = () => {
    setFilters(prev => ({
        ...prev,
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        selectedMember: 'ALL',
        transactionMode: 'all',
        transactionNature: 'all' // ✅ CHANGE: Updated reset value
    }));
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading reports data...</div>;

  return (
    <div className="p-8 space-y-8 w-full max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          REPORTS
        </h1>
        <Select onValueChange={handleExport}>
            <SelectTrigger className="w-40 bg-emerald-600 text-white"><div className="flex gap-2"><Download className="h-4 w-4"/><span>Export All</span></div></SelectTrigger>
            <SelectContent><SelectItem value="csv">CSV</SelectItem><SelectItem value="print">Print</SelectItem></SelectContent>
        </Select>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border px-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filters</span>
          </div>

          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
             <Input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="pl-10 w-36" />
          </div>
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
             <Input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="pl-10 w-36" />
          </div>

          <Select value={filters.selectedMember} onValueChange={(v) => setFilters({...filters, selectedMember: v})}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Members" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">All Members</SelectItem>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.transactionMode} onValueChange={(v) => setFilters({...filters, transactionMode: v})}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">Online (UPI)</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
            </SelectContent>
          </Select>

          {/* ✅ CHANGE: Transaction Nature Filter */}
          <Select value={filters.transactionNature} onValueChange={(v) => setFilters({...filters, transactionNature: v})}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Transaction Nature" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="inflow">Inflow (Money In)</SelectItem>
                <SelectItem value="outflow">Outflow (Money Out)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={resetFilters}><X className="h-5 w-5 text-red-500" /></Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="grid w-full grid-cols-8 h-auto gap-1 bg-gray-100 p-1 rounded-xl mb-6">
            {['Summary', 'Daily', 'Cashbook', 'Passbook', 'Loans', 'Members', 'Maturity', 'Defaulters'].map(t => (
                <TabsTrigger key={t.toLowerCase()} value={t.toLowerCase()} className="text-xs font-medium py-2">{t}</TabsTrigger>
            ))}
         </TabsList>

         <TabsContent value="summary">
            <SummaryTab summary={summary} activeMembersCount={activeMembersCount} graphData={graphData} />
         </TabsContent>

         <TabsContent value="daily">
            {/* Added Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Cash IN</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(dailyTotalIn)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Cash OUT</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(dailyTotalOut)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Net Flow</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${dailyNet>=0?'text-blue-600':'text-orange-600'}`}>{formatCurrency(dailyNet)}</div></CardContent></Card>
            </div>
            <DailyLedgerTab data={auditData.dailyLedger} />
         </TabsContent>
         
         <TabsContent value="cashbook">
            <CashbookTab data={auditData.cashbook} stats={auditData.modeStats} />
         </TabsContent>

         <TabsContent value="passbook">
            {/* Added Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Deposits</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(passbookDep)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Installments Rec.</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(passbookInst)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Interest + Fine</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{formatCurrency(passbookInt)}</div></CardContent></Card>
            </div>
            <PassbookTab data={passbookEntries} members={members} />
         </TabsContent>

         <TabsContent value="loans">
            <LoanPortfolioTab loans={auditData.loans} summary={summary.loans} members={members} />
         </TabsContent>

         <TabsContent value="members">
            {/* Added Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Members</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-gray-800">{activeMembersCount}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Deposits</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(memTotalDeposits)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active Loans Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(memTotalLoans)}</div></CardContent></Card>
            </div>
            <MembersReportTab data={auditData.memberReports} />
         </TabsContent>

         <TabsContent value="maturity">
            {/* Added Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Maturity Val</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(matTotalMaturity)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Loans to Deduct</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(matTotalLoan)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Net Payable</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(matNetPayable)}</div></CardContent></Card>
            </div>
            <MaturityTab data={auditData.maturity} />
         </TabsContent>

         <TabsContent value="defaulters">
            {/* Added Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Defaulters</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{enhancedDefaulters.length}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Amount at Risk</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency(defTotalAmount)}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Critical Cases</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-800">{defCriticalCount}</div></CardContent></Card>
            </div>
            <DefaultersTab data={enhancedDefaulters} />
         </TabsContent>
      </Tabs>
    </div>
  );
}
