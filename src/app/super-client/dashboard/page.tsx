'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  BookOpen, 
  HandCoins, 
  Receipt, 
  TrendingUp, 
  DollarSign,
  Activity,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSuperClientStore } from '@/lib/super-client/store'

export default function SuperClientDashboard() {
  // 1. Setup Mounted State
  const [isMounted, setIsMounted] = useState(false)
  const {
    members,
    loans,
    expenses,
    adminFund,
    getActiveMembers,
    getPendingLoans,
    getActiveLoans,
    getTotalDeposits,
    getTotalLoans,
    getTotalExpenses,
    getMemberBalance,
    getMemberPassbook
  } = useSuperClientStore()

  // 2. Set True on Client Load
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 3. Prevent SSR mismatch
  if (!isMounted) {
    return <div className="p-8">Loading Dashboard...</div>
  }

  // 4. Render Actual Content
  const activeMembers = getActiveMembers()
  const pendingLoans = getPendingLoans()
  const activeLoans = getActiveLoans()
  const totalDeposits = getTotalDeposits()
  const totalLoansAmount = getTotalLoans()
  const totalExpenses = getTotalExpenses()

  // Helper function to get member's total deposits
  const getMemberTotalDeposits = (memberId: string) => {
    const memberPassbook = getMemberPassbook(memberId)
    return memberPassbook
      .filter(entry => entry.type === 'deposit' || entry.type === 'interest')
      .reduce((sum, entry) => sum + entry.amount, 0)
  }

  const stats = [
    {
      title: 'Total Members',
      value: members.length,
      change: '+2 this month',
      changeType: 'positive' as const,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Active Members',
      value: activeMembers.length,
      change: `${Math.round((activeMembers.length / members.length) * 100)}% of total`,
      changeType: 'neutral' as const,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Total Deposits',
      value: `₹${totalDeposits.toLocaleString()}`,
      change: '+12% this month',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20'
    },
    {
      title: 'Total Loans',
      value: `₹${totalLoansAmount.toLocaleString()}`,
      change: `${activeLoans.length} active`,
      changeType: 'neutral' as const,
      icon: HandCoins,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Pending Loans',
      value: pendingLoans.length,
      change: 'Need approval',
      changeType: 'warning' as const,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      title: 'Total Expenses',
      value: `₹${totalExpenses.toLocaleString()}`,
      change: '-5% this month',
      changeType: 'negative' as const,
      icon: Receipt,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      title: 'Available Funds',
      value: `₹${adminFund.totalFunds.toLocaleString()}`,
      change: 'Healthy balance',
      changeType: 'positive' as const,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Interest Earned',
      value: `₹${adminFund.interestEarned.toLocaleString()}`,
      change: '+8% this month',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    }
  ]

  const recentMembers = members.slice(0, 5)
  const recentLoans = loans.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Super Client Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome to Saanify Super Client V2 - Complete overview of your financial ecosystem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow border-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <p className={`
                text-xs mt-1
                ${stat.changeType === 'positive' ? 'text-green-600' : ''}
                ${stat.changeType === 'negative' ? 'text-red-600' : ''}
                ${stat.changeType === 'neutral' ? 'text-gray-600' : ''}
                ${stat.changeType === 'warning' ? 'text-yellow-600' : ''}
              `}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Members */}
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Recent Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₹{getMemberTotalDeposits(member.id).toLocaleString()}
                    </p>
                    <p className={`text-xs ${
                      member.status === 'active' 
                        ? 'text-green-600' 
                        : 'text-gray-500'
                    }`}>
                      {member.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Loans */}
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-orange-600" />
              Recent Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoans.map((loan) => {
                const member = members.find(m => m.id === loan.memberId)
                return (
                  <div key={loan.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member?.name || 'Unknown Member'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {loan.purpose}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{loan.amount.toLocaleString()}
                      </p>
                      <p className={`text-xs ${
                        loan.status === 'active' 
                          ? 'text-green-600'
                          : loan.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                      }`}>
                        {loan.status}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Overview */}
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Admin Fund Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Funds</p>
              <p className="text-xl font-bold text-emerald-600">
                ₹{adminFund.totalFunds.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600 dark:text-gray-400">Member Deposits</p>
              <p className="text-xl font-bold text-blue-600">
                ₹{adminFund.memberDeposits.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100">
              <p className="text-sm text-gray-600 dark:text-gray-400">Loan Disbursed</p>
              <p className="text-xl font-bold text-orange-600">
                ₹{adminFund.loanDisbursed.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100">
              <p className="text-sm text-gray-600 dark:text-gray-400">Interest Earned</p>
              <p className="text-xl font-bold text-purple-600">
                ₹{adminFund.interestEarned.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}