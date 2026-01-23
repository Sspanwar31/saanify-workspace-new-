'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

interface CashbookTabProps {
  data: any[]; // Cashbook Array
  stats: {     // Mode Stats
    cashBal: number;
    bankBal: number;
    upiBal: number;
  };
}

export default function CashbookTab({ data, stats }: CashbookTabProps) {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // ❌ Manual formatCurrency function removed (Hook use ho raha hai)

  return (
    <div className="space-y-6 mt-6">
      
      {/* 1. BALANCE CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-green-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-400">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">
              {formatCurrency(stats.cashBal)}
            </div>
            <p className="text-xs text-green-600/80">Physical cash in hand</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-blue-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">Bank Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-300">
              {formatCurrency(stats.bankBal)}
            </div>
            <p className="text-xs text-blue-600/80">Bank accounts total</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-purple-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-400">UPI Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-300">
              {formatCurrency(stats.upiBal)}
            </div>
            <p className="text-xs text-purple-600/80">Digital wallets</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-orange-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-400">Total Liquidity</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">
              {formatCurrency(stats.cashBal + stats.bankBal + stats.upiBal)}
            </div>
            <p className="text-xs text-orange-600/80">All funds combined</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. CASHBOOK TABLE (TALLY STYLE) */}
      <Card className="rounded-xl border-gray-800 shadow-sm bg-gray-900">
        <CardHeader>
          <CardTitle className="text-gray-200">Cashbook - The Tally View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table className="w-full text-sm border-collapse">
              <TableHeader className="sticky top-0 bg-gray-950 z-10 shadow-sm border-b border-gray-800">
                <TableRow>
                  {/* Fixed Date Column */}
                  <TableHead className="w-[100px] text-left px-2 border-r border-gray-700 text-gray-300">Date</TableHead>
                  
                  {/* Cash Group */}
                  <TableHead className="text-right px-2 text-green-400 bg-green-950/30 border-r border-gray-700 w-[12%]">Cash IN</TableHead>
                  <TableHead className="text-right px-2 text-red-400 bg-red-950/30 border-r border-r-2 border-gray-700 w-[12%]">Cash OUT</TableHead>
                  
                  {/* Bank Group */}
                  <TableHead className="text-right px-2 text-blue-400 bg-blue-950/30 border-r border-gray-700 w-[12%]">Bank IN</TableHead>
                  <TableHead className="text-right px-2 text-red-400 bg-red-950/30 border-r border-r-2 border-gray-700 w-[12%]">Bank OUT</TableHead>
                  
                  {/* UPI Group */}
                  <TableHead className="text-right px-2 text-purple-400 bg-purple-950/30 border-r border-gray-700 w-[12%">UPI IN</TableHead>
                  <TableHead className="text-right px-2 text-red-400 bg-red-950/30 border-r border-r-2 border-gray-700 w-[12%">UPI OUT</TableHead>
                  
                  {/* Closing Balance */}
                  <TableHead className="text-right px-4 font-bold bg-gray-950 text-gray-200 w-[16%]">Closing Bal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No transactions recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((entry: any, i: number) => (
                    <TableRow key={i} className="hover:bg-gray-800 transition-colors border-b border-gray-800">
                      <TableCell className="font-medium text-gray-300 text-left px-2 border-r border-gray-700">
                        {new Date(entry.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      
                      {/* Cash Column */}
                      <TableCell className="text-right px-2 text-green-400 bg-green-950/10 border-r border-gray-800">
                        {entry.cashIn > 0 ? formatCurrency(entry.cashIn) : '-'}
                      </TableCell>
                      <TableCell className="text-right px-2 text-red-400 bg-red-950/10 border-r border-r-2 border-gray-700">
                        {entry.cashOut > 0 ? formatCurrency(entry.cashOut) : '-'}
                      </TableCell>
                      
                      {/* Bank Column */}
                      <TableCell className="text-right px-2 text-blue-400 bg-blue-950/10 border-r border-gray-800">
                        {entry.bankIn > 0 ? formatCurrency(entry.bankIn) : '-'}
                      </TableCell>
                      <TableCell className="text-right px-2 text-red-400 bg-red-950/10 border-r border-r-2 border-gray-700">
                        {entry.bankOut > 0 ? formatCurrency(entry.bankOut) : '-'}
                      </TableCell>
                      
                      {/* UPI Column */}
                      <TableCell className="text-right px-2 text-purple-400 bg-purple-950/10 border-r border-gray-800">
                        {entry.upiIn > 0 ? formatCurrency(entry.upiIn) : '-'}
                      </TableCell>
                      <TableCell className="text-right px-2 text-red-400 bg-red-950/10 border-r border-r-2 border-gray-700">
                        {entry.upiOut > 0 ? formatCurrency(entry.upiOut) : '-'}
                      </TableCell>
                      
                      <TableCell className="text-right px-4 font-bold text-gray-200 bg-gray-950/50">
                        {formatCurrency(entry.closing)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
