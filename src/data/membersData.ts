// Future-Proof Members Data for Saanify Society Management Platform
// Ready for Database Integration with UUID linking

export interface Member {
  id: string // UUID for future DB integration
  name: string
  phone: string // unique phone number
  aadhar: string // unique aadhar number
  joinDate: string // yyyy-mm-dd format
  address: string
  nominee: {
    name: string
    relation: string
  }
  status: 'active' | 'inactive'
  email?: string // optional for future use
  avatar?: string // optional for future use
  createdAt?: string
  updatedAt?: string
}

export interface MemberStats {
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  newMembersThisMonth: number
  totalDeposits: number
  totalLoans: number
}

// Dummy data with future-proof structure
export const membersData: Member[] = [
  {
    id: 'uuid-001',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    aadhar: '1234-5678-9012',
    joinDate: '2024-01-15',
    address: '123 Main Street, Mumbai, Maharashtra 400001',
    nominee: {
      name: 'Sunita Kumar',
      relation: 'Spouse'
    },
    status: 'active',
    email: 'rajesh.kumar@email.com',
    avatar: '/avatars/rajesh.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'uuid-002',
    name: 'Priya Sharma',
    phone: '+91 98765 43211',
    aadhar: '2345-6789-0123',
    joinDate: '2024-02-01',
    address: '456 Oak Avenue, Delhi, Delhi 110001',
    nominee: {
      name: 'Amit Sharma',
      relation: 'Brother'
    },
    status: 'active',
    email: 'priya.sharma@email.com',
    avatar: '/avatars/priya.jpg',
    createdAt: '2024-02-01T11:30:00Z',
    updatedAt: '2024-02-01T11:30:00Z'
  },
  {
    id: 'uuid-003',
    name: 'Amit Patel',
    phone: '+91 98765 43212',
    aadhar: '3456-7890-1234',
    joinDate: '2024-01-20',
    address: '789 Pine Road, Ahmedabad, Gujarat 380001',
    nominee: {
      name: 'Rekha Patel',
      relation: 'Mother'
    },
    status: 'active',
    email: 'amit.patel@email.com',
    avatar: '/avatars/amit.jpg',
    createdAt: '2024-01-20T14:15:00Z',
    updatedAt: '2024-01-20T14:15:00Z'
  },
  {
    id: 'uuid-004',
    name: 'Sunita Reddy',
    phone: '+91 98765 43213',
    aadhar: '4567-8901-2345',
    joinDate: '2024-03-10',
    address: '321 Elm Street, Bangalore, Karnataka 560001',
    nominee: {
      name: 'Vikram Reddy',
      relation: 'Husband'
    },
    status: 'inactive',
    email: 'sunita.reddy@email.com',
    avatar: '/avatars/sunita.jpg',
    createdAt: '2024-03-10T09:45:00Z',
    updatedAt: '2024-11-01T12:00:00Z'
  },
  {
    id: 'uuid-005',
    name: 'Vikram Singh',
    phone: '+91 98765 43214',
    aadhar: '5678-9012-3456',
    joinDate: '2024-02-15',
    address: '567 Maple Lane, Jaipur, Rajasthan 302001',
    nominee: {
      name: 'Anjali Singh',
      relation: 'Sister'
    },
    status: 'active',
    email: 'vikram.singh@email.com',
    avatar: '/avatars/vikram.jpg',
    createdAt: '2024-02-15T16:20:00Z',
    updatedAt: '2024-02-15T16:20:00Z'
  },
  {
    id: 'uuid-006',
    name: 'Anjali Gupta',
    phone: '+91 98765 43215',
    aadhar: '6789-0123-4567',
    joinDate: '2024-04-05',
    address: '890 Cedar Court, Kolkata, West Bengal 700001',
    nominee: {
      name: 'Rahul Gupta',
      relation: 'Father'
    },
    status: 'active',
    email: 'anjali.gupta@email.com',
    avatar: '/avatars/anjali.jpg',
    createdAt: '2024-04-05T13:10:00Z',
    updatedAt: '2024-04-05T13:10:00Z'
  },
  {
    id: 'uuid-007',
    name: 'Mahesh Kumar',
    phone: '+91 98765 43216',
    aadhar: '7890-1234-5678',
    joinDate: '2024-03-25',
    address: '234 Birch Road, Chennai, Tamil Nadu 600001',
    nominee: {
      name: 'Lakshmi Kumar',
      relation: 'Wife'
    },
    status: 'active',
    email: 'mahesh.kumar@email.com',
    avatar: '/avatars/mahesh.jpg',
    createdAt: '2024-03-25T10:30:00Z',
    updatedAt: '2024-03-25T10:30:00Z'
  },
  {
    id: 'uuid-008',
    name: 'Kavita Devi',
    phone: '+91 98765 43217',
    aadhar: '8901-2345-6789',
    joinDate: '2024-05-12',
    address: '678 Spruce Avenue, Hyderabad, Telangana 500001',
    nominee: {
      name: 'Ramesh Devi',
      relation: 'Brother'
    },
    status: 'active',
    email: 'kavita.devi@email.com',
    avatar: '/avatars/kavita.jpg',
    createdAt: '2024-05-12T15:45:00Z',
    updatedAt: '2024-05-12T15:45:00Z'
  }
]

// Calculate member statistics
export const getMemberStats = (members: Member[]): MemberStats => {
  const totalMembers = members.length
  const activeMembers = members.filter(member => member.status === 'active').length
  const inactiveMembers = members.filter(member => member.status === 'inactive').length
  
  // Calculate new members this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const newMembersThisMonth = members.filter(member => {
    const joinDate = new Date(member.joinDate)
    return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear
  }).length
  
  // Mock calculations for deposits and loans (will be replaced with actual data from other modules)
  const totalDeposits = members.reduce((sum, member) => sum + (Math.random() * 50000 + 10000), 0)
  const totalLoans = members.reduce((sum, member) => sum + (Math.random() * 30000 + 5000), 0)

  return {
    totalMembers,
    activeMembers,
    inactiveMembers,
    newMembersThisMonth,
    totalDeposits: Math.round(totalDeposits),
    totalLoans: Math.round(totalLoans)
  }
}

// Get active members for dropdown
export const getActiveMembers = (members: Member[]) => {
  return members.filter(member => member.status === 'active')
}

// Get member by ID
export const getMemberById = (members: Member[], id: string) => {
  return members.find(member => member.id === id)
}

// Check if phone number is unique
export const isPhoneUnique = (phone: string, members: Member[], excludeId?: string) => {
  return !members.some(member => 
    member.phone === phone && member.id !== excludeId
  )
}

// Check if Aadhar number is unique
export const isAadharUnique = (aadhar: string, members: Member[], excludeId?: string) => {
  return !members.some(member => 
    member.aadhar === aadhar && member.id !== excludeId
  )
}

// Generate UUID for new members
export const generateMemberId = () => {
  return 'uuid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

// Validate member form
export const validateMemberForm = (member: Partial<Member>, isEdit: boolean = false) => {
  const errors: string[] = []

  if (!member.name || member.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }

  if (!member.phone || member.phone.trim().length < 10) {
    errors.push('Valid phone number is required')
  }

  if (!member.aadhar || member.aadhar.trim().length < 12) {
    errors.push('Valid Aadhar number is required')
  }

  if (!member.joinDate) {
    errors.push('Join date is required')
  }

  if (!member.address || member.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long')
  }

  if (!member.nominee?.name || member.nominee.name.trim().length < 2) {
    errors.push('Nominee name is required')
  }

  if (!member.nominee?.relation || member.nominee.relation.trim().length < 2) {
    errors.push('Nominee relation is required')
  }

  if (!member.status || !['active', 'inactive'].includes(member.status)) {
    errors.push('Valid status is required')
  }

  return errors
}

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format currency for display
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Status color mapping
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

export default membersData