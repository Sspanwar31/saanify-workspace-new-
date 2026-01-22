'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  Trash2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

export default function AdminFundPage() {
  // ✅ Hook call karo
  const { formatCurrency } = useCurrency();

  // --- States ---
  const [adminFundLedger, setAdminFundLedger] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [showWarning, setShowWarning] = useState(false)

  // --- Summary Calculations ---
  const [summary, setSummary] = useState({
    netBalance: 0,
    totalInjected: 0,
    totalWithdrawn: 0
  })
  const [cashInHand, setCashInHand] = useState(0) 
  const [societyCashInHand, setSocietyCashInHand] = useState(0)

  // 1. Initial Logic
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null')

    if (!user?.id) {
      console.error('Client not found in localStorage')
      return
    }

    // Direct ID access
    const finalId = user.client_id || user.id;
    setClientId(finalId)
  }, [])

  // 2. Fetch Data Trigger
  useEffect(() => {
    if (clientId) {
      fetchAdminFundData();
    }
  }, [clientId])

  // 3. Main Data Fetching Function
  const fetchAdminFundData = async () => {
    setLoading(true);

    if (!clientId) {
      setLoading(false); 
      return;
    }

    try {
      // A. Fetch Admin Ledger
      const { data: ledger, error: ledgerError } = await supabase
        .from('admin_fund_ledger')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true }); 

      if (ledgerError) throw ledgerError;

      // B. Calculate Admin Fund Balance
      let currentRunningBalance = 0;
      let totalInjected = 0;
      let totalWithdrawn = 0;

      const processedLedger = (ledger || []).map((transaction: any) => {
          const amt = Number(transaction.amount);
          
          if (transaction.type === 'INJECT') {
              currentRunningBalance += amt;
              totalInjected += amt;
          } else if (transaction.type === 'WITHDRAW') {
              currentRunningBalance -= amt;
              totalWithdrawn += amt;
          }
          
          return { ...transaction, runningBalance: currentRunningBalance };
      });

      setAdminFundLedger([...processedLedger].reverse()); 
      setSummary({
        netBalance: currentRunningBalance, 
        totalInjected: totalInjected,
        totalWithdrawn: totalWithdrawn
      });
      setCashInHand(currentRunningBalance); 

      // C. Society Cash Calc
      // 1. Passbook
      const { data: passbookEntries } = await supabase
        .from('passbook_entries')
        .select('deposit_amount, interest_amount, fine_amount') 
        .eq('client_id', clientId);
      
      const totalDeposits = passbookEntries?.reduce((sum, entry) => sum + (Number(entry.deposit_amount)||0), 0) || 0;
      const totalInterest = passbookEntries?.reduce((sum, entry) => sum + (Number(entry.interest_amount)||0), 0) || 0;
      const totalFines = passbookEntries?.reduce((sum, entry) => sum + (Number(entry.fine_amount)||0), 0) || 0;

      // 2. Loans
      const { data: loans } = await supabase
          .from('loans')
          .select('amount, remaining_balance')
          .neq('status', 'rejected') 
          .eq('client_id', clientId); 

      const loanIssued = loans?.reduce((sum, l) => sum + (Number(l.amount)||0), 0) || 0;
      const loanRecovered = loans?.reduce((sum, l) => sum + ((Number(l.amount)||0) - (Number(l.remaining_balance)||0)), 0) || 0;
      
      // 3. Expenses
      let maintenanceNet = 0;
      try {
        const { data: expenses } = await supabase
            .from('expenses_ledger')
            .select('amount, type')
            .eq('client_id', clientId);
        
        if (expenses) {
            const income = expenses.filter(e => e.type === 'INCOME').reduce((sum, e) => sum + (Number(e.amount)||0), 0);
            const expense = expenses.filter(e => e.type === 'EXPENSE').reduce((sum, e) => sum + (Number(e.amount)||0), 0);
            maintenanceNet = income - expense;
        }
      } catch (e) {}

      // 5. Final Calculation
      const totalInflow = totalDeposits + totalInterest + totalFines + currentRunningBalance + maintenanceNet + loanRecovered;
      const totalOutflow = loanIssued;
      
      const finalSocietyCash = totalInflow - totalOutflow;
      
      setSocietyCashInHand(finalSocietyCash); 

    } catch (error) {
      console.error("Error fetching admin fund data:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- Handlers ---
  const handleAddTransaction = async (type: 'INJECT' | 'WITHDRAW') => {
    if (!formData.amount || !formData.description || !clientId) return;
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    if (type === 'WITHDRAW' && amount > cashInHand && !showWarning) {
        setShowWarning(true);
        return;
    }

    try {
        await supabase.from('admin_fund_ledger').insert([{
            client_id: clientId,
            date: formData.date,
            amount: amount,
            type: type,
            description: formData.description
        }]);
        
        fetchAdminFundData(); 
        
        setFormData({ 
            amount: '', 
            description: '', 
            date: new Date().toISOString().split('T')[0] 
        });
        
        setIsInjectModalOpen(false);
        setIsWithdrawModalOpen(false);
        setShowWarning(false);
    } catch (error) {
        console.error("Error adding transaction:", error);
        alert("Failed to add transaction.");
    }
  }

  const handleDeleteAdminTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction? This will affect balances.")) return;
    try {
        await supabase.from('admin_fund_ledger').delete().eq('id', id);
        fetchAdminFundData(); 
    } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Failed to delete transaction.");
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Fund Ledger
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track funds exchanged between Admin and Society
          </p>
        </div>
        <Button variant="outline" onClick={fetchAdminFundData} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
            <RefreshCw className="h-4 w-4 mr-2"/> Refresh
        </Button>
      </div>

      {/* SECTION A: SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        
        {/* Card 1: Net Balance */}
        <Card className="md:col-span-1 dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded"></div> : (
              <>
                <div className={`text-3xl font-bold ${
                  summary.netBalance > 0 ? 'text-orange-600' : 
                  summary.netBalance < 0 ? 'text-red-600' : 
                  'text-gray-600 dark:text-gray-300'
                }`}>
                  {formatCurrency(Math.abs(summary.netBalance))}
                </div>
                <p className={`text-sm mt-1 ${
                  summary.netBalance > 0 ? 'text-orange-600' : 
                  summary.netBalance < 0 ? 'text-red-600' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {summary.netBalance > 0 ? 'Society owes Admin' : 
                   summary.netBalance < 0 ? 'Admin owes Society' : 
                   'Balanced'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Total Injected */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Injected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded"></div> : (
              <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                {formatCurrency(summary.totalInjected)}
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Admin gave to Society</p>
          </CardContent>
        </Card>

        {/* Card 3: Total Withdrawn */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded"></div> : (
              <div className="text-3xl font-bold text-red-600 dark:text-red-500">
                {formatCurrency(summary.totalWithdrawn)}
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Admin took from Society</p>
          </CardContent>
        </Card>

        {/* Card 4: Society Cash Available (FIXED CALCULATION) */}
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">Society Cash Available</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded"></div> : (
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(societyCashInHand)}
              </div>
            )}
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Real-time cash in locker (All Sources)</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash in Hand Info (Admin Fund Specific) */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <DollarSign className="h-5 w-5" />
            Cash in Hand (Admin Fund)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-slate-800 rounded"></div> : (
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(cashInHand)}
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Available for withdrawals and expenses (from Admin Fund only)
          </p>
        </CardContent>
      </Card>

      {/* SECTION B: ACTION BUTTONS (Inject / Withdraw) */}
      <div className="flex gap-4">
        {/* Inject Fund Modal */}
        <Dialog open={isInjectModalOpen} onOpenChange={setIsInjectModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white">
              <ArrowDownCircle className="h-4 w-4" />
              Inject Fund
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <ArrowDownCircle className="h-5 w-5" />
                Inject Fund
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inject-amount" className="dark:text-white">Amount</Label>
                <Input
                  id="inject-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="inject-date" className="dark:text-white">Date</Label>
                <Input
                  id="inject-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="inject-description" className="dark:text-white">Description</Label>
                <Textarea
                  id="inject-description"
                  placeholder="Enter description for this transaction"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleAddTransaction('INJECT')} // Pass type INJECT
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700"
                  disabled={!formData.amount || !formData.description}
                >
                  Inject Fund
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsInjectModalOpen(false)}
                  className="dark:text-white dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Fund Modal */}
        <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2 dark:bg-red-600 dark:hover:bg-red-700">
              <ArrowUpCircle className="h-4 w-4" />
              Withdraw Fund
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
                <ArrowUpCircle className="h-5 w-5" />
                Withdraw Fund
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {showWarning && (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-900">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  <AlertDescription className="text-orange-800 dark:text-orange-300">
                    <div className="space-y-2">
                      <p><strong>Warning:</strong> Withdrawal amount ({formatCurrency(parseFloat(formData.amount))}) exceeds available Cash in Hand ({formatCurrency(cashInHand)}).</p>
                      <p>This may result in negative cash balance. Do you want to continue?</p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowWarning(false)}
                            className="dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900/50"
                        >
                          Cancel
                        </Button>
                        <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleAddTransaction('WITHDRAW')} // Force withdraw
                        >
                          Force Withdraw
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}              
              <div>
                <Label htmlFor="withdraw-amount" className="dark:text-white">Amount</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="withdraw-date" className="dark:text-white">Date</Label>
                <Input
                  id="withdraw-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="withdraw-description" className="dark:text-white">Description</Label>
                <Textarea
                  id="withdraw-description"
                  placeholder="Enter description for this transaction"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              {!showWarning && (
                <div className="flex gap-2">
                  <Button 
                    variant="destructive"
                    onClick={() => handleAddTransaction('WITHDRAW')} // Pass type WITHDRAW
                    className="flex-1"
                    disabled={!formData.amount || !formData.description}
                  >
                    Withdraw Fund
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="dark:text-white dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION C: THE LEDGER TABLE */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
            <CardTitle className="dark:text-white">Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700">
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                  <TableHead className="dark:text-gray-300">Description/Note</TableHead>
                  <TableHead className="dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Amount</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Running Balance</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 dark:text-gray-400">Loading...</TableCell></TableRow>
                ) : adminFundLedger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No transactions yet. Add your first transaction to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminFundLedger.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700">
                        <TableCell className="dark:text-gray-300">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate dark:text-gray-300">{transaction.description}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={transaction.type === 'INJECT' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 dark:border-red-800'}
                          >
                            {transaction.type === 'INJECT' ? 'Received' : 'Given'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={transaction.type === 'INJECT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {transaction.type === 'INJECT' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          transaction.runningBalance > 0 ? 'text-orange-600 dark:text-orange-400' : 
                          transaction.runningBalance < 0 ? 'text-red-600 dark:text-red-400' : 
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {formatCurrency(Math.abs(transaction.runningBalance))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAdminTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
