'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PassbookTransaction } from '@/data/passbookMock';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, Target } from 'lucide-react';

interface PassbookSummaryPanelProps {
  transactions: PassbookTransaction[];
  currentBalance: number;
}

export default function PassbookSummaryPanel({ 
  transactions, 
  currentBalance 
}: PassbookSummaryPanelProps) {
  const totalCredits = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const netChange = totalCredits - totalDebits;
  
  const recentTransactions = transactions.slice(0, 5);
  
  const categoryBreakdown = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { credit: 0, debit: 0, count: 0 };
    }
    if (transaction.type === 'CREDIT') {
      acc[transaction.category].credit += transaction.amount;
    } else {
      acc[transaction.category].debit += transaction.amount;
    }
    acc[transaction.category].count++;
    return acc;
  }, {} as Record<string, { credit: number; debit: number; count: number }>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Math.abs(amount));
  };

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            {netChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              netChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {netChange >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netChange))}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCredits > totalDebits ? 'Positive cash flow' : 'Negative cash flow'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              {recentTransactions.length} recent activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                transactions.length > 0 
                  ? (totalCredits + totalDebits) / transactions.length 
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(categoryBreakdown).length}</div>
            <p className="text-xs text-muted-foreground">
              Different transaction types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCategories.map(([category, data], index) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{category}</p>
                    <p className="text-sm text-muted-foreground">{data.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(data.credit + data.debit)}</p>
                  <div className="flex gap-2 justify-end">
                    {data.credit > 0 && (
                      <Badge variant="default" className="text-xs">
                        +{formatCurrency(data.credit)}
                      </Badge>
                    )}
                    {data.debit > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        -{formatCurrency(data.debit)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {transaction.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}