// Mock Users Data for Saanify Society Management Platform

export interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Treasurer' | 'Member'
  status: 'Active' | 'Inactive'
  avatar?: string
  phone?: string
  address?: string
  joinDate: string
  lastLogin?: string
  department?: string
  employeeId?: string
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  admins: number
  treasurers: number
  members: number
  newUsersThisMonth: number
  usersWithPendingTasks: number
}

// Mock users data with more diversity
export const usersData: User[] = [
  {
    id: 'U001',
    name: 'Amit Sharma',
    email: 'amit@saanify.com',
    role: 'Admin',
    status: 'Active',
    avatar: '/avatars/admin.jpg',
    phone: '+91 98765 43210',
    address: '123, Main Street, Mumbai, Maharashtra 400001',
    joinDate: '2024-01-15',
    lastLogin: '2024-11-01T10:30:00Z',
    department: 'Administration',
    employeeId: 'EMP001',
    permissions: ['all'],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-11-01T10:30:00Z'
  },
  {
    id: 'U002',
    name: 'Ravi Verma',
    email: 'ravi@saanify.com',
    role: 'Treasurer',
    status: 'Active',
    avatar: '/avatars/rajesh.jpg',
    phone: '+91 98765 43211',
    address: '456, Park Avenue, Delhi, 110001',
    joinDate: '2024-02-01',
    lastLogin: '2024-10-31T15:45:00Z',
    department: 'Finance',
    employeeId: 'EMP002',
    permissions: ['financial', 'reports', 'loans'],
    createdAt: '2024-02-01T11:30:00Z',
    updatedAt: '2024-10-31T15:45:00Z'
  },
  {
    id: 'U003',
    name: 'Sneha Patel',
    email: 'sneha@saanify.com',
    role: 'Member',
    status: 'Active',
    avatar: '/avatars/priya.jpg',
    phone: '+91 98765 43212',
    address: '789, Garden Road, Bangalore, Karnataka 560001',
    joinDate: '2024-02-15',
    lastLogin: '2024-11-01T08:20:00Z',
    department: 'General',
    employeeId: 'EMP003',
    permissions: ['view', 'profile'],
    createdAt: '2024-02-15T14:20:00Z',
    updatedAt: '2024-11-01T08:20:00Z'
  },
  {
    id: 'U004',
    name: 'Anjali Singh',
    email: 'anjali@saanify.com',
    role: 'Member',
    status: 'Inactive',
    avatar: '/avatars/jane.jpg',
    phone: '+91 98765 43213',
    address: '321, Lake View, Chennai, Tamil Nadu 600001',
    joinDate: '2024-03-01',
    lastLogin: '2024-09-15T12:00:00Z',
    department: 'General',
    employeeId: 'EMP004',
    permissions: ['view', 'profile'],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-09-15T12:00:00Z'
  },
  {
    id: 'U005',
    name: 'Rajesh Kumar',
    email: 'rajesh@saanify.com',
    role: 'Treasurer',
    status: 'Active',
    avatar: '/avatars/bob.jpg',
    phone: '+91 98765 43214',
    address: '654, Hill Side, Hyderabad, Telangana 500001',
    joinDate: '2024-03-15',
    lastLogin: '2024-10-30T16:30:00Z',
    department: 'Finance',
    employeeId: 'EMP005',
    permissions: ['financial', 'reports', 'loans'],
    createdAt: '2024-03-15T13:15:00Z',
    updatedAt: '2024-10-30T16:30:00Z'
  },
  {
    id: 'U006',
    name: 'Priya Nair',
    email: 'priya@saanify.com',
    role: 'Member',
    status: 'Active',
    avatar: '/avatars/sunita.jpg',
    phone: '+91 98765 43215',
    address: '987, Beach Road, Kochi, Kerala 682001',
    joinDate: '2024-04-01',
    lastLogin: '2024-11-01T09:15:00Z',
    department: 'General',
    employeeId: 'EMP006',
    permissions: ['view', 'profile'],
    createdAt: '2024-04-01T11:45:00Z',
    updatedAt: '2024-11-01T09:15:00Z'
  },
  {
    id: 'U007',
    name: 'Vikram Malhotra',
    email: 'vikram@saanify.com',
    role: 'Admin',
    status: 'Active',
    avatar: '/avatars/john.jpg',
    phone: '+91 98765 43216',
    address: '147, City Center, Pune, Maharashtra 411001',
    joinDate: '2024-04-15',
    lastLogin: '2024-10-29T14:00:00Z',
    department: 'Administration',
    employeeId: 'EMP007',
    permissions: ['all'],
    createdAt: '2024-04-15T16:30:00Z',
    updatedAt: '2024-10-29T14:00:00Z'
  },
  {
    id: 'U008',
    name: 'Kavita Reddy',
    email: 'kavita@saanify.com',
    role: 'Member',
    status: 'Active',
    avatar: '/avatars/anjali.jpg',
    phone: '+91 98765 43217',
    address: '258, Tech Park, Bangalore, Karnataka 560103',
    joinDate: '2024-05-01',
    lastLogin: '2024-11-01T11:00:00Z',
    department: 'General',
    employeeId: 'EMP008',
    permissions: ['view', 'profile'],
    createdAt: '2024-05-01T09:30:00Z',
    updatedAt: '2024-11-01T11:00:00Z'
  },
  {
    id: 'U009',
    name: 'Mohammed Ali',
    email: 'mohammed@saanify.com',
    role: 'Member',
    status: 'Active',
    avatar: '/avatars/mohammed.jpg',
    phone: '+91 98765 43218',
    address: '963, Old City, Hyderabad, Telangana 500002',
    joinDate: '2024-05-15',
    lastLogin: '2024-10-28T18:45:00Z',
    department: 'General',
    employeeId: 'EMP009',
    permissions: ['view', 'profile'],
    createdAt: '2024-05-15T12:00:00Z',
    updatedAt: '2024-10-28T18:45:00Z'
  },
  {
    id: 'U010',
    name: 'Deepika Rao',
    email: 'deepika@saanify.com',
    role: 'Treasurer',
    status: 'Active',
    avatar: '/avatars/deepika.jpg',
    phone: '+91 98765 43219',
    address: '741, Marine Drive, Mumbai, Maharashtra 400002',
    joinDate: '2024-06-01',
    lastLogin: '2024-11-01T07:30:00Z',
    department: 'Finance',
    employeeId: 'EMP010',
    permissions: ['financial', 'reports', 'loans'],
    createdAt: '2024-06-01T10:15:00Z',
    updatedAt: '2024-11-01T07:30:00Z'
  },
  {
    id: 'U011',
    name: 'Sanjay Gupta',
    email: 'sanjay@saanify.com',
    role: 'Member',
    status: 'Active',
    avatar: '/avatars/sanjay.jpg',
    phone: '+91 98765 43220',
    address: '852, Business Hub, Delhi, 110002',
    joinDate: '2024-06-15',
    lastLogin: '2024-10-30T12:15:00Z',
    department: 'General',
    employeeId: 'EMP011',
    permissions: ['view', 'profile'],
    createdAt: '2024-06-15T14:30:00Z',
    updatedAt: '2024-10-30T12:15:00Z'
  },
  {
    id: 'U012',
    name: 'Neha Sharma',
    email: 'neha@saanify.com',
    role: 'Member',
    status: 'Inactive',
    avatar: '/avatars/neha.jpg',
    phone: '+91 98765 43221',
    address: '159, Residential Area, Bangalore, Karnataka 560002',
    joinDate: '2024-07-01',
    lastLogin: '2024-08-15T10:00:00Z',
    department: 'General',
    employeeId: 'EMP012',
    permissions: ['view', 'profile'],
    createdAt: '2024-07-01T09:00:00Z',
    updatedAt: '2024-08-15T10:00:00Z'
  }
]

// Calculate user statistics
export const getUserStats = (users: User[]): UserStats => {
  const totalUsers = users.length
  const activeUsers = users.filter(user => user.status === 'Active').length
  const inactiveUsers = users.filter(user => user.status === 'Inactive').length
  const admins = users.filter(user => user.role === 'Admin').length
  const treasurers = users.filter(user => user.role === 'Treasurer').length
  const members = users.filter(user => user.role === 'Member').length
  
  // Calculate new users this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const newUsersThisMonth = users.filter(user => {
    const joinDate = new Date(user.joinDate)
    return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear
  }).length
  
  // Mock users with pending tasks (users who haven't logged in recently)
  const usersWithPendingTasks = users.filter(user => {
    if (!user.lastLogin) return true
    const lastLogin = new Date(user.lastLogin)
    const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceLogin > 7
  }).length

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    admins,
    treasurers,
    members,
    newUsersThisMonth,
    usersWithPendingTasks
  }
}

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'Inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Role color mapping
export const getRoleColor = (role: string) => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'Treasurer':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'Member':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

// Role icon mapping
export const getRoleIcon = (role: string) => {
  switch (role) {
    case 'Admin':
      return '👑'
    case 'Treasurer':
      return '💰'
    case 'Member':
      return '👤'
    default:
      return '👤'
  }
}

// Generate unique user ID
export const generateUserId = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `U${timestamp}${random}`
}

// Validation functions
export const validateUserForm = (user: Partial<User>, isEdit: boolean = false) => {
  const errors: string[] = []

  if (!user.name || user.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }

  if (!user.email) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Please enter a valid email address')
  }

  if (!user.role) {
    errors.push('Role is required')
  }

  if (!user.status) {
    errors.push('Status is required')
  }

  if (user.phone && !/^[+]?[\d\s\-\(\)]+$/.test(user.phone)) {
    errors.push('Please enter a valid phone number')
  }

  return errors
}

// Email validation for uniqueness (mock implementation)
export const isEmailUnique = (email: string, users: User[], excludeId?: string) => {
  return !users.some(user => 
    user.email.toLowerCase() === email.toLowerCase() && user.id !== excludeId
  )
}

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format last login for display
export const formatLastLogin = (dateString?: string) => {
  if (!dateString) return 'Never'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else {
    return formatDate(dateString)
  }
}

export default usersData