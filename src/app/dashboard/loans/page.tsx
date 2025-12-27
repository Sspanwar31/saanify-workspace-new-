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

  useEffect(() => {
    const fetchLoanData = async () => {
      setLoading(true)
      
      const { data: clients } = await supabase.from('clients').select('id').limit(1)
      
      if (clients && clients.length > 0) {
        const clientId = clients[0].id

        // 1. Fetch Loans + Member Details (Live Outstanding is in Members table)
        const { data: loansData } = await supabase
          .from('loans')
          .select('*, members(id, name, phone, total_deposits, outstanding_loan)')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })

        // 2. Fetch Passbook Entries (To calculate Total Interest Collected)
        const { data: passbookData } = await supabase
          .from('passbook_entries')
          .select('member_id, interest_amount, fine_amount')
          .eq('member_id', loansData?.[0]?.member_id || '') // Optimize later, currently simple fetch
          // Note: In production, fetch passbook entries for ALL loan members
          
        // Fetch ALL passbook entries for this client's members (Better approach)
        const { data: allPassbook } = await supabase
          .from('passbook_entries')
          .select('member_id, interest_amount, fine_amount');

        if (loansData) {
          const formattedData = loansData.map((item: any) => {
            // Calculate Total Interest Earned for this member from Passbook
            const memberEntries = allPassbook?.filter((e: any) => e.member_id === item.member_id) || [];
            const totalInterestEarned = memberEntries.reduce((sum: number, e: any) => 
              sum + (Number(e.interest_amount) || 0) + (Number(e.fine_amount) || 0), 0);

            return {
              ...item,
              id: item.id,
              amount: item.amount,
              status: item.status,
              // ✅ CRITICAL FIX: Use Member's Live Outstanding Loan, not the static loan record
              remainingBalance: item.members?.outstanding_loan || 0,
              memberId: item.member_id,
              memberName: item.members?.name || 'Unknown',
              memberPhone: item.members?.phone,
              memberTotalDeposits: item.members?.total_deposits || 0,
              // ✅ CRITICAL FIX: Pass calculated interest
              totalInterestCollected: totalInterestEarned, 
              requestedDate: item.start_date || item.created_at,
              startDate: item.start_date
            }
          })

          // 1. Pending List
          setLoanRequests(formattedData.filter(l => l.status === 'pending'))

          // 2. All Loans List (Active/Completed/Closed)
          setLoans(formattedData.filter(l => ['active', 'completed', 'closed'].includes(l.status)))
        }
      }
      setLoading(false)
    }

    fetchLoanData()
  }, [])

  // Stats Logic (Updated to use live balance)
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
    // ✅ FIX: Added 'p-6' for spacing issue
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
            <p className="text-xs text-gray-600 dark:text-gray-400">Currently active</p>
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
              {/* Uses the Live Member Balance */}
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
