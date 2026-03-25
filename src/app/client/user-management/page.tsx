'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Users, 
  UserCheck, 
  UserX, 
  RefreshCw,
  Crown,
  TrendingUp,
  Download,
  History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' // ✅ Added from Code 1
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table' // ✅ Added for Activity Logs
import AutoTable from '@/components/ui/auto-table'
import { usersData } from '@/data/usersData'
import { toast } from 'sonner'

export default function UserManagementPage() {
  const [users, setUsers] = useState(usersData)
  const [activityLogs, setActivityLogs] = useState([ // ✅ Mock Data for Activity Tab
    { id: 1, action: 'User Created', details: 'New user Rahul Sharma added as Treasurer', created_at: new Date().toISOString() },
    { id: 2, action: 'Role Updated', details: 'Admin changed Priya Singh to Member', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, action: 'Login', details: 'Amit Verma logged in from New Device', created_at: new Date(Date.now() - 172800000).toISOString() },
  ])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [activeTab, setActiveTab] = useState('all-users') // ✅ Added Tabs State

  // Calculate statistics based on enhanced users data
  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(user => user.status === 'active').length
    const inactiveUsers = users.filter(user => user.status === 'inactive').length
    const adminUsers = users.filter(user => user.role === 'admin').length
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    return users
  }, [users])

  const handleAddUser = (newUser: any) => {
    const userWithId = {
      ...newUser,
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setUsers([...users, userWithId])
    toast.success('✅ User Added', {
      description: `${newUser.name} has been added successfully`,
      duration: 3000
    })
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleSaveUser = (savedUser: any) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === savedUser.id ? { ...savedUser, updatedAt: new Date().toISOString() } : u))
      toast.success('✅ User Updated', {
        description: `${savedUser.name} has been updated successfully`,
        duration: 3000
      })
    } else {
      handleAddUser(savedUser)
    }
    
    setEditingUser(null)
    setIsModalOpen(false)
  }

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId)
    if (confirm(`Are you sure you want to delete ${userToDelete?.name}?`)) {
      setUsers(users.filter(u => u.id !== userId))
      toast.success('✅ User Deleted', {
        description: `${userToDelete?.name} has been removed from the system`,
        duration: 3000
      })
    }
  }

  const handleBulkAction = (action: string, userIds: string[]) => {
    if (action === 'delete') {
      const usersToDelete = userIds.map(id => users.find(u => u.id === id)).filter(Boolean)
      if (usersToDelete.length > 0) {
        const userNames = usersToDelete.map(u => u.name).join(', ')
        if (confirm(`Are you sure you want to delete these users?\n\n${userNames}\n\nThis action cannot be undone.`)) {
          setUsers(users.filter(u => !userIds.includes(u.id)))
          toast.success('✅ Users Deleted', {
            description: `${usersToDelete.length} users have been deleted.`,
            duration: 3000
          })
        }
      }
    } else if (action === 'activate') {
      setUsers(users.map(u => 
        userIds.includes(u.id) ? { ...u, status: 'active' } : u
      ))
      toast.success('✅ Users Activated')
    } else if (action === 'deactivate') {
      setUsers(users.map(u => 
        userIds.includes(u.id) ? { ...u, status: 'inactive' } : u
      ))
      toast.success('✅ Users Deactivated')
    }
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.info('📥 Export Started', {
      description: `User data is being exported as ${format.toUpperCase()}`,
      duration: 3000
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('🔄 Data Refreshed', {
        description: 'User data has been refreshed',
        duration: 2000
      })
    }, 1000)
  }

  const handleResetPassword = (user: any) => {
    toast.info('🔑 Password Reset', {
      description: `Password reset link has been sent to ${user.email}`,
      duration: 3000
    })
  }

  const handleInviteUser = (user: any) => {
    toast.info('📧 Invitation Sent', {
      description: `Invitation has been sent to ${user.email}`,
      duration: 3000
    })
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
              User Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage administrators, treasurers, and society members efficiently
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
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</p>
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
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeUsers}</p>
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
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.inactiveUsers}</p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-900/20 rounded-lg">
                <UserX className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Admins</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.adminUsers}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Growth Rate</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.totalUsers > 0 ? Math.round(((stats.activeUsers / stats.totalUsers) * 100)) : 0}%
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ✅ TABS SECTION INTEGRATED HERE */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-1 rounded-full w-full max-w-md mx-auto grid grid-cols-3 shadow-sm">
          <TabsTrigger value="all-users" className="rounded-full data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 transition-all">Users</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-full data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 transition-all">Roles</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-full data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 transition-all">Activity</TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="all-users" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AutoTable 
              data={filteredUsers} 
              title="Users List"
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onBulkAction={handleBulkAction}
            />
          </motion.div>
        </TabsContent>

        {/* ACTIVITY LOGS TAB */}
        <TabsContent value="activity">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                  <History className="h-5 w-5 text-blue-500" /> System Activity Logs
                </CardTitle>
              </CardHeader>
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="dark:border-slate-800">
                    <TableHead className="dark:text-slate-300">Action</TableHead>
                    <TableHead className="dark:text-slate-300">Details</TableHead>
                    <TableHead className="dark:text-slate-300 text-right">Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-12 text-slate-500">No logs found</TableCell></TableRow>
                  ) : (
                    activityLogs.map((log) => (
                      <TableRow key={log.id} className="dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <TableCell>
                          <Badge variant="secondary" className="dark:bg-slate-800 dark:text-slate-300 font-medium">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md text-slate-600 dark:text-slate-400">{log.details}</TableCell>
                        <TableCell className="text-slate-500 text-sm whitespace-nowrap text-right">
                          {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
           >
             <Card className="p-12 text-center dark:bg-slate-900 border-0 shadow-lg">
               <div className="flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
                 <Crown className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                 <div>
                   <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Role Management</h3>
                   <p>Role permissions matrix is managed here.</p>
                 </div>
               </div>
             </Card>
           </motion.div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border dark:border-gray-700"
          >
            <h2 className="text-xl font-bold mb-2 dark:text-white">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              This is a simplified demo modal. In production, this would include comprehensive user management forms and validation.
            </p>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingUser(null)
                }} 
                variant="outline" 
                className="flex-1 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingUser) {
                    handleSaveUser(editingUser)
                  } else {
                    handleAddUser({
                      name: 'Demo User',
                      email: 'demo@example.com',
                      phone: '+91 98765 43210',
                      role: 'member',
                      status: 'active'
                    })
                  }
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {editingUser ? 'Update User' : 'Add User (Demo)'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
