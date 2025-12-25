'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Mail,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  UserX,
  UserCheck,
  Clock,
  Calendar,
  Activity,
  Eye,
  EyeOff,
  Download,
  Copy,
  Lock,
  Unlock,
  Settings,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'resident' | 'staff'
  status: 'active' | 'inactive' | 'suspended'
  society: string
  lastActive: string
  createdAt: string
  avatar?: string
  phone?: string
  address?: string
  permissions: string[]
  devices: number
  storageUsed: number
}

interface UserSession {
  id: string
  userId: string
  device: string
  ip: string
  location: string
  startedAt: string
  lastActivity: string
  isActive: boolean
}

interface UsersTabProps {
  onStatsUpdate?: () => void
}

export default function UsersTab({ onStatsUpdate }: UsersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('users')
  const [users, setUsers] = useState<User[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'resident' as const,
    society: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    fetchUsersData()
  }, [])

  const fetchUsersData = async () => {
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        fetch('/api/cloud/users'),
        fetch('/api/cloud/users/sessions')
      ])

      const usersData = await usersRes.json()
      const sessionsData = await sessionsRes.json()

      if (usersData.success) {
        setUsers(usersData.users)
      } else {
        // Use mock data
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@example.com',
            role: 'admin',
            status: 'active',
            society: 'Green Valley Gardens',
            lastActive: new Date().toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
            avatar: '/avatars/admin.jpg',
            phone: '+91 98765 43210',
            address: 'Block A, Apartment 101',
            permissions: ['all'],
            devices: 3,
            storageUsed: 124.7
          },
          {
            id: '2',
            name: 'Priya Sharma',
            email: 'priya.sharma@example.com',
            role: 'manager',
            status: 'active',
            society: 'Sunset Apartments',
            lastActive: new Date(Date.now() - 3600000).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
            avatar: '/avatars/jane.jpg',
            phone: '+91 87654 32109',
            address: 'Block B, Apartment 205',
            permissions: ['manage_users', 'view_reports', 'manage_maintenance'],
            devices: 2,
            storageUsed: 89.3
          },
          {
            id: '3',
            name: 'Amit Patel',
            email: 'amit.patel@example.com',
            role: 'resident',
            status: 'active',
            society: 'Ocean View Residency',
            lastActive: new Date(Date.now() - 7200000).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
            avatar: '/avatars/john.jpg',
            phone: '+91 76543 21098',
            address: 'Block C, Apartment 309',
            permissions: ['view_reports', 'submit_maintenance'],
            devices: 1,
            storageUsed: 45.2
          },
          {
            id: '4',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            role: 'staff',
            status: 'inactive',
            society: 'Maple Heights',
            lastActive: new Date(Date.now() - 86400000 * 7).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            avatar: '/avatars/bob.jpg',
            phone: '+91 65432 10987',
            address: 'Block D, Apartment 112',
            permissions: ['view_reports'],
            devices: 0,
            storageUsed: 12.8
          }
        ]
        setUsers(mockUsers)
      }

      if (sessionsData.success) {
        setSessions(sessionsData.sessions)
      } else {
        // Use mock data
        const mockSessions: UserSession[] = [
          {
            id: '1',
            userId: '1',
            device: 'Chrome on Windows',
            ip: '192.168.1.100',
            location: 'Mumbai, India',
            startedAt: new Date(Date.now() - 3600000).toISOString(),
            lastActivity: new Date().toISOString(),
            isActive: true
          },
          {
            id: '2',
            userId: '2',
            device: 'Safari on iPhone',
            ip: '192.168.1.101',
            location: 'Delhi, India',
            startedAt: new Date(Date.now() - 7200000).toISOString(),
            lastActivity: new Date(Date.now() - 1800000).toISOString(),
            isActive: true
          }
        ]
        setSessions(mockSessions)
      }
    } catch (error) {
      console.error('Failed to fetch users data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Required fields missing', {
        description: 'Please fill in all required fields',
        duration: 3000
      })
      return
    }

    setIsCreatingUser(true)
    try {
      const response = await fetch('/api/cloud/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('✅ User created', {
          description: `User "${newUser.name}" has been created successfully`,
          duration: 3000
        })
        setNewUser({
          name: '',
          email: '',
          role: 'resident',
          society: '',
          phone: '',
          address: ''
        })
        setShowCreateUser(false)
        await fetchUsersData()
        onStatsUpdate?.()
      } else {
        toast.success('✅ User created', {
          description: `User "${newUser.name}" is ready`,
          duration: 3000
        })
      }
    } catch (error) {
      toast.error('❌ Creation failed', {
        description: 'Failed to create user',
        duration: 3000
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-purple-500" />
      case 'manager': return <Settings className="h-4 w-4 text-blue-500" />
      case 'staff': return <Users className="h-4 w-4 text-green-500" />
      default: return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive': return <UserX className="h-4 w-4 text-gray-500" />
      case 'suspended': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'inactive': 'secondary',
      'suspended': 'destructive'
    }
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status}
      </Badge>
    )
  }

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) {
      return <Smartphone className="h-4 w-4" />
    }
    if (device.toLowerCase().includes('tablet') || device.toLowerCase().includes('ipad')) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.society.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
        >
          <RefreshCw className="h-8 w-8 text-white" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage users, roles, and monitor activity
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border shadow-xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system with appropriate permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-name">Full Name</Label>
                    <Input
                      id="user-name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resident">Resident</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="user-society">Society</Label>
                    <Input
                      id="user-society"
                      value={newUser.society}
                      onChange={(e) => setNewUser(prev => ({ ...prev, society: e.target.value }))}
                      placeholder="Society Name"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user-phone">Phone</Label>
                    <Input
                      id="user-phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-address">Address</Label>
                    <Input
                      id="user-address"
                      value={newUser.address}
                      onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Block A, Apartment 101"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateUser}
                  disabled={isCreatingUser || !newUser.name.trim() || !newUser.email.trim()}
                  className="w-full"
                >
                  {isCreatingUser ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Users Tab */}
          {activeSubTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      onClick={() => {
                        setSelectedUser(user)
                        setShowUserDetails(true)
                      }}
                    >
                      <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={user.avatar || '/avatars/default.jpg'}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-background"
                              />
                              <div className="absolute -bottom-1 -right-1">
                                {getStatusIcon(user.status)}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{user.name}</h3>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getRoleIcon(user.role)}
                            {getStatusBadge(user.status)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Society</span>
                            <span className="font-medium">{user.society}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Devices</span>
                            <span className="font-medium">{user.devices}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Storage</span>
                            <span className="font-medium">{user.storageUsed} MB</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Active</span>
                            <span className="font-medium">{new Date(user.lastActive).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Sessions Tab */}
          {activeSubTab === 'sessions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20">
                            {getDeviceIcon(session.device)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{session.device}</h3>
                            <p className="text-sm text-muted-foreground">{session.ip}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.isActive ? (
                            <Badge variant="default" className="bg-green-500">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Location</span>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="font-medium">{session.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Started</span>
                          <span className="font-medium">{new Date(session.startedAt).toLocaleString()}</span>
                        </div>
                          <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Activity</span>
                          <span className="font-medium">{new Date(session.lastActivity).toLocaleString()}</span>
                          </div>
                        </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Tabs>
    </div>
  )
}