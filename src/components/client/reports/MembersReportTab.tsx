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
    <div className="bg-slate-50 dark:bg-slate-900 space-y-6 mt-6">
      <Card className="rounded-xl border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            Members Report - Financial Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 z-10 shadow-sm border-b border-gray-200 dark:border-gray-800">
                <TableRow>
                  <TableHead className="w-[180px] text-gray-900 dark:text-gray-300">Name</TableHead>
                  <TableHead className="text-green-600 dark:text-green-400 font-semibold">Total Deposit</TableHead>
                  <TableHead className="text-blue-600 dark:text-blue-400 font-semibold">Loan Taken</TableHead>
                  <TableHead className="text-purple-600 dark:text-purple-400 font-semibold">Principal Paid</TableHead>
                  <TableHead className="text-orange-600 dark:text-orange-400 font-semibold">Interest Paid</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-300">Active Loan Bal</TableHead>
                  <TableHead className="font-bold text-gray-900 dark:text-gray-300">Net Worth</TableHead>
                  <TableHead className="w-[100px] text-gray-900 dark:text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-500">
                      No members found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((member) => (
                    <TableRow key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-800">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-200">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-200">{member.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{member.fatherName || 'Self'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 dark:text-green-400 font-medium bg-green-50/30 dark:bg-green-950/20">
                        {formatCurrency(member.totalDeposits)}
                      </TableCell>
                      <TableCell className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50/30 dark:bg-blue-950/20">
                        {formatCurrency(member.loanTaken)}
                      </TableCell>
                      <TableCell className="text-purple-600 dark:text-purple-400 font-medium">
                        {formatCurrency(member.principalPaid)}
                      </TableCell>
                      <TableCell className="text-orange-600 dark:text-orange-400 font-medium">
                        {formatCurrency(member.interestPaid)}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400 font-bold bg-red-50/30 dark:bg-red-950/20">
                        {formatCurrency(member.activeLoanBal)}
                      </TableCell>
                      <TableCell className={`font-bold ${member.netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(member.netWorth)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80 border-green-200 dark:border-green-700' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}
                        >
                          {member.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
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
