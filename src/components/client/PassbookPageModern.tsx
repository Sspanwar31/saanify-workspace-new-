'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator, 
  Users, 
  Plus, 
  Download, 
  RefreshCw, 
  UserPlus,
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  IndianRupee,
  Calendar,
  Wallet,
  Receipt,
  Target,
  CreditCard
} from 'lucide-react';

// Import form component
import PassbookAddEntryForm from './PassbookAddEntryForm';

// Types
interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
}

interface PassbookEntry {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  deposit: number;
  installment: number;
  interest: number;
  fine: number;
  mode: string;
  description: string;
  balance: number;
  loanId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PassbookPageModern() {
  const { mutate } = useSWRConfig();
  
  // State
  const [passbookEntries, setPassbookEntries] = useState<PassbookEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PassbookEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loanRequestEnabled, setLoanRequestEnabled] = useState(false);
  const [loanRequestAmount, setLoanRequestAmount] = useState(0);
  const [selectedMemberForLoan, setSelectedMemberForLoan] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [membersWithActiveLoans, setMembersWithActiveLoans] = useState<Set<string>>(new Set());
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Fetch passbook entries
  const fetchPassbookEntries = useCallback(async () => {
    setIsLoadingEntries(true);
    try {
      // Always fetch all entries from all members
      console.log('📋 Fetching all passbook entries');
      const apiUrl = `${window.location.origin}/api/client/passbook`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setPassbookEntries(data.entries || []);
        
        console.log(`📊 Loaded ${data.entries?.length || 0} entries from all members`);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        toast.error(errorData.error || 'Failed to fetch passbook entries');
      }
    } catch (error) {
      console.error('Error fetching passbook entries:', error);
      toast.error('Failed to fetch passbook entries');
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  // Fetch members for loan request
  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch(`${window.location.origin}/api/client/members`);
      if (response.ok) {
        const data = await response.json();
        const membersList = data.members || [];
        setMembers(membersList);
        console.log('Members loaded:', membersList);
        
        // Also fetch active loans to determine which members have existing loans
        try {
          const loansResponse = await fetch(`${window.location.origin}/api/client/loans`);
          if (loansResponse.ok) {
            const loansData = await loansResponse.json();
            const activeLoans = loansData.loans?.filter((loan: any) => loan.status === 'active') || [];
            const memberIdsWithActiveLoans = new Set(activeLoans.map((loan: any) => loan.memberId));
            setMembersWithActiveLoans(memberIdsWithActiveLoans);
            console.log('Active loans found:', activeLoans);
            console.log('Member IDs with active loans:', Array.from(memberIdsWithActiveLoans));
          }
        } catch (error) {
          console.error('Error fetching active loans:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPassbookEntries();
    fetchMembers();
  }, [fetchPassbookEntries, fetchMembers]);

  // Handle save entry (from form)
  const handleSaveEntry = (entry: PassbookEntry) => {
    setShowAddForm(false);
    setEditingEntry(null);
    fetchPassbookEntries();
    mutate(`${window.location.origin}/api/client/passbook`);
  };

  // Handle edit
  const handleEdit = (entry: PassbookEntry) => {
    setEditingEntry(entry);
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (entryId: string) => {
    const entry = passbookEntries.find(e => e.id === entryId);
    if (confirm(`Are you sure you want to delete this entry for ${entry?.memberName}?`)) {
      setDeletingEntry(entryId);
      try {
        const response = await fetch(`${window.location.origin}/api/client/passbook/delete?id=${entryId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('✅ Entry Deleted', {
            description: 'Passbook entry has been deleted successfully',
            duration: 3000
          });
          fetchPassbookEntries();
          mutate(`${window.location.origin}/api/client/passbook`);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to delete entry');
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete entry');
      } finally {
        setDeletingEntry(null);
      }
    }
  };

  // Filter entries
  const filteredEntries = passbookEntries.filter(entry => {
    const matchesSearch = entry.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.mode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.mode === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: passbookEntries.length,
    totalDeposits: passbookEntries.reduce((sum, entry) => {
      // Only count actual deposits, not loan disbursements
      // Exclude entries with mode indicating loan disbursement
      const isLoanRelated = entry.mode.toLowerCase().includes('loan') ||
                           entry.mode.toLowerCase().includes('disbursal') ||
                           entry.mode.toLowerCase().includes('approved') ||
                           entry.loanId !== null && entry.loanId !== undefined;
      
      if (!isLoanRelated && entry.deposit && entry.deposit > 0) {
        return sum + entry.deposit;
      }
      return sum;
    }, 0),
    totalInstallments: passbookEntries.reduce((sum, entry) => sum + entry.installment, 0),
    totalInterest: passbookEntries.reduce((sum, entry) => sum + entry.interest, 0),
  };

  const handleRefresh = () => {
    setIsLoadingEntries(true);
    fetchPassbookEntries();
    toast.success('🔄 Data Refreshed', {
      description: 'Passbook data has been refreshed',
      duration: 2000
    });
  };

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Passbook data is being exported to CSV',
      duration: 3000
    });
  };

  // Handle loan request submission
  const handleLoanRequest = async () => {
    console.log("handleLoanRequest called");
    console.log("selectedMemberForLoan:", selectedMemberForLoan);
    
    if (!selectedMemberForLoan) {
      toast.error('❌ Please select a member first', {
        description: 'You must select a member to request a loan',
        duration: 4000
      });
      return;
    }
    
    // Active loan check removed - members can now request multiple loans
    // if (membersWithActiveLoans.has(selectedMemberForLoan)) {
    //   toast.error('This member already has an active loan. Please repay existing loan before requesting a new one.');
    //   return;
    // }
    
    try {
      console.log("Sending loan request...");
      const response = await fetch(`${window.location.origin}/api/client/loan-request/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberForLoan,
          amount: loanRequestAmount || undefined,
        }),
      });

      console.log("Loan request response:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Loan request success:", data);
        
        // Show success toast with more details
        toast.success('🎯 Loan Request Sent Successfully!', {
          description: `Your loan request for ${loanRequestAmount ? '₹' + loanRequestAmount.toLocaleString('en-IN') : 'the requested amount'} has been submitted and is pending approval.`,
          duration: 5000,
          action: {
            label: "View Status",
            onClick: () => {
              // Optionally navigate to loans page to see status
              window.location.href = '/client/loans';
            }
          }
        });
        
        // Reset form
        setLoanRequestEnabled(false);
        setLoanRequestAmount(0);
        setSelectedMemberForLoan('');
        
        // Refresh data
        fetchPassbookEntries();
      } else {
        const error = await response.json();
        console.log("Loan request error:", error);
        toast.error('❌ Failed to Send Loan Request', {
          description: error.error || 'Something went wrong. Please try again.',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error sending loan request:', error);
      toast.error('❌ Network Error', {
        description: 'Failed to send loan request. Please check your connection and try again.',
        duration: 4000
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              Passbook Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              View all transactions from all members sorted by date
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoadingEntries}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingEntries ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
            <Button
              onClick={() => setLoanRequestEnabled(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <CreditCard className="h-4 w-4" />
              Request Loan
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loan Status Removed as requested */}

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Entries</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Deposits</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{stats.totalDeposits.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <IndianRupee className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Installments</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{stats.totalInstallments.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Interest</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ₹{stats.totalInterest.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <div className="flex-1">
          <Input
            placeholder="Search by member name, description, or payment mode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Cheque">Cheque</SelectItem>
            <SelectItem value="Online">Online</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Passbook Entries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-blue-600" />
              Passbook Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Member</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Mode</th>
                      <th className="text-right p-4 font-medium">Deposit</th>
                      <th className="text-right p-4 font-medium">Installment</th>
                      <th className="text-right p-4 font-medium">Interest</th>
                      <th className="text-right p-4 font-medium">
                        <div className="flex items-center justify-end gap-2">
                          Total Amount
                          <span className="text-xs text-gray-500 font-normal">(Deposit + Installment + Interest + Fine)</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, index) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{entry.memberName}</div>
                            {entry.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {entry.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(entry.date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {entry.mode}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          {entry.deposit > 0 && (
                            <span className="text-green-600 font-medium">
                              +₹{entry.deposit.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {entry.installment > 0 && (
                            <span className="text-blue-600 font-medium">
                              ₹{entry.installment.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {entry.interest > 0 && (
                            <span className="text-purple-600 font-medium">
                              ₹{entry.interest.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right font-medium">
                          ₹{entry.balance.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(entry)}
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingEntry === entry.id}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No entries found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by adding your first passbook entry'
                  }
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Entry Dialog */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                }}
              >
                ×
              </Button>
            </div>
            <PassbookAddEntryForm
              editingEntry={editingEntry}
              onSave={handleSaveEntry}
              onCancel={() => {
                setShowAddForm(false);
                setEditingEntry(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Loan Request Dialog */}
      {loanRequestEnabled && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                Request New Loan
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoanRequestEnabled(false);
                  setSelectedMemberForLoan('');
                  setLoanRequestAmount(0);
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Member *</label>
                  <Select value={selectedMemberForLoan} onValueChange={(value) => {
                    console.log('Member selected:', value);
                    setSelectedMemberForLoan(value);
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingMembers ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Loading members...
                      </div>
                    ) : members && members.length > 0 ? (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{member.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No members available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Warning message for selected member with active loan - REMOVED */}
              {/* {selectedMemberForLoan && membersWithActiveLoans.has(selectedMemberForLoan) && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      This member already has an active loan. Please repay existing loan before requesting a new one.
                    </span>
                  </div>
                </div>
              )} */}
              
              <div>
                <label className="text-sm font-medium mb-2 block">Loan Amount (Optional)</label>
                <Input
                  type="number"
                  placeholder="Enter amount or leave empty"
                  value={loanRequestAmount || ''}
                  onChange={(e) => setLoanRequestAmount(parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If not specified, admin will determine the loan amount
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoanRequestEnabled(false);
                    setSelectedMemberForLoan('');
                    setLoanRequestAmount(0);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLoanRequest}
                  disabled={!selectedMemberForLoan}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}