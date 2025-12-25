'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useClientStore } from "@/lib/client/store";

// Helper for dates
const safeFormatDate = (dateString: any) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function EditUserModal({ isOpen, onClose, onSave, initialData }: EditUserModalProps) {
  const { members } = useClientStore(); // Fetch members for linking
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'MEMBER',
    department: '',
    linkedMemberId: 'none',
    isActive: true
  });

  // Populate Data on Open
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '', // Check 'phone' property specifically
        role: initialData?.role || 'MEMBER',
        department: initialData?.department || '',
        linkedMemberId: initialData?.linkedMemberId || 'none',
        isActive: initialData ? initialData.status === 'ACTIVE' : true
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if(!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }
    onSave({
      ...formData,
      status: formData.isActive ? 'ACTIVE' : 'BLOCKED'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        
        {/* HEADER */}
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{initialData ? 'Edit User Details' : 'Add New User'}</DialogTitle>
        </DialogHeader>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Enter name" 
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v) => setFormData({...formData, role: v})}
                  disabled={initialData?.id === 'CLIENT_001'} // Prevent editing Admin Role
                >
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
                    <SelectItem value="TREASURER">Treasurer</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  placeholder="user@example.com" 
                  disabled={initialData?.id === 'CLIENT_001'} // Lock Admin Email
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label>Department</Label>
                <Input 
                  value={formData.department} 
                  onChange={(e) => setFormData({...formData, department: e.target.value})} 
                  placeholder="e.g. Finance, Operations" 
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+91 98765 43210" 
                />
              </div>

              {/* Linked Member */}
              <div className="space-y-2">
                <Label>Link Member (Optional)</Label>
                <Select value={formData.linkedMemberId} onValueChange={(v) => setFormData({...formData, linkedMemberId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select member to link" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Linked</SelectItem>
                    {members.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Toggle */}
              <div className="col-span-1 md:col-span-2 flex items-center justify-between border p-4 rounded-lg bg-gray-50">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Account Status</span>
                  <span className="text-xs text-gray-500">Enable to allow login access</span>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant={formData.isActive ? "default" : "destructive"}>
                     {formData.isActive ? "Active" : "Blocked"}
                   </Badge>
                   <Switch 
                     checked={formData.isActive} 
                     onCheckedChange={(v) => setFormData({...formData, isActive: v})} 
                     disabled={initialData?.id === 'CLIENT_001'} // Prevent blocking Admin
                   />
                </div>
              </div>

              {/* Password Reset (Edit Mode Only) */}
              {initialData && (
                <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                  <Label className="mb-2 block">Password Management</Label>
                  <Button variant="outline" className="w-full" onClick={() => toast.success("Reset link sent to user")}>
                    Reset Password
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">New temporary password will be sent to the user's email.</p>
                </div>
              )}
            </div>

            {/* Read-Only Info Footer */}
            {initialData && (
               <div className="mt-6 flex gap-4 text-xs text-gray-400 border-t pt-4">
                  <div>
                    <span className="block font-bold text-gray-600">User ID</span>
                    {initialData.id}
                  </div>
                  <div>
                    <span className="block font-bold text-gray-600">Created On</span>
                    {safeFormatDate(initialData.createdAt)}
                  </div>
                  <div>
                    <span className="block font-bold text-gray-600">Last Login</span>
                    {safeFormatDate(initialData.lastLogin)}
                  </div>
               </div>
            )}
        </div>

        {/* FIXED FOOTER */}
        <DialogFooter className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white">
            {initialData ? 'Update User' : 'Create User'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}