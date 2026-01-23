'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Layers } from 'lucide-react';
import { MemberLoansModal } from './MemberLoansModal';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

// ❌ Manual formatCurrency function removed (Hook use ho raha hai)

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
  
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  const [viewingMember, setViewingMember] = useState<{name: string, loans: any[]} | null>(null);

  // --- LOGIC: GROUPING & SUMMING (FIXED FOR INTEREST) ---
  const groupedLoans = loans.reduce((acc: any, loan) => {
    const key = loan.memberId; 
    
    // Data Cleaning
    let rawAmount = loan.amount;
    let rawBalance = loan.remaining_balance !== undefined ? loan.remaining_balance : loan.remainingBalance;
    
    const amount = Number(rawAmount) || 0;
    const balance = Number(rawBalance) || 0;
    const interestCollected = Number(loan.totalInterestCollected || 0);

    if (!acc[key]) {
      // First entry initialization
      acc[key] = {
        ...loan, 
        count: 1, 
        rawLoans: [loan],
        
        // Initialize Totals
        totalAmountTaken: amount,      
        totalCurrentBalance: balance,  
        totalInterestPaid: interestCollected, // ✅ Set Initial Value
        
        startDate: loan.start_date || loan.created_at
      };
    } else {
      // Subsequent entries aggregation
      acc[key].count += 1;
      acc[key].rawLoans.push(loan);
      
      // ✅ SUMMING Only Loan Amounts
      acc[key].totalAmountTaken += amount;
      acc[key].totalCurrentBalance += balance;
      
      // 🛑 FIX (Diff-2 Verified): Interest ko yahan wapas nahi jodna hai.
      
      // Date Logic
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
      <div className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
              <TableHead className="dark:text-gray-300">Member</TableHead>
              <TableHead className="dark:text-gray-300">Total Loan Taken</TableHead>
              <TableHead className="dark:text-gray-300">Current Outstanding</TableHead>
              <TableHead className="dark:text-gray-300">Interest (1%)</TableHead>
              {/* ✅ DIFF-1: Label Updated */}
              <TableHead className="dark:text-gray-300">Interest Collected Till Date</TableHead>
              <TableHead className="dark:text-gray-300">Start Date</TableHead>
              <TableHead className="dark:text-gray-300">Next EMI</TableHead>
              <TableHead className="dark:text-gray-300">Status</TableHead>
              <TableHead className="dark:text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length > 0 ? (
              displayRows.map((row: any) => {
                const monthlyInterest = row.totalCurrentBalance * 0.01;
                const isClosed = row.totalCurrentBalance <= 0;

                return (
                  <TableRow key={row.id} className={`${isClosed ? "bg-gray-50 dark:bg-slate-800 opacity-70" : "hover:bg-slate-50 dark:hover:bg-slate-800"} dark:border-slate-700`}>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">{row.memberName}</div>
                      {row.count > 1 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1">
                           <Layers className="w-3 h-3"/> {row.count} Loans Merged
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="font-medium text-blue-800 dark:text-blue-300">
                      {formatCurrency(row.totalAmountTaken)}
                    </TableCell>
                    
                    <TableCell className={`font-bold ${isClosed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isClosed ? 'Cleared' : formatCurrency(row.totalCurrentBalance)}
                    </TableCell>
                    
                    <TableCell className="text-blue-600 dark:text-blue-400">
                      {isClosed ? '-' : formatCurrency(monthlyInterest)}
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-green-700 dark:text-green-300 font-medium bg-green-50 dark:bg-green-900/30 rounded-md px-2 py-1 w-fit">
                        {formatCurrency(row.totalInterestPaid)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="dark:text-gray-300">{formatDate(row.startDate)}</TableCell>
                    <TableCell className="dark:text-gray-300">{isClosed ? '-' : getNextEMI(row.startDate)}</TableCell>
                    
                    <TableCell>
                      <Badge className={isClosed ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"}>
                        {isClosed ? 'Closed' : 'Active'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        onClick={() => setViewingMember({ name: row.memberName, loans: row.rawLoans })}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View / Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">No active loans found</TableCell></TableRow>
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
