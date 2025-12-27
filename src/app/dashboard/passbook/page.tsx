'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; // Supabase Connection
import { 
  Plus, 
  HandCoins, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Download,
  Wallet,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// Modals
import PassbookAddEntryModal from '@/components/client/PassbookAddEntryModal';
import LoanRequestModal from '@/components/client/LoanRequestModal';

export default function PassbookPage() {
  // --- States ---
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<any>(null); // For Edit Mode
  
  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [passbook, setPassbook] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Stats State
  const [stats, setStats] = useState({
    totalDeposit: 0,
    totalInstallment: 0,
    totalInterest: 0,
    totalFine: 0
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  // --- 1. Fetch Client ID on Load ---
  useEffect(() => {
    const initData = async () => {
      const { data: clients } = await supabase.from('clients').select('id').limit(1);
      if (clients && clients.length > 0) {
        setClientId(clients[0].id);
      }
    };
    initData();
  }, []);

  // --- 2. Fetch Data ---
  useEffect(() => {
    if (clientId) {
      fetchMembers();
      fetchPassbook();
    }
  }, [clientId]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('id, name')
      .eq('client_id', clientId);
    if (data) setMembers(data);
  };

  const fetchPassbook = async () => {
    setLoading(true);
    // Fetching Raw Data
    const { data, error } = await supabase
      .from('passbook_entries')
      .select('*')
      .order('date', { ascending: false }); // Latest First

    if (data) {
      setPassbook(data);

      // Calculate Stats
      const newStats = data.reduce((acc: any, curr: any) => ({
        totalDeposit: acc.totalDeposit + (curr.deposit_amount || 0),
        totalInstallment: acc.totalInstallment + (curr.installment_amount || 0),
        totalInterest: acc.totalInterest + (curr.interest_amount || 0),
        totalFine: acc.totalFine + (curr.fine_amount || 0),
      }), { totalDeposit: 0, totalInstallment: 0, totalInterest: 0, totalFine: 0 });
      
      setStats(newStats);
    }
    setLoading(false);
  };

  // --- Logic: Delete Entry with Balance Sync (Reverse Calculation) ---
  const handleDeleteEntry = async (entry: any) => {
    if (!confirm(`Are you sure you want to delete this entry for member? This will reverse the balance.`)) return;

    try {
      // 1. Fetch Current Member Data
      const { data: memberData } = await supabase
        .from('members')
        .select('outstanding_loan, total_deposits')
        .eq('id', entry.member_id)
        .single();

      if (memberData) {
        // 2. Reverse Logic
        // If we delete a deposit, member's total deposit should DECREASE
        const reversedDeposit = (memberData.total_deposits || 0) - (entry.deposit_amount || 0);
        
        // If we delete an installment, member's loan should INCREASE (wapas karz chad gaya)
        const reversedLoan = (memberData.outstanding_loan || 0) + (entry.installment_amount || 0);

        // 3. Update Member
        await supabase.from('members').update({
          total_deposits: reversedDeposit,
          outstanding_loan: reversedLoan
        }).eq('id', entry.member_id);
      }

      // 4. Delete Entry from Table
      const { error } = await supabase
        .from('passbook_entries')
        .delete()
        .eq('id', entry.id);
      
      if (!error) {
        fetchPassbook(); // Refresh UI
      } else {
        alert('Error deleting: ' + error.message);
      }

    } catch (err) {
      console.error(err);
      alert("Failed to sync delete with member balance.");
    }
  };

  // --- Logic: Edit Entry ---
  const handleEditEntry = (entry: any) => {
    setEntryToEdit(entry);
    setIsAddEntryOpen(true);
  };

  // --- Logic: Export Data ---
  const handleExport = () => {
    // Simple CSV Export Logic
    const headers = ["Date", "Member ID", "Member Name", "Mode", "Deposit", "Installment", "Interest", "Fine", "Total"];
    const rows = passbook.map(e => [
      e.date, 
      e.member_id, 
      e.member_name || getMemberName(e.member_id),
      e.payment_mode,
      e.deposit_amount,
      e.installment_amount,
      e.interest_amount,
      e.fine_amount,
      e.total_amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "passbook_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  // Helper
  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown'; // Fallback if member deleted
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  // Pagination & Search
  const filteredEntries = passbook.filter(entry => 
    (entry.member_name || getMemberName(entry.member_id)).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.payment_mode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + entriesPerPage);

  return (
    <div className="space-y-6 pt-4"> {/* Added padding top */}
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Passbook</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage deposits, installments & interests.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchPassbook} title="Refresh Data">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} title="Export CSV">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => setIsLoanModalOpen(true)}
          >
            <HandCoins className="h-4 w-4 mr-2" /> Request Loan
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setEntryToEdit(null); // Clear edit mode
              setIsAddEntryOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Entry
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards (Overview) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deposits</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDeposit)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full"><TrendingUp className="h-6 w-6 text-green-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Loan Recovered</p>
              <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalInstallment)}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full"><Wallet className="h-6 w-6 text-blue-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Interest</p>
              <h3 className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalInterest)}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full"><DollarSign className="h-6 w-6 text-purple-600"/></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Fine</p>
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalFine)}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full"><FileText className="h-6 w-6 text-red-600"/></div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search by member name or payment mode..." 
          className="pl-10 max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 4. Passbook Table (New Split Structure) */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-green-600 font-semibold">Deposit</TableHead>
                <TableHead className="text-blue-600 font-semibold">Installment</TableHead>
                <TableHead className="text-purple-600 font-semibold">Int. + Fine</TableHead>
                <TableHead className="text-right font-bold">Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">Loading records...</TableCell>
                </TableRow>
              ) : paginatedEntries.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={8} className="text-center py-8 text-gray-500">No records found.</TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => {
                  const intFine = (entry.interest_amount || 0) + (entry.fine_amount || 0);
                  
                  return (
                    <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="text-gray-600">
                        {new Date(entry.date).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {entry.member_name || getMemberName(entry.member_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs tracking-wide">
                          {entry.payment_mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {entry.deposit_amount > 0 ? `+${formatCurrency(entry.deposit_amount)}` : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {entry.installment_amount > 0 ? formatCurrency(entry.installment_amount) : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-purple-600">
                        {intFine > 0 ? formatCurrency(intFine) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-800 bg-gray-50/50">
                        {formatCurrency(entry.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteEntry(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* 5. Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
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

      {/* Modals */}
      <PassbookAddEntryModal 
        isOpen={isAddEntryOpen} 
        onClose={() => {
            setIsAddEntryOpen(false);
            setEntryToEdit(null);
            fetchPassbook(); // Refresh Data on Close
        }}
        entryToEdit={entryToEdit} // Passing prop for Edit
      />
      
      <LoanRequestModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
      />
    </div>
  );
}
