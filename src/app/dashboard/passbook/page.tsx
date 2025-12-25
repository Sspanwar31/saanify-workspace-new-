'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, HandCoins, Edit, Trash2, Calendar, User, ArrowUpDown, 
  TrendingUp, TrendingDown, DollarSign, Wallet, Building2, Smartphone, 
  CheckCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PassbookPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('');

  // Modal State
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    member_id: '', type: 'deposit', amount: '', payment_mode: 'CASH', description: '', date: new Date().toISOString().split('T')[0]
  });

  // 1. Fetch Data
  const fetchData = async (cid: string) => {
    try {
        const [txnRes, memRes] = await Promise.all([
            fetch(`/api/client/passbook?client_id=${cid}`),
            fetch(`/api/client/members?client_id=${cid}`)
        ]);
        if (txnRes.ok) setEntries(await txnRes.json());
        if (memRes.ok) setMembers(await memRes.json());
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        setClientId(user.id);
        fetchData(user.id);
    }
  }, []);

  // 2. Calculate Stats (Client Logic)
  let cashBal = 0, bankBal = 0, upiBal = 0;
  entries.forEach(e => {
      const val = parseFloat(e.amount);
      const isCredit = ['deposit', 'interest', 'installment'].includes(e.type);
      const amt = isCredit ? val : -val;
      
      if(e.payment_mode === 'BANK') bankBal += amt;
      else if(e.payment_mode === 'UPI') upiBal += amt;
      else cashBal += amt;
  });
  const totalLiquidity = cashBal + bankBal + upiBal;

  // 3. Actions
  const handleSave = async () => {
     if(!formData.member_id || !formData.amount) return toast.error("Required fields missing");
     
     const payload = { ...formData, client_id: clientId };
     const method = editId ? 'PUT' : 'POST';
     const body = editId ? { id: editId, ...formData } : payload;

     try {
         const res = await fetch('/api/client/passbook', { method, body: JSON.stringify(body) });
         if(!res.ok) throw new Error("Failed");
         toast.success(editId ? "Entry Updated" : "Entry Added");
         setIsAddEntryOpen(false);
         fetchData(clientId);
         setFormData({ member_id: '', type: 'deposit', amount: '', payment_mode: 'CASH', description: '', date: new Date().toISOString().split('T')[0] });
     } catch(e) { toast.error("Operation Failed"); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Delete transaction?")) return;
      await fetch(`/api/client/passbook?id=${id}`, { method: 'DELETE' });
      toast.success("Deleted");
      fetchData(clientId);
  };

  const openEdit = (e: any) => {
      setEditId(e.id);
      setFormData({ 
          member_id: e.member_id, type: e.type, amount: e.amount, 
          payment_mode: e.payment_mode || 'CASH', description: e.description, date: e.date 
      });
      setIsAddEntryOpen(true);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'loan': return <HandCoins className="h-4 w-4 text-red-600" />
      case 'interest': return <DollarSign className="h-4 w-4 text-blue-600" />
      case 'withdrawal': return <TrendingDown className="h-4 w-4 text-orange-600" />
      default: return <ArrowUpDown className="h-4 w-4 text-gray-600" />
    }
  };

  const getEntryTypeBadge = (type: string) => {
    const variants: any = {
      deposit: 'bg-green-100 text-green-800',
      loan: 'bg-red-100 text-red-800',
      interest: 'bg-blue-100 text-blue-800',
      withdrawal: 'bg-orange-100 text-orange-800'
    };
    return <Badge className={variants[type] || 'bg-gray-100'}>{type.toUpperCase()}</Badge>;
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-slate-900">Passbook</h1><p className="text-slate-500">Manage financial transactions</p></div>
        <div className="flex gap-2">
            <Button onClick={() => setIsLoanModalOpen(true)} className="bg-orange-600 hover:bg-orange-700"><HandCoins className="w-4 h-4 mr-2"/> Request Loan</Button>
            <Button onClick={() => {setEditId(null); setIsAddEntryOpen(true);}} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2"/> Add Entry</Button>
        </div>
      </div>

      {/* LIQUIDITY CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50 border-emerald-200"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-emerald-700">CASH</span><Wallet className="w-4 h-4 text-emerald-600"/></div><div className="text-2xl font-bold text-emerald-800">{fmt(cashBal)}</div></CardContent></Card>
        <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-blue-700">BANK</span><Building2 className="w-4 h-4 text-blue-600"/></div><div className="text-2xl font-bold text-blue-800">{fmt(bankBal)}</div></CardContent></Card>
        <Card className="bg-purple-50 border-purple-200"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-purple-700">UPI</span><Smartphone className="w-4 h-4 text-purple-600"/></div><div className="text-2xl font-bold text-purple-800">{fmt(upiBal)}</div></CardContent></Card>
        <Card className="bg-slate-900 text-white"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-300">TOTAL</span><CheckCircle className="w-4 h-4 text-green-400"/></div><div className="text-2xl font-bold">{fmt(totalLiquidity)}</div></CardContent></Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader><CardTitle className="flex gap-2"><Calendar className="w-5 h-5"/> Transaction History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {entries.map(e => (
                   <TableRow key={e.id}>
                      <TableCell>{e.date}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">{e.members?.name?.[0]}</div>{e.members?.name || 'Unknown'}</div></TableCell>
                      <TableCell><div className="flex gap-2 items-center">{getEntryTypeIcon(e.type)} {getEntryTypeBadge(e.type)}</div></TableCell>
                      <TableCell><Badge variant="secondary">{e.payment_mode}</Badge></TableCell>
                      <TableCell className={`font-bold ${['deposit','interest'].includes(e.type)?'text-green-600':'text-red-600'}`}>{['deposit','interest'].includes(e.type)?'+':'-'} {fmt(e.amount)}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={()=>openEdit(e)}><Edit className="w-4 h-4"/></Button>
                            <Button size="icon" variant="ghost" className="text-red-500" onClick={()=>handleDelete(e.id)}><Trash2 className="w-4 h-4"/></Button>
                         </div>
                      </TableCell>
                   </TableRow>
                ))}
                {entries.length===0 && <TableRow><TableCell colSpan={6} className="text-center p-6 text-slate-500">No transactions found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD ENTRY DIALOG */}
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
         <DialogContent>
             <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Transaction</DialogTitle></DialogHeader>
             <div className="space-y-3 py-2">
                 <div className="space-y-1"><Label>Member</Label>
                    <Select value={formData.member_id} onValueChange={v=>setFormData({...formData, member_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Member"/></SelectTrigger>
                        <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.phone})</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Type</Label><Select value={formData.type} onValueChange={v=>setFormData({...formData, type: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="deposit">Deposit</SelectItem><SelectItem value="withdrawal">Withdrawal</SelectItem><SelectItem value="loan">Loan</SelectItem><SelectItem value="interest">Interest</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1"><Label>Mode</Label><Select value={formData.payment_mode} onValueChange={v=>setFormData({...formData, payment_mode: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="CASH">Cash</SelectItem><SelectItem value="BANK">Bank</SelectItem><SelectItem value="UPI">UPI</SelectItem></SelectContent></Select></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1"><Label>Amount</Label><Input type="number" value={formData.amount} onChange={e=>setFormData({...formData, amount: e.target.value})}/></div>
                     <div className="space-y-1"><Label>Date</Label><Input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})}/></div>
                 </div>
                 <div className="space-y-1"><Label>Description</Label><Input value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})}/></div>
                 <Button onClick={handleSave} className="w-full bg-blue-600">{editId ? 'Update' : 'Save Entry'}</Button>
             </div>
         </DialogContent>
      </Dialog>
      
      {/* LOAN DIALOG (Placeholder for now) */}
      <Dialog open={isLoanModalOpen} onOpenChange={setIsLoanModalOpen}>
         <DialogContent><DialogHeader><DialogTitle>Loan Request</DialogTitle></DialogHeader><div className="text-center py-4">Loan Module Loading...</div></DialogContent>
      </Dialog>
    </div>
  );
}