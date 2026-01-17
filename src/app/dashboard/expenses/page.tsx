'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, DollarSign, TrendingUp, Calendar, CreditCard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Mock data
  const expenses = [
    { id: 1, description: 'Maintenance Cost', amount: 5000, type: 'MAINTENANCE', date: '2024-01-15', status: 'COMPLETED' },
    { id: 2, description: 'Electricity Bill', amount: 3000, type: 'UTILITY', date: '2024-01-14', status: 'COMPLETED' },
    { id: 3, description: 'Water Supply', amount: 2000, type: 'UTILITY', date: '2024-01-13', status: 'PENDING' },
    { id: 4, description: 'Security Services', amount: 4000, type: 'SECURITY', date: '2024-01-12', status: 'COMPLETED' },
    { id: 5, description: 'Garden Maintenance', amount: 1500, type: 'MAINTENANCE', date: '2024-01-11', status: 'PENDING' }
  ]

  const stats = {
    totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    thisMonthExpenses: 15500,
    lastMonthExpenses: 12000,
    pendingExpenses: expenses.filter(exp => exp.status === 'PENDING').length
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || expense.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track and manage all society expenses
          </p>
        </div>
        
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
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
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-blue-100">All time expenses</p>
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
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.thisMonthExpenses.toLocaleString()}</div>
              <p className="text-xs text-green-100">+29% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <CreditCard className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingExpenses}</div>
              <p className="text-xs text-purple-100">Awaiting approval</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+18%</div>
              <p className="text-xs text-orange-100">Monthly increase</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="UTILITY">Utility</option>
                <option value="SECURITY">Security</option>
              </select>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">{expense.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">₹{expense.amount.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={
                        expense.type === 'MAINTENANCE' ? 'bg-blue-100 text-blue-800' :
                        expense.type === 'UTILITY' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }>
                        {expense.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{expense.date}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={
                        expense.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {expense.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal (Simple) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input placeholder="Enter description" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input type="number" placeholder="Enter amount" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="UTILITY">Utility</option>
                  <option value="SECURITY">Security</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsAddModalOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setIsAddModalOpen(false)} className="flex-1">
                  Add Expense
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
