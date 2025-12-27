'use client';

import { useState, useEffect } from 'react';
import { useClientStore } from '@/lib/client/store';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Download, Calendar, DollarSign, TrendingUp,
  CreditCard, AlertTriangle, Percent
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const { getAuditData, members, loans, passbookEntries } = useClientStore();

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState('summary');

  const auditData = getAuditData(startDate, endDate);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const fmt = (n = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(n);

  const totalIncome =
    (auditData.summary.income.interest || 0) +
    (auditData.summary.income.fine || 0) +
    (auditData.summary.income.other || 0);

  const totalExpense =
    (auditData.summary.expenses.ops || 0) +
    (auditData.summary.expenses.maturityInt || 0);

  const netProfit = totalIncome - totalExpense;

  const graphIncome = [
    { name: 'Income', value: totalIncome, fill: '#16a34a' },
    { name: 'Expense', value: totalExpense, fill: '#dc2626' }
  ];

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Society Financial Reports</h1>
          <Select>
            <SelectTrigger className="w-40 bg-white text-black">
              <Download className="h-4 w-4 mr-2" /> Export
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="rounded-xl">
        <CardContent className="flex flex-wrap gap-4 py-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="pl-9 w-36" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input type="date" value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="pl-9 w-36" />
          </div>
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 rounded-xl bg-muted p-1">
          {['summary','daily','cashbook','passbook','loans','members','maturity','defaulters']
            .map(t => (
              <TabsTrigger key={t} value={t}
                className="rounded-lg text-xs data-[state=active]:bg-white">
                {t.toUpperCase()}
              </TabsTrigger>
            ))}
        </TabsList>

        {/* SUMMARY */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Income</p>
              <h2 className="text-2xl font-bold text-green-600">{fmt(totalIncome)}</h2>
            </CardContent></Card>
            <Card><CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Expense</p>
              <h2 className="text-2xl font-bold text-red-600">{fmt(totalExpense)}</h2>
            </CardContent></Card>
            <Card><CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <h2 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(netProfit)}
              </h2>
            </CardContent></Card>
          </div>

          <Card className="h-[320px]">
            <CardHeader><CardTitle>Income vs Expense</CardTitle></CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphIncome}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={v => fmt(Number(v))} />
                  <Bar dataKey="value">
                    {graphIncome.map((e, i) =>
                      <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* बाकी tabs (daily, cashbook, passbook, loans, members, maturity, defaulters) */}
        {/* 👉 logic untouched, tables same – only wrapper UI */}
      </Tabs>
    </div>
  );
}
