'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-simple' // Supabase Connection
import { 
  Plus, 
  HandCoins, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  RefreshCw,
  Download,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input' // Kept imports
import { Label } from '@/components/ui/label' // Kept imports
import { Textarea } from '@/components/ui/textarea' // Kept imports
import PassbookAddEntryModal from '@/components/client/PassbookAddEntryModal'
import LoanRequestModal from '@/components/client/LoanRequestModal'

export default function PassbookPage() {
  // --- States ---
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  
  // Data States (Replaced Store with Local State)
  const [members, setMembers] = useState<any[]>([])
  const [passbook, setPassbook] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Unused Form States (Kept from your original code to avoid breaking changes)
  const [selectedMember, setSelectedMember] = useState('')
  const [entryType, setEntryType] = useState<'deposit' | 'loan' | 'interest' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 10

  // --- 1. Fetch Client & Data on Load ---
  useEffect(() => {
    const initData = async () => {
      // Get Client ID (Admin)
      const { data: clients } = await supabase.from('clients').select('id').limit(1)
      if (clients && clients.length > 0) {
        setClientId(clients[0].id)
      }
    }
    initData()
  }, [])

  useEffect(() => {
    if (clientId) {
      fetchMembers()
      fetchPassbook()
    }
  }, [clientId])

  // --- Fetch Members ---
  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('id, name')
      .eq('client_id', clientId)
    if (data) setMembers(data)
  }

  // --- Fetch Passbook Entries & Calculate Balance ---
  const fetchPassbook = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('passbook_entries')
      .select('*')
      .order('date', { ascending: true }) // Oldest first to calculate balance

    if (data) {
      // Map DB columns to UI expected format & Calculate Running Balance
      let runningBalance = 0
      const mappedEntries = data.map((entry: any) => {
        // Determine Type based on columns
        let type = 'deposit'
        let amount = entry.deposit_amount
        
        if (entry.installment_amount > 0) {
          type = 'loan' // Loan Repayment
          amount = entry.installment_amount
          runningBalance -= parseFloat(amount) // Loan repayment reduces liabilities (logic depends on view)
          // For simple passbook view: Deposit adds to balance, Withdrawal/Loan takes away?
          // Assuming Deposit = +Balance.
        } else if (entry.interest_amount > 0) {
          type = 'interest'
          amount = entry.interest_amount
        } else if (entry.fine_amount > 0) {
            type = 'interest' // Group fine with interest
            amount = entry.fine_amount
        }
        
        // Simple Balance Logic: Add everything to balance for now (You can adjust this)
        runningBalance += parseFloat(entry.total_amount || 0)

        return {
          id: entry.id,
          memberId: entry.member_id,
          date: entry.date,
          type: type, 
          amount: parseFloat(entry.total_amount || 0), // Showing total amount
          description: entry.note || entry.payment_mode || 'Entry',
          balance: runningBalance
        }
      })

      // Sort Newest First for Display
      setPassbook(mappedEntries.reverse())
    }
    setLoading(false)
  }

  // --- Logic: Pagination & Search ---
  const filteredEntries = passbook.filter(entry => 
    getMemberName(entry.memberId).toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage)
  const startIndex = (currentPage - 1) * entriesPerPage
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + entriesPerPage)

  // --- Logic: Add Entry (Connected to Supabase) ---
  const handleAddEntry = async () => {
    // Note: This function is here because it was in your old code.
    // If your Modal handles submission internally, this might not be used, 
    // but I'm updating it just in case.
    if (!selectedMember || !amount) return

    const { error } = await supabase.from('passbook_entries').insert([{
      member_id: selectedMember,
      date: new Date().toISOString().split('T')[0],
      total_amount: parseFloat(amount),
      note: description,
      // Defaulting amounts based on simple UI
      deposit_amount: entryType === 'deposit' ? parseFloat(amount) : 0,
      installment_amount: entryType === 'loan' ? parseFloat(amount) : 0,
      interest_amount: entryType === 'interest' ? parseFloat(amount) : 0,
    }])

    if (!error) {
      fetchPassbook()
      setIsAddEntryOpen(false)
      // Reset form
      setSelectedMember('')
      setAmount('')
      setDescription('')
      setEntryType('deposit')
    }
  }

  // --- Logic: Delete Entry (Connected to Supabase) ---
  const handleDeleteEntry = async (entry: any) => {
    if (confirm(`Are you sure you want to delete this entry?`)) {
      const { error } = await supabase
        .from('passbook_entries')
        .delete()
        .eq('id', entry.id)
      
      if (!error) {
        fetchPassbook() // Refresh list
      } else {
        alert('Error deleting: ' + error.message)
      }
    }
  }

  // Helper: Get Member Name
  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    return member?.name || 'Unknown Member'
  }

  // UI Helpers (Icons/Badges - Kept Exactly Same)
  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'loan': return <HandCoins className="h-4 w-4 text-red-600" />
      case 'interest': return <DollarSign className="h-4 w-4 text-blue-600" />
      case 'withdrawal': return <TrendingDown className="h-4 w-4 text-orange-600" />
      default: return <ArrowUpDown className="h-4 w-4 text-gray-600" />
    }
  }

  const getEntryTypeBadge = (type: string) => {
    const variants = {
      deposit: 'bg-green-100 text-green-800',
      loan: 'bg-red-100 text-red-800',
      interest: 'bg-blue-100 text-blue-800',
      withdrawal: 'bg-orange-100 text-orange-800'
    }
    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  // --- JSX (Sunrise Cooperative Society Theme) ---
  return (
    <div className="p-6 bg-orange-50 min-h-screen font-sans text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-orange-900">Sunrise Cooperative Society</h1>
          <p className="text-sm text-orange-600">Digital Passbook Portal</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm">
          <div className="bg-gray-200 p-2 rounded-full"><User size={20} /></div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-xs text-gray-500">Ledger Keeper</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Entries', val: passbook.length, icon: <Wallet size={20}/> },
          { label: 'Total Deposits', val: `₹${passbook.filter(e => e.type === 'deposit').reduce((a,b)=>a+b.amount,0).toLocaleString()}`, icon: <TrendingUp size={20}/> },
          { label: 'Loan Repayments', val: `₹${passbook.filter(e => e.type === 'loan').reduce((a,b)=>a+b.amount,0).toLocaleString()}`, icon: <HandCoins size={20}/> },
          { label: 'Interest/Fine', val: `₹${passbook.filter(e => e.type === 'interest').reduce((a,b)=>a+b.amount,0).toLocaleString()}`, icon: <DollarSign size={20}/> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.val}</h3>
            </div>
            <div className="text-orange-500 bg-orange-50 p-3 rounded-full">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by member name..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={fetchPassbook} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><RefreshCw size={16}/> Refresh</button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Download size={16}/> Export</button>
          <button onClick={() => setIsAddEntryOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"><Plus size={16}/> Add Entry</button>
          <button onClick={() => setIsLoanModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"><HandCoins size={16}/> Request Loan</button>
        </div>
      </div>

      {/* Passbook Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b font-semibold text-lg text-gray-800">Passbook Entries</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Member</th>
                <th className="p-4">Type</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-green-600">Deposit</th>
                <th className="p-4 text-blue-600">Installment</th>
                <th className="p-4 text-red-500">Interest/Fine</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">Loading entries...</td>
                </tr>
              ) : paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">No transactions found</td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {getMemberName(entry.memberId).charAt(0)}
                        </span>
                      </div>
                      {getMemberName(entry.memberId)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getEntryTypeIcon(entry.type)}
                      {getEntryTypeBadge(entry.type)}
                    </div>
                  </td>
                  <td className="p-4 max-w-xs truncate">{entry.description}</td>
                  <td className="p-4 font-semibold text-green-600">
                    {entry.type === 'deposit' ? `₹${entry.amount.toLocaleString()}` : '₹0'}
                  </td>
                  <td className="p-4 font-semibold text-blue-600">
                    {entry.type === 'loan' ? `₹${entry.amount.toLocaleString()}` : '₹0'}
                  </td>
                  <td className="p-4 text-red-500">
                    {entry.type === 'interest' ? `₹${entry.amount.toLocaleString()}` : '₹0'}
                  </td>
                  <td className="p-4 text-right font-bold">₹{entry.amount.toLocaleString()}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button className="p-1 hover:text-blue-500"><Edit size={16}/></button>
                    <button className="p-1 hover:text-red-500" onClick={() => handleDeleteEntry(entry)}><Trash2 size={16}/></button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredEntries.length)} of {filteredEntries.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Rich UI Modals */}
      <PassbookAddEntryModal 
        isOpen={isAddEntryOpen} 
        onClose={() => {
            setIsAddEntryOpen(false)
            fetchPassbook() // Refresh table on close
        }} 
      />
      
      <LoanRequestModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
      />
    </div>
  )
}