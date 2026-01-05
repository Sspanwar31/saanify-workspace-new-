'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { EditLoanModal } from './EditLoanModal';

// Helper to format currency
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

// Helper to format date
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const getNextEMI = (startDate: string) => {
  if (!startDate) return '-';
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + 1); // Next Month
  return formatDate(d.toISOString());
};

export function AllLoansTable({ loans }: { loans: any[] }) {
  const [editingLoan, setEditingLoan] = useState<any>(null);

  // --- LOGIC 1: FILTER (Remove Rejected AND NULL) ---
  // FIXED: Added check for (l.status && ...) to handle null values
  const validLoans = loans.filter(l => l.status && l.status !== 'rejected');

  // --- LOGIC 2: GROUPING & MERGING (Aggregation) ---
  const groupedLoans = validLoans.reduce((acc: any, loan) => {
    const key = `${loan.memberId}-${loan.status}`; // Group by Member + Status (Active/Completed)

    if (!acc[key]) {
      // First entry for this member
      acc[key] = {
        ...loan,
        count: 1, // Loan counter
        totalAmount: loan.amount, // Total Principal
        totalOutstanding: loan.remainingBalance, // Total Remaining
        totalInterestCollected: loan.total_interest_collected || 0, // Total Interest Earned
        // Keep the earliest start date
        startDate: loan.startDate || loan.created_at
      };
    } else {
      // Merge subsequent loans
      acc[key].count += 1;
      acc[key].totalAmount += loan.amount;
      acc[key].totalOutstanding += loan.remainingBalance;
      acc[key].totalInterestCollected += (loan.total_interest_collected || 0);
      
      // Update start date if this loan is older
      const currentStart = new Date(acc[key].startDate);
      const newStart = new Date(loan.startDate || loan.created_at);
      if (newStart < currentStart) {
        acc[key].startDate = loan.startDate;
      }
    }
    return acc;
  }, {});

  const displayRows = Object.values(groupedLoans);

  // --- Handlers ---
  const handleDeleteLoan = async (loanId: string) => {
    if(confirm("Are you sure you want to delete this loan record? This cannot be undone.")) {
        const { error } = await supabase.from('loans').delete().eq('id', loanId);
        if(!error) window.location.reload();
    }
  }

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
                // Auto Calculate Monthly Interest on Outstanding
                const monthlyInterest = (row.totalOutstanding || 0) * 0.01;
                
                // Determine Status Style (Using optional chaining just in case)
                const isClosed = (row.totalOutstanding || 0) <= 0 || row.status === 'completed';

                return (
                  <TableRow key={row.id} className={isClosed ? "bg-gray-50 opacity-70" : ""}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{row.memberName}</div>
                      <div className="text-xs text-blue-600 font-medium">
                        {row.count > 1 ? `${row.count} Loans Merged` : 'Single Loan'}
                      </div>
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
                      <div className="flex gap-2">
                        {/* Only allow edit/delete on active rows to prevent messing up history */}
                        {!isClosed && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => setEditingLoan(row)}>
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteLoan(row.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {isClosed && (
                           <CheckCircle2 className="h-5 w-5 text-green-500 ml-2" />
                        )}
                      </div>
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

      {/* Edit Modal - Only opens for Active loans */}
      {editingLoan && (
        <EditLoanModal 
          isOpen={!!editingLoan} 
          onClose={() => setEditingLoan(null)} 
          loanData={editingLoan} 
        />
      )}
    </>
  );
}
