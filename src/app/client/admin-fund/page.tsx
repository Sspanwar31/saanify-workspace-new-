'use client'

import { useState } from 'react'
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  Trash2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useClientStore } from '@/lib/client/store'

export default function AdminFundPage() {
  const { 
    adminFundLedger, 
    adminFund, 
    addAdminTransaction, 
    deleteAdminTransaction, 
    getAdminFundSummary,
    getSocietyCashInHand 
  } = useClientStore()

  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [showWarning, setShowWarning] = useState(false)

  const summary = getAdminFundSummary()
  const cashInHand = adminFund.totalFunds
  const societyCashInHand = getSocietyCashInHand()

  const handleInject = () => {
    if (!formData.amount || !formData.description) return
    
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) return

    addAdminTransaction(amount, 'INJECT', formData.description)
    setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] })
    setIsInjectModalOpen(false)
  }

  const handleWithdraw = () => {
    if (!formData.amount || !formData.description) return
    
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) return

    // Check if sufficient cash is available
    if (amount > cashInHand) {
      setShowWarning(true)
      return
    }

    addAdminTransaction(amount, 'WITHDRAW', formData.description)
    setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] })
    setIsWithdrawModalOpen(false)
  }

  const handleForceWithdraw = () => {
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) return

    addAdminTransaction(amount, 'WITHDRAW', formData.description)
    setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] })
    setIsWithdrawModalOpen(false)
    setShowWarning(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Fund Ledger
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track funds exchanged between Admin and Society
        </p>
      </div>

      {/* SECTION A: SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Net Balance Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              summary.netBalance > 0 ? 'text-orange-600' : 
              summary.netBalance < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              ₹{Math.abs(summary.netBalance).toLocaleString()}
            </div>
            <p className={`text-sm mt-1 ${
              summary.netBalance > 0 ? 'text-orange-600' : 
              summary.netBalance < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {summary.netBalance > 0 ? 'Society owes Admin' : 
               summary.netBalance < 0 ? 'Admin owes Society' : 
               'Balanced'}
            </p>
          </CardContent>
        </Card>

        {/* Total Injected Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Injected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{summary.totalInjected.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Admin gave to Society
            </p>
          </CardContent>
        </Card>

        {/* Total Withdrawn Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ₹{summary.totalWithdrawn.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Admin took from Society
            </p>
          </CardContent>
        </Card>

        {/* Society Cash Available Card */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Society Cash Available</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {/* Format currency helper or direct locale string */}
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(societyCashInHand)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Real-time cash in locker (All Sources)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash in Hand Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cash in Hand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            ₹{cashInHand.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Available for withdrawals and expenses
          </p>
        </CardContent>
      </Card>

      {/* SECTION B: ACTION BUTTONS */}
      <div className="flex gap-4">
        {/* Inject Fund Button */}
        <Dialog open={isInjectModalOpen} onOpenChange={setIsInjectModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <ArrowDownCircle className="h-4 w-4" />
              Inject Fund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <ArrowDownCircle className="h-5 w-5" />
                Inject Fund
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inject-amount">Amount</Label>
                <Input
                  id="inject-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inject-date">Date</Label>
                <Input
                  id="inject-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inject-description">Description</Label>
                <Textarea
                  id="inject-description"
                  placeholder="Enter description for this transaction"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleInject}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!formData.amount || !formData.description}
                >
                  Inject Fund
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsInjectModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdraw Fund Button */}
        <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Withdraw Fund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <ArrowUpCircle className="h-5 w-5" />
                Withdraw Fund
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {showWarning && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="space-y-2">
                      <p><strong>Warning:</strong> Withdrawal amount (₹{parseFloat(formData.amount).toLocaleString()}) exceeds available Cash in Hand (₹{cashInHand.toLocaleString()}).</p>
                      <p>This may result in negative cash balance. Do you want to continue?</p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowWarning(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={handleForceWithdraw}
                        >
                          Force Withdraw
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="withdraw-amount">Amount</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="withdraw-date">Date</Label>
                <Input
                  id="withdraw-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="withdraw-description">Description</Label>
                <Textarea
                  id="withdraw-description"
                  placeholder="Enter description for this transaction"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              {!showWarning && (
                <div className="flex gap-2">
                  <Button 
                    variant="destructive"
                    onClick={handleWithdraw}
                    className="flex-1"
                    disabled={!formData.amount || !formData.description}
                  >
                    Withdraw Fund
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsWithdrawModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SECTION C: THE LEDGER TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description/Note</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminFundLedger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No transactions yet. Add your first transaction to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminFundLedger
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.type === 'INJECT' ? 'default' : 'destructive'}
                            className={transaction.type === 'INJECT' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                          >
                            {transaction.type === 'INJECT' ? 'Received' : 'Given'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={transaction.type === 'INJECT' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'INJECT' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          transaction.runningBalance > 0 ? 'text-orange-600' : 
                          transaction.runningBalance < 0 ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          ₹{Math.abs(transaction.runningBalance).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAdminTransaction(transaction.id)}
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