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
        <Card className="rounded-xl border-green-100 shadow-sm bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.cashBal)}
            </div>
            <p className="text-xs text-green-600/80">Physical cash in hand</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-blue-100 shadow-sm bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Bank Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.bankBal)}
            </div>
            <p className="text-xs text-blue-600/80">Bank accounts total</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-purple-100 shadow-sm bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">UPI Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.upiBal)}
            </div>
            <p className="text-xs text-purple-600/80">Digital wallets</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-orange-100 shadow-sm bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Liquidity</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.cashBal + stats.bankBal + stats.upiBal)}
            </div>
            <p className="text-xs text-orange-600/80">All funds combined</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. CASHBOOK TABLE (TALLY STYLE) */}
      <Card className="rounded-xl border-orange-100 shadow-sm">
        <CardHeader>
          <CardTitle>Cashbook - The Tally View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table className="w-full text-sm border-collapse">
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  {/* Fixed Date Column */}
                  <TableHead className="w-[100px] text-left px-2 border-r">Date</TableHead>
                  
                  {/* Cash Group */}
                  <TableHead className="text-right px-2 text-green-700 bg-green-50/40 border-r w-[12%]">Cash IN</TableHead>
                  <TableHead className="text-right px-2 text-red-700 bg-red-50/40 border-r w-[12%] border-r-2 border-gray-300">Cash OUT</TableHead>
                  
                  {/* Bank Group */}
                  <TableHead className="text-right px-2 text-blue-700 bg-blue-50/40 border-r w-[12%]">Bank IN</TableHead>
                  <TableHead className="text-right px-2 text-red-700 bg-red-50/40 border-r w-[12%] border-r-2 border-gray-300">Bank OUT</TableHead>
                  
                  {/* UPI Group */}
                  <TableHead className="text-right px-2 text-purple-700 bg-purple-50/40 border-r w-[12%">UPI IN</TableHead>
                  <TableHead className="text-right px-2 text-red-700 bg-red-50/40 border-r w-[12%">UPI OUT</TableHead>
                  
                  {/* Closing Balance */}
                  <TableHead className="text-right px-4 font-bold bg-gray-50 text-gray-900 w-[16%]">Closing Bal</TableHead>
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
                    <TableRow key={i} className="hover:bg-gray-50 transition-colors border-b">
                      <TableCell className="font-medium text-gray-700 text-left px-2 border-r">
                        {new Date(entry.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      
                      {/* Cash Column */}
                      <TableCell className="text-right px-2 text-green-600 bg-green-50/10 border-r">
                        {entry.cashIn > 0 ? formatCurrency(entry.cashIn) : '-'}
                      </TableCell>
                      <TableCell className="text-right px-2 text-red-600 bg-red-50/10 border-r border-r-2 border-gray-200">
                        {entry.cashOut > 0 ? formatCurrency(entry.cashOut) : '-'}
                      </TableCell>
                      
                      {/* Bank Column */}
                      <TableCell className="text-right px-2 text-blue-600 bg-blue-50/10 border-r">
                        {entry.bankIn > 0 ? formatCurrency(entry.bankIn) : '-'}
                      </TableCell>
                      <TableCell className="text-right px-2 text-red-600 bg-red-50/10 border-r border-r-2 border-gray-200">
                        {entry.bankOut > 0 ? formatCurrency(entry.bankOut) : '-'}
                      </TableCell>
                      
                      {/* UPI Column */}
                      <TableCell className="text-right px-2 text-purple-600 bg-purple-50/10 border-r">
                        {entry.upiIn > 0 ? formatCurrency(entry.upiIn) : '-'}
                      </TableCell>
                      <TableCell className="text-right px-2 text-red-600 bg-red-50/10 border-r border-r-2 border-gray-200">
                        {entry.upiOut > 0 ? formatCurrency(entry.upiOut) : '-'}
                      </TableCell>
                      
                      <TableCell className="text-right px-4 font-bold text-gray-800 bg-gray-50/50">
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
