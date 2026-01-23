'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

interface DefaultersTabProps {
  data: any[]; // Array of defaulters with member details
}

export default function DefaultersTab({ data }: DefaultersTabProps) {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // ❌ Manual formatCurrency function removed (Hook use ho raha hai)

  return (
    <div className="mt-6">
      <Card className="rounded-xl border-gray-800 shadow-sm bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Defaulters List (Overdue {'>'} 60 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-950 z-10 shadow-sm border-b border-gray-800">
                <TableRow>
                  <TableHead className="text-gray-300">Member</TableHead>
                  <TableHead className="text-gray-300">Phone</TableHead>
                  <TableHead className="text-gray-300">Loan Amount</TableHead>
                  <TableHead className="text-red-400 font-bold">Balance</TableHead>
                  <TableHead className="text-gray-300">Overdue Days</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-green-400 font-medium">
                        Great news! No defaulters found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((defaulter: any, i: number) => (
                    <TableRow key={i} className="hover:bg-red-950/30 transition-colors border-b border-gray-800">
                      <TableCell className="font-medium text-gray-200">
                        {defaulter.memberName}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {defaulter.memberPhone}
                      </TableCell>
                      <TableCell className="text-blue-400">
                        {formatCurrency(defaulter.amount)}
                      </TableCell>
                      <TableCell className="text-red-400 font-bold bg-red-950/20">
                        {formatCurrency(defaulter.remainingBalance)}
                      </TableCell>
                      <TableCell className="text-orange-400 font-medium">
                        {defaulter.daysOverdue} Days
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={defaulter.status === 'Critical' ? 'destructive' : 'secondary'}
                          className={defaulter.status === 'Critical' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-orange-900/50 text-orange-300 hover:bg-orange-900/80 border border-orange-700'}
                        >
                          {defaulter.status}
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
