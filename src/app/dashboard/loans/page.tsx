'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, TrendingUp, Clock, Calendar, DollarSign, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('');

  const fetchLoans = async (cid: string) => {
    try {
      const res = await fetch(`/api/client/loans?client_id=${cid}`);
      if (res.ok) setLoans(await res.json());
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        setClientId(user.id);
        fetchLoans(user.id);
    }
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
      const updates: any = { status };
      if(status === 'active') updates.start_date = new Date().toISOString();
      
      const res = await fetch('/api/client/loans', {
          method: 'PUT', body: JSON.stringify({ id, ...updates })
      });
      
      if(res.ok) {
          toast.success(`Loan ${status}`);
          fetchLoans(clientId);
      } else {
          toast.error("Update Failed");
      }
  };

  const activeLoans = loans.filter(l => l.status === 'active');
  const pendingRequests = loans.filter(l => l.status === 'pending');
  const totalDisbursed = loans.filter(l => ['active', 'completed'].includes(l.status)).reduce((s, l) => s + Number(l.amount), 0);
  const outstanding = activeLoans.reduce((s, l) => s + Number(l.remaining_balance), 0);
  
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Loan Management</h1>
        <p className="text-slate-500 mt-2">Manage loan requests, approvals, and active loans</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row justify-between pb-2"><CardTitle className="text-sm">Active Loans</CardTitle><TrendingUp className="h-4 w-4 text-green-600"/></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{activeLoans.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row justify-between pb-2"><CardTitle className="text-sm">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-600"/></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row justify-between pb-2"><CardTitle className="text-sm">Disbursed</CardTitle><HandCoins className="h-4 w-4 text-blue-600"/></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{fmt(totalDisbursed)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row justify-between pb-2"><CardTitle className="text-sm">Outstanding</CardTitle><DollarSign className="h-4 w-4 text-orange-600"/></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{fmt(outstanding)}</div></CardContent></Card>
      </div>

      <div className="space-y-4">
        <Tabs defaultValue="requests">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="gap-2"><Clock className="h-4 w-4"/> Requests {pendingRequests.length>0 && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 rounded-full">{pendingRequests.length}</span>}</TabsTrigger>
            <TabsTrigger value="all-loans" className="gap-2"><Calendar className="h-4 w-4"/> All Loans <span className="bg-blue-100 text-blue-800 text-xs px-2 rounded-full">{loans.length}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
             <Card>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Amount</TableHead><TableHead>Duration</TableHead><TableHead>Rate</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {pendingRequests.map(l => (
                            <TableRow key={l.id}>
                                <TableCell><div className="flex items-center gap-2"><User className="w-4 h-4"/> {l.members?.name}</div></TableCell>
                                <TableCell className="font-bold">{fmt(l.amount)}</TableCell>
                                <TableCell>{l.duration_months} Months</TableCell>
                                <TableCell>{l.interest_rate}%</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={()=>handleStatusChange(l.id, 'rejected')}>Reject</Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={()=>handleStatusChange(l.id, 'active')}>Approve</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {pendingRequests.length === 0 && <TableRow><TableCell colSpan={5} className="text-center p-6 text-slate-500">No pending requests</TableCell></TableRow>}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="all-loans">
             <Card>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Amount</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead><TableHead>Start Date</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {loans.map(l => (
                            <TableRow key={l.id}>
                                <TableCell>{l.members?.name}</TableCell>
                                <TableCell>{fmt(l.amount)}</TableCell>
                                <TableCell className="font-bold text-orange-600">{fmt(l.remaining_balance)}</TableCell>
                                <TableCell><Badge variant={l.status==='active'?'default':l.status==='completed'?'outline':'secondary'}>{l.status}</Badge></TableCell>
                                <TableCell>{l.start_date || '-'}</TableCell>
                            </TableRow>
                        ))}
                        {loans.length === 0 && <TableRow><TableCell colSpan={5} className="text-center p-6 text-slate-500">No loans found</TableCell></TableRow>}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}