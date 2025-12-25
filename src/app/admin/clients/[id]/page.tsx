'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Mail, Phone, MoreVertical, CreditCard, ShieldCheck, Users, TrendingUp, AlertTriangle, CheckCircle, Trash2, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ClientProfile() {
  const { id } = useParams(); // Get ID from URL
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
      if(error) {
        toast.error("Client not found");
        router.push('/admin/clients'); // Redirect if invalid
      } else {
        setClient(data);
      }
      setLoading(false);
    };
    fetch();
  }, [id, router]);

  const handleDelete = async () => {
      if(!confirm("IRREVERSIBLE: Delete this client?")) return;
      await supabase.from('clients').delete().eq('id', id);
      toast.success("Client Deleted");
      router.push('/admin/clients');
  };

  const handleAccess = () => {
      localStorage.setItem('current_user', JSON.stringify(client)); // Impersonate
      window.open('/dashboard', '_blank');
  };

  // SAFE LOADING STATE to prevent Crash
  if (loading) return <div className="h-screen flex items-center justify-center">Loading Client Profile...</div>;
  if (!client) return <div className="h-screen flex items-center justify-center">Client Not Found</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"><ArrowLeft className="w-4 h-4"/> Back to Clients</Link>
      
      {/* HEADER CARD */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="flex gap-5 items-center">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-200">
                  {client.society_name?.charAt(0) || client.name?.charAt(0) || "C"}
              </div>
              <div>
                 <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.society_name || client.name}</h1>
                 <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-500"/> {client.name}</span>
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-500"/> {client.email}</span>
                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-500"/> {client.phone || '--'}</span>
                 </div>
              </div>
           </div>
           <div className="flex gap-3 items-center">
              <Badge className={client.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{client.status}</Badge>
              <Button onClick={handleAccess} className="bg-purple-600 hover:bg-purple-700 text-white"><ExternalLink className="w-4 h-4 mr-2"/> Access Panel</Button>
           </div>
        </CardContent>
      </Card>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="border-l-4 border-l-blue-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Total Members</p><h2 className="text-3xl font-bold text-slate-900 mt-2">245</h2></div></CardContent></Card>
         <Card className="border-l-4 border-l-purple-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Active Loans</p><h2 className="text-3xl font-bold text-slate-900 mt-2">₹89,000</h2></div></CardContent></Card>
         <Card className="border-l-4 border-l-green-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Revenue</p><h2 className="text-3xl font-bold text-slate-900 mt-2">₹125,000</h2></div></CardContent></Card>
         <Card className="border-l-4 border-l-orange-500 shadow-sm"><CardContent className="p-6"><div><p className="text-[11px] font-bold text-slate-400 uppercase">Risk Level</p><h2 className="text-3xl font-bold text-green-600 mt-2">Low</h2></div></CardContent></Card>
      </div>

      {/* DANGER ZONE */}
      <div className="border border-red-200 bg-red-50/50 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
         <div><h3 className="text-red-700 font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Danger Zone</h3><p className="text-sm text-red-600/80 mt-1">Irreversible actions. Deleting this client will remove all associated data.</p></div>
         <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-4 h-4 mr-2"/> Delete Account</Button>
      </div>
    </div>
  );
}