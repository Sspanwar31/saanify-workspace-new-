// Future-Proof Loans Data for Saanify Society Management Platform
// Ready for Database Integration with UUID member linking
// ENHANCED: Added deposit references and validation

export interface Loan {
  id: string // UUID for future DB integration
  memberId: string // Links to members.id (UUID)
  amount: number
  interest: number // Annual interest rate in %
  duration: number // Duration in months
  emi: number // Calculated EMI amount
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected'
  remainingBalance: number
  startDate: string // yyyy-mm-dd format
  endDate: string // yyyy-mm-dd format
  nextEmiDate: string // yyyy-mm-dd format
  description?: string
  approvedBy?: string
  approvedDate?: string
  createdAt: string
  updatedAt: string
  depositReference?: string // Reference to passbook deposit entry
  memberDepositAmount: number // Total deposit amount for 80% calculation
}

// Enhanced loans data with deposit references and validation
export const loansData: Loan[] = [
  {
    id: 'loan-uuid-001',
    memberId: 'uuid-001',
    amount: 40000,
    interest: 12,
    duration: 12,
    emi: 3553.95,
    status: 'active',
    remainingBalance: 35540,
    startDate: '2024-01-15',
    endDate: '2025-01-15',
    nextEmiDate: '2024-12-15',
    description: 'Personal loan for home renovation',
    approvedBy: 'admin-001',
    approvedDate: '2024-01-14',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-11-15T14:30:00Z',
    depositReference: 'pb-uuid-001',
    memberDepositAmount: 50000
  },
  {
    id: 'loan-uuid-002',
    memberId: 'uuid-002',
    amount: 60000,
    interest: 10,
    duration: 18,
    emi: 3603.42,
    status: 'active',
    remainingBalance: 47255,
    startDate: '2024-03-01',
    endDate: '2025-08-01',
    nextEmiDate: '2024-12-01',
    description: 'Business expansion loan',
    approvedBy: 'admin-001',
    approvedDate: '2024-02-28',
    createdAt: '2024-02-20T09:30:00Z',
    updatedAt: '2024-11-01T16:45:00Z',
    depositReference: 'pb-uuid-004',
    memberDepositAmount: 75000
  },
  {
    id: 'loan-uuid-003',
    memberId: 'uuid-003',
    amount: 25000,
    interest: 15,
    duration: 6,
    emi: 4350.85,
    status: 'completed',
    remainingBalance: 0,
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    nextEmiDate: '',
    description: 'Emergency medical loan',
    approvedBy: 'admin-001',
    approvedDate: '2024-01-14',
    createdAt: '2024-01-10T16:45:00Z',
    updatedAt: '2024-07-15T10:20:00Z',
    depositReference: 'pb-uuid-006',
    memberDepositAmount: 30000
  },
  {
    id: 'loan-uuid-004',
    memberId: 'uuid-005',
    amount: 80000,
    interest: 8,
    duration: 24,
    emi: 3618.18,
    status: 'pending',
    remainingBalance: 86880,
    startDate: '2025-11-30',
    endDate: '2027-11-30',
    nextEmiDate: '2025-12-30',
    description: 'Education loan for higher studies',
    approvedBy: '',
    approvedDate: '',
    createdAt: '2024-11-20T13:15:00Z',
    updatedAt: '2024-11-20T13:15:00Z',
    depositReference: 'pb-deposit-uuid-005',
    memberDepositAmount: 100000
  },
  {
    id: 'loan-uuid-005',
    memberId: 'uuid-006',
    amount: 35000,
    interest: 11,
    duration: 12,
    emi: 3093.36,
    status: 'active',
    remainingBalance: 18500,
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    nextEmiDate: '2024-12-01',
    description: 'Home appliance loan',
    approvedBy: 'admin-001',
    approvedDate: '2024-05-30',
    createdAt: '2024-05-25T15:30:00Z',
    updatedAt: '2024-11-01T09:15:00Z',
    depositReference: 'pb-deposit-uuid-006',
    memberDepositAmount: 43750
  },
  {
    id: 'loan-uuid-006',
    memberId: 'uuid-007',
    amount: 50000,
    interest: 9,
    duration: 15,
    emi: 3536.82,
    status: 'active',
    remainingBalance: 28437,
    startDate: '2024-04-10',
    endDate: '2025-07-10',
    nextEmiDate: '2024-12-10',
    description: 'Agricultural loan',
    approvedBy: 'admin-001',
    approvedDate: '2024-04-08',
    createdAt: '2024-04-05T11:20:00Z',
    updatedAt: '2024-11-10T14:00:00Z',
    depositReference: 'pb-deposit-uuid-007',
    memberDepositAmount: 62500
  }
]

export default loansData