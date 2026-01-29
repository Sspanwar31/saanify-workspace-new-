'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  CreditCard, TrendingUp, AlertCircle, Check, X, CheckCircle, 
  Clock, Plus, Edit, Trash2, Eye, FileText, MoreVertical, 
  RefreshCw, Lock, Unlock, Mail, Shield, User, Loader2,
  LayoutDashboard, Database, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// Added these imports for the Plan Form
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  
  // Charts State
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  
  // Modal & Plans State
  const [viewProof, setViewProof] = useState<any>(null);
  const [planConfig, setPlanConfig] = useState<any[]>([]); // Now Dynamic

  // Plan Edit/Create Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>({
      name: '', price: '', limit_members: '', features: '', color: 'border-gray-200'
  });

  // --- 1. FETCH DATA & CALCULATE CHARTS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // A. Fetch Orders
      const { data: orders, error: orderError } = await supabase
        .from('subscription_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      // B. Fetch Plans from Database (NEW)
      const { data: dbPlans, error: planError } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (planError) throw planError;
      setPlanConfig(dbPlans || []);

      // C. Fetch Clients
      const { data: clients } = await supabase.from('clients').select('id, name, email, society_name, client_id');

      // Process Invoices
      const formattedInvoices = orders?.map(order => {
        const requestUser = clients?.find(c => c.id === order.client_id);
        
        let societyName = 'Unknown Society';
        if (requestUser) {
           if (requestUser.society_name) {
             societyName = requestUser.society_name;
           } else if (requestUser.client_id) {
             const parentUser = clients?.find(c => c.id === requestUser.client_id);
             if (parentUser?.society_name) {
               societyName = `${parentUser.society_name} (via ${requestUser.name})`;
             }
           }
        }

        return {
          id: order.id,
          clientId: order.client_id,
          client: societyName,
          adminName: requestUser?.name || 'Unknown User',
          adminEmail: requestUser?.email || 'N/A',
          plan: order.plan_name,
          amount: order.amount,
          status: (order.status || 'pending').toLowerCase(),
          date: order.created_at,
          transactionId: order.transaction_id,
          durationDays: order.duration_days || 30,
          screenshot_url: order.screenshot_url // ADDED: To show in modal
        };
      }) || [];

      setInvoices(formattedInvoices);

      // --- CALCULATE CHARTS (BACKEND CONNECTED) ---
      
      // 1. Revenue Chart (Group by Month)
      const monthMap: any = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      orders?.forEach(order => {
         if(order.status === 'approved' || order.status === 'success' || order.status === 'paid') {
             const d = new Date(order.created_at);
             const mName = monthNames[d.getMonth()];
             if(!monthMap[mName]) monthMap[mName] = 0;
             monthMap[mName] += order.amount;
         }
      });
      
      const revChart = Object.keys(monthMap).map(key => ({ name: key, total: monthMap[key] }));
      setRevenueData(revChart.length > 0 ? revChart : [{name: 'No Data', total: 0}]);

      // 2. Pie Chart (Status Distribution)
      const statusCounts = { paid: 0, pending: 0, rejected: 0 };
      orders?.forEach(order => {
         const st = (order.status || 'pending').toLowerCase();
         if(st === 'approved' || st === 'success' || st === 'paid') statusCounts.paid++;
         else if(st === 'pending') statusCounts.pending++;
         else if(st === 'rejected') statusCounts.rejected++;
      });

      setPieData([
         { name: 'Paid/Active', value: statusCounts.paid, color: '#10B981' }, // Green
         { name: 'Pending', value: statusCounts.pending, color: '#F59E0B' }, // Orange
         { name: 'Rejected', value: statusCounts.rejected, color: '#EF4444' }  // Red
      ]);

    } catch (err: any) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // --- REALTIME LISTENER (LIVE UPDATES) ---
  useEffect(() => {
    fetchData();

    // Subscribe to changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_orders' }, (payload) => {
          console.log('Realtime update:', payload);
          fetchData(); // Reload data instantly
          toast.info("Dashboard updated via Live Sync");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  // --- 2. VERIFY PAYMENT ---
  const verifyPayment = async (invoiceId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const statusToSet = action === 'APPROVE' ? 'approved' : 'rejected';

      const { error: orderError } = await supabase
        .from('subscription_orders')
        .update({ status: statusToSet }) 
        .eq('id', invoiceId);
      
      if (orderError) throw new Error("Database Update Failed: " + orderError.message);

      if (action === 'APPROVE') {
        const { data: orderData } = await supabase.from('subscription_orders').select('*').eq('id', invoiceId).single();
        if(!orderData) throw new Error("Order data missing");

        const { data: userProfile } = await supabase.from('clients').select('id, client_id').eq('id', orderData.client_id).single();
        const targetClientId = userProfile?.client_id ? userProfile.client_id : orderData.client_id;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (orderData.duration_days || 30));

        const { error: clientError } = await supabase
          .from('clients')
          .update({
            plan_name: orderData.plan_name,
            plan: orderData.plan_name === 'Professional' ? 'PRO' : (orderData.plan_name === 'Basic' ? 'BASIC' : 'ENTERPRISE'),
            plan_start_date: startDate.toISOString(),
            plan_end_date: endDate.toISOString(),
            subscription_status: 'active'
          })
          .eq('id', targetClientId);

        if (clientError) throw new Error("Client Plan Update Failed: " + clientError.message);
        toast.success("Plan Approved & Updated Successfully");
      } else {
        toast.info("Request Rejected");
      }

      // Optimistic UI Update
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status: action === 'APPROVE' ? 'approved' : 'rejected' } : inv
      ));
      setViewProof(null);

    } catch (err: any) {
      console.error("Verification Error:", err);
      toast.error(err.message);
    }
  };

  const deleteInvoice = async (id: string) => {
    if(!confirm("Permanently delete this record?")) return;
    
    // Check if permission exists first
    const { error } = await supabase.from('subscription_orders').delete().eq('id', id);
    
    if(error) {
        console.error("Delete Error:", error);
        toast.error("Failed to delete. Check Database Permissions.");
    } else { 
        toast.success("Record Deleted Permanently"); 
        setInvoices(prev => prev.filter(i => i.id !== id));
        fetchData(); // Sync charts
    }
  };

  // --- NEW PLAN MANAGEMENT FUNCTIONS ---

  // A. Toggle Active Status
  const togglePlanActive = async (id: string, currentStatus: boolean) => {
    try {
        const { error } = await supabase.from('plans').update({ active: !currentStatus }).eq('id', id);
        if(error) throw error;
        toast.success(`Plan ${!currentStatus ? 'Activated' : 'Deactivated'}`);
        fetchData(); // Reload to reflect changes
    } catch(err: any) {
        toast.error("Update failed: " + err.message);
    }
  };

  // B. Delete Plan
  const deletePlan = async (id: string) => {
    if(!confirm("Are you sure? This will hide the plan from clients but keep history.")) return;
    try {
        const { error } = await supabase.from('plans').delete().eq('id', id);
        if(error) throw error;
        toast.success("Plan Deleted Successfully");
        fetchData();
    } catch(err: any) {
        toast.error("Delete failed: " + err.message);
    }
  };

  // C. Open Modal (Create or Edit)
  const openPlanModal = (plan: any = null) => {
      if (plan) {
          // Editing existing plan
          setCurrentPlan({
              id: plan.id,
              name: plan.name,
              price: plan.price,
              limit_members: plan.limit_members,
              features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features,
              color: plan.color
          });
      } else {
          // Creating New
          setCurrentPlan({ name: '', price: '', limit_members: '', features: '', color: 'border-blue-200' });
      }
      setIsPlanModalOpen(true);
  };

  // D. Save Plan (Insert or Update)
  const handleSavePlan = async () => {
      if(!currentPlan.name || !currentPlan.price) return toast.error("Name and Price are required");

      // Convert comma string back to array
      const featureArray = currentPlan.features.split(',').map((f:string) => f.trim()).filter((f:string) => f !== '');
      
      const payload = {
          name: currentPlan.name,
          price: Number(currentPlan.price),
          limit_members: currentPlan.limit_members,
          features: featureArray,
          color: currentPlan.color,
          active: true
      };

      try {
          if(currentPlan.id) {
              // Update
              const { error } = await supabase.from('plans').update(payload).eq('id', currentPlan.id);
              if(error) throw error;
              toast.success("Plan Updated");
          } else {
              // Create
              const { error } = await supabase.from('plans').insert([payload]);
              if(error) throw error;
              toast.success("New Plan Created");
          }
          setIsPlanModalOpen(false);
          fetchData();
      } catch(err: any) {
          toast.error("Save failed: " + err.message);
      }
  };

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const historyInvoices = invoices.filter(inv => inv.status !== 'pending');

  if (loading) return <div className="p-20 flex justify-center flex-col items-center gap-4"><Loader2 className="animate-spin h-10 w-10 text-blue-600"/><p className="text-slate-500">Syncing Subscription Data...</p></div>;

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Command Center</h1>
          <p className="text-gray-500">Revenue, Verification & Plan Management</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4"/> Sync Now</Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing & Verification</TabsTrigger>
          <TabsTrigger value="plans">Plan Config</TabsTrigger>
        </TabsList>

        {/* --- OVERVIEW TAB (CONNECTED CHARTS) --- */}
        <TabsContent value="overview" className="space-y-6">
           <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                 <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600"/> Revenue Trend (Monthly)</CardTitle></CardHeader>
                 <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name"/>
                            <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4,4,0,0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>
              <Card className="shadow-sm">
                 <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-green-600"/> Payment Status Distribution</CardTitle></CardHeader>
                 <CardContent className="h-[300px] flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={5}>
                                {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>
           </div>
           
           {/* Quick Stats Summary */}
           <div className="grid grid-cols-3 gap-4">
               <Card className="bg-blue-50 border-blue-100"><CardContent className="p-6 text-center"><p className="text-sm text-blue-600 font-bold uppercase">Total Revenue</p><h3 className="text-2xl font-bold text-blue-900">₹{revenueData.reduce((a, b) => a + b.total, 0).toLocaleString()}</h3></CardContent></Card>
               <Card className="bg-green-50 border-green-100"><CardContent className="p-6 text-center"><p className="text-sm text-green-600 font-bold uppercase">Successful Orders</p><h3 className="text-2xl font-bold text-green-900">{pieData.find(p => p.name.includes('Paid'))?.value || 0}</h3></CardContent></Card>
               <Card className="bg-orange-50 border-orange-100"><CardContent className="p-6 text-center"><p className="text-sm text-orange-600 font-bold uppercase">Pending Actions</p><h3 className="text-2xl font-bold text-orange-900">{pieData.find(p => p.name.includes('Pending'))?.value || 0}</h3></CardContent></Card>
           </div>
        </TabsContent>

        {/* --- BILLING TAB (TABLES) --- */}
        <TabsContent value="billing" className="space-y-8">
           <Card className="border-orange-200 bg-orange-50/30 shadow-sm">
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
                          <TableCell className="font-bold">₹{inv.amount.toLocaleString()}</TableCell>
                          <TableCell>
                             <Button size="sm" variant="outline" onClick={() => setViewProof(inv)} className="h-7 text-xs border-blue-200 text-blue-700 bg-blue-50">
                                <Eye className="w-3 h-3 mr-1"/> View
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
               ) : <p className="p-8 text-center text-gray-500 italic flex flex-col items-center"><CheckCircle className="h-8 w-8 text-green-200 mb-2"/>All caught up! No pending requests.</p>}
             </CardContent>
           </Card>

           <Card className="shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-slate-500"/> Verification History & Audit</CardTitle></CardHeader>
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
                          <TableCell className="font-mono text-sm">₹{inv.amount.toLocaleString()}</TableCell>
                          <TableCell>
                             <Badge className={inv.status === 'approved' || inv.status === 'paid' || inv.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
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
                                   <DropdownMenuItem onClick={() => deleteInvoice(inv.id)} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4"/> Permanently Delete</DropdownMenuItem>
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

        {/* --- PLAN CONFIG TAB (DYNAMIC & INTERACTIVE) --- */}
        <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Manage Plans</h2>
                <Button className="bg-blue-600" onClick={() => openPlanModal(null)}><Plus className="h-4 w-4 mr-2"/> Create New Plan</Button>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
                {planConfig.map((plan) => (
                    <Card key={plan.id} className={`relative border-2 ${plan.color} transition-all ${!plan.active ? 'opacity-70 grayscale' : 'shadow-sm hover:shadow-md'}`}>
                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 bg-white/50 rounded-full" onClick={() => openPlanModal(plan)}><Edit className="h-3.5 w-3.5"/></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600 bg-white/50 rounded-full" onClick={() => deletePlan(plan.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex justify-between items-center">
                                {plan.name}
                                {!plan.active && <Badge variant="destructive" className="text-[10px] h-5 ml-2">Inactive</Badge>}
                            </CardTitle>
                            <div className="mt-2">
                                <span className="text-3xl font-bold">₹{plan.price}</span>
                                <span className="text-xs text-gray-500">/mo</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">{plan.limit_members}</p>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm min-h-[80px]">
                                {(Array.isArray(plan.features) ? plan.features : []).map((f:any, i:number) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-600">
                                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0"/> <span className="truncate">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 flex justify-between items-center py-3 border-t">
                            <span className="text-xs font-medium text-gray-600">{plan.active ? 'Publicly Visible' : 'Hidden from Client'}</span>
                            <Switch checked={plan.active} onCheckedChange={() => togglePlanActive(plan.id, plan.active)} />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>

      {/* PLAN CREATE/EDIT MODAL */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{currentPlan.id ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Name</Label>
                      <Input id="name" value={currentPlan.name} onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})} className="col-span-3" placeholder="e.g. Gold Plan" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Price (₹)</Label>
                      <Input id="price" type="number" value={currentPlan.price} onChange={(e) => setCurrentPlan({...currentPlan, price: e.target.value})} className="col-span-3" placeholder="4000" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Members</Label>
                      <Input id="limit" value={currentPlan.limit_members} onChange={(e) => setCurrentPlan({...currentPlan, limit_members: e.target.value})} className="col-span-3" placeholder="e.g. 500 Members" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Features</Label>
                      <Textarea id="features" value={currentPlan.features} onChange={(e) => setCurrentPlan({...currentPlan, features: e.target.value})} className="col-span-3" placeholder="Feature 1, Feature 2, Feature 3" />
                      <p className="text-[10px] text-gray-400 col-start-2 col-span-3">Separate features with commas</p>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Theme</Label>
                      <select className="col-span-3 border rounded p-2 text-sm" value={currentPlan.color} onChange={(e) => setCurrentPlan({...currentPlan, color: e.target.value})}>
                          <option value="border-gray-200">Gray (Default)</option>
                          <option value="border-blue-200">Blue (Basic)</option>
                          <option value="border-purple-200">Purple (Pro)</option>
                          <option value="border-orange-200">Orange (Enterprise)</option>
                          <option value="border-green-200">Green (Special)</option>
                          <option value="border-red-200">Red (Hot)</option>
                      </select>
                  </div>
              </div>
              <DialogFooter>
                  <Button type="submit" onClick={handleSavePlan}>Save Plan</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* PROOF MODAL */}
      <Dialog open={!!viewProof} onOpenChange={() => setViewProof(null)}>
         <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Payment Verification</DialogTitle></DialogHeader>
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col items-center text-center space-y-4">
               <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                   <FileText className="h-6 w-6"/>
               </div>
               <div>
                   <p className="text-sm text-slate-500 font-mono mb-1">TXN: {viewProof?.transactionId || 'MANUAL-PAY'}</p>
                   <h3 className="text-2xl font-bold text-slate-800">₹{viewProof?.amount?.toLocaleString()}</h3>
                   <Badge variant="outline" className="mt-2">{viewProof?.plan}</Badge>
               </div>
               <div className="w-full bg-white p-4 rounded border border-slate-100 text-left text-sm space-y-2">
                  <div className="flex justify-between">
                      <span className="text-slate-500">Society:</span>
                      <span className="font-medium">{viewProof?.client}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-slate-500">Payer:</span>
                      <span className="font-medium">{viewProof?.adminName}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-xs">{viewProof?.adminEmail}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium">{viewProof ? new Date(viewProof.date).toLocaleDateString() : '-'}</span>
                  </div>
               </div>

               {/* --- SCREENSHOT DISPLAY LOGIC --- */}
               {viewProof?.screenshot_url && (
                  <div className="w-full mt-4 border rounded-lg overflow-hidden bg-gray-100">
                    <p className="text-xs text-gray-500 p-2 border-b bg-gray-50 text-left">Payment Screenshot</p>
                    <a href={viewProof.screenshot_url} target="_blank" rel="noreferrer">
                      <img 
                        src={viewProof.screenshot_url} 
                        alt="Payment Proof" 
                        className="w-full h-auto object-contain max-h-64 hover:opacity-90 transition cursor-zoom-in" 
                      />
                    </a>
                    <a href={viewProof.screenshot_url} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 p-2 bg-blue-50 hover:underline">
                      Click to Open Full Image
                    </a>
                  </div>
               )}
            </div>
            <DialogFooter className="grid grid-cols-2 gap-2 mt-2">
               <Button variant="outline" onClick={() => setViewProof(null)}>Close</Button>
               {viewProof?.status === 'pending' && (
                 <Button className="bg-green-600 w-full" onClick={() => { verifyPayment(viewProof.id, 'APPROVE'); }}>Verify & Activate</Button>
               )}
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
