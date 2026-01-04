'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Calendar, MapPin, Shield, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MemberProfile() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            const { data } = await supabase.from('members').select('*').eq('auth_user_id', user.id).single();
            setMember(data);
        }
        setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  if(loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline"/> Loading Profile...</div>;
  if(!member) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Profile</h1>

      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-xl">
              {member.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
              <p className="text-sm text-gray-500">{member.email}</p>
              <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                {member.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{member.phone}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div><p className="text-sm text-gray-500">Joined</p><p className="font-medium">{new Date(member.join_date || member.created_at).toLocaleDateString()}</p></div>
            </div>
            {/* Add Address if exists in DB */}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleLogout} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
        <LogOut className="w-4 h-4 mr-2" /> Logout
      </Button>
    </div>
  );
}
