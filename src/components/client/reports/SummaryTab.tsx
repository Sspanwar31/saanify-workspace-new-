'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

interface SummaryTabProps {
  summary: any;
  activeMembersCount: number;
  graphData: any;
}

export default function SummaryTab({ summary, activeMembersCount, graphData }: SummaryTabProps) {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // ❌ Manual formatCurrency function removed (Hook use ho raha hai)

  return (
    <div className="bg-slate-50 dark:bg-slate-900 space-y-8 mt-6">
      
      {/* 1. TOP CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white dark:bg-gray-900 border-green-900/50 shadow-lg text-gray-900 dark:text-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4"/> Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{formatCurrency(summary.income.total)}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">All income sources</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-red-900/50 shadow-lg text-gray-900 dark:text-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <TrendingDown className="h-4 w-4"/> Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.expenses.total)}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Operating expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-blue-900/50 shadow-lg text-gray-900 dark:text-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4"/> Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(summary.netProfit)}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Income - Expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-purple-900/50 shadow-lg text-gray-900 dark:text-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-600 dark:text-purple-400 flex items-center gap-2">
              <Users className="h-4 w-4"/> Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{activeMembersCount}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current members</p>
          </CardContent>
        </Card>
      </div>
      
      {/* 2. PROFIT & LOSS STATEMENT */}
      <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-md border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Profit & Loss Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* INCOME SIDE */}
            <div className="space-y-4">
              <h4 className="font-semibold text-green-700 dark:text-green-400 border-b border-gray-200 dark:border-gray-700 pb-2 text-lg">INCOME (Credits)</h4>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Interest Income</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(summary.income.interest)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Fine Income</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(summary.income.fine)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Other Fees</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(summary.income.other)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2 text-lg text-green-700 dark:text-green-400">
                <span>Total Income</span>
                <span>{formatCurrency(summary.income.total)}</span>
              </div>
            </div>

            {/* EXPENSE SIDE */}
            <div className="space-y-4">
              <h4 className="font-semibold text-red-700 dark:text-red-400 border-b border-gray-200 dark:border-gray-700 pb-2 text-lg">EXPENSES (Debits)</h4>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Operational Cost</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(summary.expenses.ops)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-300">Maturity Liability</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(summary.expenses.maturityInt)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2 text-lg text-red-700 dark:text-red-400">
                <span>Total Expenses</span>
                <span>{formatCurrency(summary.expenses.total)}</span>
              </div>
            </div>
          </div>
          
          {/* NET PROFIT ROW */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-200">NET PROFIT</span>
            <span className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.netProfit)}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* 3. GRAPHS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 h-[350px]">
         {/* Graph 1: Income vs Expense */}
         <Card className="p-4 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-900 dark:text-gray-100">Income vs Expense</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData.incomeVsExpense}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" /><XAxis dataKey="name" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} itemStyle={{ color: '#e2e8f0' }}/>
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
         <Card className="p-4 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-900 dark:text-gray-100">Loan Portfolio</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData.loanTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" /><XAxis dataKey="name" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} itemStyle={{ color: '#e2e8f0' }}/>
                        <Bar dataKey="value" fill="#3b82f6"/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
         </Card>

         {/* Graph 3: Payment Modes */}
         <Card className="p-4 bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-900 dark:text-gray-100">Payment Modes</CardTitle></CardHeader>
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
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} itemStyle={{ color: '#e2e8f0' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
