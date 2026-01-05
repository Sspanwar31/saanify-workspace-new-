'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function MemberPassbook() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPassbook = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase.from('members').select('id').eq('auth_user_id', user.id).single();
      if (member) {
        const { data } = await supabase
            .from('passbook_entries')
            .select('*')
            .eq('member_id', member.id)
            .order('date', { ascending: false });
        setEntries(data || []);
      }
      setLoading(false);
    };
    fetchPassbook();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Passbook</h1>

      <Card>
        <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right text-emerald-600">Deposit</TableHead>
                        <TableHead className="text-right text-blue-600">Installment</TableHead>
                        <TableHead className="text-right text-orange-600">Int + Fine</TableHead>
                        <TableHead className="text-right font-bold">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No transactions found.</TableCell></TableRow>
                    ) : (
                        entries.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell className="font-medium">{new Date(e.date).toLocaleDateString('en-IN')}</TableCell>
                                <TableCell><Badge variant="outline" className="uppercase text-[10px]">{e.payment_mode}</Badge></TableCell>
                                <TableCell className="text-right text-emerald-600 font-medium">
                                    {Number(e.deposit_amount) > 0 ? fmt(e.deposit_amount) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-blue-600 font-medium">
                                    {Number(e.installment_amount) > 0 ? fmt(e.installment_amount) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-orange-600">
                                    {(Number(e.interest_amount) + Number(e.fine_amount)) > 0 
                                      ? fmt(Number(e.interest_amount) + Number(e.fine_amount)) 
                                      : '-'}
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-700">
                                    {fmt(e.total_amount)}
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
