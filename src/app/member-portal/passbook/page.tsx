'use client';

import { useState } from 'react';
import { useClientStore } from '@/lib/client/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Calendar, Filter } from 'lucide-react';

export default function MemberPassbook() {
  const { currentUser, getMemberPassbook } = useClientStore();
  const memberId = currentUser?.linkedMemberId;
  const [filter, setFilter] = useState<'all' | 'deposit' | 'loan' | 'installment'>('all');
  
  if (!memberId) return null;

  const entries = getMemberPassbook(memberId);
  
  // Filter entries based on selected filter
  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'deposit') return entry.type === 'deposit' || entry.type === 'DEPOSIT';
    if (filter === 'loan') return entry.type === 'loan';
    if (filter === 'installment') return entry.type === 'installment' || entry.type === 'INSTALLMENT';
    return true;
  });

  // Sort by date (newest first)
  const sortedEntries = filteredEntries.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const currentBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Passbook</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-2xl font-bold text-gray-900">₹{currentBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm">Total Balance</p>
              <p className="text-3xl font-bold">₹{currentBalance.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'deposit', label: 'Deposits' },
          { value: 'loan', label: 'Loans' },
          { value: 'installment', label: 'EMIs' }
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value as any)}
            className={`whitespace-nowrap ${filter === f.value ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Transactions List */}
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {sortedEntries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedEntries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-full ${
                        entry.type === 'deposit' || entry.type === 'DEPOSIT' 
                          ? 'bg-green-100 text-green-600' 
                          : entry.type === 'loan'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {entry.type === 'deposit' || entry.type === 'DEPOSIT' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{entry.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                          {entry.paymentMode && (
                            <Badge variant="outline" className="text-xs">
                              {entry.paymentMode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        entry.type === 'deposit' || entry.type === 'DEPOSIT' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {entry.type === 'deposit' || entry.type === 'DEPOSIT' ? '+' : '-'}
                        ₹{entry.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Balance: ₹{entry.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}