'use client'

import { useState, useEffect } from 'react'
import { 
  Calculator, 
  TrendingUp, 
  Users,
  Calendar,
  DollarSign,
  Percent,
  Settings,
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
import { Progress } from '@/components/ui/progress'
import { useSuperClientStore, type MaturityData } from '@/lib/super-client/store'
import { format } from 'date-fns'

export default function MaturityPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [tempManualInterest, setTempManualInterest] = useState<string>('')
  const { getMaturityData, setMaturityOverride, clearMaturityOverride } = useSuperClientStore()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevent server render to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Maturity Module...</p>
        </div>
      </div>
    )
  }

  const maturityData = getMaturityData()

  const handleToggleOverride = (memberId: string, currentValue: number, isOverride: boolean) => {
    if (isOverride) {
      clearMaturityOverride(memberId)
    } else {
      setMaturityOverride(memberId, currentValue)
      setEditingMember(memberId)
      setTempManualInterest(currentValue.toString())
    }
  }

  const handleSaveManualInterest = (memberId: string) => {
    const amount = parseFloat(tempManualInterest)
    if (!isNaN(amount) && amount >= 0) {
      setMaturityOverride(memberId, amount)
      setEditingMember(null)
      setTempManualInterest('')
    }
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setTempManualInterest('')
  }

  // Calculate totals for overview cards
  const totalNetPayable = maturityData.reduce((sum, data) => sum + data.netPayable, 0)
  const totalCurrentDeposit = maturityData.reduce((sum, data) => sum + data.currentDeposit, 0)
  const totalMonthlyDeposit = maturityData.reduce((sum, data) => sum + (data.currentDeposit / Math.max(data.tenure, 1)), 0) * maturityData.length
  const totalTargetDeposit = maturityData.reduce((sum, data) => sum + (5000 * 36), 0) // Assuming ₹5000 monthly
  const totalMonthlyInterestLiability = maturityData.reduce((sum, data) => sum + (data.currentDeposit * 0.01), 0)
  const totalCurrentAccruedInterest = maturityData.reduce((sum, data) => sum + (data.currentDeposit * 0.01 * data.tenure), 0)
  const totalFullProjectedInterest = maturityData.reduce((sum, data) => sum + (5000 * 36 * 0.12), 0)
  const totalOutstandingLoan = maturityData.reduce((sum, data) => sum + data.outstandingLoan, 0)
  const maturedMembers = maturityData.filter(data => data.status === 'matured').length

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
            <Table className="min-w-[2200px]">
              <TableHeader>
                <TableRow>
                  {/* SECTION A: MEMBER & TIME (Gray Header) */}
                  <TableHead className="w-[200px] bg-gray-100 text-gray-900 font-bold border-r-2 border-gray-300">
                    Member Name
                  </TableHead>
                  <TableHead className="w-[140px] bg-gray-100 text-gray-900 font-bold">
                    Start Date
                  </TableHead>
                  <TableHead className="w-[140px] bg-gray-100 text-gray-900 font-bold">
                    Tenure Progress
                  </TableHead>
                  
                  {/* SECTION B: DEPOSITS (Green Header) */}
                  <TableHead className="w-[140px] bg-green-100 text-green-900 font-bold border-l-2 border-green-300">
                    Monthly Deposit
                  </TableHead>
                  <TableHead className="w-[140px] bg-green-100 text-green-900 font-bold">
                    Current Deposit
                  </TableHead>
                  <TableHead className="w-[140px] bg-green-100 text-green-900 font-bold">
                    Target Deposit
                  </TableHead>
                  
                  {/* SECTION C: INTEREST & LIABILITY (Purple Header) */}
                  <TableHead className="w-[160px] bg-purple-100 text-purple-900 font-bold border-l-2 border-purple-300">
                    Monthly Interest Liability
                  </TableHead>
                  <TableHead className="w-[160px] bg-purple-100 text-purple-900 font-bold">
                    Current Accrued Interest
                  </TableHead>
                  <TableHead className="w-[160px] bg-purple-100 text-purple-900 font-bold">
                    Full Projected Interest
                  </TableHead>
                  <TableHead className="w-[160px] bg-purple-100 text-purple-900 font-bold">
                    Manual Interest
                  </TableHead>
                  
                  {/* SECTION D: SETTLEMENT (Orange/Red Header) */}
                  <TableHead className="w-[140px] bg-orange-100 text-orange-900 font-bold border-l-2 border-orange-300">
                    Outstanding Loan
                  </TableHead>
                  <TableHead className="w-[140px] bg-red-100 text-red-900 font-bold">
                    Net Payable
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maturityData.map((data: MaturityData) => {
                  const monthlyDeposit = 5000; // Fixed amount
                  const targetDeposit = monthlyDeposit * 36;
                  const monthlyInterestLiability = data.currentDeposit * 0.01;
                  const currentAccruedInterest = monthlyInterestLiability * data.tenure;
                  const fullProjectedInterest = targetDeposit * 0.12;
                  
                  return (
                    <TableRow key={data.memberId} className="hover:bg-gray-50 whitespace-nowrap">
                      {/* Member Name - Normal column, NO Sticky */}
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
                            <p className="text-sm text-gray-500">
                              ID: {data.memberId}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Start Date (DD-MMM-YYYY) */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{format(new Date(data.joinDate), 'dd-MMM-yyyy')}</span>
                        </div>
                      </TableCell>

                      {/* Tenure Progress with Badge/Pill style */}
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="bg-blue-50 border-blue-200 text-blue-700 font-medium px-3 py-1"
                        >
                          <span className="font-bold text-blue-600">{data.tenure}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-500">36</span>
                        </Badge>
                      </TableCell>

                      {/* Monthly Deposit (Fixed Amount) */}
                      <TableCell className="font-medium text-green-600">
                        ₹{monthlyDeposit.toLocaleString()}
                      </TableCell>

                      {/* Current Deposit (Live Sum from Passbook) */}
                      <TableCell className="font-medium text-green-600">
                        ₹{data.currentDeposit.toLocaleString()}
                      </TableCell>

                      {/* Target Deposit (Monthly Deposit * 36) */}
                      <TableCell className="font-medium text-green-700">
                        ₹{targetDeposit.toLocaleString()}
                      </TableCell>

                      {/* Monthly Interest Liability (Current Deposit * 1%) */}
                      <TableCell className="font-medium text-purple-600">
                        ₹{monthlyInterestLiability.toFixed(2).toLocaleString()}
                      </TableCell>

                      {/* Current Accrued Interest (Monthly Liability * Months Completed) */}
                      <TableCell className="font-medium text-purple-600">
                        ₹{currentAccruedInterest.toFixed(2).toLocaleString()}
                      </TableCell>

                      {/* Full Projected Interest (Target Deposit * 12%) */}
                      <TableCell className="font-medium text-purple-700">
                        ₹{fullProjectedInterest.toLocaleString()}
                      </TableCell>

                      {/* Manual Interest (Input Field + Toggle) */}
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={data.isOverride}
                              onCheckedChange={() => handleToggleOverride(
                                data.memberId, 
                                data.calculatedInterest, 
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
                                ✓
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="h-8 px-2"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className={`text-sm font-medium ${data.isOverride ? 'text-orange-600' : 'text-gray-500'}`}>
                              ₹{data.finalInterest.toLocaleString()}
                              {data.isOverride && (
                                <span className="text-xs text-orange-600 ml-1">(Manual)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Outstanding Loan (Red Text, Live from Loans) */}
                      <TableCell className="font-medium text-red-600">
                        ₹{data.outstandingLoan.toLocaleString()}
                      </TableCell>

                      {/* Net Payable (Green Bold Text, Large Font) */}
                      <TableCell className="font-bold text-lg text-green-600">
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