'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PassbookTransaction } from '@/data/passbookMock';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';

interface PassbookTableProps {
  transactions: PassbookTransaction[];
  onEdit?: (transaction: PassbookTransaction) => void;
  onDelete?: (transactionId: string) => void;
  formatCurrency?: (amount: number) => string;
}

export default function PassbookTable({ 
  transactions, 
  onEdit, 
  onDelete, 
  formatCurrency: externalFormatCurrency 
}: PassbookTableProps) {
  // Filter out notification entries and loan rejection entries
  const filteredTransactions = transactions.filter(transaction => 
    transaction.mode !== "Notification" && transaction.mode !== "Loan Rejected"
  );

  const formatCurrency = (amount: number) => {
    if (externalFormatCurrency) {
      return externalFormatCurrency(amount);
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Math.abs(amount));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.COMPLETED}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      CREDIT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      DEBIT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <Badge className={variants[type as keyof typeof variants]}>
        {type}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">
                    <div className="flex flex-col items-end">
                      <span>Total Amount</span>
                      <span className="text-xs text-gray-500 font-normal">(Deposit + Installment + Interest + Fine)</span>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  {(onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{transaction.reference}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(transaction.type)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.balance)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.reference}
                    </TableCell>
                    {(onEdit || onDelete) && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem
                                onClick={() => onEdit(transaction)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(transaction.id)}
                                className="flex items-center gap-2 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No transactions found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}