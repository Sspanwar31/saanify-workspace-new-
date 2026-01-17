'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple' 
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
        // Correct logic to get ID
        const finalId = user.client_id || user.id;
        console.log("🔹 Active Client ID:", finalId); // Debugging
        setClientId(finalId)
    }
  }, [])

  // 2. Fetch Data Trigger
  useEffect(() => {
    if (clientId) {
      fetchData()
    }
  }, [clientId])

  // 3. Main Data Fetching (FIXED QUERY)
  const fetchData = async () => {
    setLoading(true)
    if (!clientId) return

    try {
        console.log("🔄 Fetching Data from Supabase...");

        // A. Fetch Members
        const { data: membersData } = await supabase
            .from('members')
            .select('id, name, phone, status')
            .eq('client_id', clientId)
            .eq('status', 'active')

        setMembers(membersData || [])

        // B. Fetch Expenses Ledger (Simplified Query for Safety)
        // 🔥 FIX: Using 'members(name)' instead of 'member:members(name)' to avoid alias errors
        const { data: ledgerData, error } = await supabase
            .from('expenses_ledger') 
            .select(`
                *,
                members (
                    name
                )
            `)
            .eq('client_id', clientId)
            .order('date', { ascending: false })

        if (error) {
            console.error("❌ Error fetching expenses_ledger:", error);
            throw error;
        }

        console.log("✅ Data Received:", ledgerData); // Debugging

        // Format data safely
        const formattedLedger = (ledgerData || []).map((item: any) => ({
            ...item,
            // Handle array or object response from join
            memberName: Array.isArray(item.members) ? item.members[0]?.name : item.members?.name || null
        }))

        setExpenseLedger(formattedLedger)
        calculateStats(formattedLedger)

    } catch (error) {
        console.error('Error fetching expenses:', error)
    } finally {
        setLoading(false)
    }
  }

  // 4. Calculate Stats
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

  const handleCollectFee = async () => {
    if (!selectedMember || !clientId) return

    try {
        await supabase.from('expenses_ledger').insert([{
            client_id: clientId,
            member_id: selectedMember,
            amount: 200,
            type: 'INCOME',
            category: 'MAINTENANCE_FEE',
            description: 'Monthly Maintenance Fee',
            date: new Date().toISOString().split('T')[0]
        }])

        fetchData()
        setSelectedMember('')
        setIsCollectFeeOpen(false)
    } catch (error) {
        alert('Failed to collect fee')
    }
  }

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

        fetchData()
        setExpenseData({
            amount: '',
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        })
        setIsRecordExpenseOpen(false)
    } catch (error) {
        alert('Failed to record expense')
    }
  }

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
        <Dialog open={isCollectFeeOpen} onOpenChange={setIsCollectFeeOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Users className="h-4 w-4" />
              Collect Member Fee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Collect Fee</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Label>Select Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleCollectFee} className="w-full bg-blue-600">Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isRecordExpenseOpen} onOpenChange={setIsRecordExpenseOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4" />
              Record Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input type="number" placeholder="Amount" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} />
              <Select value={expenseData.category} onValueChange={v => setExpenseData({...expenseData, category: v})}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STATIONERY">Stationery</SelectItem>
                  <SelectItem value="PRINTING">Printing</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} />
              <Textarea placeholder="Description" value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} />
              <Button onClick={handleRecordExpense} className="w-full bg-orange-600">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION C: THE LEDGER TABLE */}
      <Card>
        <CardHeader><CardTitle className="flex gap-2"><Receipt className="h-5 w-5"/> Ledger</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow> :
               expenseLedger.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No Data found.</TableCell></TableRow> :
               expenseLedger.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.memberName || '-'}</TableCell>
                  <TableCell><Badge className={getCategoryColor(entry.category)}>{getCategoryLabel(entry.category)}</Badge></TableCell>
                  <TableCell><Badge variant={entry.type === 'INCOME' ? 'default' : 'destructive'}>{entry.type}</Badge></TableCell>
                  <TableCell className={`text-right font-bold ${entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.type === 'INCOME' ? '+' : '-'}₹{Number(entry.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
