'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple' // Supabase Connection
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Note: In tables ko bhi Supabase se connect karna padega agar ye Local Store use kar rahe hain
import { LoanRequestsTable } from '@/components/client/loans/LoanRequestsTable'
import { AllLoansTable } from '@/components/client/loans/AllLoansTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HandCoins, TrendingUp, Clock, Calendar, DollarSign } from 'lucide-react'

export default function LoansPage() {
  // --- States (Replaced Store with Local State) ---
  const [loans, setLoans] = useState<any[]>([])
  const [loanRequests, setLoanRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- Fetch Data from Supabase ---
  useEffect(() => {
    const fetchLoanData = async () => {
      setLoading(true)
      
      // 1. Get Client ID (Admin)
      const { data: clients } = await supabase.from('clients').select('id').limit(1)
      
      if (clients && clients.length > 0) {
        const clientId = clients[0].id

        // 2. Fetch All Loans (Requests + Active)
        const { data } = await supabase
          .from('loans')
          .select('*')
          .eq('client_id', clientId)

        if (data) {
          // Map DB columns (snake_case) to UI expected format (camelCase)
          const formattedData = data.map((item: any) => ({
            ...item,
            id: item.id,
            amount: item.amount,
            status: item.status,
            // Critical: Map 'remaining_balance' to 'remainingBalance' for your logic
            remainingBalance: item.remaining_balance || 0, 
            memberId: item.member_id
          }))

          // Separate Pending Requests vs Active/History Loans
          const requests = formattedData.filter(l => l.status === 'pending')
          const allOtherLoans = formattedData.filter(l => l.status !== 'pending')

          setLoanRequests(requests)
          setLoans(allOtherLoans)
        }
      }
      setLoading(false)
    }

    fetchLoanData()
  }, [])

  // --- Existing Logic (Unchanged) ---
  
  // Calculate stats
  const activeLoans = loans.filter(loan => loan.status === 'active')
  const pendingRequests = loanRequests.filter(request => request.status === 'pending')
  
  const totalDisbursed = loans
    .filter(l => l.status === 'active' || l.status === 'approved' || l.status === 'completed')
    .reduce((sum, loan) => sum + (loan.amount || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Loan Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage loan requests, approvals, and active loans
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : activeLoans.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Currently active loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? '...' : pendingRequests.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <HandCoins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : formatCurrency(totalDisbursed)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total loan amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : formatCurrency(activeLoans.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total outstanding balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <div className="space-y-4">
        <Tabs defaultValue="requests">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Loan Requests
              {pendingRequests.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-loans" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              All Loans
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {loans.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <LoanRequestsTable />
          </TabsContent>

          <TabsContent value="all-loans">
            <AllLoansTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
