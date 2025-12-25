'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  FileText,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  Filter,
  Plus,
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  memberId: string
  memberName: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  date: string
  status: 'COMPLETED' | 'PENDING' | 'EXPIRED'
  balance: number
}

interface Member {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  joinedAt: string
}

export default function PassbookManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    memberId: '',
    type: 'CREDIT' as const,
    amount: '',
    description: ''
  })

  // Mock data
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        memberId: '1',
        memberName: 'John Doe',
        type: 'CREDIT',
        amount: 5000,
        description: 'Monthly deposit',
        date: '2024-01-15',
        status: 'COMPLETED',
        balance: 15000
      },
      {
        id: '2',
        memberId: '2',
        memberName: 'Jane Smith',
        type: 'DEBIT',
        amount: 2000,
        description: 'Withdrawal',
        date: '2024-01-14',
        status: 'COMPLETED',
        balance: 8000
      }
    ]

    const mockMembers: Member[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+0987654321',
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: '2024-01-02'
      }
    ]

    setTimeout(() => {
      setTransactions(mockTransactions)
      setMembers(mockMembers)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'amount':
          return b.amount - a.amount
        case 'name':
          return a.memberName.localeCompare(b.memberName)
        default:
          return 0
      }
    })

    return filtered
  }, [transactions, searchTerm, selectedType, selectedStatus, sortBy])

  const stats = useMemo(() => {
    const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0)
    const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0)
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING').length

    return {
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit,
      pendingTransactions,
      totalTransactions: transactions.length
    }
  }, [transactions])

  const handleAddTransaction = () => {
    if (!newTransaction.memberId || !newTransaction.amount || !newTransaction.description) {
      toast.error('Please fill all fields')
      return
    }

    const member = members.find(m => m.id === newTransaction.memberId)
    if (!member) {
      toast.error('Please select a valid member')
      return
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      memberId: newTransaction.memberId,
      memberName: member.name,
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      date: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      balance: 0 // Calculate based on previous transactions
    }

    setTransactions([transaction, ...transactions])
    setNewTransaction({ memberId: '', type: 'CREDIT', amount: '', description: '' })
    setIsAddDialogOpen(false)
    toast.success('Transaction added successfully')
  }

  const exportData = () => {
    toast.success('Data exported successfully')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Passbook Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage all financial transactions and member balances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-blue-100" />
              <Badge className="bg-white/20 text-white border-white/30">
                Total Credit
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              ${stats.totalCredit.toLocaleString()}
            </div>
            <div className="text-blue-100 text-sm">
              All credit transactions
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-red-100" />
              <Badge className="bg-white/20 text-white border-white/30">
                Total Debit
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              ${stats.totalDebit.toLocaleString()}
            </div>
            <div className="text-red-100 text-sm">
              All debit transactions
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-8 w-8 text-green-100" />
              <Badge className="bg-white/20 text-white border-white/30">
                Current Balance
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              ${stats.balance.toLocaleString()}
            </div>
            <div className="text-green-100 text-sm">
              Net balance
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <PieChart className="h-8 w-8 text-purple-100" />
              <Badge className="bg-white/20 text-white border-white/30">
                Total Transactions
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">
              {stats.totalTransactions}
            </div>
            <div className="text-purple-100 text-sm">
              All transactions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
                <SelectItem value="DEBIT">Debit</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="EXPIRED">EXPIRED</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.memberName}</TableCell>
                  <TableCell>
                    <Badge className={
                      transaction.type === 'CREDIT' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>${transaction.amount.toLocaleString()}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge className={
                      transaction.status === 'COMPLETED' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${transaction.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Add a new transaction to the passbook
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="member">Member</Label>
              <Select value={newTransaction.memberId} onValueChange={(value) => 
                setNewTransaction({...newTransaction, memberId: value})
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newTransaction.type} onValueChange={(value: 'CREDIT' | 'DEBIT') => 
                setNewTransaction({...newTransaction, type: value})
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                placeholder="Enter amount"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTransaction}>
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}