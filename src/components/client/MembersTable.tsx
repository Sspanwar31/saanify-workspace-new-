'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  UserCheck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users
} from 'lucide-react'

interface Member {
  id: string
  name: string
  email?: string | null
  phone: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  membershipId: string
  joinDate: string
  lastLogin: string | null
  address: string
  fatherHusbandName: string
  avatar?: string
  loanCount?: number
  savingsAmount?: number
}

interface MembersTableProps {
  members: Member[]
  onEdit: (member: Member) => void
  onDelete: (memberId: string) => void
  onViewProfile: (member: Member) => void
  getStatusBadge: (status: string) => React.ReactNode
}

const MembersTable = ({ 
  members, 
  onEdit, 
  onDelete, 
  onViewProfile,
  getStatusBadge 
}: MembersTableProps) => {
  const [sortField, setSortField] = useState<keyof Member>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue === null) return 1
    if (bValue === null) return -1
    
    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 dark:border-slate-700">
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    <span>Member</span>
                    {sortField === 'name' && (
                      <span className="text-xs text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('fatherHusbandName')}
                >
                  <div className="flex items-center gap-2">
                    <span>Father/Husband</span>
                    {sortField === 'fatherHusbandName' && (
                      <span className="text-xs text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    {sortField === 'status' && (
                      <span className="text-xs text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center gap-2">
                    <span>Join Date</span>
                    {sortField === 'joinDate' && (
                      <span className="text-xs text-slate-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Financial</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.map((member, index) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                        {member.status === 'ACTIVE' && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {member.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {member.fatherHusbandName || 'Not provided'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(member.status)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                          {member.email || 'No email'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {member.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatDate(member.joinDate)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Last login: {formatDate(member.lastLogin)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Loans:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {member.loanCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Savings:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {member.savingsAmount ? formatCurrency(member.savingsAmount) : '₹0'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onEdit(member)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onViewProfile(member)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(member.id)}
                          className="flex items-center gap-2 text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {members.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No members found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Try adjusting your search or filters to find members.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MembersTable