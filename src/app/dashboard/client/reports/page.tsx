'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  HandCoins, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isGenerating, setIsGenerating] = useState(false)

  // Mock data
  const reports = [
    { 
      id: 1, 
      title: 'Monthly Financial Report', 
      type: 'FINANCIAL', 
      period: 'January 2024', 
      status: 'COMPLETED', 
      generatedAt: '2024-01-31T10:30:00Z',
      size: '2.4 MB',
      downloads: 45
    },
    { 
      id: 2, 
      title: 'Member Activity Report', 
      type: 'MEMBER', 
      period: 'January 2024', 
      status: 'COMPLETED', 
      generatedAt: '2024-01-30T15:45:00Z',
      size: '1.8 MB',
      downloads: 32
    },
    { 
      id: 3, 
      title: 'Loan Performance Report', 
      type: 'LOAN', 
      period: 'January 2024', 
      status: 'PENDING', 
      generatedAt: null,
      size: null,
      downloads: 0
    },
    { 
      id: 4, 
      title: 'Expense Analysis Report', 
      type: 'EXPENSE', 
      period: 'December 2023', 
      status: 'COMPLETED', 
      generatedAt: '2023-12-31T09:15:00Z',
      size: '3.1 MB',
      downloads: 67
    },
    { 
      id: 5, 
      title: 'Annual Summary Report', 
      type: 'SUMMARY', 
      period: '2023', 
      status: 'COMPLETED', 
      generatedAt: '2023-12-31T18:00:00Z',
      size: '5.2 MB',
      downloads: 124
    }
  ]

  const stats = {
    totalReports: reports.length,
    completedReports: reports.filter(r => r.status === 'COMPLETED').length,
    pendingReports: reports.filter(r => r.status === 'PENDING').length,
    totalDownloads: reports.reduce((sum, r) => sum + r.downloads, 0)
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || report.type === selectedType
    return matchesSearch && matchesType
  })

  const handleGenerateReport = (type: string) => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      // In real app, this would trigger report generation
      console.log(`Generating ${type} report for ${selectedPeriod}`)
    }, 2000)
  }

  const handleDownloadReport = (reportId: number, format: 'pdf' | 'csv') => {
    // In real app, this would trigger file download
    console.log(`Downloading report ${reportId} as ${format}`)
  }

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate and manage all society reports
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => handleGenerateReport('financial')} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
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
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-blue-100">All reports</p>
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
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedReports}</div>
              <p className="text-xs text-green-100">Ready to download</p>
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
              <div className="text-2xl font-bold">{stats.pendingReports}</div>
              <p className="text-xs text-yellow-100">Being generated</p>
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
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <p className="text-xs text-purple-100">Total downloads</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                onClick={() => handleGenerateReport('financial')}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Financial
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleGenerateReport('member')}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Members
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleGenerateReport('loan')}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <HandCoins className="h-4 w-4" />
                Loans
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleGenerateReport('expense')}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <PieChart className="h-4 w-4" />
                Expenses
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Reports</CardTitle>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="FINANCIAL">Financial</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="LOAN">Loan</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="SUMMARY">Summary</SelectItem>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Period</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Downloads</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{report.title}</div>
                        {report.generatedAt && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Generated: {new Date(report.generatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          report.type === 'FINANCIAL' ? 'bg-blue-100 text-blue-800' :
                          report.type === 'MEMBER' ? 'bg-green-100 text-green-800' :
                          report.type === 'LOAN' ? 'bg-purple-100 text-purple-800' :
                          report.type === 'EXPENSE' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {report.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{report.period}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          report.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {report.size || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{report.downloads}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {report.status === 'COMPLETED' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadReport(report.id, 'pdf')}
                              >
                                PDF
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadReport(report.id, 'csv')}
                              >
                                CSV
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}