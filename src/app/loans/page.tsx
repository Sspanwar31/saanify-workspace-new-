'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, CreditCard, Users, Calendar, TrendingUp, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Loan {
  id: number
  memberName: string
  amount: number
  type: 'PERSONAL' | 'HOME'
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED'
  date: string
  interestRate: number
}

interface Stats {
  totalLoans: number
  activeLoans: number
  pendingLoans: number
  completedLoans: number
}

export default function LoansPage() {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)

  // Mock data
  const loans: Loan[] = [
    { id: 1, memberName: 'John Doe', amount: 50000, type: 'PERSONAL', status: 'ACTIVE', date: '2024-01-15', interestRate: 12 },
    { id: 2, memberName: 'Jane Smith', amount: 75000, type: 'HOME', status: 'ACTIVE', date: '2024-01-14', interestRate: 10 },
    { id: 3, memberName: 'Bob Johnson', amount: 25000, type: 'PERSONAL', status: 'PENDING', date: '2024-01-13', interestRate: 14 },
    { id: 4, memberName: 'Alice Brown', amount: 100000, type: 'HOME', status: 'COMPLETED', date: '2024-01-12', interestRate: 11 },
    { id: 5, memberName: 'Charlie Wilson', amount: 30000, type: 'PERSONAL', status: 'ACTIVE', date: '2024-01-11', interestRate: 13 }
  ]

  const stats: Stats = useMemo(() => ({
    totalLoans: loans.reduce((sum, loan) => sum + loan.amount, 0),
    activeLoans: loans.filter(loan => loan.status === 'ACTIVE').length,
    pendingLoans: loans.filter(loan => loan.status === 'PENDING').length,
    completedLoans: loans.filter(loan => loan.status === 'COMPLETED').length
  }), [loans])

  const filteredLoans: Loan[] = useMemo(() => {
    return loans.filter(loan => {
      const matchesSearch = loan.memberName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || loan.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [loans, searchTerm, selectedStatus])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loans Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and track all member loans
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Loan
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <CreditCard className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalLoans.toLocaleString()}</div>
              <p className="text-xs text-blue-100">All active loans</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
              <p className="text-xs text-green-100">Currently active</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingLoans}</div>
              <p className="text-xs text-yellow-100">Awaiting approval</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedLoans}</div>
              <p className="text-xs text-purple-100">Fully paid</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Loans</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search loans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Interest</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">{loan.memberName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">₹{loan.amount.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={
                        loan.type === 'PERSONAL' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {loan.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{loan.interestRate}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{loan.date}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={
                        loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {loan.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Loan Modal (Simple) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Add New Loan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Member Name</label>
                <Input placeholder="Enter member name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input type="number" placeholder="Enter amount" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal</SelectItem>
                    <SelectItem value="HOME">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsAddModalOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setIsAddModalOpen(false)} className="flex-1">
                  Add Loan
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}