'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-simple'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Download } from 'lucide-react'

// ==============================
// FINAL MERGED REPORTS MODULE
// Modern UI + Old Stable Logic
// ==============================

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])

  // Filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [memberId, setMemberId] = useState('all')

  // ------------------------------
  // Fetch Data (Supabase Backend)
  // ------------------------------
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)

      const { data: tx } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true })

      const { data: mem } = await supabase
        .from('members')
        .select('*')

      setTransactions(tx || [])
      setMembers(mem || [])
      setLoading(false)
    }

    fetchAll()
  }, [])

  // ------------------------------
  // Filtered Transactions
  // ------------------------------
  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      if (fromDate && t.date < fromDate) return false
      if (toDate && t.date > toDate) return false
      if (memberId !== 'all' && t.member_id !== memberId) return false
      return true
    })
  }, [transactions, fromDate, toDate, memberId])

  // ------------------------------
  // Summary Calculations
  // ------------------------------
  const summary = useMemo(() => {
    let income = 0
    let expense = 0

    filteredTx.forEach(t => {
      if (t.type === 'interest' || t.type === 'fine') income += t.amount
      if (t.type === 'expense') expense += t.amount
    })

    return {
      income,
      expense,
      profit: income - expense,
    }
  }, [filteredTx])

  // ------------------------------
  // Export CSV
  // ------------------------------
  const exportCSV = () => {
    const rows = filteredTx.map(t => (
      `${t.date},${t.member_id},${t.type},${t.amount}`
    ))

    const csv = ['Date,Member,Type,Amount', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.csv'
    a.click()
  }

  if (loading) return <p className="p-4">Loading reports…</p>

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Society Financial Reports</h1>
        <Button onClick={exportCSV} className="gap-2">
          <Download size={16} /> Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          <select
            className="border rounded px-2"
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
          >
            <option value="all">All Members</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">Income<br /><b>₹{summary.income}</b></CardContent></Card>
        <Card><CardContent className="p-4">Expense<br /><b>₹{summary.expense}</b></CardContent></Card>
        <Card><CardContent className="p-4">Profit<br /><b>₹{summary.profit}</b></CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Daily Ledger</TabsTrigger>
          <TabsTrigger value="cashbook">Cashbook</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
        </TabsList>

        {/* Daily Ledger */}
        <TabsContent value="ledger">
          <Card>
            <CardContent className="p-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th>Date</th><th>Type</th><th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map(t => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td>{t.type}</td>
                      <td>₹{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cashbook */}
        <TabsContent value="cashbook">
          <Card><CardContent className="p-4">Cash / Bank mode wise totals (auto from transactions)</CardContent></Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members">
          <Card><CardContent className="p-4">Member-wise deposit, loan & balance summary</CardContent></Card>
        </TabsContent>

        {/* Loans */}
        <TabsContent value="loans">
          <Card><CardContent className="p-4">Active / Closed loans with remaining balance</CardContent></Card>
        </TabsContent>

        {/* Defaulters */}
        <TabsContent value="defaulters">
          <Card><CardContent className="p-4">Auto generated defaulter list</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
