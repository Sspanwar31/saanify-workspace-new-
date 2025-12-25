'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Eye, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ReportItem, 
  reportTypes, 
  getStatusColor, 
  getTypeColor, 
  formatCurrency, 
  formatDate 
} from '@/data/reportsData'

interface ReportsTableProps {
  reports: ReportItem[]
  loading?: boolean
  onExport?: (format: 'csv' | 'pdf') => void
  onView?: (report: ReportItem) => void
}

const ITEMS_PER_PAGE = 10

export default function ReportsTable({ 
  reports, 
  loading = false, 
  onExport, 
  onView 
}: ReportsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<keyof ReportItem>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = reports

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(report => report.type === selectedType)
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(report => report.status === selectedStatus)
    }

    // Sort reports
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === undefined || bValue === undefined) return 0
      
      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [reports, searchTerm, selectedType, selectedStatus, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE)
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (field: keyof ReportItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    if (onExport) {
      onExport(format)
    }
  }

  const handleView = (report: ReportItem) => {
    if (onView) {
      onView(report)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Reports History
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/40"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/40"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredReports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full flex items-center justify-center mb-4">
                <Filter className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No reports found
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your filters or search terms to find the reports you're looking for.
              </p>
            </motion.div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th 
                        className="text-left p-4 font-semibold text-foreground cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center gap-2">
                          Type
                          <span className="text-xs text-muted-foreground">
                            {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </span>
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        Member / Description
                      </th>
                      <th 
                        className="text-left p-4 font-semibold text-foreground cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center gap-2">
                          Amount
                          <span className="text-xs text-muted-foreground">
                            {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="text-left p-4 font-semibold text-foreground cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          <span className="text-xs text-muted-foreground">
                            {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </span>
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-foreground">
                        Status
                      </th>
                      <th className="text-right p-4 font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedReports.map((report, index) => (
                        <motion.tr
                          key={report.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-border/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                        >
                          <td className="p-4">
                            <Badge className={getTypeColor(report.type)}>
                              {(report.type?.charAt(0) ?? "").toUpperCase() + (report.type?.slice(1) ?? "")}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-foreground">
                                {report.memberName || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {report.description}
                              </div>
                              {report.category && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {report.category}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">
                              {formatCurrency(report.amount)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="text-foreground">
                                {formatDate(report.date)}
                              </div>
                              {report.dueDate && (
                                <div className="text-xs text-muted-foreground">
                                  Due: {formatDate(report.dueDate)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(report.status)}>
                              {(report.status?.charAt(0) ?? "").toUpperCase() + (report.status?.slice(1) ?? "")}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(report)}
                                className="hover:bg-emerald-100 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} of{' '}
                    {filteredReports.length} reports
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 p-0 ${
                            currentPage === i + 1
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10'
                          }`}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}