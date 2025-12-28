'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MaturityTabProps {
  data: any[]; // Array of maturity projections
}

export default function MaturityTab({ data }: MaturityTabProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="mt-6">
      <Card className="rounded-xl border-orange-100 shadow-sm">
        <CardHeader>
          <CardTitle>Maturity Projections - Fixed Columns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[180px]">Member</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Current Deposit</TableHead>
                  <TableHead>Target Deposit</TableHead>
                  <TableHead>Projected Int.</TableHead>
                  <TableHead>Maturity Amount</TableHead>
                  <TableHead>Outstanding Loan</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No maturity data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((maturity: any, i: number) => (
                    <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {maturity.memberName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(maturity.joinDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(maturity.currentDeposit)}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {formatCurrency(maturity.targetDeposit)}
                      </TableCell>
                      <TableCell className="text-purple-600">
                        {formatCurrency(maturity.projectedInterest)}
                      </TableCell>
                      <TableCell className="text-orange-600 font-semibold">
                        {formatCurrency(maturity.maturityAmount)}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatCurrency(maturity.outstandingLoan)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${maturity.netPayable >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(maturity.netPayable)}
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
