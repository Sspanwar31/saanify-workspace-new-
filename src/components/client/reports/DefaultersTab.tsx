'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface DefaultersTabProps {
  data: any[]; // Array of defaulters with member details
}

export default function DefaultersTab({ data }: DefaultersTabProps) {
  
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
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Defaulters List (Overdue {'>'} 60 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead className="text-red-600 font-bold">Balance</TableHead>
                  <TableHead>Overdue Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-green-600 font-medium">
                      Great news! No defaulters found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((defaulter: any, i: number) => (
                    <TableRow key={i} className="hover:bg-red-50/30 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {defaulter.memberName}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {defaulter.memberPhone}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {formatCurrency(defaulter.amount)}
                      </TableCell>
                      <TableCell className="text-red-600 font-bold bg-red-50/50">
                        {formatCurrency(defaulter.remainingBalance)}
                      </TableCell>
                      <TableCell className="text-orange-700 font-medium">
                        {defaulter.daysOverdue} Days
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={defaulter.status === 'Critical' ? 'destructive' : 'secondary'}
                          className={defaulter.status === 'Critical' ? 'bg-red-600' : 'bg-orange-100 text-orange-800'}
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
