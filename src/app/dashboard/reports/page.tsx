'use client';

import { useState } from 'react';
import { useReportLogic } from '@/hooks/useReportLogic'; // Make sure this path is correct
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
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
  // 1. Get Data & Logic from Custom Hook
  const { 
    loading, 
    auditData, 
    members, 
    passbookEntries, // Raw UI Mapped Entries
    filters, 
    setFilters 
  } = useReportLogic();

  const [activeTab, setActiveTab] = useState('summary');

  // 2. Prepare Data for UI Components
  const { summary } = auditData;
  const activeMembersCount = members.filter(m => m.status === 'active').length;

  // Graph Data Construction for Summary Tab
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

  // 3. Export Handler
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
        link.setAttribute("download", `report_${filters.startDate}_to_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
    } else if (format === 'print') {
        window.print();
    }
  };

  // 4. Reset Filters
  const resetFilters = () => {
    setFilters(prev => ({
        ...prev,
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        selectedMember: 'ALL',
        transactionMode: 'all',
        transactionType: 'all'
    }));
  };

  return (
    <div className="p-8 space-y-8 w-full max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          REPORTS
        </h1>
        <Select onValueChange={handleExport}>
            <SelectTrigger className="w-40 bg-emerald-600 hover:bg-emerald-700 text-white">
                <div className="flex items-center gap-2"><Download className="h-4 w-4" /><span>Export All</span></div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="csv">Export CSV</SelectItem>
                <SelectItem value="print">Print Report</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* FILTER BAR */}
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
                <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.transactionType} onValueChange={(v) => setFilters({...filters, transactionType: v})}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={resetFilters} className="text-red-500 hover:bg-red-50">
            <X className="h-5 w-5" />
          </Button>
      </div>

      {/* TABS & CONTENT */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading reports data...</div>
      ) : (
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
                <DailyLedgerTab data={auditData.dailyLedger} />
            </TabsContent>
            
            <TabsContent value="cashbook">
                <CashbookTab data={auditData.cashbook} stats={auditData.modeStats} />
            </TabsContent>

            <TabsContent value="passbook">
                <PassbookTab data={passbookEntries} members={members} />
            </TabsContent>

            <TabsContent value="loans">
                <LoanPortfolioTab loans={auditData.loans} summary={summary.loans} members={members} />
            </TabsContent>

            <TabsContent value="members">
                <MembersReportTab data={auditData.memberReports} />
            </TabsContent>

            <TabsContent value="maturity">
                <MaturityTab data={auditData.maturity} />
            </TabsContent>

            <TabsContent value="defaulters">
                <DefaultersTab data={auditData.defaulters} />
            </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
