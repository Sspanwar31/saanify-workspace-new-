// User Management Module with Role-Based Access Control
// Future-ready for API integration

export interface User {
  id: string // UUID for future DB integration
  username: string
  email: string
  password: string // Hashed password
  firstName: string
  lastName: string
  phone: string
  role: 'superAdmin' | 'admin' | 'treasurer' | 'client'
  permissions: Permission[]
  status: 'active' | 'inactive' | 'suspended'
  profile: {
    avatar?: string
    bio?: string
    address?: string
    dateOfBirth?: string
    joinDate: string
    lastLogin?: string
  }
  security: {
    twoFactorEnabled: boolean
    loginAttempts: number
    lockedUntil?: string
    passwordChangedAt: string
    lastPasswordChange?: string
  }
  preferences: {
    language: string
    timezone: string
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  description: string
  module: string
  action: 'create' | 'read' | 'update' | 'delete' | 'approve'
  scope: 'own' | 'all' | 'department'
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[] // Permission IDs
  isSystem: boolean
  createdAt: string
}

export interface Session {
  id: string
  userId: string
  token: string
  refreshToken: string
  deviceInfo: {
    userAgent: string
    ip: string
    location?: string
  }
  expiresAt: string
  createdAt: string
  lastAccessedAt: string
  isActive: boolean
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
  status: 'success' | 'failure'
}

// System permissions
export const systemPermissions: Permission[] = [
  // Member Management
  { id: 'memberCreate', name: 'Create Member', description: 'Add new members', module: 'members', action: 'create', scope: 'all' },
  { id: 'memberRead', name: 'View Members', description: 'View member information', module: 'members', action: 'read', scope: 'all' },
  { id: 'memberUpdate', name: 'Update Member', description: 'Edit member information', module: 'members', action: 'update', scope: 'all' },
  { id: 'memberDelete', name: 'Delete Member', description: 'Remove members', module: 'members', action: 'delete', scope: 'all' },
  
  // Loan Management
  { id: 'loanCreate', name: 'Create Loan', description: 'Add new loans', module: 'loans', action: 'create', scope: 'all' },
  { id: 'loanRead', name: 'View Loans', description: 'View loan information', module: 'loans', action: 'read', scope: 'all' },
  { id: 'loanUpdate', name: 'Update Loan', description: 'Edit loan information', module: 'loans', action: 'update', scope: 'all' },
  { id: 'loanDelete', name: 'Delete Loan', description: 'Remove loans', module: 'loans', action: 'delete', scope: 'all' },
  { id: 'loanApprove', name: 'Approve Loan', description: 'Approve loan applications', module: 'loans', action: 'approve', scope: 'all' },
  
  // Passbook Management
  { id: 'passbookCreate', name: 'Create Entry', description: 'Add passbook entries', module: 'passbook', action: 'create', scope: 'all' },
  { id: 'passbookRead', name: 'View Passbook', description: 'View passbook entries', module: 'passbook', action: 'read', scope: 'all' },
  { id: 'passbookUpdate', name: 'Update Entry', description: 'Edit passbook entries', module: 'passbook', action: 'update', scope: 'all' },
  { id: 'passbookDelete', name: 'Delete Entry', description: 'Remove passbook entries', module: 'passbook', action: 'delete', scope: 'all' },
  
  // Expense Management
  { id: 'expenseCreate', name: 'Create Expense', description: 'Add new expenses', module: 'expenses', action: 'create', scope: 'all' },
  { id: 'expenseRead', name: 'View Expenses', description: 'View expense information', module: 'expenses', action: 'read', scope: 'all' },
  { id: 'expenseUpdate', name: 'Update Expense', description: 'Edit expense information', module: 'expenses', action: 'update', scope: 'all' },
  { id: 'expenseDelete', name: 'Delete Expense', description: 'Remove expenses', module: 'expenses', action: 'delete', scope: 'all' },
  { id: 'expenseApprove', name: 'Approve Expense', description: 'Approve expense claims', module: 'expenses', action: 'approve', scope: 'all' },
  
  // Reports
  { id: 'reportsView', name: 'View Reports', description: 'Access reports and analytics', module: 'reports', action: 'read', scope: 'all' },
  { id: 'reportsExport', name: 'Export Reports', description: 'Export reports data', module: 'reports', action: 'create', scope: 'all' },
  
  // Admin Fund
  { id: 'adminFund_create', name: 'Manage Admin Fund', description: 'Add admin fund transactions', module: 'adminFund', action: 'create', scope: 'all' },
  { id: 'adminFund_read', name: 'View Admin Fund', description: 'View admin fund information', module: 'adminFund', action: 'read', scope: 'all' },
  
  // User Management
  { id: 'userCreate', name: 'Create User', description: 'Add new users', module: 'users', action: 'create', scope: 'all' },
  { id: 'userRead', name: 'View Users', description: 'View user information', module: 'users', action: 'read', scope: 'all' },
  { id: 'userUpdate', name: 'Update User', description: 'Edit user information', module: 'users', action: 'update', scope: 'all' },
  { id: 'userDelete', name: 'Delete User', description: 'Remove users', module: 'users', action: 'delete', scope: 'all' },
  { id: 'userManage_permissions', name: 'Manage Permissions', description: 'Assign user permissions', module: 'users', action: 'update', scope: 'all' },
  
  // System Settings
  { id: 'settingsView', name: 'View Settings', description: 'Access system settings', module: 'settings', action: 'read', scope: 'all' },
  { id: 'settingsUpdate', name: 'Update Settings', description: 'Modify system settings', module: 'settings', action: 'update', scope: 'all' },
  
  // Audit Logs
  { id: 'auditView', name: 'View Audit Logs', description: 'Access audit logs', module: 'audit', action: 'read', scope: 'all' }
]

// System roles
export const systemRoles: Role[] = [
  {
    id: 'superAdmin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: systemPermissions.map(p => p.id),
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrative access to most features',
    permissions: [
      'memberCreate', 'memberRead', 'memberUpdate',
      'loanCreate', 'loanRead', 'loanUpdate', 'loanApprove',
      'passbookCreate', 'passbookRead', 'passbookUpdate',
      'expenseCreate', 'expenseRead', 'expenseUpdate', 'expenseApprove',
      'reportsView', 'reportsExport',
      'adminFund_create', 'adminFund_read'
    ],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'treasurer',
    name: 'Treasurer',
    description: 'Financial management access',
    permissions: [
      'memberRead',
      'loanRead', 'loanApprove',
      'passbookCreate', 'passbookRead',
      'expenseRead', 'expenseApprove',
      'reportsView',
      'adminFund_read'
    ],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'client',
    name: 'Client',
    description: 'Member access to own information',
    permissions: [
      'memberRead',
      'loanRead',
      'passbookRead',
      'expenseRead',
      'reportsView'
    ],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
]

// Dummy users data
export const usersData: User[] = [
  {
    id: 'user-uuid-001',
    username: 'superadmin',
    email: 'admin@saanify.com',
    password: '$2b$10$hashedpassword123', // This would be properly hashed
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+91 98765 43210',
    role: 'superAdmin',
    permissions: systemPermissions,
    status: 'active',
    profile: {
      avatar: '/avatars/admin.jpg',
      bio: 'System Super Administrator',
      address: '123 Admin Street, Mumbai, Maharashtra 400001',
      dateOfBirth: '1980-01-01',
      joinDate: '2024-01-01',
      lastLogin: '2024-11-30T10:30:00Z'
    },
    security: {
      twoFactorEnabled: true,
      loginAttempts: 0,
      passwordChangedAt: '2024-01-01T00:00:00Z',
      lastPasswordChange: '2024-10-01T00:00:00Z'
    },
    preferences: {
      language: 'en',
      timezone: 'Asia/Kolkata',
      theme: 'system',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-30T10:30:00Z'
  },
  {
    id: 'user-uuid-002',
    username: 'admin',
    email: 'administrator@saanify.com',
    password: '$2b$10$hashedpassword456',
    firstName: 'John',
    lastName: 'Administrator',
    phone: '+91 98765 43211',
    role: 'admin',
    permissions: systemPermissions.filter(p => 
      systemRoles.find(r => r.id === 'admin')?.permissions.includes(p.id)
    ),
    status: 'active',
    profile: {
      avatar: '/avatars/admin.jpg',
      bio: 'Society Administrator',
      address: '456 Society Road, Delhi, Delhi 110001',
      dateOfBirth: '1985-05-15',
      joinDate: '2024-01-15',
      lastLogin: '2024-11-30T09:15:00Z'
    },
    security: {
      twoFactorEnabled: false,
      loginAttempts: 0,
      passwordChangedAt: '2024-01-15T00:00:00Z',
      lastPasswordChange: '2024-09-15T00:00:00Z'
    },
    preferences: {
      language: 'en',
      timezone: 'Asia/Kolkata',
      theme: 'light',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-11-30T09:15:00Z'
  },
  {
    id: 'user-uuid-003',
    username: 'treasurer',
    email: 'treasurer@saanify.com',
    password: '$2b$10$hashedpassword789',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    phone: '+91 98765 43212',
    role: 'treasurer',
    permissions: systemPermissions.filter(p => 
      systemRoles.find(r => r.id === 'treasurer')?.permissions.includes(p.id)
    ),
    status: 'active',
    profile: {
      avatar: '/avatars/treasurer.jpg',
      bio: 'Society Treasurer',
      address: '789 Finance Street, Bangalore, Karnataka 560001',
      dateOfBirth: '1978-08-22',
      joinDate: '2024-02-01',
      lastLogin: '2024-11-30T08:45:00Z'
    },
    security: {
      twoFactorEnabled: true,
      loginAttempts: 0,
      passwordChangedAt: '2024-02-01T00:00:00Z',
      lastPasswordChange: '2024-08-01T00:00:00Z'
    },
    preferences: {
      language: 'en',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      notifications: {
        email: true,
        sms: true,
        push: false
      }
    },
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-11-30T08:45:00Z'
  },
  {
    id: 'user-uuid-004',
    username: 'client1',
    email: 'client1@saanify.com',
    password: '$2b$10$hashedpassword012',
    firstName: 'Priya',
    lastName: 'Sharma',
    phone: '+91 98765 43213',
    role: 'client',
    permissions: systemPermissions.filter(p => 
      systemRoles.find(r => r.id === 'client')?.permissions.includes(p.id)
    ),
    status: 'active',
    profile: {
      avatar: '/avatars/client1.jpg',
      bio: 'Society Member',
      address: '321 Member Lane, Chennai, Tamil Nadu 600001',
      dateOfBirth: '1990-03-10',
      joinDate: '2024-03-01',
      lastLogin: '2024-11-29T18:30:00Z'
    },
    security: {
      twoFactorEnabled: false,
      loginAttempts: 0,
      passwordChangedAt: '2024-03-01T00:00:00Z',
      lastPasswordChange: '2024-07-01T00:00:00Z'
    },
    preferences: {
      language: 'en',
      timezone: 'Asia/Kolkata',
      theme: 'light',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    },
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-11-29T18:30:00Z'
  },
  {
    id: 'user-uuid-005',
    username: 'client2',
    email: 'client2@saanify.com',
    password: '$2b$10$hashedpassword345',
    firstName: 'Amit',
    lastName: 'Patel',
    phone: '+91 98765 43214',
    role: 'client',
    permissions: systemPermissions.filter(p => 
      systemRoles.find(r => r.id === 'client')?.permissions.includes(p.id)
    ),
    status: 'active',
    profile: {
      avatar: '/avatars/client2.jpg',
      bio: 'Society Member',
      address: '654 Member Avenue, Hyderabad, Telangana 500001',
      dateOfBirth: '1988-11-25',
      joinDate: '2024-04-15',
      lastLogin: '2024-11-30T07:20:00Z'
    },
    security: {
      twoFactorEnabled: false,
      loginAttempts: 1,
      passwordChangedAt: '2024-04-15T00:00:00Z',
      lastPasswordChange: '2024-06-15T00:00:00Z'
    },
    preferences: {
      language: 'hi',
      timezone: 'Asia/Kolkata',
      theme: 'system',
      notifications: {
        email: false,
        sms: true,
        push: true
      }
    },
    createdAt: '2024-04-15T00:00:00Z',
    updatedAt: '2024-11-30T07:20:00Z'
  }
]

// Dummy sessions data
export const sessionsData: Session[] = [
  {
    id: 'session-uuid-001',
    userId: 'user-uuid-001',
    token: 'jwt-token-12345',
    refreshToken: 'refresh-token-12345',
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip: '192.168.1.100',
      location: 'Mumbai, India'
    },
    expiresAt: '2024-12-30T10:30:00Z',
    createdAt: '2024-11-30T10:30:00Z',
    lastAccessedAt: '2024-11-30T10:30:00Z',
    isActive: true
  },
  {
    id: 'session-uuid-002',
    userId: 'user-uuid-003',
    token: 'jwt-token-67890',
    refreshToken: 'refresh-token-67890',
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ip: '192.168.1.101',
      location: 'Bangalore, India'
    },
    expiresAt: '2024-12-30T08:45:00Z',
    createdAt: '2024-11-30T08:45:00Z',
    lastAccessedAt: '2024-11-30T08:45:00Z',
    isActive: true
  }
]

// Dummy audit logs data
export const auditLogsData: AuditLog[] = [
  {
    id: 'audit-uuid-001',
    userId: 'user-uuid-001',
    action: 'LOGIN',
    resource: 'auth',
    details: { success: true, method: 'password' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-11-30T10:30:00Z',
    status: 'success'
  },
  {
    id: 'audit-uuid-002',
    userId: 'user-uuid-003',
    action: 'LOANAPPROVE',
    resource: 'loan',
    resourceId: 'loan-uuid-001',
    details: { loanAmount: 50000, memberName: 'Rajesh Kumar' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    timestamp: '2024-11-30T09:15:00Z',
    status: 'success'
  },
  {
    id: 'audit-uuid-003',
    userId: 'user-uuid-002',
    action: 'EXPENSECREATE',
    resource: 'expense',
    resourceId: 'exp-uuid-001',
    details: { amount: 5000, category: 'maintenance' },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    timestamp: '2024-11-30T08:30:00Z',
    status: 'success'
  }
]

// Permission checking functions
export const hasPermission = (user: User, permissionId: string): boolean => {
  return user.permissions.some(permission => permission.id === permissionId)
}

export const hasModuleAccess = (user: User, module: string, action: string): boolean => {
  return user.permissions.some(permission => 
    permission.module === module && permission.action === action
  )
}

export const canAccessResource = (user: User, resource: string, resourceId?: string): boolean => {
  // Super admin can access everything
  if (user.role === 'superAdmin') return true
  
  // Check specific permissions
  const relevantPermissions = user.permissions.filter(p => 
    p.module === resource || p.module === 'all'
  )
  
  if (relevantPermissions.length === 0) return false
  
  // Check scope permissions
  return relevantPermissions.some(permission => {
    if (permission.scope === 'all') return true
    if (permission.scope === 'own' && resourceId) {
      // Check if resource belongs to user (this would need implementation based on resource type)
      return true // Simplified for now
    }
    return false
  })
}

// User management functions
export const getUserById = (userId: string): User | undefined => {
  return usersData.find(user => user.id === userId)
}

export const getUserByEmail = (email: string): User | undefined => {
  return usersData.find(user => user.email === email)
}

export const getUserByUsername = (username: string): User | undefined => {
  return usersData.find(user => user.username === username)
}

export const getActiveUsers = (): User[] => {
  return usersData.filter(user => user.status === 'active')
}

export const getUsersByRole = (role: string): User[] => {
  return usersData.filter(user => user.role === role)
}

// Session management functions
export const getActiveSessions = (userId?: string): Session[] => {
  let sessions = sessionsData.filter(session => session.isActive)
  if (userId) {
    sessions = sessions.filter(session => session.userId === userId)
  }
  return sessions
}

export const getUserSessions = (userId: string): Session[] => {
  return sessionsData.filter(session => session.userId === userId)
}

// Audit log functions
export const getAuditLogs = (userId?: string, limit?: number): AuditLog[] => {
  let logs = auditLogsData
  if (userId) {
    logs = logs.filter(log => log.userId === userId)
  }
  logs = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  if (limit) {
    logs = logs.slice(0, limit)
  }
  return logs
}

// Role management functions
export const getRolePermissions = (roleId: string): Permission[] => {
  const role = systemRoles.find(r => r.id === roleId)
  if (!role) return []
  
  return systemPermissions.filter(permission => 
    role.permissions.includes(permission.id)
  )
}

// Validation functions
export const validateUserForm = (user: Partial<User>, isEdit: boolean = false) => {
  const errors: string[] = []

  if (!user.username || user.username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long')
  }

  if (!user.email || !user.email.includes('@')) {
    errors.push('Valid email is required')
  }

  if (!user.firstName || user.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters long')
  }

  if (!user.lastName || user.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters long')
  }

  if (!user.phone || user.phone.trim().length < 10) {
    errors.push('Valid phone number is required')
  }

  if (!user.role) {
    errors.push('Role is required')
  }

  if (!isEdit && !user.password) {
    errors.push('Password is required')
  }

  if (user.password && user.password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  return errors
}

// Generate unique user ID
export const generateUserId = () => {
  return 'user-uuid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

// Generate unique session ID
export const generateSessionId = () => {
  return 'session-uuid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

// Generate unique audit log ID
export const generateAuditLogId = () => {
  return 'audit-uuid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    case 'suspended':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Role color mapping
export const getRoleColor = (role: string) => {
  switch (role) {
    case 'superAdmin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'admin':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'treasurer':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'client':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// API-ready functions for future integration
export const userManagementAPI = {
  // Future API calls - currently returns mock data
  getAllUsers: async (): Promise<User[]> => {
    return Promise.resolve(usersData)
  },
  
  getUserById: async (id: string): Promise<User | undefined> => {
    return Promise.resolve(getUserById(id))
  },
  
  create: async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const newUser: User = {
      ...user,
      id: generateUserId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return Promise.resolve(newUser)
  },
  
  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const user = getUserById(id)
    if (!user) throw new Error('User not found')
    return Promise.resolve({ ...user, ...updates, updatedAt: new Date().toISOString() })
  },
  
  delete: async (id: string): Promise<void> => {
    const user = getUserById(id)
    if (!user) throw new Error('User not found')
    return Promise.resolve()
  },
  
  checkPermission: async (userId: string, permissionId: string): Promise<boolean> => {
    const user = getUserById(userId)
    if (!user) return false
    return Promise.resolve(hasPermission(user, permissionId))
  }
}

export default usersData