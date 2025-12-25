'use client';

import { motion } from 'framer-motion';
import { Download, Filter, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PassbookHeaderProps {
  totalBalance: number;
  totalCredits: number;
  totalDebits: number;
  onExport: () => void;
  onFilterToggle: () => void;
}

export default function PassbookHeader({ 
  totalBalance, 
  totalCredits, 
  totalDebits, 
  onExport, 
  onFilterToggle 
}: PassbookHeaderProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Passbook
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all your financial transactions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onFilterToggle}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Current Balance
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Total Credits
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(totalCredits)}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
                  <span className="text-green-700 text-sm font-bold">+</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">
                    Total Debits
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(totalDebits)}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-200 flex items-center justify-center">
                  <span className="text-red-700 text-sm font-bold">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}