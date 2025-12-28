'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DailyLedgerTabProps {
  data: any[];
}

export default function DailyLedgerTab({ data }: DailyLedgerTabProps) {
  
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
          <CardTitle>Daily Ledger - The Operational Audit</CardTitle>
        </CardHeader>
        <CardContent>
          {/* h-[600px] ensures the table has a fixed height with scroll */}
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="text-green-600 font-semibold">Deposit</TableHead>
                  <TableHead className="text-green-600 font-semibold">EMI</TableHead>
                  <TableHead className="text-red-600 font-semibold">Loan Out</TableHead>
                  <TableHead className="text-green-600 font-semibold">Interest</TableHead>
                  <TableHead className="text-green-600 font-semibold">Fine</TableHead>
                  <TableHead className="text-green-600 font-bold bg-green-50">Cash IN</TableHead>
                  <TableHead className="text-red-600 font-bold bg-red-50">Cash OUT</TableHead>
                  <TableHead className="font-semibold">Net Flow</TableHead>
                  <TableHead className="text-blue-700 font-bold bg-blue-50">Running Bal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No records found for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((entry: any, i: number) => (
                    <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-700">
                        {new Date(entry.date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {entry.deposit > 0 ? formatCurrency(entry.deposit) : '-'}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {entry.emi > 0 ? formatCurrency(entry.emi) : '-'}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {entry.loanOut > 0 ? formatCurrency(entry.loanOut) : '-'}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {entry.interest > 0 ? formatCurrency(entry.interest) : '-'}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {entry.fine > 0 ? formatCurrency(entry.fine) : '-'}
                      </TableCell>
                      
                      {/* Summary Columns */}
                      <TableCell className="font-bold text-green-700 bg-green-50/50">
                        {formatCurrency(entry.cashIn)}
                      </TableCell>
                      <TableCell className="font-bold text-red-700 bg-red-50/50">
                        {formatCurrency(entry.cashOut)}
                      </TableCell>
                      
                      <TableCell className={`font-medium ${entry.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(entry.netFlow)}
                      </TableCell>
                      
                      <TableCell className="font-bold text-blue-700 bg-blue-50/50">
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
