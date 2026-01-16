'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AdminFundPage() {
  // --- States ---
  const [adminFundLedger, setAdminFundLedger] = useState<any[]>([])
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

  // 1. Init Logic
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null')
    if (user?.id) {
      setClientId(user.id)
    }
  }, [])

  // 2. Fetch Trigger
  useEffect(() => {
    if (clientId) {
      fetchAdminFundData();
    }
  }, [clientId])

  // 3. Main Calculation Logic (Old Way - Manual Calculation)
  const fetchAdminFundData = async () => {
    if (!clientId) return;
    setLoading(true);

    try {
      // A. Fetch Ledger (Sorted by Date for running balance)
      const { data: ledger, error: ledgerError } = await supabase
        .from('admin_fund_ledger')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

      if (ledgerError) throw ledgerError;

      // B. Calculate Running Balance (Frontend Logic)
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

      // C. Update Admin Fund States
      setAdminFundLedger([...processedLedger].reverse()); // Show latest first
      setSummary({
        netBalance: currentRunningBalance,
        totalInjected: totalInjected,
        totalWithdrawn: totalWithdrawn
      });
      setCashInHand(currentRunningBalance);

      // D. Calculate Society Cash (Old Logic: Deposits + AdminFund - Loans)
      
      // Fetch Total Deposits (Passbook)
      const { data: passbookEntries } = await supabase
        .from('passbook_entries')
        .select('deposit_amount')
        .eq('client_id', clientId);

      const totalPassbookCollection = passbookEntries?.reduce((sum, entry) => sum + (Number(entry.deposit_amount) || 0), 0) || 0;

      // Fetch Total Loans Disbursed
      const { data: loans } = await supabase
        .from('loans')
        .select('amount')
        .neq('status', 'rejected')
        .eq('client_id', clientId);

      const totalLoansDisbursed = loans?.reduce((sum, loan) => sum + (Number(loan.amount) || 0), 0) || 0;

      // Final Formula
      const finalSocietyCash = totalPassbookCollection + currentRunningBalance - totalLoansDisbursed;
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
      const { error } = await supabase.from('admin_fund_ledger').insert([{
        client_id: clientId,
        date: formData.date,
        amount: amount,
        type: type,
        description: formData.description
      }]);

      if (error) throw error;

      fetchAdminFundData();
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Fund Ledger</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track funds exchanged between Admin and Society</p>
        </div>
        <Button variant="outline" onClick={fetchAdminFundData}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>

      {/* SECTION A: SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Net Balance */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
              <>
                <div className={`text-3xl font-bold ${summary.netBalance > 0 ? 'text-orange-600' : summary.netBalance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  ₹{Math.abs(summary.netBalance).toLocaleString()}
                </div>
                <p className="text-sm mt-1 text-gray-500">
                  {summary.netBalance > 0 ? 'Society owes Admin' : summary.netBalance < 0 ? 'Admin owes Society' : 'Balanced'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Injected */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> Total Injected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
              <div className="text-3xl font-bold text-green-600">₹{summary.totalInjected.toLocaleString()}</div>
            )}
            <p className="text-sm text-gray-600 mt-1">Admin gave to Society</p>
          </CardContent>
        </Card>

        {/* Total Withdrawn */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" /> Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
              <div className="text-3xl font-bold text-red-600">₹{summary.totalWithdrawn.toLocaleString()}</div>
            )}
            <p className="text-sm text-gray-600 mt-1">Admin took from Society</p>
          </CardContent>
        </Card>

        {/* Society Cash Available */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Society Cash Available</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
              <div className="text-2xl font-bold text-purple-700">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(societyCashInHand)}
              </div>
            )}
            <p className="text-xs text-purple-600 mt-1">Real-time cash in locker (All Sources)</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash in Hand Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Cash in Hand (Admin Fund)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
            <div className="text-2xl font-bold text-blue-600">₹{cashInHand.toLocaleString()}</div>
          )}
          <p className="text-sm text-gray-600 mt-1">Available for withdrawals and expenses (from Admin Fund only)</p>
        </CardContent>
      </Card>

      {/* SECTION B: ACTION BUTTONS */}
      <div className="flex gap-4">
        {/* Inject Modal */}
        <Dialog open={isInjectModalOpen} onOpenChange={setIsInjectModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <ArrowDownCircle className="h-4 w-4" /> Inject Fund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600"><ArrowDownCircle className="h-5 w-5" /> Inject Fund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleAddTransaction('INJECT')} className="flex-1 bg-green-600 hover:bg-green-700" disabled={!formData.amount || !formData.description}>Inject</Button>
                <Button variant="outline" onClick={() => setIsInjectModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Modal */}
        <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Withdraw Fund</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600"><ArrowUpCircle className="h-5 w-5" /> Withdraw Fund</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {showWarning && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Warning: Withdrawal exceeds Cash in Hand. Continue?
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => setShowWarning(false)}>Cancel</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAddTransaction('WITHDRAW')}>Force Withdraw</Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <div>
                <Label>Amount</Label>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              {!showWarning && (
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => handleAddTransaction('WITHDRAW')} className="flex-1" disabled={!formData.amount || !formData.description}>Withdraw</Button>
                  <Button variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>Cancel</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION C: LEDGER TABLE */}
      <Card>
        <CardHeader><CardTitle>Transaction Ledger</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : adminFundLedger.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No transactions yet.</TableCell></TableRow>
              ) : (
                adminFundLedger.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tx.type === 'INJECT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {tx.type === 'INJECT' ? 'Received' : 'Given'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === 'INJECT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'INJECT' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      ₹{Math.abs(tx.runningBalance).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAdminTransaction(tx.id)} className="text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
