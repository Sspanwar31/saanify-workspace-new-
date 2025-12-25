'use client';
import { useState } from 'react';
import { useClientStore } from '@/lib/client/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { EditLoanModal } from './EditLoanModal';

export function AllLoansTable() {
  const { loans, deleteLoan, members } = useClientStore();
  const [editingLoan, setEditingLoan] = useState<any>(null);

  // AGGREGATION LOGIC
  const groupedLoans = loans.reduce((acc: any, loan) => {
    if (loan.status !== 'active') return acc;
    
    if (!acc[loan.memberId]) {
      acc[loan.memberId] = { 
        ...loan, 
        count: 1,
        totalInterestEarned: 0 // Initialize tracking if needed
      };
    } else {
      acc[loan.memberId].amount += loan.amount;
      acc[loan.memberId].remainingBalance += loan.remainingBalance;
      acc[loan.memberId].count += 1;
      // Keep earliest start date
      if (new Date(loan.startDate) < new Date(acc[loan.memberId].startDate)) {
        acc[loan.memberId].startDate = loan.startDate;
      }
    }
    return acc;
  }, {});

  const displayLoans = Object.values(groupedLoans);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const getNextEMI = (startDate: string) => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1); // Simple +1 Month Logic
    return formatDate(d.toISOString());
  };

  return (
    <>
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Member</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Outstanding Balance</TableHead>
              <TableHead>Interest (1%)</TableHead>
              <TableHead>Total Interest Earned</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Next EMI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoans.length > 0 ? (
              displayLoans.map((loan: any) => {
                const memberName = members.find(m => m.id === loan.memberId)?.name || "Unknown";
                const monthlyInterest = loan.remainingBalance * 0.01;

                return (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="font-medium">{memberName}</div>
                      <div className="text-xs text-gray-500">
                        {loan.count > 1 ? `${loan.count} Active Loans` : ''}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(loan.amount)}</TableCell>
                    <TableCell className="text-red-600 font-bold">
                      {formatCurrency(loan.remainingBalance)}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      {formatCurrency(monthlyInterest)}
                    </TableCell>
                    <TableCell>₹0.00</TableCell>
                    <TableCell>{formatDate(loan.startDate)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{getNextEMI(loan.startDate)}</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Active</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setEditingLoan(loan)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteLoan(loan.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">No active loans found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* REUSE EDIT MODAL */}
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