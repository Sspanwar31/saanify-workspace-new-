'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Plus, 
  Trash2, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ExpensesPage() {
  // --- States ---
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false)
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [showWarning, setShowWarning] = useState(false)

  // Data States
  const [members, setMembers] = useState<any[]>([])
  const [expenseLedger, setExpenseLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)

  // --- Stats States ---
  const [stats, setStats] = useState({
    netBalance: 0,
    totalFeesCollected: 0,
    membersPaidCount: 0,
    totalExpenses: 0
  })

  // 1. Fetch Client ID & Initial Data
  useEffect(() => {
    const initData = async () => {
      // ✅ FIX: Client ID Fetch (MAIN ISSUE) - Logic Updated Here
      const admin = JSON.parse(localStorage.getItem('current_user') || 'null')
      if (!admin?.id) return

      // 🔥 REAL FIX: get client_id from admins table
      const { data, error } = await supabase
        .from('admins')
        .select('client_id')
        .eq('id', admin.id)
        .single()

      if (error) {
        console.error('Failed to resolve client_id', error)
        return
      }

      setClientId(data.client_id)
    }
    initData()
  }, [])

  // 2. Fetch Data
  useEffect(() => {
    if (clientId) {
      fetchData()
    }
  }, [clientId])

  const fetchData = async () => {
    setLoading(true);

    try {
      if (!clientId) {
        setLoading(false);
        return;
      }

      // A. Fetch Members (For Dropdown)
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .eq('client_id', clientId)
        .order('name', { ascending: true });

      setMembers(membersData || []);

      // B. Fetch Ledger (With Relational Join for Member Name)
      // ✅ CHANGE 1: Updated Select to use Foreign Key
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('expenses_ledger')
        .select(`
          *,
          member:members!expenses_ledger_member_id_fkey(name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }); // Latest first

      if (ledgerError) throw ledgerError;

      // C. Map for UI (Using Relational Data)
      const formattedLedger = (ledgerData || []).map((item: any) => ({
        ...item,
        createdAt: item.created_at,
        // ✅ CHANGE 2: Mapping fix
        memberName: item.member?.name || 'Unknown' // Join returns an object, access .name safely
      }));

      setExpenseLedger([...formattedLedger]);

      // D. Calculate Stats
      let netBal = 0;
      let feesColl = 0;
      let expenses = 0;
      let paidMembers = 0;

      // Calculate stats logic based on processedLedger
      formattedLedger.forEach((entry: any) => {
        const amt = Number(entry.amount);
        if (entry.type === 'INCOME') { // Assuming 'INCOME' is Maintenance Fee
          netBal += amt;
          feesColl += amt;
        } else if (entry.type === 'EXPENSE') {
          netBal -= amt;
          expenses += amt;
        }
      });

      // Count paid members (using local state 'members' for better performance)
      if (members.length > 0) {
        paidMembers = members.filter((m: any) => m.has_paid_maintenance).length;
      }

      setStats({
        netBalance: netBal,
        totalFeesCollected: feesColl,
        membersPaidCount: paidMembers,
        totalExpenses: expenses
      });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); // ✅ FIX: Ensure loading turns off
    }
  }

  // --- Handlers ---
  const handleCollectFee = async () => {
    if (!selectedMember || !clientId) return;

    try {
      // Insert Income Entry
      await supabase.from('expenses_ledger').insert([{
        client_id: clientId,
        member_id: selectedMember,
        amount: 200, // Fixed Fee
        type: 'INCOME', // Assuming 'INCOME' type for Maintenance
        category: 'MAINTENANCE_FEE',
        description: 'Monthly Maintenance Fee Collected',
        date: new Date().toISOString().split('T')[0]
      }]);

      // Update Member Status to Paid
      await supabase.from('members').update({ has_paid_maintenance: true }).eq('id', selectedMember);

      // Reset & Refresh
      setSelectedMember('');
      fetchData();
      setIsCollectFeeOpen(false);

    } catch (error) {
        console.error("Error collecting fee:", error);
        alert("Failed to collect fee.");
    }
  }

  const handleRecordExpense = async () => {
    if (!expenseData.amount || !expenseData.category || !clientId) return;

    try {
      // Insert Expense Entry
      await supabase.from('expenses_ledger').insert([{
        client_id: clientId,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date,
        type: 'EXPENSE',
        member_id: selectedMember || null // Optional linking
      }]);

      // Reset & Refresh
      setExpenseData({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      setIsRecordExpenseOpen(false);
      fetchData();

    } catch (error) {
      console.error("Error recording expense:", error);
      alert("Failed to record expense.");
    }
  }

  const deleteExpenseEntry = async (id: string, memberId?: string, category?: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      // Delete Entry
      await supabase.from('expenses_ledger').delete().eq('id', id);

      // If it was a Fee, revert member status
      if (category === 'MAINTENANCE_FEE' && memberId) {
        await supabase.from('members').update({ has_paid_maintenance: false }).eq('id', memberId);
      }

      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction.");
    }
  }

  // --- Helpers ---
  const getCategoryIcon = (category: string) => {
    const icons: any = {
      'MAINTENANCE_FEE': <DollarSign className="h-4 w-4 text-green-600" />,
      'STATIONERY': <Receipt className="h-4 w-4 text-blue-600" />,
      'PRINTING': <Receipt className="h-4 w-4 text-purple-600" />,
      'LOAN_FORMS': <Receipt className="h-4 w-4 text-orange-600" />,
      'REFRESHMENTS': <Receipt className="h-4 w-4 text-teal-600" />,
      'OTHER': <Receipt className="h-4 w-4 text-gray-600" />
    }
    return icons[category] || <Receipt className="h-4 w-4 text-gray-600" />
  }

  const getCategoryColor = (category: string) => {
    const colors: any = {
      'MAINTENANCE_FEE': 'bg-green-100 text-green-800',
      'STATIONERY': 'bg-blue-100 text-blue-800',
      'PRINTING': 'bg-purple-100 text-purple-800',
      'LOAN_FORMS': 'bg-orange-100 text-orange-800',
      'REFRESHMENTS': 'bg-teal-100 text-teal-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels: any = {
      'MAINTENANCE_FEE': 'Maintenance Fee',
      'STATIONERY': 'Stationery',
      'PRINTING': 'Printing',
      'LOAN_FORMS': 'Loan Forms',
      'REFRESHMENTS': 'Refreshments',
      'OTHER': 'Other'
    }
    return labels[category] || category
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Expenses & Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track maintenance fees and operational expenses
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2"/> Refresh</Button>
      </div>

      {/* SECTION A: SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Maintenance Fund Balance Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Maintenance Fund Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
              <>
                <div className={`text-3xl font-bold ${
                  stats.netBalance > 0 ? 'text-green-600' : 
                  stats.netBalance < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  ₹{Math.abs(stats.netBalance).toLocaleString()}
                </div>
                <p className={`text-sm mt-1 ${
                  stats.netBalance > 0 ? 'text-green-600' : 
                  stats.netBalance < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {stats.netBalance > 0 ? 'Positive Balance' : 
                   stats.netBalance < 0 ? 'Negative Balance' : 
                   'Balanced'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fees Collected Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Fees Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
              <div className="text-3xl font-bold text-green-600">
                ₹{stats.totalFeesCollected.toLocaleString()}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-1">
              {stats.membersPaidCount} members × ₹200
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div> : (
              <div className="text-3xl font-bold text-red-600">
                ₹{stats.totalExpenses.toLocaleString()}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Operational costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION B: ACTION BUTTONS */}
      <div className="flex gap-4">
        {/* Collect Member Fee Button */}
        <Dialog open={isCollectFeeOpen} onOpenChange={setIsCollectFeeOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Users className="h-4 w-4" />
              Collect Member Fee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Users className="h-5 w-5" />
                Collect Member Fee
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="member-select">Select Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member who hasn't paid..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.filter((m: any) => !m.has_paid_maintenance).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <p><strong>Amount:</strong> ₹200</p>
                  <p><strong>Type:</strong> Maintenance Fee</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCollectFee}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedMember}
                >
                  Collect Fee
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCollectFeeOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Record Expense Button */}
        <Dialog open={isRecordExpenseOpen} onOpenChange={setIsRecordExpenseOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4" />
              Record Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <Plus className="h-5 w-5" />
                Record Expense
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expense-category">Category</Label>
                <Select value={expenseData.category} onValueChange={(value) => setExpenseData({ ...expenseData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAINTENANCE_FEE">Maintenance Fee</SelectItem>
                    <SelectItem value="STATIONERY">Stationery</SelectItem>
                    <SelectItem value="PRINTING">Printing</SelectItem>
                    <SelectItem value="LOAN_FORMS">Loan Forms</SelectItem>
                    <SelectItem value="REFRESHMENTS">Refreshments</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseData.date}
                  onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expense-description">Description</Label>
                <Textarea
                  id="expense-description"
                  placeholder="Enter expense description"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleRecordExpense}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!expenseData.amount || !expenseData.category || !expenseData.description}
                >
                  Record Expense
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRecordExpenseOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION C: THE LEDGER TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Maintenance & Expenses Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : expenseLedger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No transactions yet. Add your first transaction to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseLedger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        {/* ✅ UPDATE: Display Member Name using Relational Join */}
                        <TableCell>
                          {entry.memberName ? (
                            <span className="text-blue-600 font-medium">{entry.memberName}</span>
                          ) : (
                            <span className="text-gray-400">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(entry.category)}>
                            {getCategoryLabel(entry.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={entry.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {entry.type === 'INCOME' ? 'Income' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                            {entry.type === 'INCOME' ? '+' : '-'}₹{Number(entry.amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExpenseEntry(entry.id, entry.member_id, entry.category)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
