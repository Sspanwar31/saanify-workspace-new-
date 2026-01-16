'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import {
  ArrowDownCircle, ArrowUpCircle, Trash2, AlertTriangle, DollarSign,
  TrendingUp, TrendingDown, Wallet, RefreshCw
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
  const [adminFundLedger, setAdminFundLedger] = useState<any[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [formData, setFormData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] })
  const [showWarning, setShowWarning] = useState(false)

  // Summary States
  const [summary, setSummary] = useState({ netBalance: 0, totalInjected: 0, totalWithdrawn: 0 })
  const [cashInHand, setCashInHand] = useState(0)
  const [societyCashInHand, setSocietyCashInHand] = useState(0)

  // 1. Init Logic
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null')
    if (!user?.id) return
    const finalId = user.client_id || user.id;
    setClientId(finalId)
  }, [])

  // 2. Fetch Trigger
  useEffect(() => {
    if (clientId) fetchAdminFundData();
  }, [clientId])

  // ✅ 3. Main Logic (Fixes 404 Crash & Loan Logic)
  const fetchAdminFundData = async () => {
    setLoading(true);
    if (!clientId) { setLoading(false); return; }

    try {
      // A. Admin Fund Ledger
      const { data: ledger } = await supabase
        .from('admin_fund_ledger')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

      let currentRunningBalance = 0, totalInjected = 0, totalWithdrawn = 0;
      const processed = (ledger || []).map((tx: any) => {
        const amt = Number(tx.amount);
        if (tx.type === 'INJECT') { currentRunningBalance += amt; totalInjected += amt; }
        else { currentRunningBalance -= amt; totalWithdrawn += amt; }
        return { ...tx, runningBalance: currentRunningBalance };
      });

      setAdminFundLedger([...processed].reverse());
      setSummary({ netBalance: currentRunningBalance, totalInjected, totalWithdrawn });
      setCashInHand(currentRunningBalance);

      // --- SOCIETY CASH CALCULATION (SAFE MODE) ---
      
      // 1. Passbook (Deposits)
      const { data: deposits } = await supabase
        .from('passbook_entries')
        .select('deposit_amount')
        .eq('client_id', clientId);
      const totalDeposits = deposits?.reduce((sum, d) => sum + (Number(d.deposit_amount) || 0), 0) || 0;

      // 2. Loans (🔥 FIX: Exclude 'pending' loans to increase Cash Balance)
      const { data: loans } = await supabase
        .from('loans')
        .select('amount')
        .neq('status', 'rejected')
        .neq('status', 'pending') // <-- Ye line Cash badhayegi (₹15k se upar)
        .eq('client_id', clientId);
      const totalLoans = loans?.reduce((sum, l) => sum + (Number(l.amount) || 0), 0) || 0;

      // 3. Expenses (Try/Catch to ignore 404 if table missing)
      let totalExpenses = 0;
      try {
        const { data: exp, error } = await supabase.from('expenses').select('amount').eq('client_id', clientId);
        if (!error && exp) totalExpenses = exp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      } catch (e) { console.log('Expenses table missing, ignoring'); }

      // 4. Repayments (Try/Catch to ignore 404 if table missing)
      let totalRepayments = 0;
      try {
        const { data: rep, error } = await supabase.from('loan_payments').select('amount').eq('client_id', clientId);
        if (!error && rep) totalRepayments = rep.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      } catch (e) { console.log('Loan Payments table missing, ignoring'); }

      // 🔥 FINAL CALCULATION
      const finalSocietyCash = (totalDeposits + totalRepayments + currentRunningBalance) - (totalLoans + totalExpenses);
      setSocietyCashInHand(finalSocietyCash);

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleTx = async (type: 'INJECT' | 'WITHDRAW') => {
    const amt = parseFloat(formData.amount);
    if (!amt || !clientId) return;
    if (type === 'WITHDRAW' && amt > cashInHand && !showWarning) { setShowWarning(true); return; }

    try {
      await supabase.from('admin_fund_ledger').insert([{
        client_id: clientId, date: formData.date, amount: amt, type, description: formData.description
      }]);
      fetchAdminFundData();
      setFormData({ ...formData, amount: '', description: '' });
      setIsInjectModalOpen(false); setIsWithdrawModalOpen(false); setShowWarning(false);
    } catch (e) { alert("Failed to save"); }
  }

  const deleteTx = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from('admin_fund_ledger').delete().eq('id', id);
    fetchAdminFundData();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Fund Ledger</h1>
          <p className="text-gray-500">Track funds exchanged between Admin and Society</p>
        </div>
        <Button variant="outline" onClick={fetchAdminFundData}><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Balance</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.netBalance >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
              ₹{Math.abs(summary.netBalance).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">{summary.netBalance >= 0 ? 'Society owes Admin' : 'Admin owes Society'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex gap-2"><TrendingUp className="text-green-600 h-4 w-4"/> Total Injected</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">₹{summary.totalInjected.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex gap-2"><TrendingDown className="text-red-600 h-4 w-4"/> Total Withdrawn</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">₹{summary.totalWithdrawn.toLocaleString()}</div></CardContent>
        </Card>
        
        {/* Society Cash Available */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-purple-800 flex justify-between">Society Cash Available <Wallet className="h-4 w-4"/></CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(societyCashInHand)}
            </div>
            <p className="text-xs text-purple-600">Real-time cash in locker (All Sources)</p>
          </CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle className="flex gap-2"><DollarSign className="h-5 w-5"/> Cash in Hand (Admin Fund)</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-blue-600">₹{cashInHand.toLocaleString()}</div></CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Dialog open={isInjectModalOpen} onOpenChange={setIsInjectModalOpen}>
          <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700"><ArrowDownCircle className="mr-2 h-4 w-4"/> Inject Fund</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Inject Fund</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <Button onClick={() => handleTx('INJECT')} className="w-full bg-green-600">Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
          <DialogTrigger asChild><Button variant="destructive"><ArrowUpCircle className="mr-2 h-4 w-4"/> Withdraw Fund</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Withdraw Fund</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {showWarning && <Alert variant="destructive"><AlertTriangle className="h-4 w-4"/><AlertDescription>Amount exceeds balance! <Button size="sm" onClick={() => handleTx('WITHDRAW')} className="ml-2">Force</Button></AlertDescription></Alert>}
              <Input type="number" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              {!showWarning && <Button onClick={() => handleTx('WITHDRAW')} variant="destructive" className="w-full">Withdraw</Button>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader><CardTitle>Transaction Ledger</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow> :
               adminFundLedger.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-gray-500">No transactions yet.</TableCell></TableRow> :
               adminFundLedger.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell><Badge variant="outline" className={tx.type==='INJECT'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}>{tx.type}</Badge></TableCell>
                  <TableCell className={`text-right font-medium ${tx.type==='INJECT'?'text-green-600':'text-red-600'}`}>{tx.type==='INJECT'?'+':'-'}₹{Number(tx.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">₹{Math.abs(tx.runningBalance).toLocaleString()}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteTx(tx.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
