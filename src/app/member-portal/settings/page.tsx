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
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>

      {/* Profile Section (Read Only) */}
      <Card>
        <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-slate-500">Full Name</Label>
                    <div className="flex items-center gap-2 border p-2 rounded-md bg-slate-50 text-slate-700">
                        <User className="w-4 h-4 text-slate-400"/> {member?.name}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-500">Phone</Label>
                    <div className="flex items-center gap-2 border p-2 rounded-md bg-slate-50 text-slate-700">
                        <Phone className="w-4 h-4 text-slate-400"/> {member?.phone}
                    </div>
                </div>
                <div className="col-span-2 space-y-2">
                    <Label className="text-slate-500">Email Address</Label>
                    <div className="flex items-center gap-2 border p-2 rounded-md bg-slate-50 text-slate-700">
                        <Mail className="w-4 h-4 text-slate-400"/> {member?.email}
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Change Password</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                            type="password" 
                            placeholder="Enter new password" 
                            className="pl-9"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <Button onClick={handlePasswordUpdate} disabled={loading}>
                        {loading ? 'Updating...' : 'Update'}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
