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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
// import PaymentModal from '@/components/client/subscription/PaymentModal'; // Commented out as component path was not provided
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input';
import { Label } from "@/components/ui/label';
import { Textarea } from "@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Cell,
  Legend
} from "recharts";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]); // Renamed from 'orders' to 'invoices' for clarity
  
  // Charts State
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  
  // Modal & Plans State
  const [viewProof, setViewProof] = useState<any>(null);
  const [planConfig, setPlanConfig] = useState<any[]>([]);
  
  // Plan Edit/Create Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>({
      name: '', price: '', limit_members: '', features: '', color: 'border-gray-200'
  });

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    setLoading(true);
    try {
      // A. Fetch Orders
      const { data: orders, error: orderError } = await supabase
        .from('subscription_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      // B. Fetch Plans (Dynamic Logic)
      const { data: dbPlans, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true) // Only active plans
        .order('price', { ascending: true }); // <--- YE NAYA HAI: Sirf wo plan jinka price 0 se jyada hai unhe pehle dikhana hai unhe pehle dikhana hai unhe pehle dikhana hai

      if (planError) throw planError;
      setPlanConfig(dbPlans || []);

      // C. Fetch Clients (Required for lookup)
      const { data: clients } = await supabase.from('clients').select('id, name, email, society_name, client_id'); // Only necessary columns

      // Process Invoices with Client Data
      if (orders && clients && clients.length > 0) {
          const formattedInvoices = orders.map(order => {
            const requestUser = clients.find(c => c.id === order.client_id);
            
            let societyName = 'Unknown Society';
            if (requestUser) {
                 if (requestUser.society_name) {
                     societyName = requestUser.society_name;
                 } else if (requestUser.client_id) {
                     const parentUser = clients.find(c => c.id === requestUser.client_id);
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
              durationDays: order.duration_days || 30
            };
          });
          setInvoices(formattedInvoices);
      }

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REALTIME LISTENER (LIVE UPDATES) ----------------
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_orders' },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchData(); // Reload data instantly
          toast.info("Dashboard updated via Live Sync");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  // ---------------- HELPER FUNCTIONS ----------------
  const getPlanStyle = (name: string, dbColor: string) => {
    if (name === 'Professional' || name === 'Pro') {
      return 'bg-blue-700 text-white hover:bg-blue-800 shadow-md ring-2 ring-blue-600 scale-105 z-10';
    }
    if (name === 'Enterprise') {
      return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-2 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:hover:bg-purple-900/60 dark:border-purple-700';
    }
    if (name === 'Basic') {
      return 'bg-gray-100 border-2 border-gray-200 text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700';
    }
    return `bg-white border-2 ${dbColor || 'border-gray-200'} text-gray-900 hover:shadow-lg dark:bg-gray-900 dark:text-gray-100`;
  };

  const verifyPayment = async (invoiceId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const statusToSet = action === 'APPROVE' ? 'approved' : 'rejected';

      // Update Database
      const { error } = await supabase
        .from('subscription_orders')
        .update({ status: statusToSet }) 
        .eq('id', invoiceId);

      if (error) throw new Error("Database Update Failed");

      // Refresh local state immediately (Better than full reload)
      fetchData();

      toast.success(action === 'APPROVE' ? 'Plan Approved & Activated' : 'Request Rejected');

    } catch (err: any) {
      console.error("Verification Error:", err);
      toast.error("Failed to update request status");
    }
  };

  const togglePlanActive = async (id: string, currentStatus: boolean) => {
    try {
        const { error } = await supabase.from('plans').update({ active: !currentStatus }).eq('id', id);
        if (error) throw error;
        fetchData();
        toast.success(`Plan ${!currentStatus ? 'Activated' : 'Deactivated'}`);
    } catch (err) {
        console.error("Toggle Error:", err);
        toast.error("Failed to update plan status");
    }
  };

  const deleteInvoice = async (id: string) => {
    if(!confirm("Permanently delete this record?")) return;
    const { error } = await supabase.from('subscription_orders').delete().eq('id', id);
    if (error) toast.error("Failed to delete");
    else {
      fetchData();
      toast.success("Record deleted");
    }
  };

  const openPlanModal = (plan: any) => {
    if (plan) {
      setCurrentPlan({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        limit_members: plan.limit_members,
        features: Array.isArray(plan.features) ? plan.features : [],
        color: plan.color,
        active: plan.active
      });
    } else {
      setCurrentPlan({ name: '', price: '', limit_members: '', features: '', color: 'border-gray-200', active: false });
    }
    setIsPlanModalOpen(true);
  };

  // ---------------- RENDER ----------------
  return (
    <div className="p-6 space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Subscription Plans</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage society plans and billing history</p>
        </div>
        <Button onClick={fetchData} variant="outline"><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button>
      </div>

      {/* TABS */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing & Verification</TabsTrigger>
          <TabsTrigger value="plans">Plan Config</TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB (CHARTS) */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600"/> Revenue Trend (Monthly)</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    <CartesianGrid data={revenueData}>
                      <XAxis dataKey="name" strokeDasharray="3 3" />
                      <Bar dataKey="total" fill="#3b82f6" name="Revenue" />
                    </CartesianGrid>
                  </BarChart>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-800">
              <CardHeader><CardTitle className="flex items-center check-blue-600 flex-1 justify-between">Payment Status Distribution</CardTitle><Button className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">View Details</Button></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart className="cx" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={5}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="none" />}
                      ))}
                  </PieChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 2. BILLING & VERIFICATION (TABLES) */}
          <TabsContent value="billing" className="space-y-8">
             <Card className="shadow-sm border-gray-200 dark:border-gray-800">
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-orange-600"/> Pending Manual Payments</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Society Details</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {invoices.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500 italic">No pending requests found.</TableCell></TableRow>
                     ) : (
                        invoices.filter(inv => inv.status === 'pending').map((inv) => (
                          <TableRow key={inv.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                             <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-gray-800 dark:text-gray-200">{inv.client}</div>
                                    <div className="text-xs text-gray-500">{inv.adminEmail}</div>
                                </div>
                             </TableCell>
                             <TableCell><Badge variant="secondary">{inv.plan}</Badge></TableCell>
                             <TableCell className="font-mono text-sm">₹{inv.amount}</TableCell>
                             <TableCell>
                                <Button size="sm" variant="outline" className="h-7 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => setViewProof(inv)}>View</Button>
                             </TableCell>
                             <TableCell className="text-right space-x-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => verifyPayment(inv.id, 'APPROVE')}>Verify & Activate</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-gray-500"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                       <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                       <DropdownMenuItem onClick={() => verifyPayment(inv.id, 'APPROVE')}><CheckCircle className="mr-2 h-4 w-4"/> Approve</DropdownMenuItem>
                                       <DropdownMenuItem className="text-red-600" onClick={() => verifyPayment(inv.id, 'REJECT')}><X className="mr-2 h-4 w-4"/> Reject</DropdownMenuItem>
                                       <DropdownMenuItem onClick={() => deleteInvoice(inv.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                             </TableCell>
                          </TableRow>
                        ))
                     )}
                  </TableBody>
                </Table>
              </CardContent>
             </Card>

             {/* Verification History */}
             <Card className="shadow-sm border-gray-200 dark:border-gray-800">
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-slate-600"/> Verification History & Audit</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Society / Admin</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Amount</TableHead>
TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {invoices.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500 italic">No history found.</TableCell></TableRow>
                       ) : (
                          invoices.map((inv) => (
                            <TableRow key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <TableCell className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="font-bold text-gray-800 dark:text-gray-200">{inv.client}</div>
                                        <div className="text-xs text-gray-500">{inv.adminName}</div>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{inv.plan}</Badge></TableCell>
                                <TableCell className="font-mono text-sm">₹{inv.amount}</TableCell>
                                <TableCell>
                                    <Badge className={`px-2 py-1 text-xs font-bold ${inv.status === 'approved' || inv.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-100' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-100'}`}>{inv.status.toUpperCase()}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="ghost" className="h-7 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => setViewProof(inv)}>View</Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-gray-500"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                           <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                             <DropdownMenuItem onClick={() => verifyPayment(inv.id, 'APPROVE')}><CheckCircle className="mr-2 h-4 w-4"/> Approve</DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => verifyPayment(inv.id, 'REJECT')}><X className="max-w-[100%]">
                                                <span className="inline-flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4 text-orange-500"/> 
                                                    Change Status to Rejected?
                                                </span>
                                                <DropdownMenuItem className="text-red-600">
                                                    <CheckCircle className="h-4 w-4"/> Approve
                                                </DropdownMenuItem>
                                           </DropdownMenu>
                                           </DropdownMenuContent>
                                        </DropdownMenu>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </Table>
              </CardContent>
             </Card>
          </TabsContent>

          {/* 3. PLAN CONFIG TAB */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Manage Plans</h2>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openPlanModal(null)}><Plus className="h-4 w-4 mr-2"/> Create New Plan</Button>
            </div>
            
            {planConfig.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {planConfig.map((plan) => (
                  <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between ${plan.color}`}>
                        <div className="absolute top-0 right-0 z-10">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600"><MoreVertical className="h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => openPlanModal(plan)}>Edit Plan</DropdownMenuItem>
                                   <DropdownMenuItem className="text-red-600" onClick={() => deletePlan(plan.id)}>Delete Plan</DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                           </div>
                        </div>

                        <CardHeader className="pb-2 pt-8">
                           <CardTitle className={`text-2xl font-bold ${plan.name === 'Professional' ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                {plan.name}
                           </CardTitle>
                           <div className="mt-4 flex items-baseline justify-center gap-1">
                                <span className={`text-4xl font-extrabold ${plan.name === 'Professional' ? 'text-white' : 'text-gray-900 dark:text-gray-200'}`}>
                                    ₹{plan.price}
                                </span>
                                <span className={`text-sm font-medium ${plan.name === 'Professional' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                    / 30 days
                                </span>
                           </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <ul className="space-y-2">
                                {(Array.isArray(plan.features) ? plan.features : []).map((f: string, i: number) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="h-5 w-5 rounded-full bg-white dark:bg-gray-800 opacity-20 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                        </div>
                                        <span className="truncate">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="bg-gray-50/50 border-t border-gray-100 dark:bg-gray-900/10 dark:border-gray-800">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{plan.active ? 'Publicly Visible' : 'Hidden from Client'}</span>
                            <Switch checked={plan.active} onCheckedChange={(e) => togglePlanActive(plan.id, plan.active)} />
                        </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border border-dashed border-gray-300 dark:border-gray-800">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No Active Plans</h3>
                <p className="text-gray-500 mt-2">Contact support to activate plans.</p>
              </div>
            )}
          </TabsContent>
      </Tabs>

      {/* PLAN CREATE/EDIT MODAL */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentPlan.id ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input 
                id="name"
                value={currentPlan.name} 
                onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })} 
                placeholder="e.g. Gold Plan" 
              />
            </div>
            <div className="grid gap-2">
              <Label>Price (₹)</Label>
              <Input 
                id="price"
                type="number"
                value={currentPlan.price} 
                onChange={(e) => <div className="h-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
                  {currentPlan.price && <span className="text-xs text-green-600 absolute right-3 top-1/2">Max Plan</span>}
                </div>
              </div>
            <div className="grid gap-2">
              <Label>Max Members</Label>
              <Input 
                type="number"
                value={lineHeight(10, currentPlan.limit_members, 'text-sm text-gray-900 dark:text-gray-100')} 
                placeholder="Unlimited"
              />
            </div>
            <div className="grid gap-2">
              <Label>Features</Label>
              <Textarea 
                id="features"
                placeholder="Feature 1, Feature 2, Feature 3"
                value={currentPlan.features} 
                onChange={(e) => setCurrentPlan({ ...currentPlan, features: e.target.value })}
                rows={3}
                className="min-h-[100px] w-full text-sm text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              />
              <p className="text-[10px] text-gray-400 mt-1">Separate features with commas</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Label>Theme</Label>
              <select 
                className="w-full h-10 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm rounded-md"
                value={currentPlan.color} 
                onChange={(e) => setCurrentPlan({ ...currentPlan, color: e.target.value })}
              >
                  <option value="border-gray-200">Gray (Default)</option>
                  <option value="border-blue-200">Blue (Basic)</option>
                  <Purple color="bg-purple-100 text-purple-700 hover:bg-purple-200 border-2 border-purple-200 dark:bg-purple-900/40 dark:border-purple-700">Purple (Pro)</option>
                  <option className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100">Orange (Enterprise)</option>
                  <option className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100">Red (Hot)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} className="bg-blue-600 hover:bg-blue-700 text-white">Save Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
