'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

interface DailyLedgerTabProps {
  data: any[];
}

export default function DailyLedgerTab({ data }: DailyLedgerTabProps) {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // ❌ Manual formatCurrency function removed (Hook use ho raha hai)

  return (
    <div className="bg-slate-50 dark:bg-slate-900 mt-6">
      <Card className="rounded-xl border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-200">Daily Ledger - The Operational Audit</CardTitle>
        </CardHeader>
        <CardContent>
          {/* h-[600px] ensures table has a fixed height with scroll */}
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950 shadow-sm z-10 border-b border-gray-200 dark:border-gray-800">
                <TableRow>
                  <TableHead className="w-[100px] text-gray-900 dark:text-gray-300">Date</TableHead>
                  <TableHead className="text-green-600 dark:text-green-400 font-semibold">Deposit</TableHead>
                  <TableHead className="text-green-600 dark:text-green-400 font-semibold">EMI</TableHead>
                  <TableHead className="text-red-600 dark:text-red-400 font-semibold">Loan Out</TableHead>
                  <TableHead className="text-green-600 dark:text-green-400 font-semibold">Interest</TableHead>
                  <TableHead className="text-green-600 dark:text-green-400 font-semibold">Fine</TableHead>
                  <TableHead className="text-green-600 dark:text-green-400 font-bold bg-green-50/30 dark:bg-green-950/30">Cash IN</TableHead>
                  <TableHead className="text-red-600 dark:text-red-400 font-bold bg-red-50/30 dark:bg-red-950/30">Cash OUT</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-300">Net Flow</TableHead>
                  <TableHead className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/30">Running Bal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500 dark:text-gray-500">
                      No records found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((entry: any, i: number) => (
                    <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-800">
                      <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {entry.deposit > 0 ? formatCurrency(entry.deposit) : '-'}
                      </TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {entry.emi > 0 ? formatCurrency(entry.emi) : '-'}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {entry.loanOut > 0 ? formatCurrency(entry.loanOut) : '-'}
                      </TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {entry.interest > 0 ? formatCurrency(entry.interest) : '-'}
                      </TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {entry.fine > 0 ? formatCurrency(entry.fine) : '-'}
                      </TableCell>
                      
                      {/* Summary Columns */}
                      <TableCell className="font-bold text-green-600 dark:text-green-400 bg-green-50/10 dark:bg-green-950/10">
                        {formatCurrency(entry.cashIn)}
                      </TableCell>
                      <TableCell className="font-bold text-red-600 dark:text-red-400 bg-red-50/10 dark:bg-red-950/10">
                        {formatCurrency(entry.cashOut)}
                      </TableCell>
                      
                      <TableCell className={`font-medium ${entry.netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(entry.netFlow)}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-950/10">
                        {formatCurrency(entry.runningBal)}
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
