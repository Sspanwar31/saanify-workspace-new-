'use client'

import { useState } from 'react'
import { 
  Edit, 
  Eye, 
  Ban, 
  CheckCircle, 
  UserX, 
  Ghost, 
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Link,
  Unlink,
  Pencil,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, MOCK_ROLES } from '@/lib/super-client/store'

interface AllUsersTabProps {
  users: User[]
  currentUser: User | null
  canManageUsers: boolean
  canUseGhostMode: boolean
  onEditUser: (user: User) => void
  onBlockUser: (userId: string) => void
  onUnblockUser: (userId: string) => void
  onDeleteUser: (userId: string) => void
  onGhostMode: (user: User) => void
  isGhostMode: boolean
}

export default function AllUsersTab({
  users,
  currentUser,
  canManageUsers,
  canUseGhostMode,
  onEditUser,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
  onGhostMode,
  isGhostMode
}: AllUsersTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter.toUpperCase()
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const getRoleBadge = (role: string) => {
    const roleConfig = MOCK_ROLES.find(r => r.id === role)
    return (
      <Badge className={roleConfig?.color || 'bg-gray-100 text-gray-800'}>
        {roleConfig?.name || role}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={
        status === 'ACTIVE' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }>
        {status === 'ACTIVE' ? 'Active' : 'Blocked'}
      </Badge>
    )
  }

  const formatLastLogin = (lastLogin: string) => {
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const handleLinkMember = (userId: string) => {
    // This would open a member selection modal
    alert('Link Member functionality would open member selection modal')
  }

  const handleUnlinkMember = (userId: string) => {
    // This would unlink the member
    alert('Unlink Member functionality would remove member link')
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {MOCK_ROLES.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Users ({filteredUsers.length})
            </span>
            {isGhostMode && (
              <Badge className="bg-purple-100 text-purple-800">
                Ghost Mode Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Info</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Linked Member</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={user.avatar} 
                            alt={user.name}
                            onError={(e) => {
                              e.currentTarget.src = ''
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </p>
                          {user.department && (
                            <p className="text-xs text-gray-500">
                              {user.department}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {formatLastLogin(user.lastLogin)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {user.linkedMemberId ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {user.linkedMemberId}
                          </Badge>
                          {canManageUsers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlinkMember(user.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Not linked</span>
                          {canManageUsers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLinkMember(user.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Link className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* EDIT ACTION */}
                        {canManageUsers && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEditUser(user)}
                            className="h-8 w-8"
                            title="Edit User"
                          >
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}

                        {/* BLOCK/UNBLOCK ACTION */}
                        {canManageUsers && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => user.status === 'ACTIVE' ? onBlockUser(user.id) : onUnblockUser(user.id)}
                            className="h-8 w-8"
                            title={user.status === 'ACTIVE' ? 'Block User' : 'Unblock User'}
                          >
                            {user.status === 'ACTIVE' ? (
                              <Ban className="h-4 w-4 text-orange-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        )}

                        {/* DELETE ACTION */}
                        {canManageUsers && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDeleteUser(user.id)}
                            className="h-8 w-8"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        
                        {/* GHOST MODE (Impersonate) */}
                        {canUseGhostMode && !isGhostMode && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onGhostMode(user)}
                            className="h-8 w-8"
                            title="View as User (Ghost Mode)"
                          >
                            <Eye className="h-4 w-4 text-purple-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No users found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}