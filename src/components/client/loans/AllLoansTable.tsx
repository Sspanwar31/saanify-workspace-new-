'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Layers } from 'lucide-react';
import { MemberLoansModal } from './MemberLoansModal';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getNextEMI = (startDate: string) => {
  if (!startDate) return '-';
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + 1); 
  return formatDate(d.toISOString());
};

export function AllLoansTable({ loans }: { loans: any[] }) {
  const [viewingMember, setViewingMember] = useState<{name: string, loans: any[]} | null>(null);

  // --- LOGIC: GROUPING & SUMMING (ROBUST VERSION) ---
  const groupedLoans = loans.reduce((acc: any, loan) => {
    const key = loan.memberId; 
    
    // 1. Force Convert to Number (Safety)
    const amount = parseFloat(loan.amount) || 0;
    const balance = parseFloat(loan.remainingBalance || loan.remaining_balance) || 0;
    const interestCollected = parseFloat(loan.totalInterestCollected) || 0;

    if (!acc[key]) {
      acc[key] = {
        ...loan,
        count: 1, 
        rawLoans: [loan], // Store list
        
        // Initialize Totals
        totalAmountTaken: amount,      
        totalCurrentBalance: balance,  
        totalInterestPaid: interestCollected,
        
        startDate: loan.start_date || loan.created_at
      };
    } else {
      acc[key].count += 1;
      acc[key].rawLoans.push(loan);
      
      // Accumulate Totals
      acc[key].totalAmountTaken += amount;
      acc[key].totalCurrentBalance += balance;
      acc[key].totalInterestPaid += interestCollected;
      
      // Earliest Date Logic
      const currentStart = new Date(acc[key].startDate);
      const newStart = new Date(loan.start_date || loan.created_at);
      if (newStart < currentStart) {
        acc[key].startDate = loan.start_date || loan.created_at;
      }
    }
    return acc;
  }, {});

  const displayRows = Object.values(groupedLoans);

  return (
    <>
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Member</TableHead>
              <TableHead>Total Loan Taken</TableHead>
              <TableHead>Current Outstanding</TableHead>
              <TableHead>Interest (1%)</TableHead>
              <TableHead>Total Interest Earned</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Next EMI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length > 0 ? (
              displayRows.map((row: any) => {
                const monthlyInterest = row.totalCurrentBalance * 0.01;
                // Loan Closed tabhi manenge jab Balance 0 ho
                const isClosed = row.totalCurrentBalance <= 0;

                return (
                  <TableRow key={row.id} className={isClosed ? "bg-gray-50 opacity-70" : ""}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{row.memberName}</div>
                      {row.count > 1 && (
                        <div className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                           <Layers className="w-3 h-3"/> {row.count} Loans Merged
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Total Loan Taken */}
                    <TableCell className="font-medium text-blue-800">
                      {formatCurrency(row.totalAmountTaken)}
                    </TableCell>
                    
                    {/* Current Outstanding */}
                    <TableCell className={`font-bold ${isClosed ? 'text-green-600' : 'text-red-600'}`}>
                      {isClosed ? 'Cleared' : formatCurrency(row.totalCurrentBalance)}
                    </TableCell>
                    
                    <TableCell className="text-blue-600">
                      {isClosed ? '-' : formatCurrency(monthlyInterest)}
                    </TableCell>
                    
                    <TableCell className="text-green-700 font-medium bg-green-50 rounded-md px-2 py-1 w-fit">
                      {formatCurrency(row.totalInterestPaid)}
                    </TableCell>
                    
                    <TableCell>{formatDate(row.startDate)}</TableCell>
                    <TableCell>{isClosed ? '-' : getNextEMI(row.startDate)}</TableCell>
                    
                    <TableCell>
                      <Badge className={isClosed ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                        {isClosed ? 'Closed' : 'Active'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => setViewingMember({ name: row.memberName, loans: row.rawLoans })}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View / Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">No active loans found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {viewingMember && (
        <MemberLoansModal 
          isOpen={!!viewingMember} 
          onClose={() => setViewingMember(null)} 
          memberName={viewingMember.name}
          loans={viewingMember.loans}
        />
      )}
    </>
  );
}
