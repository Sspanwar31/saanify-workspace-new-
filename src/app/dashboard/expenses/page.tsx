'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple' // ✅ Using simple client
import { 
  Plus, 
  Trash2, 
  Users,
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ExpensesPage() {
  // --- States ---
  const [expenseLedger, setExpenseLedger] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false)
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // --- Stats Calculation State ---
  const [stats, setStats] = useState({
    netBalance: 0,
    totalFeesCollected: 0,
    totalExpenses: 0,
    membersPaidCount: 0
  })

  // 1. Init: Get Client ID
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('current_user') || 'null')
    if (user?.id) {
        // Fallback for client_id if table lookup fails or using simple auth
        setClientId(user.client_id || user.id)
    }
  }, [])

  // 2. Fetch Data Trigger
  useEffect(() => {
    if (clientId) {
      fetchData()
    }
  }, [clientId])

  // 3. Main Data Fetching (Replaces Store)
  const fetchData = async () => {
    setLoading(true)
    if (!clientId) return

    try {
        // A. Fetch Members (Active Only) for Dropdown
        const { data: membersData } = await supabase
            .from('members')
            .select('id, name, phone, status')
            .eq('client_id', clientId)
            .eq('status', 'active')

        setMembers(membersData || [])

        // B. Fetch Expenses Ledger (FIXED QUERY)
        // 🔥 Change: Use 'members(name)' strictly to ensure Left Join works correctly
        const { data: ledgerData, error } = await supabase
            .from('expenses_ledger')
            .select(`
                *,
                members (
                    name
                )
            `)
            .eq('client_id', clientId)
            .order('date', { ascending: false }) // Newest first

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        // console.log("Fetched Ledger:", ledgerData); // Uncomment to debug

        const formattedLedger = (ledgerData || []).map((item: any) => ({
            ...item,
            // 🔥 Fix: Handle array or object response from members relation
            memberName: Array.isArray(item.members) 
                ? item.members[0]?.name 
                : item.members?.name || null
        }))

        setExpenseLedger(formattedLedger)
        calculateStats(formattedLedger)

    } catch (error) {
        console.error('Error fetching expenses:', error)
    } finally {
        setLoading(false)
    }
  }

  // 4. Calculate Stats (Logic preserved)
  const calculateStats = (ledger: any[]) => {
    let income = 0
    let expenses = 0
    let paidCount = 0

    ledger.forEach(entry => {
        const amt = Number(entry.amount) || 0
        if (entry.type === 'INCOME' || entry.category === 'MAINTENANCE_FEE') {
            income += amt
            paidCount++
        } else {
            expenses += amt
        }
    })

    setStats({
        netBalance: income - expenses,
        totalFeesCollected: income,
        totalExpenses: expenses,
        membersPaidCount: paidCount
    })
  }

  // --- Handlers ---

  // 5. Collect Fee (Save to DB)
  const handleCollectFee = async () => {
    if (!selectedMember || !clientId) return

    try {
        await supabase.from('expenses_ledger').insert([{
            client_id: clientId,
            member_id: selectedMember,
            amount: 200, // Fixed Fee
            type: 'INCOME',
            category: 'MAINTENANCE_FEE',
            description: 'Monthly Maintenance Fee',
            date: new Date().toISOString().split('T')[0]
        }])

        fetchData() // Refresh
        setSelectedMember('')
        setIsCollectFeeOpen(false)
    } catch (error) {
        console.error('Error collecting fee:', error)
        alert('Failed to collect fee')
    }
  }

  // 6. Record Expense (Save to DB)
  const handleRecordExpense = async () => {
    if (!expenseData.amount || !expenseData.category || !expenseData.description || !clientId) return
    
    const amount = parseFloat(expenseData.amount)
    if (isNaN(amount) || amount <= 0) return

    try {
        await supabase.from('expenses_ledger').insert([{
            client_id: clientId,
            amount: amount,
            type: 'EXPENSE',
            category: expenseData.category,
            description: expenseData.description,
            date: expenseData.date
        }])

        fetchData() // Refresh
        setExpenseData({
            amount: '',
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        })
        setIsRecordExpenseOpen(false)
    } catch (error) {
        console.error('Error recording expense:', error)
        alert('Failed to record expense')
    }
  }

  // 7. Delete Entry
  const handleDeleteEntry = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      try {
          await supabase.from('expenses_ledger').delete().eq('id', id);
          fetchData();
      } catch (error) {
          console.error("Error deleting:", error);
      }
  }

  const getCategoryColor = (category: string) => {
    const colors: any = {
      'MAINTENANCE_FEE': 'bg-green-100 text-green-800',
      'STATIONERY': 'bg-blue-100 text-blue-800',
      'PRINTING': 'bg-purple-100 text-purple-800',
      'LOAN_FORMS': 'bg-orange-100 text-orange-800',
      'REFRESHMENTS': 'bg-pink-100 text-pink-800',
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
    <div className="space-y-6">
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
        {/* Maintenance Fund Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Maintenance Fund Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-8 bg-gray-200 animate-pulse rounded"></div> : (
                <>
                    <div className={`text-3xl font-bold ${
                    stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    ₹{Math.abs(stats.netBalance).toLocaleString()}
                    </div>
                    <p className={`text-sm mt-1 ${
                    stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {stats.netBalance >= 0 ? 'Positive Balance' : 'Negative Balance'}
                    </p>
                </>
            )}
          </CardContent>
        </Card>

        {/* Fees Collected */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Fees Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-8 bg-gray-200 animate-pulse rounded"></div> : (
                <>
                    <div className="text-3xl font-bold text-green-600">
                    ₹{stats.totalFeesCollected.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                    {stats.membersPaidCount} payments recorded
                    </p>
                </>
            )}
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-8 bg-gray-200 animate-pulse rounded"></div> : (
                <>
                    <div className="text-3xl font-bold text-red-600">
                    ₹{stats.totalExpenses.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                    Operational costs
                    </p>
                </>
            )}
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
          {/* ✅ FIX: Added aria-describedby for Dialog warning fix */}
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Users className="h-5 w-5" />
                Collect Maintenance Fee
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="member-select">Select Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <p><strong>Amount:</strong> ₹200 (Fixed)</p>
                  <p><strong>Type:</strong> One-Time Maintenance Fee</p>
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
          {/* ✅ FIX: Added aria-describedby for Dialog warning fix */}
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <Plus className="h-5 w-5" />
                Record New Expense
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
                  placeholder="Enter expense description..."
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
                  <TableHead>Description</TableHead>
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
                  expenseLedger
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell>
                          {entry.memberName ? (
                            <span className="text-blue-600 font-medium">{entry.memberName}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(entry.category)}>
                            {getCategoryLabel(entry.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={entry.type === 'INCOME' ? 'default' : 'destructive'}
                            className={entry.type === 'INCOME' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
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
                            onClick={() => handleDeleteEntry(entry.id)}
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
  )
}
