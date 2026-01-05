'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Card, CardHeader, CardTitle, CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserData({
          name: data.user.user_metadata?.name || '',
          email: data.user.email || '',
          phone: data.user.user_metadata?.phone || '',
          password: ''
        });
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  const handleChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const updates = {
      data: {
        name: userData.name,
        phone: userData.phone
      }
    };
    const { error } = await supabase.auth.updateUser(updates);
    if (error) alert('Update failed: ' + error.message);
    else alert('Profile updated successfully!');
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={userData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={userData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="Your phone number"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userData.email}
                disabled
                placeholder="Your email"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={userData.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="New password"
              />
            </div>
          </div>
          <Button 
            className="mt-4"
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
