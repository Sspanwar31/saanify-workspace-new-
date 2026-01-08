'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PassbookTabProps {
  data: any[];
  members: any[];
}

export default function PassbookTab({ data, members }: PassbookTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);

  // ✅ ONLY DELETE LOGIC UPDATED (API CALL)
  const handleDelete = async (entry: any) => {
    if (!confirm('Are you sure? Deleting this will reverse the loan balance immediately.')) return;
    setDeletingId(entry.id);

    try {
      const res = await fetch(`/api/client/passbook?id=${entry.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Delete failed');

      toast.success('Entry deleted & loan synced successfully');
      window.location.reload();
    } catch (e: any) {
      console.error('Delete Error:', e);
      toast.error('Delete Failed: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-6">
      <Card className="rounded-xl border-orange-100 shadow-sm">
        <CardHeader>
          <CardTitle>Passbook Entries</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No entries found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((entry: any, i: number) => {
                    const member = members.find((m) => m.id === entry.memberId);
                    const dateStr = entry.date || entry.created_at;
                    const type =
                      entry.type || (Number(entry.deposit_amount) > 0 ? 'DEPOSIT' : 'LOAN_REPAYMENT');

                    return (
                      <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-700">
                          {dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : '-'}
                        </TableCell>

                        <TableCell className="font-semibold text-gray-800">
                          {member?.name || entry.memberName || 'Unknown'}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={type === 'DEPOSIT' ? 'default' : 'secondary'}
                            className={
                              type === 'DEPOSIT'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {type}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {entry.description || entry.note}
                        </TableCell>

                        <TableCell
                          className={`font-bold ${
                            type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(Math.abs(entry.amount))}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[10px]">
                            {entry.paymentMode || entry.payment_mode || 'CASH'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-blue-600 font-bold bg-blue-50/30">
                          {formatCurrency(entry.balance)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                            onClick={() => handleDelete(entry)}
                            disabled={!!deletingId}
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
