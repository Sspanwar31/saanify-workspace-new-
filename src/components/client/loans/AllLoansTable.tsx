'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { EditLoanModal } from './EditLoanModal';
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
const [editingLoan, setEditingLoan] = useState<any>(null);
// --- LOGIC: GROUPING & MERGING ---
const groupedLoans = loans.reduce((acc: any, loan) => {
const key = loan.memberId;
code
Code
if (!acc[key]) {
  acc[key] = {
    ...loan,
    count: 1, 
    totalAmount: loan.amount,
    totalOutstanding: loan.remainingBalance, 
    totalInterestCollected: loan.totalInterestCollected || 0, // Initial Value
    startDate: loan.startDate || loan.created_at
  };
} else {
  acc[key].count += 1;
  acc[key].totalAmount += loan.amount;
  // Note: totalOutstanding aur totalInterestCollected Parent se Member level par aa rahe hain.
  // Isliye unhe bar-bar add (+=) nahi karna hai, bas latest value rakhni hai.
  
  const currentStart = new Date(acc[key].startDate);
  const newStart = new Date(loan.startDate || loan.created_at);
  if (newStart < currentStart) {
    acc[key].startDate = loan.startDate;
  }
}
return acc;
}, {});
const displayRows = Object.values(groupedLoans);
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
const monthlyInterest = (row.totalOutstanding || 0) * 0.01;
const isClosed = row.totalOutstanding <= 0;
code
Code
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
                  {/* Only Interest, No Fine */}
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
