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
      <Card className="rounded-xl border-gray-800 shadow-sm bg-gray-900">
        <CardHeader>
          <CardTitle className="text-gray-200">Maturity Projections - Fixed Columns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-950 z-10 shadow-sm border-b border-gray-800">
                <TableRow>
                  <TableHead className="w-[180px] text-gray-300">Member</TableHead>
                  <TableHead className="text-gray-300">Join Date</TableHead>
                  <TableHead className="text-gray-300">Current Deposit</TableHead>
                  <TableHead className="text-gray-300">Target Deposit</TableHead>
                  <TableHead className="text-gray-300">Projected Int.</TableHead>
                  <TableHead className="text-gray-300">Maturity Amount</TableHead>
                  <TableHead className="text-gray-300">Outstanding Loan</TableHead>
                  <TableHead className="text-right text-gray-300">Net Payable</TableHead>
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
                    <TableRow key={i} className="hover:bg-gray-800 transition-colors border-b border-gray-800">
                      <TableCell className="font-medium text-gray-200">
                        {maturity.memberName}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(maturity.joinDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-green-400">
                        {formatCurrency(maturity.currentDeposit)}
                      </TableCell>
                      <TableCell className="text-green-300">
                        {formatCurrency(maturity.targetDeposit)}
                      </TableCell>
                      <TableCell className="text-purple-400">
                        {formatCurrency(maturity.projectedInterest)}
                      </TableCell>
                      <TableCell className="text-orange-400">
                        {formatCurrency(maturity.maturityAmount)}
                      </TableCell>
                      <TableCell className="text-red-400">
                        {formatCurrency(maturity.outstandingLoan)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${maturity.netPayable >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
