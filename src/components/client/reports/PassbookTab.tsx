'use client';

import React, { useState, useEffect } from 'react'; // ✅ Missing Imports Added
import { useCurrency } from '@/hooks/useCurrency'; 
import { Calendar, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react'; // ✅ Icons Added
// Apni supabase aur toast library path yahan check karein
import { supabase } from '@/lib/supabase'; 
import { toast } from 'sonner'; 

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PassbookAddEntryModal } from './PassbookAddEntryModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function PassbookTab({ members, clientId }: { members: any[], clientId: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<any>(null);

  const { formatCurrency } = useCurrency(); 

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('passbook_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (clientId) {
      fetchEntries();
    }
  }, [clientId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const handleEditEntry = (entry: any) => {
    setEntryToEdit({
      ...entry,
    });
    setIsAddEntryOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const { error } = await supabase.from('passbook_entries').delete().eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        return;
      }

      const { data: member } = await supabase
        .select('total_deposits')
        .eq('id', id) 
        .single();

      let totalDep = (member?.total_deposits || 0);

      // Logic logic kept same as original
      if (id.installment_amount) { // Note: logic kept exactly as you pasted
         totalDep -= Number(id.installment_amount);
      }
      if (id.deposit_amount) {
         totalDep += Number(id.deposit_amount);
      }

      await supabase.from('members').update({ total_deposits: totalDep }).eq('id', id);

      await fetchEntries();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading entries...</p>
        </CardContent>
      </Card>
    )
  }

  const getMemberName = (id: string) => {
    const m = members.find(m => m.id === id);
    return m ? m.name : 'Unknown Member';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge variant="default">Active</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'DEPOSIT': return <Badge className="bg-green-100 text-green-800">Deposit</Badge>;
      case 'INSTALLMENT': return <Badge className="bg-blue-100 text-blue-800">Installment</Badge>;
      case 'FINE': return <Badge className="bg-purple-100 text-purple-800">Fine</Badge>;
      case 'REFRESHMENTS': return <Badge className="bg-yellow-100 text-yellow-800">Refreshments</Badge>;
      default: return <Badge variant="outline">Other</Badge>;
    }
  };

  const getPaymentMode = (mode: string) => {
    if (mode) return mode.toUpperCase();
    return 'CASH';
  }

  const getPaymentModeColor = (mode: string) => {
    if (mode === 'CASH') return 'text-green-600';
    if (mode === 'UPI') return 'text-purple-600';
    if (mode === 'ONLINE' || mode === 'BANK') return 'text-blue-600';
    return 'text-gray-500';
  };

  // Duplicate formatDate kept as requested
  const formatDateDuplicate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // SYNTAX ERROR FIXED HERE: Added try/catch block properly and fixed brackets
  const handleDeleteEntryMain = async (entry: any) => {
    if (!confirm(`Are you sure you want to delete this entry for ${getMemberName(entry.member_id)}?`)) return;
    
    try {
      const { data: member } = await supabase
          .from('members')
          .select('total_deposits')
          .eq('id', entry.member_id)
          .single();

      // SYNTAX ERROR FIXED: Missing closing parenthesis
      let currentTotal = Number(member?.total_deposits || 0);
      const entryDeposit = Number(entry.deposit_amount || 0);
      const entryInstallment = Number(entry.installment_amount || 0);

      let newTotalDeposits = currentTotal + entryDeposit - entryInstallment;

      const { error: updateError } = await supabase.from('members').update({
          total_deposits: newTotalDeposits
        }).eq('id', entry.member_id);

      const { error: deleteError } = await supabase.from('passbook_entries').delete().eq('id', entry.id);
      if (deleteError) throw deleteError;

      toast.success("Entry deleted & member deposits reverted.");
      fetchEntries();
    } catch (err: any) {
          console.error(err);
          toast.error("Delete Failed: " + err.message);
      }
  };

  const handleOpenAddEntry = () => {
    setEntryToEdit(null);
    setIsAddEntryOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Passbook Records
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => fetchEntries()} size="icon"><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleOpenAddEntry}><Plus className="h-4 w-4 mr-2" /> Add Entry</Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Cash In</TableHead>
                  <TableHead className="text-right">Cash Out</TableHead>
                  <TableHead className="text-right">Int. + Fine</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div></TableCell></TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-gray-400"/>
                            </div>
                            <p className="text-sm font-medium mt-2">No entries yet.</p>
                        </div>
                  </TableCell>
                  </TableRow>
                ) : entries.map((entry) => {
                  const isDeposit = entry.type === 'DEPOSIT';
                  const totalAmt = Number(entry.total_amount) || 0;
                  const cashIn = Number(entry.cash_in) || 0;
                  const cashOut = Number(entry.cash_out) || 0;
                  
                  // SYNTAX ERROR FIXED: Missing closing parenthesis in calculation
                  const intFine = (Number(entry.interest_amount || 0) + Number(entry.fine_amount || 0));

                  return (
                    <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-700">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar userId={entry.member_id} className="h-8 w-8" />
                          <div className="flex flex-col justify-center">
                            <span className="text-sm font-semibold text-gray-900">{getMemberName(entry.member_id)}</span>
                            <span className="text-xs text-gray-500">{getMemberName(entry.member_id)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(entry.type)}
                      </TableCell>
                      <TableCell className="text-gray-500 font-medium">
                        {getPaymentMode(entry.payment_mode)}
                      </TableCell>
                      <TableCell className={`text-right ${getPaymentModeColor(entry.payment_mode)}`}>
                        {cashIn > 0 ? `+${formatCurrency(cashIn)}` : '-'}
                      </TableCell>
                      <TableCell className={`text-right ${getPaymentModeColor(entry.payment_mode)}`}>
                        {cashOut > 0 ? `+${formatCurrency(cashOut)}` : '-'}
                      </TableCell>
                      <TableCell className={`text-right text-purple-600`}>
                        {intFine > 0 ? formatCurrency(intFine) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totalAmt)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(entry.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(entry.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => handleOpenAddEntry(entry)}>
                            <Edit className="h-4 w-4"/>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteEntryMain(entry)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <PassbookAddEntryModal
        isOpen={isAddEntryOpen} 
        onClose={() => {
            setIsAddEntryOpen(false); 
            setEntryToEdit(null);
            fetchEntries();
        }}
        entryToEdit={entryToEdit}
        members={members} 
        clientId={clientId}
      />
    </>
  );
}
