'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  CreditCard, TrendingUp, AlertCircle, Check, X, CheckCircle, 
  Clock, Plus, Edit, Trash2, Eye, FileText, MoreVertical, 
  RefreshCw, Lock, Unlock, Mail, Shield, User, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  
  // MODAL STATES
  const [viewProof, setViewProof] = useState<any>(null);

  // --- 1. FETCH REAL DATA (SMART PARENT CHECK) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Orders
      const { data: orders, error } = await supabase
        .from('subscription_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ALL Clients to map relationships
      const { data: clients } = await supabase.from('clients').select('id, name, email, society_name, client_id');

      // Combine Data with Parent Check
      const formattedInvoices = orders?.map(order => {
        // Find the user who made the request
        const requestUser = clients?.find(c => c.id === order.client_id);
        
        // Check if this user is a sub-user (has a parent client_id)
        let societyName = 'Unknown Society';
        
        if (requestUser) {
           if (requestUser.society_name) {
             societyName = requestUser.society_name;
           } else if (requestUser.client_id) {
             // If user has no society name (e.g. Treasurer), find the Parent Owner
             const parentUser = clients?.find(c => c.id === requestUser.client_id);
             if (parentUser?.society_name) {
               societyName = `${parentUser.society_name} (via ${requestUser.name})`;
             }
           }
        }

        return {
          id: order.id,
          clientId: order.client_id, // Who made the payment
          client: societyName,
          adminName: requestUser?.name || 'Unknown User',
          adminEmail: requestUser?.email || 'N/A',
          plan: order.plan_name,
          amount: order.amount,
          // Normalize status to lowercase for filtering
          status: (order.status || 'pending').toLowerCase(),
          date: order.created_at,
          transactionId: order.transaction_id,
          durationDays: order.duration_days || 30
        };
      }) || [];

      setInvoices(formattedInvoices);

    } catch (err: any) {
      console.error("Error fetching subs:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. VERIFY PAYMENT (UPDATES OWNER, NOT SUB-USER) ---
  const verifyPayment = async (invoiceId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      // 1. Get Order
      const { data: orderData, error: fetchError } = await supabase
        .from('subscription_orders')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw new Error("Order not found");

      if (action === 'APPROVE') {
        // 2. Find who is the ACTUAL OWNER (Target ID)
        // Check if the person who ordered is a sub-user
        const { data: userProfile } = await supabase
          .from('clients')
          .select('id, client_id')
          .eq('id', orderData.client_id)
          .single();

        // Determine who gets the plan update
        // If user has a client_id (Parent), update Parent. Otherwise update User.
        const targetClientId = userProfile?.client_id ? userProfile.client_id : orderData.client_id;

        // 3. Update Client Table (The Main Owner)
        const startDate = new Date();
        const duration = orderData.duration_days || 30;
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + duration);

        const { error: clientError } = await supabase
          .from('clients')
          .update({
            plan_name: orderData.plan_name,
            plan: orderData.plan_name === 'Professional' ? 'PRO' : (orderData.plan_name === 'Basic' ? 'BASIC' : 'ENTERPRISE'),
            plan_start_date: startDate.toISOString(),
            plan_end_date: endDate.toISOString(),
            subscription_status: 'active'
          })
          .eq('id', targetClientId); // <--- CRITICAL FIX: Updates Parent ID

        if (clientError) throw new Error("Failed to update Plan: " + clientError.message);

        // 4. Update Order Status
        const { error: orderError } = await supabase
          .from('subscription_orders')
          .update({ status: 'approved' }) 
          .eq('id', invoiceId);
        
        if (orderError) throw orderError;
        
        toast.success(`Plan Approved & Updated for Owner ID: ${targetClientId}`);

      } else {
        // Reject Logic
        const { error } = await supabase
          .from('subscription_orders')
          .update({ status: 'rejected' })
          .eq('id', invoiceId);
        
        if (error) throw error;
        toast.info("Request Rejected");
      }

      // 5. Refresh Data
      await fetchData();
      setViewProof(null);

    } catch (err: any) {
      console.error("Verification Error:", err);
      toast.error("Action failed: " + err.message);
    }
  };

  const deleteInvoice = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    const { error } = await supabase.from('subscription_orders').delete().eq('id', id);
    if(error) toast.error("Delete failed");
    else { toast.success("Deleted"); fetchData(); }
  };

  // --- FILTERS (CASE INSENSITIVE) ---
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const historyInvoices = invoices.filter(inv => inv.status !== 'pending');

  const revenueData = [{name:'Aug', total:15000}, {name:'Sep', total:22000}, {name:'Oct', total:18000}, {name:'Nov', total:35000}, {name:'Dec', total:45000}];
  const pieData = [{name:'Paid', value: historyInvoices.filter(i => i.status === 'approved' || i.status === 'paid').length, color:'#10B981'}, {name:'Pending', value: pendingInvoices.length, color:'#F59E0B'}, {name:'Failed', value: historyInvoices.filter(i => i.status === 'rejected').length, color:'#EF4444'}];

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Command Center</h1>
          <p className="text-gray-500">Revenue, Verification & Plans</p>
        </div>
        <Button onClick={fetchData} variant="outline"><RefreshCw className="h-4 w-4 mr-2"/> Refresh Data</Button>
      </div>

      <Tabs defaultValue="billing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing & Verification</TabsTrigger>
          <TabsTrigger value="plans">Plan Config</TabsTrigger>
        </TabsList>

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

        <TabsContent value="billing" className="space-y-8">
           {/* PENDING REQUESTS */}
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
                                <Eye className="w-3 h-3 mr-1"/> Check Details
                             </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                             <Button size="sm" className="bg-green-600 h-8" onClick={() => { verifyPayment(inv.id, 'APPROVE'); }}><Check className="w-4 h-4 mr-1"/> Approve</Button>
                             <Button size="sm" variant="destructive" className="h-8" onClick={() => { verifyPayment(inv.id, 'REJECT'); }}><X className="w-4 h-4 mr-1"/> Reject</Button>
                          </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               ) : <p className="p-4 text-center text-gray-500 italic">No pending payment requests.</p>}
             </CardContent>
           </Card>

           {/* HISTORY LOG */}
           <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-slate-500"/> Verification History</CardTitle></CardHeader>
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
                             <Badge className={inv.status === 'approved' || inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {inv.status.toUpperCase()}
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

        <TabsContent value="plans">
            <div className="p-4 text-center text-gray-500">Plan Configuration</div>
        </TabsContent>
      </Tabs>

      {/* PROOF MODAL */}
      <Dialog open={!!viewProof} onOpenChange={() => setViewProof(null)}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Payment Details</DialogTitle></DialogHeader>
            <div className="bg-slate-100 h-64 flex flex-col items-center justify-center rounded-lg border-2 border-dashed relative">
               <FileText className="h-16 w-16 text-slate-300 mb-4"/>
               <p className="text-slate-500 font-medium">Transaction ID: {viewProof?.transactionId || 'N/A'}</p>
               <div className="bg-white p-4 rounded-md shadow-sm mt-4 text-xs text-left w-64 space-y-2">
                  <p><strong>Society:</strong> {viewProof?.client}</p>
                  <p><strong>Payer:</strong> {viewProof?.adminName} ({viewProof?.adminEmail})</p>
                  <p><strong>Amount:</strong> ₹{viewProof?.amount}</p>
                  <p><strong>Date:</strong> {viewProof ? new Date(viewProof.date).toLocaleDateString() : '-'}</p>
               </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-center">
               <Button variant="outline" onClick={() => setViewProof(null)}>Close</Button>
               {viewProof?.status === 'pending' && (
                 <Button className="bg-green-600" onClick={() => { verifyPayment(viewProof.id, 'APPROVE'); }}>Approve & Activate</Button>
               )}
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
