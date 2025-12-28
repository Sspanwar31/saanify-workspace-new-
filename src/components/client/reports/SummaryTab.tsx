'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface SummaryTabProps {
  summary: any;
  activeMembersCount: number;
  graphData: any;
}

export default function SummaryTab({ summary, activeMembersCount, graphData }: SummaryTabProps) {
  
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const formatCurrency = (value: number) => fmt(value || 0);

  return (
    <div className="space-y-8 mt-6">
      
      {/* 1. TOP CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4"/> Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{formatCurrency(summary.income.total)}</div>
            <p className="text-sm text-muted-foreground">All income sources</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <TrendingDown className="h-4 w-4"/> Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{formatCurrency(summary.expenses.total)}</div>
            <p className="text-sm text-muted-foreground">Operating expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4"/> Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{formatCurrency(summary.netProfit)}</div>
            <p className="text-sm text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Users className="h-4 w-4"/> Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{activeMembersCount}</div>
            <p className="text-sm text-muted-foreground">Current members</p>
          </CardContent>
        </Card>
      </div>
      
      {/* 2. PROFIT & LOSS STATEMENT */}
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
                <span className="font-medium">{formatCurrency(summary.expenses.ops)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Maturity Liability</span>
                <span className="font-medium">{formatCurrency(summary.expenses.maturityInt)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 text-lg text-red-700">
                <span>Total Expenses</span>
                <span>{formatCurrency(summary.expenses.total)}</span>
              </div>
            </div>
          </div>
          
          {/* NET PROFIT ROW */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center border">
            <span className="text-xl font-bold text-gray-700">NET PROFIT</span>
            <span className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* 3. GRAPHS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 h-[350px]">
         {/* Graph 1: Income vs Expense */}
         <Card className="p-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Income vs Expense</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData.incomeVsExpense}>
                        <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)}/>
                        <Bar dataKey="value">
                          {graphData.incomeVsExpense.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
         </Card>

         {/* Graph 2: Loan Portfolio */}
         <Card className="p-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Loan Portfolio</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData.loanTrends}>
                        <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)}/>
                        <Bar dataKey="value" fill="#3b82f6"/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
         </Card>

         {/* Graph 3: Payment Modes */}
         <Card className="p-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Payment Modes</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                          data={graphData.paymentModes} 
                          cx="50%" cy="50%" 
                          labelLine={false} 
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
                          outerRadius={80} 
                          fill="#8884d8" 
                          dataKey="value"
                        >
                            {graphData.paymentModes.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill}/>
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)}/>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
