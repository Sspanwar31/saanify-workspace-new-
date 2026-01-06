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
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const getNextEMI = (startDate: string) => {
  if (!startDate) return '-';
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + 1); 
  return formatDate(d.toISOString());
};

export function AllLoansTable({ loans }: { loans: any[] }) {
  // State for opening the list modal
  const [viewingMember, setViewingMember] = useState<{name: string, loans: any[]} | null>(null);

  // --- LOGIC: GROUPING & MERGING (Updated to store rawLoans) ---
  const groupedLoans = loans.reduce((acc: any, loan) => {
    const key = loan.memberId; 

    if (!acc[key]) {
      acc[key] = {
        ...loan,
        count: 1, 
        rawLoans: [loan], // ✅ Store individual loans for the modal
        totalAmount: Number(loan.amount),
        totalOutstanding: Number(loan.remainingBalance),
        totalInterestCollected: loan.totalInterestCollected || 0,
        startDate: loan.start_date || loan.created_at
      };
    } else {
      acc[key].count += 1;
      acc[key].rawLoans.push(loan); // ✅ Add to list
      acc[key].totalAmount += Number(loan.amount);
      acc[key].totalOutstanding += Number(loan.remainingBalance);
      
      // Update start date to earliest
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
              <TableHead>Total Loan Amount</TableHead>
              <TableHead>Outstanding Balance</TableHead>
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
                const monthlyInterest = (row.totalOutstanding || 0) * 0.01;
                const isClosed = row.totalOutstanding <= 0;

                return (
                  <TableRow key={row.id} className={isClosed ? "bg-gray-50 opacity-70" : ""}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{row.memberName}</div>
                      {row.count > 1 && (
                        <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                           <Layers className="w-3 h-3"/> {row.count} Loans Merged
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="font-medium">
                      {formatCurrency(row.totalAmount)}
                    </TableCell>
                    
                    <TableCell className={`font-bold ${isClosed ? 'text-green-600' : 'text-red-600'}`}>
                      {isClosed ? 'Cleared' : formatCurrency(row.totalOutstanding)}
                    </TableCell>
                    
                    <TableCell className="text-blue-600">
                      {isClosed ? '-' : formatCurrency(monthlyInterest)}
                    </TableCell>
                    
                    <TableCell className="text-green-700 font-medium bg-green-50 rounded-md">
                      {formatCurrency(row.totalInterestCollected)}
                    </TableCell>
                    
                    <TableCell>{formatDate(row.startDate)}</TableCell>
                    
                    <TableCell>{isClosed ? '-' : getNextEMI(row.startDate)}</TableCell>
                    
                    <TableCell>
                      {isClosed ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Closed</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {/* ✅ Action: View / Manage Button */}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setViewingMember({ name: row.memberName, loans: row.rawLoans })}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View / Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No active loans found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Modal that shows individual loans */}
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
