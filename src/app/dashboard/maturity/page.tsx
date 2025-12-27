'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple' // Supabase Connection Added
import { 
  Calculator, 
  TrendingUp, 
  Users,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { format, differenceInMonths } from 'date-fns'

// Define the interface locally since we removed the store
export interface MaturityData {
  memberId: string
  memberName: string
  joinDate: string
  tenure: number
  monthsCompleted: number
  monthlyDeposit: number
  currentDeposit: number
  targetDeposit: number
  projectedInterest: number
  settledInterest: number
  isOverride: boolean
  monthlyInterestShare: number
  currentAccruedInterest: number
  maturityAmount: number
  outstandingLoan: number
  netPayable: number
  status: 'active' | 'matured'
}

export default function MaturityPage() {
  const [isMounted, setIsMounted] = useState(false)
  
  // Local State for Data
  const [maturityData, setMaturityData] = useState<MaturityData[]>([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)

  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [tempManualInterest, setTempManualInterest] = useState<string>('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // --- 1. Fetch Data & Calculate Logic (Supabase) ---
  const fetchData = async () => {
    setLoading(true)
    
    // Get Client ID
    let cid = clientId
    if (!cid) {
        const { data: clients } = await supabase.from('clients').select('id').limit(1)
        if (clients && clients.length > 0) {
            cid = clients[0].id
            setClientId(cid)
        }
    }

    if (cid) {
        // Fetch Members with all financial details
        const { data: members } = await supabase
            .from('members')
            .select('*')
            .eq('client_id', cid)
            .order('name', { ascending: true })

        if (members) {
            // Apply Maturity Logic (Same as your original store logic)
            const calculatedData: MaturityData[] = members.map((m: any) => {
                const joinDate = new Date(m.join_date || new Date())
                const now = new Date()
                
                // Constants & Basic Data
                const tenure = 36 // Default Tenure (Fixed as per your logic)
                const monthsCompleted = Math.max(0, differenceInMonths(now, joinDate))
                
                // Financials from DB
                const monthlyDeposit = m.monthly_deposit_amount || 0 // Individual amount from DB
                const currentDeposit = m.total_deposits || 0
                const outstandingLoan = m.outstanding_loan || 0

                // Calculations
                const targetDeposit = monthlyDeposit * tenure
                const fullProjectedInterest = targetDeposit * 0.12 // 12% Logic

                // Override Logic
                const isOverride = m.maturity_is_override || false
                const manualAmount = m.maturity_manual_amount || 0
                
                // Decision: Auto vs Manual
                const settledInterest = isOverride ? manualAmount : fullProjectedInterest

                // Accrual Logic
                const monthlyInterestShare = settledInterest / tenure
                const currentAccruedInterest = monthlyInterestShare * monthsCompleted

                // Finals
                const maturityAmount = targetDeposit + settledInterest
                const netPayable = maturityAmount - outstandingLoan
                
                const status = monthsCompleted >= tenure ? 'matured' : 'active'

                return {
                    memberId: m.id,
                    memberName: m.name,
                    joinDate: m.join_date,
                    tenure,
                    monthsCompleted,
                    monthlyDeposit,
                    currentDeposit,
                    targetDeposit,
                    projectedInterest: fullProjectedInterest,
                    settledInterest,
                    isOverride,
                    monthlyInterestShare,
                    currentAccruedInterest,
                    maturityAmount,
                    outstandingLoan,
                    netPayable,
                    status
                }
            })
            setMaturityData(calculatedData)
        }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- Handlers (Connected to Supabase) ---

  const handleToggleOverride = async (memberId: string, currentValue: number, isOverride: boolean) => {
    if (isOverride) {
      // Clear Override (Turn OFF)
      // Optimistic Update
      setMaturityData(prev => prev.map(d => d.memberId === memberId ? { ...d, isOverride: false } : d))
      setEditingMember(null)
      setTempManualInterest('')
      
      // DB Update
      await supabase.from('members').update({ 
          maturity_is_override: false,
          maturity_manual_amount: 0 
      }).eq('id', memberId)
      
      fetchData() // Re-fetch to apply auto-calculation logic
    } else {
      // Turn ON Override
      // Optimistic Update
      setMaturityData(prev => prev.map(d => d.memberId === memberId ? { ...d, isOverride: true } : d))
      
      // DB Update
      await supabase.from('members').update({ maturity_is_override: true }).eq('id', memberId)
      
      setEditingMember(memberId)
      setTempManualInterest(currentValue.toString())
    }
  }

  const handleSaveManualInterest = async (memberId: string) => {
    const amount = parseFloat(tempManualInterest)
    if (!isNaN(amount) && amount >= 0) {
      // Optimistic Update
      setMaturityData(prev => prev.map(d => 
        d.memberId === memberId ? { ...d, settledInterest: amount } : d
      ))
      setEditingMember(null)
      setTempManualInterest('')

      // DB Update
      await supabase.from('members').update({ 
          maturity_manual_amount: amount,
          maturity_is_override: true 
      }).eq('id', memberId)
      
      fetchData() // Recalculate dependent fields
    }
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setTempManualInterest('')
  }

  // Prevent server render to avoid hydration mismatch
  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Maturity Module...</p>
        </div>
      </div>
    )
  }

  // Calculate totals for overview cards
  const totalNetPayable = maturityData.reduce((sum, data) => sum + data.netPayable, 0)
  const totalCurrentDeposit = maturityData.reduce((sum, data) => sum + data.currentDeposit, 0)
  const totalMonthlyInterestLiability = maturityData.reduce((sum, data) => sum + data.monthlyInterestShare, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Maturity Module
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive maturity calculations with manual override capabilities
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Members</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {maturityData.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Registered members
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Current Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalCurrentDeposit.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Live sum from passbook
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Interest Liability</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{totalMonthlyInterestLiability.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Monthly society expense
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Net Payable</CardTitle>
            <Calculator className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalNetPayable.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total settlement amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Final Maturity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Final Maturity Table - Comprehensive View
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete financial analysis with deposits, interest calculations, and settlement amounts
          </p>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="w-full overflow-x-auto border rounded-lg custom-scrollbar pb-4">
            <Table className="min-w-[2600px]">
              <TableHeader>
                <TableRow>
                  {/* 1. Member Name */}
                  <TableHead className="w-[200px] bg-gray-100 text-gray-900 font-bold border-r-2 border-gray-300">
                    Member Name
                  </TableHead>
                  
                  {/* 2. Start Date */}
                  <TableHead className="w-[140px] bg-gray-100 text-gray-900 font-bold">
                    Start Date
                  </TableHead>
                  
                  {/* 3. Tenure */}
                  <TableHead className="w-[140px] bg-gray-100 text-gray-900 font-bold">
                    Tenure
                  </TableHead>
                  
                  {/* 4. Monthly Deposit */}
                  <TableHead className="w-[140px] bg-green-100 text-green-900 font-bold border-l-2 border-green-300">
                    Monthly Deposit
                  </TableHead>
                  
                  {/* 5. Current Deposit */}
                  <TableHead className="w-[140px] bg-green-100 text-green-900 font-bold">
                    Current Deposit
                  </TableHead>
                  
                  {/* 6. Target Deposit */}
                  <TableHead className="w-[140px] bg-green-100 text-green-900 font-bold">
                    Target Deposit
                  </TableHead>
                  
                  {/* 7. Full Projected Int. (12%) */}
                  <TableHead className="w-[160px] bg-purple-100 text-purple-900 font-bold border-l-2 border-purple-300">
                    Full Projected Int. (12%)
                  </TableHead>
                  
                  {/* 8. Settled Interest (Toggle + Input) */}
                  <TableHead className="w-[180px] bg-purple-100 text-purple-900 font-bold">
                    Settled Interest (Toggle + Input)
                  </TableHead>
                  
                  {/* 9. Monthly Int. Share */}
                  <TableHead className="w-[160px] bg-purple-100 text-purple-900 font-bold">
                    Monthly Int. Share
                  </TableHead>
                  
                  {/* 10. Current Accrued */}
                  <TableHead className="w-[160px] bg-purple-100 text-purple-900 font-bold">
                    Current Accrued
                  </TableHead>
                  
                  {/* 11. Maturity Amount */}
                  <TableHead className="w-[160px] bg-orange-100 text-orange-900 font-bold border-l-2 border-orange-300">
                    Maturity Amount
                  </TableHead>
                  
                  {/* 12. Outstanding Loan */}
                  <TableHead className="w-[140px] bg-red-100 text-red-900 font-bold">
                    Outstanding Loan
                  </TableHead>
                  
                  {/* 13. Net Payable */}
                  <TableHead className="w-[140px] bg-green-100 text-green-900 font-bold">
                    Net Payable
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maturityData.map((data: MaturityData) => {
                  return (
                    <TableRow key={data.memberId} className="hover:bg-gray-50 whitespace-nowrap">
                      {/* 1. Member Name */}
                      <TableCell className="border-r-2 border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {data.memberName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {data.memberName}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Start Date */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{data.joinDate ? format(new Date(data.joinDate), 'dd-MMM-yyyy') : 'N/A'}</span>
                        </div>
                      </TableCell>

                      {/* 3. Tenure (Pill: "10 / 36") */}
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="bg-blue-50 border-blue-200 text-blue-700 font-medium px-3 py-1"
                        >
                          <span className="font-bold text-blue-600">{data.monthsCompleted}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-500">{data.tenure}</span>
                        </Badge>
                      </TableCell>

                      {/* 4. Monthly Deposit */}
                      <TableCell className="font-medium text-green-600">
                        ₹{data.monthlyDeposit.toLocaleString()}
                      </TableCell>

                      {/* 5. Current Deposit */}
                      <TableCell className="font-medium text-green-600">
                        ₹{data.currentDeposit.toLocaleString()}
                      </TableCell>

                      {/* 6. Target Deposit */}
                      <TableCell className="font-medium text-green-700">
                        ₹{data.targetDeposit.toLocaleString()}
                      </TableCell>

                      {/* 7. Full Projected Int. (12%) */}
                      <TableCell className="font-medium text-purple-700">
                        ₹{data.projectedInterest.toLocaleString()}
                      </TableCell>

                      {/* 8. Settled Interest (Toggle + Input) */}
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={data.isOverride}
                              onCheckedChange={() => handleToggleOverride(
                                data.memberId, 
                                data.settledInterest, 
                                data.isOverride
                              )}
                            />
                            <span className="text-sm text-gray-600">
                              {data.isOverride ? 'Manual' : 'Auto'}
                            </span>
                          </div>
                          
                          {editingMember === data.memberId ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={tempManualInterest}
                                onChange={(e) => setTempManualInterest(e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Enter amount"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveManualInterest(data.memberId)}
                                className="h-8 px-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="h-8 px-2"
                              >
                                X
                              </Button>
                            </div>
                          ) : (
                            <div className={`text-sm font-medium ${data.isOverride ? 'text-orange-600' : 'text-gray-500'}`}>
                              ₹{data.settledInterest.toLocaleString()}
                              {data.isOverride && (
                                <span className="text-xs text-orange-600 ml-1">(Manual)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 9. Monthly Int. Share */}
                      <TableCell className="font-medium text-purple-600">
                        ₹{data.monthlyInterestShare.toFixed(2).toLocaleString()}
                      </TableCell>

                      {/* 10. Current Accrued */}
                      <TableCell className="font-medium text-purple-600">
                        ₹{data.currentAccruedInterest.toFixed(2).toLocaleString()}
                      </TableCell>

                      {/* 11. Maturity Amount */}
                      <TableCell className="font-medium text-orange-600">
                        ₹{data.maturityAmount.toLocaleString()}
                      </TableCell>

                      {/* 12. Outstanding Loan */}
                      <TableCell className="font-medium text-red-600">
                        ₹{data.outstandingLoan.toLocaleString()}
                      </TableCell>

                      {/* 13. Net Payable */}
                      <TableCell className="font-bold text-green-600">
                        ₹{data.netPayable.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fed7aa;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fb923c;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f97316;
        }
      `}</style>
    </div>
  )
}
