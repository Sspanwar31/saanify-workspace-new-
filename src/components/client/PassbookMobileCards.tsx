'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PassbookTransaction } from '@/data/passbookMock';
import { format } from 'date-fns';
import { Calendar, DollarSign, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

interface PassbookMobileCardsProps {
  transactions: PassbookTransaction[];
}

export default function PassbookMobileCards({ transactions }: PassbookMobileCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Math.abs(amount));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-4 md:hidden">
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium line-clamp-2">
                    {transaction.description}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-lg ${getTypeColor(transaction.type)}`}>
                    {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  <Badge 
                    variant={transaction.type === 'CREDIT' ? 'default' : 'destructive'}
                    className="text-xs mt-1"
                  >
                    {transaction.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Balance */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Balance</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(transaction.balance)}
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Category</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {transaction.category}
                  </Badge>
                </div>

                {/* Status and Reference */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    <span className="text-sm text-gray-600">Status</span>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>

                {/* Reference */}
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-500">
                    Ref: <span className="font-mono">{transaction.reference}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {transactions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No transactions found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}