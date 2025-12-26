'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; // Supabase Connection
import { 
  Plus, 
  HandCoins, 
  Edit, 
  Trash2, 
  Calendar,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
// Modals - Using your existing components
import PassbookAddEntryModal from '@/components/client/PassbookAddEntryModal';
import LoanRequestModal from '@/components/client/LoanRequestModal';

export default function PassbookPage() {
  // --- States ---
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  
  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [passbook, setPassbook] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // --- 1. Fetch Client ID on Load ---
  useEffect(() => {
    const initData = async () => {
      // Admin के लिए Client ID लाएं
      const { data: clients } = await supabase.from('clients').select('id').limit(1);
      if (clients && clients.length > 0) {
        setClientId(clients[0].id);
      }
    };
    initData();
  }, []);

  // --- 2. Fetch Data when Client ID is ready ---
  useEffect(() => {
    if (clientId) {
      fetchMembers();
      fetchPassbook();
    }
  }, [clientId]);

  // --- Fetch Members ---
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('id, name')
      .eq('client_id', clientId);
    if (data) setMembers(data);
  };

  // --- Fetch Passbook Entries & Calculate Balance ---
  const fetchPassbook = async () => {
    setLoading(true);
    // Oldest first order me layenge taki balance sahi calculate ho
    const { data, error } = await supabase
      .from('passbook_entries')
      .select('*')
      .order('date', { ascending: true });

    if (data) {
      let runningBalance = 0;
      
      const mappedEntries = data.map((entry: any) => {
        // Amount aur Type determine logic
        let type = 'deposit';
        let amount = entry.deposit_amount || 0;
        
        if (entry.installment_amount > 0) {
          type = 'loan'; // Loan Repayment (Installment)
          amount = entry.installment_amount;
          // Logic: Installment dene se hath ka paisa kam hua (Passbook View) ya Loan kam hua?
          // Usually Passbook me Installment 'Debit' side hoti hai.
          runningBalance -= parseFloat(amount);
        } else if (entry.interest_amount > 0) {
          type = 'interest';
          amount = entry.interest_amount;
        } else if (entry.fine_amount > 0) {
            type = 'interest'; // Fine as interest category
            amount = entry.fine_amount;
        } else {
            // Deposit
            runningBalance += parseFloat(entry.total_amount || 0);
        }

        return {
          id: entry.id,
          memberId: entry.member_id,
          date: entry.date,
          type: type, 
          amount: parseFloat(entry.total_amount || 0),
          description: entry.note || entry.payment_mode || 'Entry',
          balance: runningBalance
        };
      });

      // UI me Newest First dikhane ke liye reverse karein
      setPassbook(mappedEntries.reverse());
    }
    setLoading(false);
  };

  // --- Logic: Delete Entry ---
  const handleDeleteEntry = async (entry: any) => {
    if (confirm(`Are you sure you want to delete this entry?`)) {
      const { error } = await supabase
        .from('passbook_entries')
        .delete()
        .eq('id', entry.id);
      
      if (!error) {
        fetchPassbook(); // List Refresh karein
      } else {
        alert('Error deleting: ' + error.message);
      }
    }
  };

  // Helper: Get Member Name
  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown Member';
  };

  // Helper: Icons
  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'loan': return <HandCoins className="h-4 w-4 text-red-600" />;
      case 'interest': return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'withdrawal': return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default: return <ArrowUpDown className="h-4 w-4 text-gray-600" />;
    }
  };

  // Helper: Badges
  const getEntryTypeBadge = (type: string) => {
    const variants: any = {
      deposit: 'bg-green-100 text-green-800',
      loan: 'bg-red-100 text-red-800',
      interest: 'bg-blue-100 text-blue-800',
      withdrawal: 'bg-orange-100 text-orange-800'
    };
    return (
      <Badge className={variants[type] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  // Pagination Logic
  const sortedEntries = passbook;
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Passbook
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage all financial transactions and entries
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Request Loan Button */}
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsLoanModalOpen(true)}
          >
            <HandCoins className="h-4 w-4 mr-2" />
            Request Loan
          </Button>
          
          {/* Add Entry Button */}
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddEntryOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Passbook Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading entries...</TableCell>
                </TableRow>
              ) : paginatedEntries.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={7} className="text-center py-8">No transactions found.</TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {getMemberName(entry.memberId).charAt(0)}
                        </span>
                      </div>
                      {getMemberName(entry.memberId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEntryTypeIcon(entry.type)}
                      {getEntryTypeBadge(entry.type)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      entry.type === 'deposit' || entry.type === 'interest' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {entry.type === 'deposit' || entry.type === 'interest' ? '+' : ''}
                      ₹{entry.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{entry.balance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteEntry(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, sortedEntries.length)} of {sortedEntries.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals - Connected to refresh on close */}
      <PassbookAddEntryModal 
        isOpen={isAddEntryOpen} 
        onClose={() => {
            setIsAddEntryOpen(false);
            fetchPassbook(); // Modal band hone par data refresh hoga
        }} 
      />
      
      <LoanRequestModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
      />
    </div>
  );
}
