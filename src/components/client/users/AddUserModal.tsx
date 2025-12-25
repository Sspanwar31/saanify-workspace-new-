'use client';

import { useState, useEffect } from 'react';
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

interface AddUserModalProps {
  onClose: () => void;
  onSuccess?: () => void; // Used for Add
  onSave?: (data: any) => void; // Used for Edit wrapper logic if needed
  initialData?: any;
}

export default function AddUserModal({ onClose, onSuccess, initialData }: AddUserModalProps) {
  const { members, addUser, updateUser } = useClientStore(); // Fetch members & actions
  
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
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || initialData.password || '', 
        role: initialData.role || 'MEMBER',
        department: initialData.department || '',
        linkedMemberId: initialData.linkedMemberId || 'none',
        isActive: initialData.status === 'ACTIVE'
      });
    }
  }, [initialData]);

  const handleSubmit = () => {
    if(!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    const payload = {
      ...formData,
      status: formData.isActive ? 'ACTIVE' : 'BLOCKED',
      // If linkedMemberId is 'none', remove it
      linkedMemberId: formData.linkedMemberId === 'none' ? undefined : formData.linkedMemberId
    };

    try {
      if (initialData) {
        // UPDATE MODE
        updateUser(initialData.id, payload as any);
        toast.success("User updated successfully");
      } else {
        // CREATE MODE
        addUser({
           ...payload,
           password: formData.phone || '123456', // Default password
           lastLogin: '',
           avatar: ''
        } as any);
        toast.success("User added successfully");
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      toast.error("Operation failed");
    }
  };

  // RENDER CONTENT DIRECTLY (NO DIALOG WRAPPER)
  return (
    <div className="flex flex-col h-full">
        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              
              {/* Full Name */}
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter name" />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})} disabled={initialData?.id === 'CLIENT_001'}>
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
                <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="user@example.com" disabled={initialData?.id === 'CLIENT_001'} />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210" />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} placeholder="e.g. Finance" />
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
                   <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} disabled={initialData?.id === 'CLIENT_001'} />
                </div>
              </div>

              {/* Password Reset (Edit Mode Only) */}
              {initialData && (
                <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                  <Label className="mb-2 block">Password Management</Label>
                  <Button variant="outline" className="w-full" onClick={() => toast.success("Reset link sent")}>
                    Reset Password
                  </Button>
                </div>
              )}
            </div>

            {/* Read-Only Info Footer */}
            {initialData && (
               <div className="mt-6 flex gap-4 text-xs text-gray-400 border-t pt-4">
                  <div><span className="block font-bold text-gray-600">User ID</span>{initialData.id}</div>
                  <div><span className="block font-bold text-gray-600">Created</span>{safeFormatDate(initialData.createdAt)}</div>
                  <div><span className="block font-bold text-gray-600">Last Login</span>{safeFormatDate(initialData.lastLogin)}</div>
               </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 mt-4 -mx-6 -mb-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white">
            {initialData ? 'Update User' : 'Create User'}
          </Button>
        </div>
    </div>
  );
}