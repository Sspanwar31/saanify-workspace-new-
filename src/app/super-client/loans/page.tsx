'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoanRequestsTable } from '@/components/super-client/loans/LoanRequestsTable'
import { AllLoansTable } from '@/components/super-client/loans/AllLoansTable'
import { useSuperClientStore } from '@/lib/super-client/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HandCoins, TrendingUp, Clock, Calendar, DollarSign } from 'lucide-react'

export default function LoansPage() {
  const { loans, loanRequests } = useSuperClientStore()

  // Calculate stats
  const activeLoans = loans.filter(loan => loan.status === 'active')
  const pendingRequests = loanRequests.filter(request => request.status === 'pending')
  const totalDisbursed = loans
    .filter(l => l.status === 'active' || l.status === 'approved')
    .reduce((sum, loan) => sum + loan.amount, 0)

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
              {activeLoans.length}
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
              {pendingRequests.length}
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
              {formatCurrency(totalDisbursed)}
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
              {formatCurrency(activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total outstanding balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
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

        <TabsContent value="requests" className="space-y-4">
          <LoanRequestsTable />
        </TabsContent>

        <TabsContent value="all-loans" className="space-y-4">
          <AllLoansTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}