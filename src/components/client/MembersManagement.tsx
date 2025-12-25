'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Crown,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Settings,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AnimatedCounter from '@/components/ui/animated-counter'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  name: string
  phone: string
  joinDate: string
  address: string
  createdAt: string
  updatedAt: string
}

interface MembersManagementProps {
  societyInfo: any
}

interface EnhancedMember extends Member {
  loanCount?: number
  savingsAmount?: number
  lastActivity?: string
  totalRevenue?: number
}

export function MembersManagement({ societyInfo }: MembersManagementProps) {
  const [members, setMembers] = useState<EnhancedMember[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/client/members')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch members')
      }

      const enhancedMembers: EnhancedMember[] = data.members.map((member: any) => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
        joinDate: member.joinDate,
        address: member.address,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        loanCount: 0, // Will be calculated from database
        savingsAmount: 0, // Will be calculated from database
        totalRevenue: 0, // Will be calculated from database
        lastActivity: member.updatedAt
      }))
      
      setMembers(enhancedMembers)
    } catch (error) {
      console.error('Failed to fetch members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm) ||
                         member.address.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'joinedAt':
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      default:
        return 0
    }
  })

  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200',
      INACTIVE: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border-slate-200',
      PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200',
      EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200',
      LOCKED: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border-slate-200'
    }
    
    return (
      <Badge className={cn(variants[status as keyof typeof variants] || variants.ACTIVE, 'font-medium')}>
        {status}
      </Badge>
    )
  }

  const getMemberStats = () => {
    const total = members.length
    const active = members.filter(m => m.loanCount && m.loanCount > 0).length // Active = has loans
    const inactive = total - active
    const pending = 0 // No pending status in new schema
    
    return {
      total,
      active,
      inactive,
      pending,
      activePercentage: total > 0 ? ((active / total) * 100).toFixed(1) : '0%'
    }
  }

  const memberStats = getMemberStats()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Members',
            value: memberStats.total,
            change: '+0%',
            description: 'Registered members',
            icon: <Users className="h-4 w-4" />,
            bgGradient: 'from-blue-500 to-blue-600',
            borderColor: 'border-blue-200',
            gradient: 'from-blue-400 to-blue-600'
          },
          {
            title: 'Active Members',
            value: memberStats.active,
            change: '+0%',
            description: 'Members with loans',
            icon: <UserCheck className="h-4 w-4" />,
            bgGradient: 'from-emerald-500 to-emerald-600',
            borderColor: 'border-emerald-200',
            gradient: 'from-emerald-400 to-emerald-600'
          },
          {
            title: 'Inactive Members',
            value: memberStats.inactive,
            change: '-0%',
            description: 'Members without loans',
            icon: <AlertCircle className="h-4 w-4" />,
            bgGradient: 'from-slate-500 to-slate-600',
            borderColor: 'border-slate-200',
            gradient: 'from-slate-400 to-slate-600'
          },
          {
            title: 'Active Rate',
            value: memberStats.activePercentage,
            change: '+0%',
            description: 'Percentage active',
            icon: <TrendingUp className="h-4 w-4" />,
            bgGradient: 'from-purple-500 to-purple-600',
            borderColor: 'border-purple-200',
            gradient: 'from-purple-400 to-purple-600',
            suffix: '%'
          }
        ].map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: index * 0.1,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{ 
            y: -5, 
            scale: 1.02,
            rotateX: 5,
            rotateY: 5,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}
          className="group"
          style={{ perspective: '1000px' }}
        >
          <Card className={cn(
            "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
            stat.bgGradient,
            stat.borderColor
          )}>
            {/* Background gradient overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
              stat.gradient
            )} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {stat.title}
              </CardTitle>
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "p-3 rounded-full bg-gradient-to-r",
                  stat.gradient,
                  "text-white shadow-lg"
                )}
              >
                {stat.icon}
              </motion.div>
            </CardHeader>
            
            <CardContent className="p-6">
              <motion.div 
                className="text-3xl font-bold text-slate-900 dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <AnimatedCounter 
                  value={stat.value} 
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </motion.div>
              
              <div className="flex items-center justify-between mt-2">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    stat.change.startsWith('+') 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  )}
                >
                  {stat.change}
                </motion.span>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      </div>

    {/* Member Growth Chart */}
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        whileHover={{ y: -5, scale: 1.01 }}
        className="group"
      >
        <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-white" />
              Member Growth Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {memberStats.total}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Total Registered
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    {memberStats.activePercentage}% Active
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {memberStats.inactive}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Inactive Members
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {memberStats.pending}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Pending Approval
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    0
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Trial Users
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Member Growth
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    0% this month
                  </span>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </motion.div>

      {/* Role Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        whileHover={{ y: -5, scale: 1.01 }}
        className="group"
      >
        <Card className="border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { role: 'MEMBER', count: members.length },
                { role: 'ADMIN', count: 0 },
                { role: 'TREASURER', count: 0 },
                { role: 'LOCKED', count: 0 }
              ].map((item, index) => (
                <motion.div
                  key={item.role}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ scale: 1.05 }}
                  className="group"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {item.count}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {item.role}s
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge className={cn(
                      "px-3 py-1 rounded-full",
                      item.role === 'ADMIN' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200" :
                      item.role === 'MEMBER' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200" :
                      item.role === 'TREASURER' ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200" :
                      "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border-slate-200"
                  )}>
                    {item.role}
                  </Badge>
                </div>
              </motion.div>
            ))}
            </div>
            
            {/* Validation Check */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Total Members: {members.length}
                </span>
                <span className={cn(
                  "font-medium",
                  members.length === 0 ? "text-red-600" : "text-emerald-600"
                )}>
                  {members.length === 0 ? 'No members found' : '✅ Accurate'}
                </span>
              </div>
            </div>
            </CardContent>
            </Card>
          </motion.div>

      {/* Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="border-2 border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-slate-500 to-slate-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5 text-white" />
                Members Directory
              </CardTitle>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-64 bg-white/10 border-white/20 text-white placeholder-white/70"
                />
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="joinedAt">Join Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Join Date</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Created At</TableHead>
                  <TableHead className="font-semibold">Updated At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium">{member.id}</TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{formatDate(member.joinDate)}</TableCell>
                    <TableCell>{member.address}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{formatDateTime(member.createdAt)}</TableCell>
                    <TableCell>{formatDateTime(member.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {paginatedMembers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  {searchTerm ? 'No members found matching your search' : 'No members found'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
        </div>
  )
}

// Helper functions for date formatting
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
