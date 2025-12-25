'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ArrowLeft, ExternalLink, Mail, Phone, MoreVertical, CreditCard, ShieldCheck, 
  Users, TrendingUp, AlertTriangle, CheckCircle, Trash2, Bell, FileText, Lock, RefreshCw, Activity
} from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ClientProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('clients').select('*').eq('id', id).single();
      if(data) setClient(data);
    };
    fetch();
  }, [id]);

  const handleDelete = async () => {
      if(!confirm("IRREVERSIBLE ACTION: Delete this client and ALL data?")) return;
      await supabase.from('clients').delete().eq('id', id);
      toast.success("Client Deleted");
      router.push('/admin/clients');
  };

  const handleAccess = () => {
      localStorage.setItem('impersonate_client', JSON.stringify(client));
      window.open('/dashboard', '_blank'); // Open in new tab as client
  };

  if (!client) return <div className="p-10 flex justify-center">Loading Profile...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"><ArrowLeft className="w-4 h-4"/> Back to Clients</Link>
      
      {/* HEADER CARD */}
      <Card className="bg-white shadow-sm border-slate-200 overflow-visible">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex gap-5 items-center">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-200">
                  {client.society_name?.charAt(0) || "C"}
              </div>
              <div>
                 <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.society_name || 'Unknown Society'}</h1>
                 <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><ShieldCheck className="w-3.5 h-3.5 text-blue-500"/> {client.name}</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Mail className="w-3.5 h-3.5 text-blue-500"/> {client.email}</span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Phone className="w-3.5 h-3.5 text-blue-500"/> {client.phone || '+91 --'}</span>
                 </div>
              </div>
           </div>
           <div className="flex gap-3 items-center">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 text-xs">ACTIVE</Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200 px-3 py-1 text-xs uppercase">{client.plan} PLAN</Badge>
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              <Button onClick={handleAccess} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"><ExternalLink className="w-4 h-4 mr-2"/> Access Panel</Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="rounded-full"><MoreVertical className="w-4 h-4"/></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Smart Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem><Bell className="mr-2 w-4 h-4 text-blue-500"/> Notify Client</DropdownMenuItem>
                  <DropdownMenuItem><FileText className="mr-2 w-4 h-4 text-purple-500"/> Statement & Ledger</DropdownMenuItem>
                  <DropdownMenuItem><RefreshCw className="mr-2 w-4 h-4 text-green-500"/> Renew / Change Plan</DropdownMenuItem>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem className="text-orange-600"><Lock className="mr-2 w-4 h-4"/> Lock Account</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </CardContent>
      </Card>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Members</p><h2 className="text-3xl font-bold text-slate-900 mt-2">245</h2></div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users className="w-5 h-5"/></div>
                </div>
            </CardContent>
         </Card>
         <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Loans</p><h2 className="text-3xl font-bold text-slate-900 mt-2">₹89,000</h2></div>
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><CreditCard className="w-5 h-5"/></div>
                </div>
            </CardContent>
         </Card>
         <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p><h2 className="text-3xl font-bold text-slate-900 mt-2">₹125,000</h2><p className="text-xs text-green-600 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> +12%</p></div>
                    <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp className="w-5 h-5"/></div>
                </div>
            </CardContent>
         </Card>
         <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Risk Level</p><h2 className="text-3xl font-bold text-green-600 mt-2">Low</h2></div>
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><AlertTriangle className="w-5 h-5"/></div>
                </div>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* SUBSCRIPTION STATUS */}
         <Card className="lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-50 py-4 px-6"><div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2 text-base"><Calendar className="w-4 h-4"/> Subscription Status</CardTitle><Button variant="outline" size="sm">Renew Plan</Button></div></CardHeader>
            <CardContent className="p-8">
               <div className="flex justify-between items-end mb-2">
                  <div>
                      <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                      <h3 className="text-3xl font-bold text-blue-600 uppercase">{client.plan} <span className="text-lg text-slate-400 font-normal">/ Monthly</span></h3>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold">Renewal Date</p>
                      <h4 className="text-xl font-bold text-slate-900">31 Dec 2025</h4>
                  </div>
               </div>
               <div className="mt-6">
                  <div className="flex justify-between text-xs mb-2 text-slate-500"><span>Plan Usage</span><span>12 Days Remaining</span></div>
                  <Progress value={65} className="h-3 bg-slate-100" />
                  <p className="text-xs text-right text-slate-400 mt-2">Auto-renewal enabled</p>
               </div>
            </CardContent>
         </Card>

         {/* ACCOUNT HEALTH */}
         <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-50 py-4 px-6"><CardTitle className="flex items-center gap-2 text-base"><Activity className="w-4 h-4"/> Account Health</CardTitle></CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center">
               <div className="relative mb-4">
                   <div className="w-32 h-32 rounded-full border-8 border-slate-50 flex items-center justify-center">
                       <span className="text-4xl font-bold text-green-600">92</span>
                   </div>
                   <div className="absolute top-0 right-0 bg-green-500 text-white p-1.5 rounded-full shadow-lg"><CheckCircle className="w-5 h-5"/></div>
               </div>
               <p className="text-sm text-slate-500">Overall Score</p>
               
               <div className="w-full mt-6 pt-6 border-t border-slate-50">
                  <div className="flex justify-between items-center">
                      <div><p className="text-xs text-slate-400">This Month Revenue</p><p className="text-xl font-bold text-slate-900">₹125,000</p></div>
                      <TrendingUp className="w-6 h-6 text-slate-300"/>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* DANGER ZONE */}
      <div className="border border-red-200 bg-red-50/50 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h3 className="text-red-700 font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Danger Zone</h3>
            <p className="text-sm text-red-600/80 mt-1">Irreversible actions. Deleting this client will remove all associated data.</p>
         </div>
         <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm shadow-red-200">
            <Trash2 className="w-4 h-4 mr-2"/> Delete Account
         </Button>
      </div>

    </div>
  );
}