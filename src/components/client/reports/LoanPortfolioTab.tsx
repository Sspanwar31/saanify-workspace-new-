'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, Percent } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency'; 

interface LoanPortfolioTabProps {
  loans: any[]; 
  summary: {    
    issued: number;
    recovered: number;
    pending: number;
  };
  members: any[]; 
}

export default function LoanPortfolioTab({ loans, summary, members }: LoanPortfolioTabProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="space-y-6 mt-6">
      
      {/* 1. LOAN STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-blue-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-400">Issued</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-300">
              {formatCurrency(summary.issued)}
            </div>
            <p className="text-xs text-blue-600/80">Total loans disbursed</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border-green-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-400">Recovered</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-300">
              {formatCurrency(summary.recovered)}
            </div>
            <p className="text-xs text-green-600/80">Principal collected</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-yellow-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-400">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">
              {formatCurrency(summary.pending)}
            </div>
            <p className="text-xs text-yellow-600/80">Outstanding principal</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-purple-900/50 shadow-sm bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-400">Rate %</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-300">12%</div>
            <p className="text-xs text-purple-600/80">Standard Annual Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. LOANS TABLE */}
      <Card className="rounded-xl border-gray-800 shadow-sm bg-gray-900">
        <CardHeader>
          <CardTitle className="text-gray-200">Loan Portfolio Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-950 z-10 shadow-sm border-b border-gray-800">
                <TableRow>
                  {/* ✅ Fixed Sequence: Date Added Here */}
                  <TableHead className="w-[100px] text-gray-300">Start Date</TableHead>
                  <TableHead className="w-[180px] text-gray-300">Member</TableHead>
                  <TableHead className="text-gray-300">Loan Amount</TableHead>
                  <TableHead className="text-gray-300">Principal Paid</TableHead>
                  <TableHead className="text-gray-300">Balance</TableHead>
                  <TableHead className="text-gray-300">Interest Amount</TableHead>
                  <TableHead className="text-right text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No loans found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan: any, i: number) => {
                    const member = members.find(m => m.id === loan.memberId);
                    const principalPaid = (loan.amount || 0) - (loan.remainingBalance || 0);

                    return (
                      <TableRow key={i} className="hover:bg-gray-800 transition-colors border-b border-gray-800">
                        {/* ✅ Added Date Cell */}
                        <TableCell className="text-gray-400 font-medium">
                            {new Date(loan.start_date || loan.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-gray-200">
                          {member?.name || 'Unknown Member'}
                        </TableCell>
                        <TableCell className="text-blue-400 font-semibold">
                          {formatCurrency(loan.amount)}
                        </TableCell>
                        <TableCell className="text-green-400 font-medium">
                          {formatCurrency(principalPaid)}
                        </TableCell>
                        <TableCell className="text-red-400 font-bold bg-red-950/20">
                          {formatCurrency(loan.remainingBalance)}
                        </TableCell>
                        
                        <TableCell className="text-purple-400 font-medium">
                           {formatCurrency(loan.interestRate)}
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <Badge 
                            variant={loan.status === 'ACTIVE' ? 'destructive' : 
                                             loan.status === 'COMPLETED' ? 'default' : 'secondary'}
                            className={loan.status === 'ACTIVE' ? 'bg-red-600 text-white hover:bg-red-700' : 
                                       loan.status === 'COMPLETED' ? 'bg-green-900/50 text-green-300 hover:bg-green-900/80 border border-green-700' : 
                                       'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
