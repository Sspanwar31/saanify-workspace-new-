'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, Calendar, CreditCard, TrendingUp, AlertTriangle, Edit, RefreshCw,
  Building2, DollarSign, BarChart3, Activity, Target, ArrowUpRight, ChevronDown,
  Plus, Loader2, Shield, Download, LogOut, CheckCircle, Search, Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem 
} from '@/components/ui/dropdown-menu'
import AnimatedCounter from '@/components/ui/animated-counter'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Interfaces
interface Loan {
  id: string; memberId: string; memberName: string; loanType: 'PERSONAL' | 'BUSINESS' | 'EMERGENCY' | 'HOUSING';
  principal: number; interestRate: number; amount: number; tenure: number; startDate: string; endDate?: string;
  status: 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'PAID'; emiAmount?: number; nextPaymentDate?: string;
  createdAt: string; updatedAt: string;
}
interface LoanFormData {
  loanType: 'PERSONAL' | 'BUSINESS' | 'EMERGENCY' | 'HOUSING'
  principal: number
  interestRate: number
  amount: number
  tenure: number
  startDate: string
  endDate?: string
  description: string
  memberId: string
  notes?: string
}
interface EMIInfo {
  monthlyPayment: number
  totalPayment: number
  remainingBalance: number
  nextPaymentDate: string
  daysLeft: number
  progress: number
  status: 'ON_TRACK' | 'PAID' | 'OVERDUE' | 'CRITICAL' | 'WARNING'
}
interface LoanManagementProps { societyInfo: any }

// Mock Data
const mockLoans: Loan[] = [
  { id: '1', memberId: 'M001', memberName: 'John Doe', loanType: 'PERSONAL', principal: 5000, interestRate: 12, amount: 5600, tenure: 12, startDate: '2023-11-01', endDate: '2024-11-01', status: 'ACTIVE', emiAmount: 467, nextPaymentDate: '2024-12-01', createdAt: '2023-11-01', updatedAt: '2023-11-01' },
  { id: '2', memberId: 'M002', memberName: 'Jane Smith', loanType: 'BUSINESS', principal: 20000, interestRate: 15, amount: 23000, tenure: 6, startDate: '2024-03-01', endDate: '2024-09-01', status: 'PAID', emiAmount: 3833, createdAt: '2024-03-01', updatedAt: '2024-09-01' },
  { id: '3', memberId: 'M003', memberName: 'Mike Johnson', loanType: 'EMERGENCY', principal: 1500, interestRate: 18, amount: 1635, tenure: 3, startDate: '2024-08-15', endDate: '2024-11-15', status: 'OVERDUE', emiAmount: 545, nextPaymentDate: '2024-09-15', createdAt: '2024-08-15', updatedAt: '2024-08-15' },
];

const initialNewLoanState = {
  loanType: 'PERSONAL' as Loan['loanType'],
  principal: 1000,
  interestRate: 12,
  amount: 5000,
  tenure: 12,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  description: '',
  memberId: '',
  notes: ''
}

export default function LoanManagement({ societyInfo }: LoanManagementProps) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLoanType, setSelectedLoanType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // SOLUTION: Missing state added
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [newLoanData, setNewLoanData] = useState(initialNewLoanState)

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
        setLoans(mockLoans);
        setLoading(false);
    }, 800);
  }, []);

  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch = loan.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) || loan.loanType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedLoanType === 'all' || loan.loanType === selectedLoanType;
      const matchesStatus = selectedStatus === 'all' || loan.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [loans, searchTerm, selectedLoanType, selectedStatus]);

  // SOLUTION: Stats variable added
  const stats = useMemo(() => {
    const totalRevenue = loans.reduce((sum, loan) => sum + loan.amount, 0);
    // Simple mock for monthly revenue
    const monthlyRevenue = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + (l.emiAmount || 0), 0);
    return { totalRevenue, monthlyRevenue };
  }, [loans]);

  // SOLUTION: handleAddLoan fixed
  const handleAddLoan = () => {
    if (!newLoanData.memberId || !newLoanData.amount || !newLoanData.tenure) {
      toast.error("Please fill all required fields: Member ID, Amount, Tenure.");
      return;
    }
    const newLoan: Loan = {
      id: Date.now().toString(),
      memberName: `Member ${newLoanData.memberId}`, // Placeholder name
      principal: newLoanData.principal,
      interestRate: newLoanData.interestRate,
      amount: newLoanData.amount,
      tenure: newLoanData.tenure,
      startDate: newLoanData.startDate,
      loanType: newLoanData.loanType,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberId: newLoanData.memberId,
    };
    setLoans(prev => [newLoan, ...prev]);
    setIsAddModalOpen(false);
    setNewLoanData(initialNewLoanState);
    toast.success(`New loan for ${newLoan.memberName} has been added`);
  };

  // SOLUTION: handleEditLoan fixed
  const handleEditLoan = () => {
    if (!editingLoan) return;
    setLoans(prev => prev.map(loan => loan.id === editingLoan.id ? editingLoan : loan));
    setIsEditModalOpen(false);
    setEditingLoan(null);
    toast.success(`Loan for ${editingLoan.memberName} has been updated`);
  };

  // SOLUTION: Only one handleDeleteLoan function
  const handleDeleteLoan = (loanToDelete: Loan) => {
    if (!loanToDelete) return;
    setLoans(prev => prev.filter(l => l.id !== loanToDelete.id));
    toast.error(`Loan for ${loanToDelete.memberName} has been deleted`);
  };

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PAID: 'bg-blue-100 text-blue-800'
  };
  const planColors = {
    PERSONAL: 'bg-blue-100 text-blue-800',
    BUSINESS: 'bg-purple-100 text-purple-800',
    EMERGENCY: 'bg-red-100 text-red-800',
    HOUSING: 'bg-green-100 text-green-800'
  };
  
  if (loading) { return <Loader2 className="animate-spin m-auto" /> }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage all member loans efficiently</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-3 py-2 text-sm">
              🧩 Demo Mode
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-gray-200 shadow-lg">
                <DropdownMenuItem onClick={() => toast.success('Exporting as CSV')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success('Exporting as PDF')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              onClick={() => window.location.href = '/login'}
              variant="outline"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Cards (Corrected) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Loans Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                    <CreditCard className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loans.length}</div>
                    <p className="text-xs text-blue-100">All registered loans</p>
                </CardContent>
            </Card>
            {/* Active Loans Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                    <Activity className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loans.filter(l => l.status === 'ACTIVE').length}</div>
                    <p className="text-xs text-green-100">Currently active</p>
                </CardContent>
            </Card>
            {/* Total Revenue Card (Corrected) */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Loan Amount</CardTitle>
                    <DollarSign className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{(stats.totalRevenue / 1000).toFixed(1)}K</div>
                    <p className="text-xs text-purple-100">All time disbursed</p>
                </CardContent>
            </Card>
            {/* Monthly Revenue Card (Corrected) */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly EMI</CardTitle>
                    <BarChart3 className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{(stats.monthlyRevenue / 1000).toFixed(1)}K</div>
                    <p className="text-xs text-orange-100">This month's collection</p>
                </CardContent>
            </Card>
        </div>

        {/* Search and Filter Bar (Corrected) */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by name or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="OVERDUE">Overdue</SelectItem><SelectItem value="PAID">Paid</SelectItem></SelectContent>
                </Select>
                <Select value={selectedLoanType} onValueChange={setSelectedLoanType}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="PERSONAL">Personal</SelectItem><SelectItem value="BUSINESS">Business</SelectItem><SelectItem value="EMERGENCY">Emergency</SelectItem><SelectItem value="HOUSING">Housing</SelectItem></SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Table (Corrected) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Loan Management</CardTitle>
            <CardDescription>View and manage all member loans.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>EMI</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredLoans.length > 0 ? filteredLoans.map((loan) => (
                        <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.memberName}</TableCell>
                            <TableCell><Badge className={planColors[loan.loanType]}>{loan.loanType}</Badge></TableCell>
                            <TableCell><Badge className={statusColors[loan.status]}>{loan.status}</Badge></TableCell>
                            <TableCell>₹{loan.principal.toLocaleString()}</TableCell>
                            <TableCell>₹{loan.emiAmount?.toLocaleString() || 'N/A'}</TableCell>
                            <TableCell>{loan.startDate}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => { setEditingLoan(loan); setIsEditModalOpen(true); }}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteLoan(loan)}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow><TableCell colSpan={7} className="text-center">No loans found.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Loan Modal */}
        <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setEditingLoan(null);
            setNewLoanData(initialNewLoanState);
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditModalOpen ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
              <DialogDescription>
                {isEditModalOpen ? 'Edit the loan details below.' : 'Fill in the details to add a new loan.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="memberId" className="text-right">
                  Member ID
                </Label>
                <Input
                  id="memberId"
                  value={isEditModalOpen ? editingLoan?.memberId : newLoanData.memberId}
                  onChange={(e) => isEditModalOpen 
                    ? setEditingLoan(prev => prev ? {...prev, memberId: e.target.value} : null)
                    : setNewLoanData(prev => ({...prev, memberId: e.target.value}))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={isEditModalOpen ? editingLoan?.amount : newLoanData.amount}
                  onChange={(e) => isEditModalOpen 
                    ? setEditingLoan(prev => prev ? {...prev, amount: Number(e.target.value)} : null)
                    : setNewLoanData(prev => ({...prev, amount: Number(e.target.value)}))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tenure" className="text-right">
                  Tenure (months)
                </Label>
                <Input
                  id="tenure"
                  type="number"
                  value={isEditModalOpen ? editingLoan?.tenure : newLoanData.tenure}
                  onChange={(e) => isEditModalOpen 
                    ? setEditingLoan(prev => prev ? {...prev, tenure: Number(e.target.value)} : null)
                    : setNewLoanData(prev => ({...prev, tenure: Number(e.target.value)}))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="loanType" className="text-right">
                  Loan Type
                </Label>
                <Select 
                  value={isEditModalOpen ? editingLoan?.loanType : newLoanData.loanType}
                  onValueChange={(value) => isEditModalOpen 
                    ? setEditingLoan(prev => prev ? {...prev, loanType: value as Loan['loanType']} : null)
                    : setNewLoanData(prev => ({...prev, loanType: value as Loan['loanType']}))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    <SelectItem value="HOUSING">Housing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setEditingLoan(null);
                setNewLoanData(initialNewLoanState);
              }}>Cancel</Button>
              <Button onClick={isEditModalOpen ? handleEditLoan : handleAddLoan}>
                {isEditModalOpen ? 'Save Changes' : 'Add Loan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Floating Add Button */}
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}