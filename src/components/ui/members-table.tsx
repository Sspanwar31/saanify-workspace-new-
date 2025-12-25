'use client'

import { useState, useMemo } from 'react'
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
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Filter, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'

interface MembersTableProps {
  data: any[]
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  onView?: (item: any) => void
}

export default function MembersTable({
  data,
  onEdit,
  onDelete,
  onView,
}: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const formatCellValue = (value: any, column: string) => {
    if (value === null || value === undefined) return '-'
    
    // Format dates
    if (column.toLowerCase().includes('date') || column.toLowerCase().includes('at')) {
      try {
        return new Date(value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        })
      } catch {
        return value
      }
    }
    
    return String(value)
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with Search and Records Count */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page on search
            }}
            className="pl-10 w-full"
          />
        </div>
        
        <Badge variant="outline" className="shrink-0">
          {filteredData.length} records
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="px-3 py-3 text-left font-medium w-[20%]">
                  Name
                </TableHead>
                <TableHead className="px-3 py-3 text-left font-medium w-[15%]">
                  Phone
                </TableHead>
                <TableHead className="px-3 py-3 text-left font-medium w-[20%]">
                  Email
                </TableHead>
                <TableHead className="px-3 py-3 text-left font-medium w-[15%]">
                  Join Date
                </TableHead>
                <TableHead className="px-3 py-3 text-left font-medium w-[20%]">
                  Address
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-medium w-[10%]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={6} 
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">📋</div>
                      <div className="text-lg font-medium">No members found</div>
                      <div className="text-sm">
                        {searchTerm 
                          ? 'Try adjusting your search criteria' 
                          : 'No members in the database'
                        }
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((member, index) => (
                  <TableRow 
                    key={member.originalId || member.id || index} 
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="px-3 py-3">
                      <div className="font-medium truncate" title={member.name}>
                        {member.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {member.displayId || member.id}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="truncate" title={member.phone}>
                        {member.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="truncate text-sm" title={member.email}>
                        {member.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="text-sm">
                        {formatCellValue(member.joinDate, 'joinDate')}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="truncate text-sm" title={member.address}>
                        {member.address}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-muted mx-auto"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem 
                              onClick={() => onView(member)}
                              className="cursor-pointer"
                            >
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem 
                              onClick={() => onEdit(member)}
                              className="cursor-pointer"
                            >
                              Edit Member
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(member)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              Delete Member
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of{' '}
            {filteredData.length} members
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
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
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}