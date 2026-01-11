'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Plus, 
  HandCoins, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  Wallet,
  DollarSign,
  FileText,
  RefreshCw,
  Download,
  Search,
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Modals
import PassbookAddEntryModal from '@/components/client/PassbookAddEntryModal';
import LoanRequestModal from '@/components/client/LoanRequestModal';

export default function PassbookPage() {
  // --- States ---
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<any>(null);
  
  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [passbook, setPassbook] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  // --- FILTER & PAGINATION STATES (New) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats State
  const [stats, setStats] = useState({
    totalDeposit: 0,
    totalInstallment: 0,
    totalInterest: 0,
    totalFine: 0
  });

  // --- 1. Fetch Client ID ---
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
    const { data } = await supabase.from('members').select('id, name').eq('client_id', clientId);
    if (data) setMembers(data);
  };

  const fetchPassbook = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('passbook_entries')
      .select('*')
      .order('date', { ascending: false });

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

  // --- Logic: Delete Entry ---
  const handleDeleteEntry = async (entry: any) => {
    if (!confirm(`Are you sure you want to delete this entry? This will reverse balance.`)) return;
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('outstanding_loan, total_deposits')
        .eq('id', entry.member_id)
        .single();

      if (memberData) {
        const reversedDeposit = (memberData.total_deposits || 0) - (entry.deposit_amount || 0);
        const reversedLoan = (memberData.outstanding_loan || 0) + (entry.installment_amount || 0);

        await supabase.from('members').update({
          total_deposits: reversedDeposit,
          outstanding_loan: reversedLoan
        }).eq('id', entry.member_id);
      }

      const { error } = await supabase.from('passbook_entries').delete().eq('id', entry.id);
      if (!error) fetchPassbook();
      else alert('Error deleting: ' + error.message);
    } catch (err) { console.error(err); }
  };

  const handleEditEntry = (entry: any) => {
    setEntryToEdit(entry);
    setIsAddEntryOpen(true);
  };

  const handleExport = () => {
    const headers = ["Date", "Member", "Mode", "Deposit", "Installment", "Int+Fine", "Total"];
    const rows = passbook.map(e => [
      e.date, 
      e.member_name || getMemberName(e.member_id),
      e.payment_mode,
      e.deposit_amount,
      e.installment_amount,
      (e.interest_amount || 0) + (e.fine_amount || 0),
      e.total_amount
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "passbook_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  // --- FILTERS & PAGINATION LOGIC ---
  
  // 1. Filter Data
  const filteredEntries = passbook.filter(entry => {
    const nameMatch = (entry.member_name || getMemberName(entry.member_id)).toLowerCase().includes(searchTerm.toLowerCase());
    const modeMatch = (entry.payment_mode || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let dateMatch = true;
    if (startDate) dateMatch = dateMatch && new Date(entry.date) >= new Date(startDate);
    if (endDate) dateMatch = dateMatch && new Date(entry.date) <= new Date(endDate);

    return (nameMatch || modeMatch) && dateMatch;
  });

  // 2. Paginate Data
  const limit = parseInt(rowsPerPage);
  const totalPages = Math.ceil(filteredEntries.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + limit);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, startDate, endDate, rowsPerPage]);

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setRowsPerPage('10');
  };

  return (
    <div className="p-8 space-y-8 w-full max-w-[1600px] mx-auto"> 
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Passbook</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage deposits, installments & interests.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchPassbook} className="bg-white">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="bg-white">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => setIsLoanModalOpen(true)}>
            <HandCoins className="h-4 w-4 mr-2" /> Request Loan
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setEntryToEdit(null); setIsAddEntryOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Deposits', val: stats.totalDeposit, icon: TrendingUp, color: 'green' },
          { label: 'Loan Recovered', val: stats.totalInstallment, icon: Wallet, color: 'blue' },
          { label: 'Total Interest', val: stats.totalInterest, icon: DollarSign, color: 'purple' },
          { label: 'Total Fine', val: stats.totalFine, icon: FileText, color: 'red' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className={`text-2xl font-bold text-${stat.color}-600`}>{formatCurrency(stat.val)}</h3>
              </div>
              <div className={`p-3 bg-${stat.color}-100 rounded-full`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`}/>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modern Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center bg-white p-4 rounded-lg border shadow-sm">
        
        {/* Search */}
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by member name or payment mode..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="grid gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 ml-1">From</span>
            <Input type="date" className="w-full xl:w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 ml-1">To</span>
            <Input type="date" className="w-full xl:w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Rows Per Page */}
        <div className="grid gap-1 min-w-[100px]">
           <span className="text-[10px] uppercase font-bold text-gray-500 ml-1">Rows</span>
           <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
            <SelectTrigger>
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Rows</SelectItem>
              <SelectItem value="25">25 Rows</SelectItem>
              <SelectItem value="50">50 Rows</SelectItem>
              <SelectItem value="100">100 Rows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filter Button */}
        {(searchTerm || startDate || endDate) && (
          <Button variant="ghost" onClick={resetFilters} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 mt-6 xl:mt-0">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Passbook Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-green-600 font-semibold">Deposit</TableHead>
                <TableHead className="text-blue-600 font-semibold">Installment</TableHead>
                <TableHead className="text-purple-600 font-semibold">Int. + Fine</TableHead>
                <TableHead className="text-right font-bold bg-gray-100/50">Total Amount</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="flex justify-center items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin"/> Loading records...</div>
                  </TableCell>
                </TableRow>
              ) : paginatedEntries.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                     No records found matching your filters.
                   </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => {
                  const intFine = (entry.interest_amount || 0) + (entry.fine_amount || 0);
                  
                  return (
                    <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="text-gray-600 font-medium">
                        {new Date(entry.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {entry.member_name || getMemberName(entry.member_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-wide font-normal bg-white">
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
                      <TableCell className="text-right font-bold text-gray-800 bg-gray-50/30">
                        {formatCurrency(entry.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => handleEditEntry(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteEntry(entry)}>
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

          {/* Modern Pagination Footer */}
          {filteredEntries.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t bg-gray-50/30 gap-4">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to <span className="font-medium text-gray-900">{Math.min(startIndex + limit, filteredEntries.length)}</span> of <span className="font-medium text-gray-900">{filteredEntries.length}</span> entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white min-w-[80px]"
                >
                  Previous
                </Button>
                <div className="flex items-center justify-center px-4 font-medium text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white min-w-[80px]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals (No changes to logic/UI as requested) */}
      <PassbookAddEntryModal 
        isOpen={isAddEntryOpen} 
        onClose={() => {
            setIsAddEntryOpen(false);
            setEntryToEdit(null);
            fetchPassbook();
        }}
        entryToEdit={entryToEdit} 
      />
      
      {/* ✅ CHANGE #1: Members aur ClientId pass kar diye */}
      <LoanRequestModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
        members={members}
        clientId={clientId}
      />
    </div>
  );
}
