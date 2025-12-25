'use client';

import { useState } from 'react';
import { useClientStore } from '@/lib/client/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoanRequestModal from '@/components/client/LoanRequestModal'; // REUSE EXISTING MODAL

export default function MemberLoans() {
  const { currentUser, loans, loanRequests } = useClientStore();
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const memberId = currentUser?.linkedMemberId;

  // Filter Data
  const myActiveLoan = loans.find(l => l.memberId === memberId && l.status === 'active');
  const myPendingRequest = loanRequests.find(r => r.memberId === memberId && r.status === 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Loans</h1>

      {/* 1. ACTIVE LOAN STATUS */}
      {myActiveLoan ? (
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="text-red-600 bg-red-50">Active Loan</Badge>
              <span className="text-xs text-gray-500">{new Date(myActiveLoan.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-end">
               <div>
                 <p className="text-sm text-gray-500">Remaining Balance</p>
                 <p className="text-3xl font-bold text-gray-900">₹{myActiveLoan.remainingBalance.toLocaleString()}</p>
               </div>
               <div className="text-right">
                 <p className="text-sm text-gray-500">Total Taken</p>
                 <p className="font-medium">₹{myActiveLoan.amount.toLocaleString()}</p>
               </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-green-50 border-green-100">
           <CardContent className="p-6 text-center">
              <p className="text-green-700 font-medium">You have no active loans.</p>
           </CardContent>
        </Card>
      )}

      {/* 2. PENDING REQUEST STATUS */}
      {myPendingRequest && (
        <Card className="bg-yellow-50 border-yellow-200 animate-pulse">
           <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-yellow-800 font-bold">Request Pending</p>
                <p className="text-xs text-yellow-600">₹{myPendingRequest.amount} - Under Review</p>
              </div>
              <Badge className="bg-yellow-200 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
           </CardContent>
        </Card>
      )}

      {/* 3. REQUEST BUTTON (Only if no pending request) */}
      {!myPendingRequest && (
        <Button 
          onClick={() => setIsRequestOpen(true)}
          className="w-full h-12 text-lg bg-gray-900 hover:bg-black rounded-xl shadow-xl"
        >
          Request New Loan
        </Button>
      )}

      {/* REUSED MODAL WITH AUTO-SELECT */}
      <LoanRequestModal 
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        preSelectedMemberId={memberId} // <--- THIS PROP IS KEY
      />
    </div>
  );
}