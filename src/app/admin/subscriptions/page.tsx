'use client';

import { useState, useEffect } from 'react';
import { useAdminStore, AdminPlan, Invoice } from '@/lib/admin/store';
import { 
  CreditCard, TrendingUp, AlertCircle, Check, X, CheckCircle, 
  Clock, Plus, Edit, Trash2, Eye, FileText, MoreVertical, 
  RefreshCw, Lock, Unlock, Mail, Shield, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function SubscriptionPage() {
  const { invoices, plans, verifyPayment, deleteInvoice, addPlan, updatePlan, deletePlan, togglePlanStatus } = useAdminStore();
  const [isMounted, setIsMounted] = useState(false);
  
  // MODAL STATES
  const [viewProof, setViewProof] = useState<Invoice | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);

  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return <div className="p-8">Loading...</div>;

  // SEPARATE LISTS
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING');
  const historyInvoices = invoices.filter(inv => inv.status !== 'PENDING');

  // MOCK DATA FOR CHARTS
  const revenueData = [{name:'Aug', total:15000}, {name:'Sep', total:22000}, {name:'Oct', total:18000}, {name:'Nov', total:35000}, {name:'Dec', total:45000}];
  const pieData = [{name:'Paid', value:12, color:'#10B981'}, {name:'Pending', value:3, color:'#F59E0B'}, {name:'Failed', value:1, color:'#EF4444'}];

  const handlePlanSave = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const planData = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      limit: Number(formData.get('limit')),
      features: (formData.get('features') as string).split(',').map(f => f.trim()),
      color: 'bg-white border-slate-200',
      isActive: true
    };

    if (editingPlan) {
      updatePlan(editingPlan.id, planData);
      toast.success("Plan Updated");
    } else {
      const newPlan = {
        id: `PLAN-${Date.now()}`,
        ...planData
      };
      addPlan(newPlan as AdminPlan);
      toast.success("Plan Created");
    }
    setIsPlanModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Command Center</h1>
          <p className="text-gray-500">Revenue, Verification & Plans</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing & Verification</TabsTrigger>
          <TabsTrigger value="plans">Plan Config</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW (Kept as requested) */}
        <TabsContent value="overview" className="space-y-6">
           <div className="grid gap-6 md:grid-cols-2">
              <Card>
                 <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                 <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><Tooltip formatter={(val) => `₹${val}`} /><Bar dataKey="total" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
                 </CardContent>
              </Card>
              <Card>
                 <CardHeader><CardTitle>Payment Status Distribution</CardTitle></CardHeader>
                 <CardContent className="h-[300px] flex justify-center">
                    <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">{pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* TAB 2: BILLING & VERIFICATION (Detailed Table) */}
        <TabsContent value="billing" className="space-y-8">
           
           {/* A. PENDING REQUESTS */}
           <Card className="border-orange-200 bg-orange-50/30">
             <CardHeader><CardTitle className="text-orange-800 flex items-center gap-2"><AlertCircle className="h-5 w-5"/> Pending Manual Payments</CardTitle></CardHeader>
             <CardContent>
               {pendingInvoices.length > 0 ? (
                 <Table>
                   <TableHeader><TableRow><TableHead>Society Details</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Proof</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                   <TableBody>
                     {pendingInvoices.map((inv) => (
                       <TableRow key={inv.id} className="bg-white">
                          <TableCell>
                             <div className="font-bold text-slate-800">{inv.client}</div>
                             <div className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3"/> {inv.adminName}</div>
                             <div className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3"/> {inv.adminEmail}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{inv.plan}</Badge></TableCell>
                          <TableCell className="font-bold">₹{inv.amount}</TableCell>
                          <TableCell>
                             <Button size="sm" variant="outline" onClick={() => setViewProof(inv)} className="h-7 text-xs border-blue-200 text-blue-700 bg-blue-50">
                                <Eye className="w-3 h-3 mr-1"/> View Screenshot
                             </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                             <Button size="sm" className="bg-green-600 h-8" onClick={() => { verifyPayment(inv.id, 'APPROVE'); toast.success("Approved"); }}><Check className="w-4 h-4 mr-1"/> Approve</Button>
                             <Button size="sm" variant="destructive" className="h-8" onClick={() => { verifyPayment(inv.id, 'REJECT'); toast.error("Rejected"); }}><X className="w-4 h-4 mr-1"/> Reject</Button>
                          </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               ) : <p className="p-4 text-center text-gray-500 italic">No pending payment requests.</p>}
             </CardContent>
           </Card>

           {/* B. DETAILED HISTORY LOG */}
           <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-slate-500"/> Verification History (Audit Log)</CardTitle></CardHeader>
              <CardContent>
                 <Table>
                   <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Society / Admin</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Proof</TableHead><TableHead className="text-right">Manage</TableHead></TableRow></TableHeader>
                   <TableBody>
                     {historyInvoices.map((inv) => (
                       <TableRow key={inv.id}>
                          <TableCell className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                             <div className="font-medium text-sm">{inv.client}</div>
                             <div className="text-[10px] text-slate-400">{inv.adminName}</div>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{inv.plan}</Badge></TableCell>
                          <TableCell className="font-mono text-sm">₹{inv.amount}</TableCell>
                          <TableCell>
                             <Badge className={inv.status === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                                {inv.status === 'PAID' ? 'APPROVED' : 'REJECTED'}
                             </Badge>
                          </TableCell>
                          <TableCell>
                             <Button size="sm" variant="ghost" onClick={() => setViewProof(inv)} className="h-6 w-6 p-0 text-blue-500">
                                <FileText className="h-4 w-4"/>
                             </Button>
                          </TableCell>
                          <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                   <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                   <DropdownMenuItem onClick={() => verifyPayment(inv.id, 'APPROVE')}><CheckCircle className="mr-2 h-4 w-4 text-green-600"/> Mark as Approved</DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => verifyPayment(inv.id, 'REJECT')}><X className="mr-2 h-4 w-4 text-red-600"/> Mark as Rejected</DropdownMenuItem>
                                   <DropdownMenuLabel>Danger Zone</DropdownMenuLabel>
                                   <DropdownMenuItem onClick={() => deleteInvoice(inv.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4"/> Delete Record</DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

        {/* TAB 3: PLAN CONFIG (Restored Buttons) */}
        <TabsContent value="plans">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Manage Plans</h3>
              <Button onClick={() => { setEditingPlan(null); setIsPlanModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                 <Plus className="mr-2 h-4 w-4"/> Create New Plan
              </Button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                 <Card key={plan.id} className={`${plan.color} border-2 ${!plan.isActive ? 'opacity-60 grayscale' : ''} transition-all relative group`}>
                    <CardHeader>
                       <div className="flex justify-between items-start">
                         <CardTitle className="text-lg">{plan.name}</CardTitle>
                         {/* RESTORED EDIT/DELETE BUTTONS */}
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white/80 p-1 rounded-md shadow-sm">
                            <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-blue-600" onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }}><Edit className="h-3 w-3"/></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => deletePlan(plan.id)}><Trash2 className="h-3 w-3"/></Button>
                         </div>
                       </div>
                       <div className="text-3xl font-bold mt-2">₹{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                       <p className="text-xs text-gray-500 mt-1">Limit: {plan.limit === 99999 ? 'Unlimited' : plan.limit} Members</p>
                    </CardHeader>
                    <CardContent>
                       <ul className="space-y-2 mb-4 min-h-[80px]">
                          {plan.features.map((f, i) => <li key={i} className="text-xs flex gap-2 items-start"><CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0"/> {f}</li>)}
                       </ul>
                       <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                          <span className="text-sm font-medium text-slate-600">Active Status</span>
                          <Switch checked={plan.isActive} onCheckedChange={() => togglePlanStatus(plan.id)} />
                       </div>
                    </CardContent>
                 </Card>
              ))}
           </div>
        </TabsContent>
      </Tabs>

      {/* --- PROOF MODAL (Visual) --- */}
      <Dialog open={!!viewProof} onOpenChange={() => setViewProof(null)}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
            <div className="bg-slate-100 h-96 flex flex-col items-center justify-center rounded-lg border-2 border-dashed relative">
               {/* In Real App: <img src={viewProof?.proofUrl} /> */}
               <FileText className="h-16 w-16 text-slate-300 mb-4"/>
               <p className="text-slate-500 font-medium">Screenshot Preview</p>
               <div className="bg-white p-4 rounded-md shadow-sm mt-4 text-xs text-left w-64 space-y-2">
                  <p><strong>Transaction ID:</strong> {viewProof?.transactionId || 'N/A'}</p>
                  <p><strong>Amount:</strong> ₹{viewProof?.amount}</p>
                  <p><strong>Date:</strong> {viewProof?.date}</p>
               </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-center">
               <Button variant="outline" onClick={() => setViewProof(null)}>Close</Button>
               {viewProof?.status === 'PENDING' && (
                 <Button className="bg-green-600" onClick={() => { verifyPayment(viewProof.id, 'APPROVE'); setViewProof(null); toast.success("Approved"); }}>Approve Now</Button>
               )}
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* --- PLAN FORM MODAL --- */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
         <DialogContent>
            <DialogHeader><DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle></DialogHeader>
            <form onSubmit={handlePlanSave} className="space-y-4 py-4">
               <div className="space-y-2"><Label>Plan Name</Label><Input name="name" defaultValue={editingPlan?.name} required placeholder="e.g. Starter"/></div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Price (₹)</Label><Input name="price" type="number" defaultValue={editingPlan?.price} required /></div>
                  <div className="space-y-2"><Label>Member Limit</Label><Input name="limit" type="number" defaultValue={editingPlan?.limit} required /></div>
               </div>
               <div className="space-y-2"><Label>Features (comma separated)</Label><Input name="features" defaultValue={editingPlan?.features.join(',')} placeholder="Feature 1, Feature 2"/></div>
               <DialogFooter><Button type="submit">Save Plan</Button></DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  );
}