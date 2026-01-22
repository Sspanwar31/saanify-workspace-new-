'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

interface MaturityTabProps {
  data: any[]; // Array of maturity projections
}

export default function MaturityTab({ data }: MaturityTabProps) {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // ❌ Manual formatCurrency function removed (Hook use ho raha hai)

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
                    <TableCell colSpan={8} className="text-center py-8">
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
                      <TableCell className="text-green-600">
                        {formatCurrency(maturity.currentDeposit)}
                      </TableCell>
                      <TableCell className="text-green-700">
                        {formatCurrency(maturity.targetDeposit)}
                      </TableCell>
                      <TableCell className="text-purple-600">
                        {formatCurrency(maturity.projectedInterest)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {formatCurrency(maturity.maturityAmount)}
                      </TableCell>
                      <TableCell className="text-red-600">
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
