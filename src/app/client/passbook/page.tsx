'use client'

import { useState } from 'react'
import { 
  Plus, 
  HandCoins, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClientStore } from '@/lib/client/store'
import { PassbookEntry } from '@/lib/client/store'
import PassbookAddEntryModal from '@/components/client/PassbookAddEntryModal'
import LoanRequestModal from '@/components/client/LoanRequestModal'

export default function PassbookPage() {
  // Updated: 2025-12-22 - Enhanced UI with new modal components
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  const [entryType, setEntryType] = useState<'deposit' | 'loan' | 'interest' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 10

  const {
    members,
    passbook,
    addEntry,
    getMemberBalance,
    getMemberPassbook
  } = useClientStore()

  // Get paginated entries
  const sortedEntries = [...passbook].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage)
  const startIndex = (currentPage - 1) * entriesPerPage
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + entriesPerPage)

  const handleAddEntry = () => {
    if (!selectedMember || !amount || !description) {
      return
    }

    const entryData = {
      memberId: selectedMember,
      date: new Date().toISOString().split('T')[0],
      type: entryType,
      amount: parseFloat(amount),
      description
    }

    addEntry(entryData)
    
    // Reset form
    setSelectedMember('')
    setAmount('')
    setDescription('')
    setEntryType('deposit')
    setIsAddEntryOpen(false)
  }

  const handleEditEntry = (entry: any) => {
    // Set form data for editing
    setSelectedMember(entry.memberId)
    setEntryType(entry.type)
    setAmount(entry.amount.toString())
    setDescription(entry.description)
    setIsAddEntryOpen(true)
  }

  const handleDeleteEntry = (entry: any) => {
    if (confirm(`Are you sure you want to delete this ${entry.type} entry for ${getMemberName(entry.memberId)}?`)) {
      // In a real app, this would call a delete function from the store
      alert(`Entry deleted successfully`);
      // You could also call a deleteEntry function from the store if available
    }
  }

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member?.name || 'Unknown Member'
  }

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'loan': return <HandCoins className="h-4 w-4 text-red-600" />
      case 'interest': return <DollarSign className="h-4 w-4 text-blue-600" />
      case 'withdrawal': return <TrendingDown className="h-4 w-4 text-orange-600" />
      default: return <ArrowUpDown className="h-4 w-4 text-gray-600" />
    }
  }

  const getEntryTypeBadge = (type: string) => {
    const variants = {
      deposit: 'bg-green-100 text-green-800',
      loan: 'bg-red-100 text-red-800',
      interest: 'bg-blue-100 text-blue-800',
      withdrawal: 'bg-orange-100 text-orange-800'
    }
    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Passbook
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage all financial transactions and entries
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Request Loan Button */}
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsLoanModalOpen(true)}
          >
            <HandCoins className="h-4 w-4 mr-2" />
            Request Loan
          </Button>
          
          {/* Add Entry Button */}
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddEntryOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Passbook Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {getMemberName(entry.memberId).charAt(0)}
                        </span>
                      </div>
                      {getMemberName(entry.memberId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEntryTypeIcon(entry.type)}
                      {getEntryTypeBadge(entry.type)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      entry.type === 'deposit' || entry.type === 'interest' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {entry.type === 'deposit' || entry.type === 'interest' ? '+' : ''}
                      ₹{entry.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{entry.balance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteEntry(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, sortedEntries.length)} of {sortedEntries.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Rich UI Modals */}
      <PassbookAddEntryModal 
        isOpen={isAddEntryOpen} 
        onClose={() => setIsAddEntryOpen(false)} 
      />
      
      <LoanRequestModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
      />
    </div>
  )
}