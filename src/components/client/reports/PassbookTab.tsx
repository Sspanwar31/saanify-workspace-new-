'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PassbookTabProps {
  data: any[];    // passbookEntries array
  members: any[]; // members list for name lookup
}

export default function PassbookTab({ data, members }: PassbookTabProps) {
  
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
          <CardTitle>Passbook Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Fixed height for scroll */}
          <div className="h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No entries found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((entry: any, i: number) => {
                    // Lookup Member Name
                    const member = members.find(m => m.id === entry.memberId);
                    
                    return (
                      <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-700">
                          {new Date(entry.date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-800">
                          {member?.name || 'Unknown Member'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={entry.type === 'DEPOSIT' ? 'default' : 'secondary'}
                            className={entry.type === 'DEPOSIT' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}
                          >
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell className={`font-bold ${entry.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(entry.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                            {entry.paymentMode || 'CASH'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-600 font-bold bg-blue-50/30">
                          {formatCurrency(entry.balance)}
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
