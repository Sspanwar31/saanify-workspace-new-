'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  Plus,
  Edit,
  Eye,
  Ban,
  UserX,
  Ghost,
  Settings,
  FileText,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSuperClientStore, User, ActivityLog, Role, MOCK_ROLES, Permission } from '@/lib/super-client/store'

// Import Components
import AllUsersTab from '@/components/super-client/users/AllUsersTab'
import RolesPermissionsTab from '@/components/super-client/users/RolesPermissionsTab'
import ActivityLogsTab from '@/components/super-client/users/ActivityLogsTab'
import AddUserModal from '@/components/super-client/users/AddUserModal'
import EditUserModal from '@/components/super-client/users/EditUserModal'

export default function UsersPage() {
  const { 
    users, 
    activityLogs, 
    roles,
    getActiveUsers, 
    getBlockedUsers,
    hasPermission,
    addUser,
    blockUser,
    unblockUser,
    deleteUser,
    linkMember,
    unlinkMember,
    impersonateUser,
    stopImpersonation,
    togglePermission,
    currentUser
  } = useSuperClientStore()

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('all-users')
  const [isGhostMode, setIsGhostMode] = useState(false)
  const [ghostModeUser, setGhostModeUser] = useState<User | null>(null)

  // Check permissions
  const canManageUsers = currentUser ? 
    (typeof currentUser.role === 'object' && currentUser.role.id === 'SUPER_ADMIN') || 
    (typeof currentUser.role === 'string' && currentUser.role === 'SUPER_ADMIN') || 
    hasPermission(currentUser.id, 'MANAGE_USERS') || 
    hasPermission(currentUser.id, 'manage_users') ||
    hasPermission(currentUser.id, 'MANAGE_ROLES') ||
    hasPermission(currentUser.id, 'manage_roles') : false
  
  const canViewActivityLogs = currentUser ? 
    hasPermission(currentUser.id, 'VIEW_ACTIVITY_LOGS') || 
    hasPermission(currentUser.id, 'view_activity_logs') : false
    
  const canUseGhostMode = currentUser ? 
    hasPermission(currentUser.id, 'GHOST_MODE') : false

  const activeUsers = getActiveUsers()
  const blockedUsers = getBlockedUsers()

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }

  const handleBlockUser = (userId: string) => {
    blockUser(userId)
  }

  const handleUnblockUser = (userId: string) => {
    unblockUser(userId)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUser(userId)
    }
  }

  const handleGhostMode = (user: User) => {
    if (isGhostMode) {
      stopImpersonation()
      setIsGhostMode(false)
      setGhostModeUser(null)
    } else {
      impersonateUser(user.id)
      setIsGhostMode(true)
      setGhostModeUser(user)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = MOCK_ROLES.find(r => r.id === role)
    return (
      <Badge className={roleConfig?.color || 'bg-gray-100 text-gray-800'}>
        {roleConfig?.name || role}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage users, roles, permissions, and monitor system activity
          </p>
        </div>
        
        {/* Ghost Mode Indicator */}
        {isGhostMode && ghostModeUser && (
          <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
            <Ghost className="h-4 w-4" />
            <span className="text-sm font-medium">
              Impersonating: {ghostModeUser.name}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleGhostMode(ghostModeUser)}
              className="text-purple-800 hover:text-purple-900"
            >
              Stop
            </Button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeUsers.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {blockedUsers.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Blocked accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {roles.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              System roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="roles-permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="activity-logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          {/* Add User Button - Only for users with MANAGE_USERS permission */}
          {canManageUsers && activeTab === 'all-users' && (
            <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <AddUserModal 
                  onClose={() => setIsAddUserModalOpen(false)}
                  onSuccess={() => setIsAddUserModalOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* All Users Tab */}
        <TabsContent value="all-users" className="space-y-4">
          <AllUsersTab 
            users={users}
            currentUser={currentUser}
            canManageUsers={canManageUsers}
            canUseGhostMode={canUseGhostMode}
            onEditUser={handleEditUser}
            onBlockUser={handleBlockUser}
            onUnblockUser={handleUnblockUser}
            onDeleteUser={handleDeleteUser}
            onGhostMode={handleGhostMode}
            isGhostMode={isGhostMode}
          />
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles-permissions" className="space-y-4">
          <RolesPermissionsTab 
            roles={roles}
            canManageUsers={canManageUsers}
            togglePermission={togglePermission}
            currentUser={currentUser}
          />
        </TabsContent>

        {/* Activity Logs Tab - Only for users with VIEW_ACTIVITY_LOGS permission */}
        {canViewActivityLogs && (
          <TabsContent value="activity-logs" className="space-y-4">
            <ActivityLogsTab 
              activityLogs={activityLogs}
              users={users}
            />
          </TabsContent>
        )}

        {/* Permission Denied Message for Activity Logs */}
        {!canViewActivityLogs && activeTab === 'activity-logs' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                You don't have permission to view activity logs. 
                Please contact your administrator for access.
              </p>
            </CardContent>
          </Card>
        )}
      </Tabs>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <EditUserModal 
              user={selectedUser}
              onClose={() => setIsEditUserModalOpen(false)}
              onSuccess={() => setIsEditUserModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}