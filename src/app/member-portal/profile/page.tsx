'use client';

import { useState } from 'react';
import { useClientStore } from '@/lib/client/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Calendar, MapPin, Shield, LogOut } from 'lucide-react';

export default function MemberProfile() {
  const { currentUser, members, logout } = useClientStore();
  const memberId = currentUser?.linkedMemberId;
  
  if (!memberId) return null;

  // Find the member data
  const memberData = members.find(m => m.id === memberId);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-xl font-bold">My Profile</h1>

      {/* User Info Card */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-xl">
              {currentUser?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
              <p className="text-sm text-gray-500">{currentUser?.email}</p>
              <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                Active Member
              </Badge>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Member ID</p>
                <p className="font-medium">{memberId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{memberData?.phone || 'Not available'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{currentUser?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-medium">
                  {memberData?.joinDate ? new Date(memberData.joinDate).toLocaleDateString() : 'Not available'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{memberData?.address || 'Not available'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <Badge className={memberData?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {memberData?.status || 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">Account Security</h3>
            <p className="text-sm text-blue-700">
              Your account is protected with secure authentication. Never share your login credentials with anyone.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4">
            <h3 className="font-medium text-orange-900 mb-2">Need Help?</h3>
            <p className="text-sm text-orange-700">
              Contact your society administrator for any account-related queries or support.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <Button 
        onClick={handleLogout}
        variant="outline" 
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}