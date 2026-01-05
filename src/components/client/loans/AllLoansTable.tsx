'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Standard import
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  AlertTriangle, 
  Calendar, 
  Percent, 
  Activity,
  User,
  Edit2
} from 'lucide-react';

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData: any;
}

export function EditLoanModal({ isOpen, onClose, loanData }: EditLoanModalProps) {
  // --- States for Editable Fields ---
  const [totalAmount, setTotalAmount] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [status, setStatus] = useState('active'); 
  const [loading, setLoading] = useState(false);

  // --- Initialize Data on Open ---
  useEffect(() => {
    if (loanData) {
      // Data fill kar rahe hain (Fallback 0 ke sath)
      setTotalAmount(loanData.amount?.toString() || loanData.totalAmount?.toString() || '0');
      setOutstanding(loanData.remainingBalance?.toString() || loanData.totalOutstanding?.toString() || '0');
      setStatus(loanData.status?.toLowerCase() || 'active');
    }
  }, [loanData]);

  // --- Handle Save Logic ---
  const handleSave = async () => {
    setLoading(true);
    try {
      const newTotal = Number(totalAmount);
      const newOutstanding = Number(outstanding);

      // 1. Validation: Outstanding Total se jyada nahi ho sakta
      if (newOutstanding > newTotal) {
        toast.error("Error: Outstanding balance cannot differ from Total Loan Amount");
        setLoading(false);
        return;
      }

      if (newTotal <= 0) {
        toast.error("Total Amount must be greater than 0");
        setLoading(false);
        return;
      }

      // 2. Auto Status Logic (Optional Helper)
      // Agar Outstanding 0 kar diya, to loan close ho jana chahiye
      let finalStatus = status;
      if (newOutstanding === 0 && status === 'active') {
         finalStatus = 'closed'; 
      }
      // Agar Outstanding > 0 hai aur status closed hai, to active kar do
      if (newOutstanding > 0 && status === 'closed') {
         finalStatus = 'active';
      }

      // 3. Database Update
      // Hum us specific loan ID ko update kar rahe hain jo table se aayi hai
      const { error } = await supabase
        .from('loans')
        .update({
          amount: newTotal,             // Fixing Total Loan Amount
          remaining_balance: newOutstanding, // Fixing Outstanding Balance
          status: finalStatus           // Updating Status
        })
        .eq('id', loanData.id);

      if (error) throw error;

      toast.success("Loan corrected successfully");
      window.location.reload(); // Refresh table to show changes

    } catch (error: any) {
      console.error("Update Error:", error);
      toast.error("Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!loanData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
            <div className="p-2 bg-blue-100 rounded-full">
                <Edit2 className="w-5 h-5 text-blue-600"/>
            </div>
            Edit Loan Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          {/* 1. READ ONLY INFO (Member & Meta Data) */}
          {/* Ye section zaroori hai taaki admin ko pata rahe kiska loan edit ho raha hai */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
             <div>
                <Label className="text-xs text-slate-500 uppercase flex items-center gap-1 font-bold">
                   <User className="w-3 h-3"/> Member Name
                </Label>
                <p className="font-bold text-slate-800 text-base">{loanData.memberName || 'Unknown'}</p>
             </div>
             <div>
                <Label className="text-xs text-slate-500 uppercase flex items-center gap-1 font-bold">
                   <Calendar className="w-3 h-3"/> Start Date
                </Label>
                <p className="font-medium text-slate-700">
                    {loanData.startDate ? new Date(loanData.startDate).toLocaleDateString('en-IN') : '-'}
                </p>
             </div>
             <div>
                <Label className="text-xs text-slate-500 uppercase flex items-center gap-1 font-bold">
                   <Percent className="w-3 h-3"/> Interest Rate
                </Label>
                <p className="font-medium text-slate-700">{loanData.interestRate || '1'}% / month</p>
             </div>
             <div>
                <Label className="text-xs text-slate-500 uppercase flex items-center gap-1 font-bold">
                   <Activity className="w-3 h-3"/> Current Status
                </Label>
                <Badge variant={status === 'active' ? 'default' : 'secondary'} className="mt-1">
                    {status.toUpperCase()}
                </Badge>
             </div>
          </div>

          {/* 2. EDITABLE FIELDS (Main Logic) */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Field A: Total Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="total" className="text-blue-700 font-semibold">Total Approved</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                <Input
                  id="total"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="pl-7 h-11 text-lg font-bold border-blue-200 focus:border-blue-500 bg-white"
                />
              </div>
              <p className="text-[10px] text-gray-400">Edit original principal amount</p>
            </div>

            {/* Field B: Outstanding Balance */}
            <div className="space-y-2">
              <Label htmlFor="outstanding" className="text-red-700 font-semibold">Outstanding Bal</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                <Input
                  id="outstanding"
                  type="number"
                  value={outstanding}
                  onChange={(e) => setOutstanding(e.target.value)}
                  className="pl-7 h-11 text-lg font-bold border-red-200 focus:border-red-500 text-red-600 bg-white"
                />
              </div>
              <p className="text-[10px] text-gray-400">Edit remaining amount to pay</p>
            </div>
          </div>

          {/* 3. STATUS TOGGLE (Manual Override) */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-1">
             <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-slate-700">Loan Status Override</Label>
                <p className="text-xs text-gray-500">Force close or reopen this loan manually.</p>
             </div>
             <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                    {status === 'active' ? 'ACTIVE' : 'CLOSED'}
                </span>
                <Switch 
                    checked={status === 'active'}
                    onCheckedChange={(c) => setStatus(c ? 'active' : 'closed')}
                />
             </div>
          </div>

          {/* 4. WARNING BOX */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-bold mb-1">⚠️ Admin Correction Mode</p>
              <p>Changing these values will directly update the database record. Ensure "Total Approved" matches the original agreement and "Outstanding" reflects true pending amount.</p>
            </div>
          </div>

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="border-slate-300">
            Discard
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 shadow-md">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <SaveIcon className="w-4 h-4 mr-2"/>}
            Save Corrections
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper Icon
function SaveIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  )
}
