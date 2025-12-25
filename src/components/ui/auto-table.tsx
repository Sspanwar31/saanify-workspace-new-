'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Search, Filter, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, SkipBack, SkipForward, HelpCircle } from 'lucide-react'

interface AutoTableProps {
  data: any[]
  title: string
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  pagination?: boolean
  itemsPerPage?: number
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  onView?: (item: any) => void
  customActions?: (item: any) => React.ReactNode
}

export default function AutoTable({
  data,
  title,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  itemsPerPage = 10,
  onEdit,
  onDelete,
  onView,
  customActions,
}: AutoTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterColumn, setFilterColumn] = useState<string>('')
  const [filterValue, setFilterValue] = useState<string>('')
  const [horizontalScroll, setHorizontalScroll] = useState(0)
  const tableRef = useRef<HTMLDivElement>(null)

  // Get columns from data keys
  const columns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    }))
  }, [data])

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data]

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply column filter
    if (filterColumn && filterValue) {
      filtered = filtered.filter(item =>
        String(item[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        let comparison = 0
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        } else {
          comparison = String(aVal).localeCompare(String(bVal))
        }
        
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [data, searchTerm, filterColumn, filterValue, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedData.slice(startIndex, startIndex + itemsPerPage)
  }, [processedData, currentPage, itemsPerPage])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Horizontal scroll functions
  const scrollLeft = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const scrollToStart = () => {
    if (tableRef.current) {
      tableRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }

  const scrollToEnd = () => {
    if (tableRef.current) {
      tableRef.current.scrollTo({ left: tableRef.current.scrollWidth, behavior: 'smooth' })
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch(e.key) {
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            scrollLeft()
          }
          break
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            scrollRight()
          }
          break
        case 'Home':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            scrollToStart()
          }
          break
        case 'End':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            scrollToEnd()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) return '-'
    
    // Format dates
    if (column.toLowerCase().includes('date') || column.toLowerCase().includes('at')) {
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return value
      }
    }
    
    // Format currency
    if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('balance') || column.toLowerCase().includes('fee')) {
      if (typeof value === 'number') {
        return `₹${value.toLocaleString('en-IN')}`
      }
    }
    
    // Format status badges
    if (column.toLowerCase().includes('status')) {
      const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
      }
      const colorClass = statusColors[String(value).toLowerCase()] || 'bg-gray-100 text-gray-800'
      return <Badge className={colorClass}>{value}</Badge>
    }
    
    return String(value)
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="shrink-0">
                {processedData.length} records
              </Badge>
              {columns.length > 4 && (
                <>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Use scroll controls ↔️
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">Table Navigation:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Use arrow buttons to scroll left/right</li>
                          <li>• <kbd>Ctrl</kbd>+<kbd>←</kbd> / <kbd>Ctrl</kbd>+<kbd>→</kbd> to scroll</li>
                          <li>• <kbd>Ctrl</kbd>+<kbd>Home</kbd> / <kbd>Ctrl</kbd>+<kbd>End</kbd> for start/end</li>
                          <li>• Actions column stays visible while scrolling</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {searchable && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          )}
          
          {filterable && columns.length > 0 && (
            <div className="flex gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 overflow-y-auto">
                  {columns.map((column) => (
                    <DropdownMenuItem
                      key={column.key}
                      onClick={() => setFilterColumn(column.key)}
                      className="cursor-pointer"
                    >
                      {column.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {filterColumn && (
                <Input
                  placeholder={`Filter ${filterColumn}...`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-48 lg:w-64"
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Table Section */}
      <div className="rounded-md border bg-background relative overflow-hidden">
        {/* Horizontal Scroll Controls */}
        {columns.length > 4 && (
          <div className="absolute top-2 left-2 z-10 flex gap-1 bg-background/90 backdrop-blur-sm rounded-md border p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToStart}
              className="h-7 w-7 p-0"
              title="Scroll to start (Ctrl+Home)"
            >
              <SkipBack className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollLeft}
              className="h-7 w-7 p-0"
              title="Scroll left (Ctrl+←)"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollRight}
              className="h-7 w-7 p-0"
              title="Scroll right (Ctrl+→)"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToEnd}
              className="h-7 w-7 p-0"
              title="Scroll to end (Ctrl+End)"
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <ScrollArea className="w-full max-h-[70vh]">
          <div ref={tableRef} className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {columns.map((column) => (
                    <TableHead key={column.key} className={`px-3 py-3 whitespace-nowrap ${
                      column.key === 'name' ? 'min-w-[150px] max-w-[200px]' : 
                      column.key === 'phone' ? 'min-w-[120px] max-w-[140px]' :
                      column.key === 'email' ? 'min-w-[180px] max-w-[220px]' :
                      column.key === 'address' ? 'min-w-[200px] max-w-[250px]' :
                      'min-w-[100px] max-w-[150px]'
                    }`}>
                      {sortable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-semibold hover:bg-transparent justify-start w-full"
                          onClick={() => handleSort(column.key)}
                        >
                          <span className="truncate text-left">{column.label}</span>
                          <span className="ml-2 shrink-0">{getSortIcon(column.key)}</span>
                        </Button>
                      ) : (
                        <span className="truncate text-left font-medium">{column.label}</span>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-[80px] px-3 py-3 whitespace-nowrap sticky right-0 bg-background border-l">
                    <MoreHorizontal className="h-4 w-4" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length + 1} 
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl">📋</div>
                        <div className="text-lg font-medium">No data available</div>
                        <div className="text-sm">
                          {searchTerm || filterValue 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'No records found in the database'
                          }
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, index) => (
                    <TableRow 
                      key={row.id || index} 
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={column.key} 
                          className={`px-3 py-3 ${
                            column.key === 'name' ? 'max-w-[200px]' : 
                            column.key === 'phone' ? 'max-w-[140px]' :
                            column.key === 'email' ? 'max-w-[220px]' :
                            column.key === 'address' ? 'max-w-[250px]' :
                            'max-w-[150px]'
                          }`}
                        >
                          <div className="truncate" title={String(row[column.key])}>
                            {formatCellValue(row[column.key], column.key)}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="px-3 py-3 whitespace-nowrap sticky right-0 bg-background border-l">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem 
                                onClick={() => onView(row)}
                                className="cursor-pointer"
                              >
                                View Details
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem 
                                onClick={() => onEdit(row)}
                                className="cursor-pointer"
                              >
                                Edit
                              </DropdownMenuItem>
                            )}
                            {customActions && customActions(row)}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(row)}
                                className="text-red-600 cursor-pointer hover:text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-1">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} results
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="shrink-0 h-8 w-8 p-0"
              title="First page"
            >
              <SkipBack className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="shrink-0 h-8 w-8 p-0"
              title="Previous page"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="shrink-0 h-8 w-8 p-0 text-xs"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="shrink-0 h-8 w-8 p-0"
              title="Next page"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="shrink-0 h-8 w-8 p-0"
              title="Last page"
            >
              <SkipForward className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}