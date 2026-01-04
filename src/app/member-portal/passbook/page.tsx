'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Calendar, Loader2 } from 'lucide-react';

export default function MemberPassbook() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchPassbook = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        // Get Member ID
        const { data: member } = await supabase.from('members').select('id').eq('auth_user_id', user.id).single();
        
        if(member) {
            const { data } = await supabase
                .from('passbook_entries')
                .select('*')
                .eq('member_id', member.id)
                .order('date', { ascending: false }); // Newest First

            if(data) {
                // Calculate Running Balance logic if not stored in DB, or just sum
                // Here assuming simple sum for display
                const total = data.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
                setBalance(total);
                setEntries(data);
            }
        }
        setLoading(false);
    };
    fetchPassbook();
  }, []);

  if(loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline"/> Loading...</div>;

  const filteredEntries = entries.filter(e => {
      if(filter === 'all') return true;
      // Simple logic: Deposit > 0 is Deposit, else Expense/Loan
      if(filter === 'deposit') return Number(e.deposit_amount) > 0;
      if(filter === 'loan') return Number(e.installment_amount) > 0; // Paying Loan
      return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Passbook</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-2xl font-bold text-gray-900">₹{balance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm">Total Balance</p>
              <p className="text-3xl font-bold">₹{balance.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'deposit', 'loan'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={`capitalize ${filter === f ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* List */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center"><p className="text-gray-500">No transactions found</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEntries.map((entry) => {
                const isDeposit = Number(entry.deposit_amount) > 0;
                const amt = isDeposit ? entry.deposit_amount : (Number(entry.installment_amount) + Number(entry.interest_amount));
                
                return (
                <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-full ${isDeposit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isDeposit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{entry.note || (isDeposit ? 'Deposit' : 'Loan Repayment')}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <p className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                          <Badge variant="outline" className="text-xs uppercase">{entry.payment_mode}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isDeposit ? 'text-green-600' : 'text-red-600'}`}>
                        {isDeposit ? '+' : '-'} ₹{Number(amt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
