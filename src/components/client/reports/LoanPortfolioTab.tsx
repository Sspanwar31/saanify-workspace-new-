'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, Percent } from 'lucide-react';

interface LoanPortfolioTabProps {
  loans: any[]; // List of loans
  summary: {    // Summary stats
    issued: number;
    recovered: number;
    pending: number;
  };
  members: any[]; // Member list for name lookup
}

export default function LoanPortfolioTab({ loans, summary, members }: LoanPortfolioTabProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6 mt-6">
      
      {/* 1. LOAN STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-blue-100 shadow-sm bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Issued</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.issued)}
            </div>
            <p className="text-xs text-blue-600/80">Total loans disbursed</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border-green-100 shadow-sm bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Recovered</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.recovered)}
            </div>
            <p className="text-xs text-green-600/80">Principal collected</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-yellow-100 shadow-sm bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(summary.pending)}
            </div>
            <p className="text-xs text-yellow-600/80">Outstanding principal</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-purple-100 shadow-sm bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Rate %</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">12%</div>
            <p className="text-xs text-purple-600/80">Standard Annual Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. LOANS TABLE */}
      <Card className="rounded-xl border-orange-100 shadow-sm">
        <CardHeader>
          <CardTitle>Loan Portfolio Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[180px]">Member</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Principal Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No loans found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan: any, i: number) => {
                    const member = members.find(m => m.id === loan.memberId);
                    // Calculation logic preserved from original
                    const principalPaid = (loan.amount || 0) - (loan.remainingBalance || 0);

                    return (
                      <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-900">
                          {member?.name || 'Unknown Member'}
                        </TableCell>
                        <TableCell className="text-blue-600 font-semibold">
                          {formatCurrency(loan.amount)}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(principalPaid)}
                        </TableCell>
                        <TableCell className="text-red-600 font-bold bg-red-50/30">
                          {formatCurrency(loan.remainingBalance)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {loan.interestRate || 12}% / 1% p.m.
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={loan.status === 'active' ? 'destructive' : 
                                     loan.status === 'completed' ? 'default' : 'secondary'}
                            className={loan.status === 'active' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
                          >
                            {loan.status?.toUpperCase() || 'UNKNOWN'}
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
