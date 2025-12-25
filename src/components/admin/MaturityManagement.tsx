"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { RefreshCw, Settings, CheckCircle } from 'lucide-react';

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
  adjustedInterest?: number;
  currentAdjustment: number;
  loanAdjustment: number;
  status: 'active' | 'matured' | 'claimed';
  claimedAt?: string;
}

export default function MaturityManagement() {
  const [records, setRecords] = useState<MaturityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [adjustedInterestValue, setAdjustedInterestValue] = useState<string>('');

  // Fetch maturity records
  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/maturity');
      if (!response.ok) throw new Error('Failed to fetch records');
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      toast.error('Failed to load maturity records');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-generate/update records
  const generateRecords = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/maturity', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate records');
      const result = await response.json();
      toast.success(result.message || 'Records updated successfully');
      await fetchRecords(); // Refresh the data
    } catch (error) {
      toast.error('Failed to generate records');
      console.error(error);
      setRefreshing(false);
    }
  };

  // Toggle manual override
  const toggleManualOverride = async (recordId: string, currentState: boolean) => {
    try {
      const response = await fetch('/api/maturity/manual-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          manualOverride: !currentState,
          adjustedInterest: !currentState ? parseFloat(adjustedInterestValue) || 0 : null
        })
      });

      if (!response.ok) throw new Error('Failed to update record');
      
      toast.success('Manual override updated successfully');
      setEditingRecord(null);
      setAdjustedInterestValue('');
      await fetchRecords();
    } catch (error) {
      toast.error('Failed to update manual override');
      console.error(error);
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
      await fetchRecords();
    } catch (error) {
      toast.error('Failed to claim maturity');
      console.error(error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'matured': return 'bg-yellow-100 text-yellow-800';
      case 'claimed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading maturity records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maturity Management</h1>
          <p className="text-muted-foreground">
            Automated maturity system with 36-month cycles and 12% total interest
          </p>
        </div>
        <Button 
          onClick={generateRecords} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Generating...' : 'Generate Records'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maturity Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Total Deposit</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Maturity Date</TableHead>
                  <TableHead>Months Completed</TableHead>
                  <TableHead>Remaining Months</TableHead>
                  <TableHead>Current Interest</TableHead>
                  <TableHead>Full Interest (12%)</TableHead>
                  <TableHead>Manual Override</TableHead>
                  <TableHead>Adjusted Interest</TableHead>
                  <TableHead>Current Adjustment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      No maturity records found. Click "Generate Records" to create them.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.memberName}</TableCell>
                      <TableCell>{formatCurrency(record.totalDeposit)}</TableCell>
                      <TableCell>{formatDate(record.startDate)}</TableCell>
                      <TableCell>{formatDate(record.maturityDate)}</TableCell>
                      <TableCell>{record.monthsCompleted}</TableCell>
                      <TableCell>{record.remainingMonths}</TableCell>
                      <TableCell>{formatCurrency(record.currentInterest)}</TableCell>
                      <TableCell>{formatCurrency(record.fullInterest)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={record.manualOverride}
                            onCheckedChange={() => setEditingRecord(record.id)}
                          />
                          {record.manualOverride && (
                            <Settings className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingRecord === record.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={adjustedInterestValue}
                              onChange={(e) => setAdjustedInterestValue(e.target.value)}
                              placeholder={record.fullInterest.toString()}
                              className="w-24"
                            />
                            <Button
                              size="sm"
                              onClick={() => toggleManualOverride(record.id, record.manualOverride)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          formatCurrency(record.adjustedInterest || record.fullInterest)
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(record.currentAdjustment)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.status === 'matured' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => claimMaturity(record.id)}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Claim
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}