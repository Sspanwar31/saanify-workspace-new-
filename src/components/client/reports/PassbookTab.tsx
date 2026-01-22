'use client';

import { useCurrency } from '@/hooks/useCurrency'; // ✅ Import karo

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PassbookAddEntryModal } from './PassbookAddEntryModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

// Note: The file exports `UserAvatar`. If `UserAvatar` handles `avatar_url` internally, we don't need to explicitly pass it here.
// However, if UserAvatar takes a prop, we might need to pass `avatar_url` and `name` props to it. 
// Based on usage `<UserAvatar />` (No props), it might fetch data via ID.

export function PassbookTab({ members, clientId }: { members: any[], clientId: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<any>(null);

  // ✅ Hook call karo (Manual function removed)
  const { formatCurrency } = useCurrency(); 

  // 1. Fetch Entries
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

  // Use effect to fetch data when props change
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
      // Ensure data consistency if needed
    });
    setIsAddEntryOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      // Delete from Passbook
      const { error } = await supabase.from('passbook_entries').delete().eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        return;
      }

      // Update Member totals manually (if necessary, though ideally backend does this)
      const { data: member } = await supabase
        .select('total_deposits') // Fetch relevant info first to avoid accidental overwrite
        .eq('id', memberId) 
        .single();

      let totalDep = (member?.total_deposits || 0);

      if (entry.installment_amount) {
         totalDep -= Number(entry.installment_amount);
      }
      if (entry.deposit_amount) {
         totalDep += Number(entry.deposit_amount);
      }

      await supabase.from('members').update({ total_deposits: totalDep }).eq('id', memberId);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry? This will reverse balance.")) return;
    try {
      const { data: member } = await supabase
        .from('members')
        .select('total_deposits')
        .eq('id', id)
        .single();

      let currentDeposits = Number(member?.total_deposits || 0);

      if (entry.deposit_amount) {
        currentDeposits -= Number(entry.deposit_amount);
      }

      // 3. Update Member Balance
      const { error } = await supabase.from('members').update({
        total_deposits: currentDeposits
      }).eq('id', member.id);

      if (error) {
        toast.error("Update failed: " + error.message);
        return;
      }

      // 4. Delete Entry
      const { error: deleteError } = await supabase.from('passbook_entries').delete().eq('id', id);
      if (deleteError) throw deleteError;

      toast.success("Entry deleted & balance reversed.");
      fetchEntries();
    } catch (err: any) {
      console.error(err);
      toast.error("Error: " + err.message);
    }
  };

  const getMemberName = (id: string) => {
    const m = members.find(m => m.id === id);
    return m?.name || 'Unknown Member';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    return <Badge variant="secondary" className="bg-gray-100 text-gray-700">{status || 'Inactive'}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'DEPOSIT': return <Badge className="bg-green-100 text-green-800">Deposit</Badge>;
      case 'INSTALLMENT': return <Badge className="bg-blue-100 text-blue-800">Installment</Badge>;
      case 'INTEREST': return <Badge className="bg-purple-100 text-purple-800">Interest</Badge>;
      case 'FINE': return <Badge className="bg-red-100 text-red-800">Fine</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-700">Other</Badge>;
    }
  };

  const getPaymentMode = (mode: string) => {
    if (!mode) return 'CASH';
    const m = mode.toUpperCase();
    if (m.includes('UPI') || m.includes('ONLINE')) return 'ONLINE';
    return 'CASH';
  };

  const getPaymentModeColor = (mode: string) => {
    const m = mode ? mode.toLowerCase() : '';
    if (m.includes('upi') || m.includes('online')) return 'text-purple-600';
    if (m.includes('cash')) return 'text-green-600';
    return 'text-gray-500';
  };

  const handleOpenAddEntry = () => {
    setEntryToEdit(null);
    setIsAddEntryOpen(true);
  };

  const handleDeleteEntry = async (entry: any) => {
    if (!confirm(`Are you sure you want to delete this entry for ${getMemberName(entry.member_id)}?`)) return;
    
    const { data: member } = await supabase
        .from('members')
        .select('total_deposits')
        .eq('id', entry.member_id)
        .single();

    let currentTotal = Number(member?.total_deposits || 0;
    const entryDeposit = Number(entry.deposit_amount || 0);
    const entryInstallment = Number(entry.installment_amount || 0);

    // 1. Calculate New Deposit Balance
    // If deposit exists, subtract. If installment exists, add.
    let newTotalDeposits = currentTotal + entryDeposit - entryInstallment;

    // 2. Update DB
    const { error: updateError } = await supabase.from('members').update({
        total_deposits: newTotalDeposits
      }).eq('id', entry.member_id);

    // 3. Delete Entry
    const { error: deleteError } = await supabase.from('passbook_entries').delete().eq('id', entry.id);
    if (deleteError) throw deleteError;

    toast.success("Entry deleted & member deposits reverted.");
    fetchEntries();
  } catch (err: any) {
        console.error(err);
        toast.error("Delete Failed: " + err.message);
    }
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
                  const intFine = (Number(entry.interest_amount || 0) + (entry.fine_amount || 0);

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
                        </TableCell>
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
                        {/* ✅ Using Hook for Balance */}
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteEntry(entry)}>
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
