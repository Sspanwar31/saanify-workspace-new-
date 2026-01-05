'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function MemberSettings() {
  const [member, setMember] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
        const { data } = await supabase.from('members').select('*').eq('auth_user_id', user.id).single();
        setMember(data);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password too short");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    
    if (error) toast.error(error.message);
    else {
      toast.success("Password Updated!");
      setNewPassword('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>

      {/* Profile Section */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label className="text-slate-500">Full Name</Label>
              <div className="flex items-center gap-2 border p-3 rounded-lg bg-slate-50 text-slate-800 hover:shadow-sm transition-shadow">
                <User className="w-5 h-5 text-slate-400"/> {member?.name || '-'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500">Phone</Label>
              <div className="flex items-center gap-2 border p-3 rounded-lg bg-slate-50 text-slate-800 hover:shadow-sm transition-shadow">
                <Phone className="w-5 h-5 text-slate-400"/> {member?.phone || '-'}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label className="text-slate-500">Email Address</Label>
              <div className="flex items-center gap-2 border p-3 rounded-lg bg-slate-50 text-slate-800 hover:shadow-sm transition-shadow">
                <Mail className="w-5 h-5 text-slate-400"/> {member?.email || '-'}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Change Password</Label>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  type="password" 
                  placeholder="Enter new password" 
                  className="pl-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handlePasswordUpdate} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                {loading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
