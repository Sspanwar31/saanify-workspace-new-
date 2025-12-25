export interface PassbookTransaction {
  id: string;
  date: string;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance: number;
  category: string;
  reference: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export const passbookMockData: PassbookTransaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Monthly Maintenance Fee',
    type: 'DEBIT',
    amount: 500,
    balance: 45000,
    category: 'Maintenance',
    reference: 'MNT-2024-001',
    status: 'COMPLETED'
  },
  {
    id: '2',
    date: '2024-01-14',
    description: 'John Doe - Loan Payment',
    type: 'CREDIT',
    amount: 5000,
    balance: 45500,
    category: 'Loan Payment',
    reference: 'LOAN-JD-001',
    status: 'COMPLETED'
  },
  {
    id: '3',
    date: '2024-01-13',
    description: 'Community Event Expenses',
    type: 'DEBIT',
    amount: 2500,
    balance: 40500,
    category: 'Events',
    reference: 'EVENT-2024-001',
    status: 'COMPLETED'
  },
  {
    id: '4',
    date: '2024-01-12',
    description: 'Jane Smith - Membership Fee',
    type: 'CREDIT',
    amount: 1000,
    balance: 43000,
    category: 'Membership',
    reference: 'MEMB-JS-001',
    status: 'COMPLETED'
  },
  {
    id: '5',
    date: '2024-01-11',
    description: 'Electricity Bill Payment',
    type: 'DEBIT',
    amount: 3000,
    balance: 42000,
    category: 'Utilities',
    reference: 'ELEC-2024-001',
    status: 'COMPLETED'
  },
  {
    id: '6',
    date: '2024-01-10',
    description: 'Robert Johnson - Loan Disbursement',
    type: 'DEBIT',
    amount: 10000,
    balance: 45000,
    category: 'Loan',
    reference: 'LOAN-RJ-002',
    status: 'COMPLETED'
  },
  {
    id: '7',
    date: '2024-01-09',
    description: 'Water Bill Payment',
    type: 'DEBIT',
    amount: 1500,
    balance: 55000,
    category: 'Utilities',
    reference: 'WATER-2024-001',
    status: 'COMPLETED'
  },
  {
    id: '8',
    date: '2024-01-08',
    description: 'Sarah Williams - Donation',
    type: 'CREDIT',
    amount: 2500,
    balance: 56500,
    category: 'Donation',
    reference: 'DON-SW-001',
    status: 'COMPLETED'
  },
  {
    id: '9',
    date: '2024-01-07',
    description: 'Security Services',
    type: 'DEBIT',
    amount: 4000,
    balance: 54000,
    category: 'Security',
    reference: 'SEC-2024-001',
    status: 'COMPLETED'
  },
  {
    id: '10',
    date: '2024-01-06',
    description: 'Michael Brown - Parking Fee',
    type: 'CREDIT',
    amount: 500,
    balance: 58000,
    category: 'Parking',
    reference: 'PARK-MB-001',
    status: 'COMPLETED'
  },
  {
    id: '11',
    date: '2024-01-05',
    description: 'Garden Maintenance',
    type: 'DEBIT',
    amount: 2000,
    balance: 57500,
    category: 'Maintenance',
    reference: 'GARDEN-2024-001',
    status: 'COMPLETED'
  },
  {
    id: '12',
    date: '2024-01-04',
    description: 'Emily Davis - Event Registration',
    type: 'CREDIT',
    amount: 750,
    balance: 59500,
    category: 'Events',
    reference: 'EVENT-REG-001',
    status: 'COMPLETED'
  }
];

export const categories = [
  'All',
  'Maintenance',
  'Loan Payment',
  'Events',
  'Membership',
  'Utilities',
  'Donation',
  'Security',
  'Parking'
];

export const transactionTypes = [
  { value: 'all', label: 'All Transactions' },
  { value: 'credit', label: 'Credit Only' },
  { value: 'debit', label: 'Debit Only' }
];