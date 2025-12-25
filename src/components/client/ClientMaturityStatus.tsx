"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Eye, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Users,
  Wallet,
  Target,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MaturityRecord {
  id: string;
  memberId: string;
  memberName: string;
  totalDeposit: number;
  startDate: string;
  maturityDate: string;
  monthsCompleted: number;
  remainingMonths: number;
  monthlyInterestRate: number;
  currentInterest: number;
  fullInterest: number;
  manualOverride: boolean;
  adjustedInterest: number;
  currentAdjustment: number;
  status: 'active' | 'matured' | 'claimed';
  claimedAt?: string;
}

export default function ClientMaturityStatus() {
  const [records, setRecords] = useState<MaturityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOverride, setEditingOverride] = useState<string | null>(null);
  const [overrideValues, setOverrideValues] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all maturity records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/maturity/records');
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching maturity records:', error);
      toast.error('Failed to fetch maturity records');
    } finally {
      setLoading(false);
    }
  };

  // Claim maturity
  const claimMaturity = async (recordId: string) => {
    try {
      const response = await fetch('/api/maturity/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId })
      });

      if (!response.ok) throw new Error('Failed to claim maturity');
      
      toast.success('Maturity claimed successfully');
      await fetchRecords(); // Refresh data
    } catch (error) {
      toast.error('Failed to claim maturity');
      console.error(error);
    }
  };

  // Toggle manual override
  const toggleManualOverride = async (recordId: string, currentValue: number) => {
    if (editingOverride === recordId) {
      // Save override value
      try {
        const adjustedValue = overrideValues[recordId] || currentValue.toString();
        const response = await fetch('/api/maturity/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            recordId, 
            adjustedInterest: adjustedValue 
          })
        });

        if (!response.ok) throw new Error('Failed to update override');
        
        toast.success('Manual override updated successfully');
        setEditingOverride(null);
        await fetchRecords(); // Refresh data
      } catch (error) {
        toast.error('Failed to update manual override');
        console.error(error);
      }
    } else {
      // Start editing
      setEditingOverride(recordId);
      setOverrideValues(prev => ({
        ...prev,
        [recordId]: currentValue.toString()
      }));
    }
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
          icon: <Target className="h-3 w-3" />,
          label: 'Active'
        };
      case 'matured': 
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Matured'
        };
      case 'claimed': 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
          icon: <CheckCircle className="h-3 w-3" />,
          label: 'Claimed'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700',
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'Unknown'
        };
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter records based on search
  const filteredRecords = records.filter(record =>
    record.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary statistics
  const stats = {
    totalRecords: records.length,
    activeRecords: records.filter(r => r.status === 'active').length,
    maturedRecords: records.filter(r => r.status === 'matured').length,
    claimedRecords: records.filter(r => r.status === 'claimed').length,
    totalDeposits: records.reduce((sum, r) => sum + r.totalDeposit, 0),
    totalInterest: records.reduce((sum, r) => sum + r.adjustedInterest, 0)
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-800 dark:text-amber-200 font-medium">Loading Maturity Records...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
      {/* Header Section */}
      <div className="p-6 pb-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-amber-200 dark:border-amber-700"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Calendar className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-300 dark:to-orange-300 bg-clip-text text-transparent">
                  Maturity Records
                </h1>
                <p className="text-amber-600 dark:text-amber-400">Track and manage member maturity benefits</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={fetchRecords}
                  variant="outline"
                  className="bg-white/80 dark:bg-amber-950/50 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                title: 'Total Records',
                value: stats.totalRecords,
                icon: <Users className="w-5 h-5" />,
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-950/30'
              },
              {
                title: 'Active',
                value: stats.activeRecords,
                icon: <Target className="w-5 h-5" />,
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50 dark:bg-green-950/30'
              },
              {
                title: 'Matured',
                value: stats.maturedRecords,
                icon: <AlertCircle className="w-5 h-5" />,
                color: 'from-yellow-500 to-yellow-600',
                bgColor: 'bg-yellow-50 dark:bg-yellow-950/30'
              },
              {
                title: 'Total Deposits',
                value: formatCurrency(stats.totalDeposits),
                icon: <Wallet className="w-5 h-5" />,
                color: 'from-amber-500 to-orange-600',
                bgColor: 'bg-amber-50 dark:bg-amber-950/30'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`${stat.bgColor} rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/50 shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white shadow-md`}>
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Input
                placeholder="Search by member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-amber-950/50 border-amber-200 dark:border-amber-700 focus:border-amber-400 dark:focus:border-amber-600"
              />
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Table Content */}
      <div className="px-6 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/90 dark:bg-amber-950/50 backdrop-blur-sm rounded-xl border border-amber-200/50 dark:border-amber-800/50 shadow-xl overflow-hidden"
        >
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-amber-300 dark:text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
                {searchTerm ? 'No records found' : 'No maturity records found'}
              </h3>
              <p className="text-amber-600 dark:text-amber-400">
                {searchTerm ? 'Try a different search term' : 'Make deposits to start earning maturity benefits'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)] w-full">
              <Table>
                <TableHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Member Name</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Total Deposit</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Start Date</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Maturity Date</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Months Completed</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Remaining Months</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Monthly Interest Rate</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Current Interest</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Full Interest (12%)</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Manual Override</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Adjusted Interest</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Current Adjustment</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200">Status</TableHead>
                    <TableHead className="font-semibold text-amber-800 dark:text-amber-200 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredRecords.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-amber-100 dark:border-amber-800/30 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <TableCell className="font-medium text-amber-900 dark:text-amber-100">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {record.memberName.charAt(0)}
                            </div>
                            {record.memberName}
                          </div>
                        </TableCell>
                        <TableCell className="text-amber-900 dark:text-amber-100 font-semibold">
                          {formatCurrency(record.totalDeposit)}
                        </TableCell>
                        <TableCell className="text-amber-700 dark:text-amber-300">
                          {formatDate(record.startDate)}
                        </TableCell>
                        <TableCell className="text-amber-700 dark:text-amber-300">
                          {formatDate(record.maturityDate)}
                        </TableCell>
                        <TableCell className="text-amber-900 dark:text-amber-100">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-amber-200 dark:bg-amber-700 rounded-full h-2 max-w-[60px]">
                              <div 
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                                style={{ width: `${Math.min((record.monthsCompleted / 36) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{record.monthsCompleted}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-amber-900 dark:text-amber-100">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            record.remainingMonths <= 6 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {record.remainingMonths}
                          </span>
                        </TableCell>
                        <TableCell className="text-amber-700 dark:text-amber-300 font-mono text-sm">
                          0.0333333333
                        </TableCell>
                        <TableCell className="text-amber-900 dark:text-amber-100 font-semibold">
                          {formatCurrency(record.currentInterest)}
                        </TableCell>
                        <TableCell className="text-amber-900 dark:text-amber-100 font-semibold">
                          {formatCurrency(record.fullInterest)}
                        </TableCell>
                        <TableCell className="text-amber-900 dark:text-amber-100">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={record.manualOverride}
                              onCheckedChange={() => toggleManualOverride(record.id, record.adjustedInterest)}
                              className="data-[state=checked]:bg-amber-500"
                            />
                            {editingOverride === record.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                              >
                                <Input
                                  type="number"
                                  value={overrideValues[record.id] || record.adjustedInterest.toString()}
                                  onChange={(e) => setOverrideValues(prev => ({
                                    ...prev,
                                    [record.id]: e.target.value
                                  }))}
                                  onBlur={() => toggleManualOverride(record.id, parseFloat(overrideValues[record.id] || record.adjustedInterest.toString()))}
                                  className="w-24 h-8 bg-white dark:bg-amber-950 border-amber-300 dark:border-amber-600"
                                  autoFocus
                                />
                              </motion.div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-amber-900 dark:text-amber-100 font-semibold">
                          {formatCurrency(record.adjustedInterest)}
                        </TableCell>
                        <TableCell className={`font-semibold ${
                          record.currentAdjustment >= 0 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {formatCurrency(record.currentAdjustment)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusInfo(record.status).color} border font-medium flex items-center gap-1 w-fit`}>
                            {getStatusInfo(record.status).icon}
                            {getStatusInfo(record.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </motion.div>
                            {record.status === 'matured' && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  onClick={() => claimMaturity(record.id)}
                                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </motion.div>
      </div>
    </div>
  );
}