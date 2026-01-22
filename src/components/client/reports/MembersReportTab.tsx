

Haan, maine `MembersReportTab.tsx` mein bhi `useCurrency` hook ko integrate kar diya hai. Maine manual `formatCurrency` function ko remove kar diya hai aur jagah-jagah hook wala function use kar liya hai.

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

interface MembersReportTabProps {
  data: any[]; // Array of calculated member reports
}

export default function MembersReportTab({ data }: MembersReportTabProps) {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // ❌ Manual formatCurrency function removed (Hook use ho raha hai)

  return (
    <div className="mt-6">
      <Card className="rounded-xl border-orange-100 shadow-sm">
        <CardHeader>
          <CardTitle>Members Report - Financial Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[180px]">Name</TableHead>
                  <TableHead className="text-green-600 font-semibold">Total Deposit</TableHead>
                  <TableHead className="text-blue-600 font-semibold">Loan Taken</TableHead>
                  <TableHead className="text-purple-600 font-semibold">Principal Paid</TableHead>
                  <TableHead className="text-orange-600 font-semibold">Interest Paid</TableHead>
                  <TableHead className="text-orange-600 font-semibold">Fine Paid</TableHead>
                  <TableHead className="text-orange-600 font-semibold">Pending Loan</TableHead>
                  <TableHead className="text-orange-600 font-bold">Net Worth</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((member: any, i: number) => (
                    <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-gray-900">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.fatherName || 'Self'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 font-medium bg-green-50/30">
                        {formatCurrency(member.totalDeposits)}
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium bg-blue-50/30">
                        {formatCurrency(member.loanTaken)}
                      </TableCell>
                      <TableCell className="text-purple-600 font-medium bg-purple-50/30">
                        {formatCurrency(member.principalPaid)}
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium bg-orange-50/30">
                        {formatCurrency(member.interestPaid)}
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium bg-orange-50/30">
                        {formatCurrency(member.finePaid)}
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium bg-orange-50/30">
                        {formatCurrency(member.activeLoanBal)}
                      </TableCell>
                      <TableCell className={`text-orange-600 font-bold bg-orange-100/50 ${member.netWorth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(member.netWorth)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.status === 'active' ? 'default' : 'secondary'}
                          className={member.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800'}
                        >
                          {member.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  );
}
