'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Filter,
  UserPlus,
  Shield,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import MembersTable from '@/components/client/MembersTable'
import AddMemberModal from '@/components/client/AddMemberModal'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string
  phone: string
  joinDate: string
  address: string
  createdAt: string
  updatedAt: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  // Reset modal state on page load to prevent stuck modal
  useEffect(() => {
    setIsAddModalOpen(false)
    setEditingMember(null)
    
    // Clear any potential stored modal state
    try {
      sessionStorage.removeItem('addMemberModal')
      localStorage.removeItem('addMemberModal')
    } catch (e) {
      // Ignore storage errors
    }
  }, [])

  // Fetch members from API
  const fetchMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/client/members')
      const data = await response.json()
      
      if (response.ok) {
        setMembers(data.members || [])
      } else {
        toast.error('Failed to fetch members')
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
      toast.error('Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  // Filter members based on search and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm) ||
                         member.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && member.phone && member.phone.length > 0) ||
      (selectedStatus === 'inactive' && (!member.phone || member.phone.length === 0))
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: members.length,
    active: members.filter(m => m.phone && m.phone.length > 0).length, // Active = has phone
    inactive: members.filter(m => !m.phone || m.phone.length === 0).length,
    pending: 0 // No pending status in new schema
  }

  const handleViewProfile = (member: any) => {
    // Navigate to member profile page or open modal
    // For now, we'll navigate to a profile page
    window.location.href = `/client/members/${member.id}`
  }

  const handleAddMember = async (newMember: any) => {
    try {
      const response = await fetch('/api/client/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      })

      if (response.ok) {
        const data = await response.json()
        setMembers([...members, data.member])
        toast.success('✅ Member Added', {
          description: `${newMember.name} has been added successfully`,
          duration: 3000
        })
        setIsAddModalOpen(false)
      } else {
        const error = await response.json()
        toast.error('Failed to add member', {
          description: error.error || 'Unknown error',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to add member:', error)
      toast.error('Failed to add member')
    }
  }

  const handleEditMember = (member: any) => {
    setEditingMember(member)
    setIsAddModalOpen(true)
  }

  const handleUpdateMember = async (updatedMember: any) => {
    try {
      const response = await fetch(`/api/client/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMember)
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(members.map(m => m.id === editingMember.id ? data.member : m))
        toast.success('✅ Member Updated', {
          description: `${updatedMember.name} has been updated successfully`,
          duration: 3000
        })
      } else {
        const error = await response.json()
        toast.error('Failed to update member', {
          description: error.error || 'Unknown error',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to update member:', error)
      toast.error('Failed to update member', {
        description: 'Network error occurred',
        duration: 3000
      })
    }
    setEditingMember(null)
    setIsAddModalOpen(false)
  }

  const handleDeleteMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (confirm(`Are you sure you want to remove ${member?.name}?`)) {
      try {
        const response = await fetch(`/api/client/members/${memberId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setMembers(members.filter(m => m.id !== memberId))
          toast.success('✅ Member Removed', {
            description: `${member?.name} has been removed successfully`,
            duration: 3000
          })
        } else {
          const error = await response.json()
          toast.error('Failed to remove member', {
            description: error.error || 'Unknown error',
            duration: 3000
          })
        }
      } catch (error) {
        console.error('Failed to delete member:', error)
        toast.error('Failed to remove member', {
          description: 'Network error occurred',
          duration: 3000
        })
      }
    }
  }

  const handleRefresh = () => {
    fetchMembers()
  }

  const handleExport = () => {
    toast.info('📊 Export Started', {
      description: 'Member data is being exported to CSV',
      duration: 3000
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      inactive: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.active}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Members Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage society members, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Members</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Inactive</p>
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-900/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search members by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <MembersTable
          members={filteredMembers}
          onEdit={handleEditMember}
          onDelete={handleDeleteMember}
          onViewProfile={handleViewProfile}
          getStatusBadge={getStatusBadge}
        />
      </motion.div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingMember(null)
        }}
        onSubmit={editingMember ? handleUpdateMember : handleAddMember}
        editingMember={editingMember}
      />
    </div>
  )
}