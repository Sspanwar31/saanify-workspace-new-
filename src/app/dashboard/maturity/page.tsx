'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { 
  Calculator, 
  Users,
  DollarSign,
  Percent,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

export interface MaturityData {
  memberId: string
  memberName: string
  joinDate: string
  tenure: number
  monthsCompleted: number
  monthlyDeposit: number
  currentDeposit: number
  targetDeposit: number
  projectedInterest: number;
  settledInterest: number;
  isOverride: boolean;
  monthlyInterestShare: number;
  currentAccruedInterest: number;
  maturityAmount: number;
  outstandingLoan: number;
  netPayable: number;
  status: 'active' | 'matured';
}

export default function MaturityPage() {
  const [isMounted, setIsMounted] = useState(false)
  
  const [maturityData, setMaturityData] = useState<MaturityData[]>([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)

  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [tempManualInterest, setTempManualInterest] = useState<string>('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    
    // ✅ FIX #1: Client ID Fetch (MAIN BUG) - Logic Updated Here
    let cid = clientId
    if (!cid) {
      const user = JSON.parse(localStorage.getItem('current_user') || '{}');
      cid = user?.id;
      if (cid) setClientId(cid);
    }

    if (cid) {
        // 1. Fetch Members
        const { data: members } = await supabase
            .from('members')
            .select('*')
            .eq('client_id', cid)
            .order('name', { ascending: true })

        // 2. Fetch ALL Passbook Entries (To calculate First Deposit & Count)
        // ✅ FIX #2: Passbook Filter (silent dropdown bug) - .eq('client_id', cid) Added
        const { data: allEntries } = await supabase
            .from('passbook_entries')
            .select('member_id, deposit_amount, date')
            .eq('client_id', cid)
            .gt('deposit_amount', 0)
            .order('date', { ascending: true }) // Oldest first

        if (members && allEntries) {
            const calculatedData: MaturityData[] = members.map((m: any) => {
                // --- CUSTOM LOGIC START ---
                
                // Filter deposits for this member
                const memberDeposits = allEntries.filter((e: any) => e.member_id === m.id);
                
                // ✅ FIX #3: Safe Fallback for Monthly Deposit
                let monthlyDeposit = 0;
                if (memberDeposits.length > 0) {
                    monthlyDeposit = Number(memberDeposits[0].deposit_amount);
                } else {
                    monthlyDeposit = 0; // explicit, safe
                }

                // 2. Months Completed = Total Count of Deposits
                const monthsCompleted = memberDeposits.length;

                // --- CUSTOM LOGIC END ---

                const currentDeposit = m.total_deposits || 0
                const outstandingLoan = m.outstanding_loan || 0
                const tenure = 36 // Fixed Tenure

                // Calculations
                const targetDeposit = monthlyDeposit * tenure
                const fullProjectedInterest = targetDeposit * 0.12 // 12% Logic

                // Override Logic
                const isOverride = m.maturity_is_override || false
                const manualAmount = m.maturity_manual_amount || 0
                const settledInterest = isOverride ? manualAmount : fullProjectedInterest

                // Accrual Logic
                const monthlyInterestShare = settledInterest / tenure
                const currentAccruedInterest = monthlyInterestShare * monthsCompleted

                // Finals
                const maturityAmount = targetDeposit + settledInterest
                const netPayable = maturityAmount - outstandingLoan // Loan kaat ke paisa
                
                const status = monthsCompleted >= tenure ? 'matured' : 'active'

                return {
                    memberId: m.id,
                    memberName: m.name,
                    joinDate: m.join_date,
                    tenure,
                    monthsCompleted,
                    monthlyDeposit,
                    currentDeposit,
                    targetDeposit,
                    projectedInterest: fullProjectedInterest,
                    settledInterest,
                    isOverride,
                    monthlyInterestShare,
                    currentAccruedInterest,
                    maturityAmount,
                    outstandingLoan,
                    netPayable,
                    status
                }
            })
            setMaturityData(calculatedData)
        }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- Handlers ---
  const handleToggleOverride = async (memberId: string, currentValue: number, isOverride: boolean) => {
    const newOverrideState = !isOverride;
    
    // ✅ SAFE UPDATE: Rewrote to avoid parsing ambiguity
    setMaturityData((prev) => {
        return prev.map((d) => {
            if (d.memberId === memberId) {
                return { ...d, isOverride: newOverrideState };
            }
            return d;
        });
    });

    await supabase.from('members').update({
      maturity_is_override: newOverrideState,
      maturity_manual_amount: newOverrideState ? currentValue : 0 
    }).eq('id', memberId);

    if (newOverrideState) {
      setEditingMember(memberId);
      setTempManualInterest(currentValue.toString());
    } else {
      fetchData();
    }
  }

  const handleSaveManualInterest = async (memberId: string) => {
    const amount = parseFloat(tempManualInterest);
    if (!isNaN(amount) && amount >= 0) {
      setMaturityData(prev => prev.map(d => 
        d.memberId === memberId ? { ...d, settledInterest: amount } : d
      ))
      setEditingMember(null)
      await supabase.from('members').update({ 
          maturity_manual_amount: amount,
          maturity_is_override: true 
      }).eq('id', memberId)
      fetchData()
    }
  }

  // ✅ FIX: Added Semicolons to fix "Parsing failed" error
  const handleCancelEdit = () => {
    setEditingMember(null);
    setTempManualInterest('');
  }

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Maturity Analysis...</p>
        </div>
      </div>
    )
  }

  // Totals
  const totalNetPayable = maturityData.reduce((sum, data) => sum + data.netPayable, 0)
  const totalCurrentDeposit = maturityData.reduce((sum, data) => sum + data.currentDeposit, 0)
  const totalMonthlyInterestLiability = maturityData.reduce((sum, data) => sum + data.monthlyInterestShare, 0)

  return (
    <div className="space-y-6 p-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maturity Module</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive maturity calculations</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Members</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{maturityData.length}</div></CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Current Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">₹{totalCurrentDeposit.toLocaleString()}</div></CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Interest Liability</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-600">₹{totalMonthlyInterestLiability.toFixed(0).toLocaleString()}</div></CardContent>
        </Card>

        <Card className="border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">Net Payable</CardTitle>
            <Calculator className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">₹{totalNetPayable.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Final Maturity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            Final Maturity Table
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="w-full overflow-x-auto border rounded-lg custom-scrollbar pb-4">
            <Table className="min-w-[2600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] bg-gray-100 font-bold border-r-2">Member Name</TableHead>
                  <TableHead className="w-[140px] bg-gray-100 font-bold">Start Date</TableHead>
                  <TableHead className="w-[140px] bg-gray-100 font-bold">Tenure (Paid)</TableHead>
                  <TableHead className="w-[140px] bg-green-100 font-bold border-l-2 border-green-300">Monthly Deposit</TableHead>
                  <TableHead className="w-[140px] bg-green-100 font-bold">Current Deposit</TableHead>
                  <TableHead className="w-[140px] bg-green-100 font-bold">Target Deposit</TableHead>
                  <TableHead className="w-[160px] bg-purple-100 font-bold border-l-2 border-purple-300">Projected Int. (12%)</TableHead>
                  <TableHead className="w-[180px] bg-purple-100 font-bold">Settled Interest</TableHead>
                  <TableHead className="w-[160px] bg-purple-100 font-bold">Monthly Share</TableHead>
                  <TableHead className="w-[160px] bg-purple-100 font-bold">Current Accrued</TableHead>
                  <TableHead className="w-[160px] bg-orange-100 font-bold border-l-2 border-orange-300">Maturity Amount</TableHead>
                  <TableHead className="w-[140px] bg-red-100 font-bold">Outstanding Loan</TableHead>
                  <TableHead className="w-[140px] bg-green-100 font-bold">Net Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maturityData.map((data) => (
                  <TableRow key={data.memberId} className="hover:bg-gray-50 whitespace-nowrap">
                    <TableCell className="border-r-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{data.memberName.charAt(0)}</span>
                        </div>
                        <p className="font-medium text-gray-900">{data.memberName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{data.joinDate ? format(new Date(data.joinDate), 'dd-MMM-yyyy') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-1">
                        <span className="font-bold">{data.monthsCompleted}</span>
                        <span className="mx-1">/</span>
                        <span>{data.tenure}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">₹{data.monthlyDeposit.toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-green-600">₹{data.currentDeposit.toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-green-700">₹{data.targetDeposit.toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-purple-700">₹{data.projectedInterest.toLocaleString()}</TableCell>
                    
                    {/* Toggle Logic */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={data.isOverride} onCheckedChange={() => handleToggleOverride(data.memberId, data.settledInterest, data.isOverride)} />
                        {editingMember === data.memberId ? (
                          <div className="flex gap-1">
                            <Input type="number" value={tempManualInterest} onChange={(e) => setTempManualInterest(e.target.value)} className="h-8 w-20 text-sm" />
                            <Button size="sm" onClick={() => handleSaveManualInterest(data.memberId)} className="h-8 px-2">✓</Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-8 px-2">✕</Button>
                          </div>
                        ) : (
                          <span className={`text-sm ${data.isOverride ? 'text-orange-600' : 'text-gray-500'}`}>
                            ₹{data.settledInterest.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-purple-600">₹{data.monthlyInterestShare.toFixed(0).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-purple-600">₹{data.currentAccruedInterest.toFixed(0).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-orange-600">₹{data.maturityAmount.toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-red-600">₹{data.outstandingLoan.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-green-600">₹{data.netPayable.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fed7aa;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fb923c;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f97316;
        }
      `}</style>
    </div>
  );
}
