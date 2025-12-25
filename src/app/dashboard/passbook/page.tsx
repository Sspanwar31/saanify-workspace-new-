'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Wallet, Building2, Smartphone, CheckCircle, Loader2, Edit, Trash2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PassbookPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '', type: 'deposit', amount: '', payment_mode: 'CASH', description: '', date: new Date().toISOString().split('T')[0]
  });

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

  // Stats
  let cashBal = 0, bankBal = 0, upiBal = 0;
  entries.forEach(e => {
      const val = Number(e.amount);
      const isCredit = ['deposit', 'interest', 'installment'].includes(e.type);
      const amt = isCredit ? val : -val;
      if(e.payment_mode === 'BANK') bankBal += amt;
      else if(e.payment_mode === 'UPI') upiBal += amt;
      else cashBal += amt;
  });

  const handleSave = async () => {
     if(!formData.member_id || !formData.amount) return toast.error("Required fields missing");
     setIsSaving(true);
     try {
         const res = await fetch('/api/client/passbook', { 
            method: 'POST', 
            body: JSON.stringify({ ...formData, client_id: clientId }) 
         });
         if(!res.ok) throw new Error("Failed");
         toast.success("Transaction Added");
         setIsAddOpen(false);
         fetchData(clientId);
     } catch(e) { toast.error("Error saving"); }
     finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Delete transaction?")) return;
      await fetch(`/api/client/passbook?id=${id}`, { method: 'DELETE' });
      toast.success("Deleted");
      fetchData(clientId);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-slate-900">Passbook</h1><p className="text-slate-500">Financial transactions ledger</p></div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2"/> Add Entry</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50 border-emerald-200"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-emerald-700">CASH</span><Wallet className="w-4 h-4 text-emerald-600"/></div><div className="text-2xl font-bold text-emerald-800">{fmt(cashBal)}</div></CardContent></Card>
        <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-blue-700">BANK</span><Building2 className="w-4 h-4 text-blue-600"/></div><div className="text-2xl font-bold text-blue-800">{fmt(bankBal)}</div></CardContent></Card>
        <Card className="bg-purple-50 border-purple-200"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-purple-700">UPI</span><Smartphone className="w-4 h-4 text-purple-600"/></div><div className="text-2xl font-bold text-purple-800">{fmt(upiBal)}</div></CardContent></Card>
        <Card className="bg-slate-900 text-white"><CardContent className="p-4"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-300">TOTAL</span><CheckCircle className="w-4 h-4 text-green-400"/></div><div className="text-2xl font-bold">{fmt(cashBal+bankBal+upiBal)}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Member</TableHead><TableHead>Type</TableHead><TableHead>Mode</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
                {entries.map(e => (
                   <TableRow key={e.id}>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.members?.name || 'Unknown'}</TableCell>
                      <TableCell><Badge variant="outline" className="uppercase">{e.type}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{e.payment_mode}</Badge></TableCell>
                      <TableCell className={`font-bold ${['deposit','interest'].includes(e.type)?'text-green-600':'text-red-600'}`}>{['deposit','interest'].includes(e.type)?'+':'-'} {fmt(e.amount)}</TableCell>
                      <TableCell className="text-right"><Button size="icon" variant="ghost" className="text-red-500 h-6 w-6" onClick={()=>handleDelete(e.id)}><Trash2 className="w-4 h-4"/></Button></TableCell>
                   </TableRow>
                ))}
                {entries.length===0 && <TableRow><TableCell colSpan={6} className="text-center p-6 text-slate-500">No transactions found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
         <DialogContent>
             <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
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
                 <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600">{isSaving ? <Loader2 className="animate-spin"/> : 'Save Entry'}</Button>
             </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}