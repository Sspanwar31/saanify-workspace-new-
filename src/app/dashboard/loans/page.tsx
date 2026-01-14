'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple' 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoanRequestsTable } from '@/components/client/loans/LoanRequestsTable'
import { AllLoansTable } from '@/components/client/loans/AllLoansTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HandCoins, TrendingUp, Clock, Calendar, DollarSign } from 'lucide-react'

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([])
  const [loanRequests, setLoanRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // 1️⃣ clientId state
  const [clientId, setClientId] = useState(''); 

  // 2️⃣ useEffect में SAFE CLIENT ID
  useEffect(() => {
    const fetchLoanData = async () => {
      setLoading(true);

      // ✅ FIX: Resolve client_id from localStorage (NOT random client)
      const currentUser = JSON.parse(localStorage.getItem('current_user') || 'null')
      const currentMember = JSON.parse(localStorage.getItem('current_member') || 'null')

      const resolvedClientId = currentMember?.client_id || currentUser?.id

      if (!resolvedClientId) {
        console.error('CLIENT ID NOT FOUND');
        setLoading(false)
        return
      }

      // ✅ IMPORTANT: Update State so UI components can use it
      setClientId(resolvedClientId);

      // 1. Fetch Loans (3️⃣ Fetch में clientId use hua)
      const { data: loansData } = await supabase
        .from('loans')
        .select('*, members(id, name, phone, total_deposits, outstanding_loan)')
        .eq('client_id', resolvedClientId)
        .order('created_at', { ascending: false })

      // 2. Fetch ALL Passbook entries to calculate interest
      const { data: allPassbook } = await supabase
        .from('passbook_entries')
        .select('member_id, interest_amount')

      if (loansData) {
        const formattedData = loansData.map((item: any) => {

          // ✅ Interest calculation (UNCHANGED)
          const memberEntries =
            allPassbook?.filter((e: any) => e.member_id === item.member_id) || []

          const totalInterestEarned = memberEntries.reduce(
            (sum: number, e: any) => sum + (Number(e.interest_amount) || 0),
            0
          )

          return {
            ...item,
            id: item.id,
            amount: item.amount,
            status: item.status,
            remainingBalance: item.members?.outstanding_loan || 0,
            memberId: item.member_id,
            memberName: item.members?.name || 'Unknown',
            memberPhone: item.members?.phone,
            memberTotalDeposits: item.members?.total_deposits || 0,
            totalInterestCollected: totalInterestEarned,
            requestedDate: item.start_date || item.created_at,
            startDate: item.start_date
          }
        })

        setLoanRequests(formattedData.filter(l => l.status === 'pending'))
        setLoans(formattedData.filter(l => ['active', 'completed', 'closed'].includes(l.status)))
      }

      setLoading(false)
    }

    fetchLoanData()
  }, [])

  const activeLoans = loans.filter(loan => loan.status === 'active')
  const pendingRequests = loanRequests
  
  const totalDisbursed = loans
    .filter(l => ['active', 'completed'].includes(l.status))
    .reduce((sum, loan) => sum + (loan.amount || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
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
            <p className="text-xs text-gray-600 dark:text-gray-400">Currently active loans</p>
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
            <p className="text-xs text-gray-600 dark:text-gray-400">Awaiting approval</p>
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
            <p className="text-xs text-gray-600 dark:text-gray-400">Total loan amount</p>
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
            <p className="text-xs text-gray-600 dark:text-gray-400">Total outstanding balance</p>
          </CardContent>
        </Card>
      </div>

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
            <LoanRequestsTable requests={pendingRequests} />
          </TabsContent>

          <TabsContent value="all-loans">
            <AllLoansTable loans={loans} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
