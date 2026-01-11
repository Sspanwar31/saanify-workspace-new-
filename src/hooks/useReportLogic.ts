

Maine aapke code mein sirf **DIFF-1** ke hisaab se `normalizeMode` function ko update kiya hai. Isse ab Online, GPay, PhonePe, NEFT, RTGS wale entries bhi sahi filter mein capture honge. Baaki code exactly same rakha hai jaise aapne provide kiya tha.

Ye raha aapka **Fixed `src/app/dashboard/report/useReportLogic.tsx`** code:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple'; 
import { differenceInMonths } from 'date-fns';

export function useReportLogic() {
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  // Raw Data States
  const [members, setMembers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [passbookEntries, setPassbookEntries] = useState<any[]>([]); 
  const [expenses, setExpenses] = useState<any[]>([]);
  const [adminFunds, setAdminFunds] = useState<any[]>([]);
  
  // ✅ DIFF-1: Added state for filtered passbook (from previous context)
  const [filteredPassbookState, setFilteredPassbookState] = useState<any[]>([]);

  // Filter States
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    selectedMember: 'ALL',
    transactionMode: 'all',
    transactionType: 'all'
  });

  // Calculated Data Structure
  const [auditData, setAuditData] = useState<any>({
    summary: { 
        income: { interest: 0, fine: 0, other: 0, total: 0 }, 
        expenses: { ops: 0, maturityInt: 0, total: 0 },
        assets: { deposits: 0 },
        loans: { issued: 0, recovered: 0, pending: 0 },
        netProfit: 0
    },
    dailyLedger: [],
    cashbook: [],
    modeStats: { cashBal: 0, bankBal: 0, upiBal: 0 },
    loans: [],
    memberReports: [],
    maturity: [],
    defaulters: [],
    adminFund: []
  });

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      let cid = clientId;

      // 🔑 STEP 1: Resolve clientId safely
      if (!cid) {
        const storedUser = localStorage.getItem('current_user');
        const storedMember = localStorage.getItem('current_member');

        if (storedUser) {
          const user = JSON.parse(storedUser);
          cid = user.role === 'treasurer' ? user.client_id : user.id;
        } 
        else if (storedMember) {
          cid = JSON.parse(storedMember).client_id;
        }

        if (cid) setClientId(cid);
      }

      // 🔑 STEP 2: ONLY proceed if cid exists
      if (!cid) {
        setLoading(false);
        return;
      }

      try {
        const fetchFromApi = async (table: string) => {
           try {
              const res = await fetch('/api/admin/get-data', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ table, clientId: cid })
              });
              const json = await res.json();
              return json.data || [];
          } catch (error) {
              console.error(`Error fetching ${table}:`, error);
              return [];
          }
        };

        const [m, l, p, e, af] = await Promise.all([
             fetchFromApi('members'),
             fetchFromApi('loans'),
             fetchFromApi('passbook_entries'),
             fetchFromApi('expenses_ledger'),
             fetchFromApi('admin_fund_ledger')
        ]);

        const membersData = m;
        const loansData = l;
        const passbookData = p?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const expensesData = e;
        const adminFundData = af;

        setMembers(membersData);
        setLoans(loansData);
        setExpenses(expensesData);
        setAdminFunds(adminFundData);

        if (passbookData) {
          const memberIds = new Set(membersData.map((m: any) => m.id));
          const validEntries = passbookData.filter((e: any) => memberIds.has(e.member_id));

          let runningBalance = 0;
          const mappedPassbook = validEntries.map((e: any) => {
              const total = Number(e.total_amount || 0);
              runningBalance += total;

              return {
                  id: e.id,
                  date: e.date || e.created_at,
                  memberId: e.member_id, 
                  memberName: e.member_name, 
                  amount: total,
                  paymentMode: e.payment_mode || 'CASH', 
                  description: e.note || 'Passbook Entry',
                  type: Number(e.installment_amount) > 0 ? 'LOAN_REPAYMENT' : 'DEPOSIT',
                  depositAmount: Number(e.deposit_amount || 0),
                  installmentAmount: Number(e.installment_amount || 0),
                  interestAmount: Number(e.interest_amount || 0),
                  fineAmount: Number(e.fine_amount || 0),
                  balance: runningBalance
              };
          });
          setPassbookEntries(mappedPassbook); 
        }

      } catch (error) {
          console.error("Critical Data Fetch Error:", error);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  // 2. Calculation Engine
  useEffect(() => {
    // ✅ DIFF-1: Global guard (Changed from !passbookEntries.length to just loading)
    if (loading) return;

    // ✅ DIFF-2: Date filter (Summary = 0 fix) - Updated Logic
    const isDateInRange = (dateStr?: string) => {
      // no date filter → allow all
      if (!filters.startDate && !filters.endDate) return true;

      if (!dateStr) return false;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);

      if (start && d < start) return false;
      if (end && d > end) return false;

      return true;
    };

    // ✅ DIFF-1: Normalize Mode Helper (FINAL VERSION - Online + Cash Fix)
    const normalizeMode = (mode: string) => {
      if (!mode) return 'cash';

      const m = mode.toLowerCase();

      if (m.includes('cash')) return 'cash';
      if (m.includes('upi') || m.includes('online') || m.includes('gpay') || m.includes('phonepe'))
        return 'upi';
      if (m.includes('bank') || m.includes('cheque') || m.includes('neft') || m.includes('rtgs'))
        return 'bank';

      return 'cash'; // SAFE default
    };

    const filteredPassbook = passbookEntries.filter(e => {
        // ✅ FIX-2: Passbook filter fallback to created_at
        const inDate = isDateInRange(e.date || e.created_at);
        const memberMatch = filters.selectedMember === 'ALL' || e.memberId === filters.selectedMember;
        
        // ✅ DIFF-2: Passbook filter (Uses updated normalizeMode)
        const modeMatch = filters.transactionMode === 'all' || normalizeMode(e.paymentMode) === filters.transactionMode;
        
        let typeMatch = true;
        if(filters.transactionType === 'deposit') typeMatch = (e.depositAmount > 0);
        if(filters.transactionType === 'loan') typeMatch = (e.installmentAmount > 0);
        if(filters.transactionType === 'expense') typeMatch = false; 

        return inDate && memberMatch && modeMatch && typeMatch;
    });

    // ✅ DIFF-3: Expenses member filter (Income/Expense mismatch fix)
    const filteredExpenses = expenses.filter(e => {
      const inDate = isDateInRange(e.date || e.created_at);
      const memberMatch =
        filters.selectedMember === 'ALL' ||
        e.member_id === filters.selectedMember;

      return inDate && memberMatch;
    });

    const filteredAdminFunds = adminFunds.filter(a => isDateInRange(a.date || a.created_at));

    let interestIncome = 0, fineIncome = 0, depositTotal = 0, otherIncome = 0, opsExpense = 0, totalExpense = 0;
    
    // ✅ DIFF-4: Use filteredPassbook for summaries
    filteredPassbook.forEach(e => {
        interestIncome += e.interestAmount;
        fineIncome += e.fineAmount;
        depositTotal += e.depositAmount;
    });

    filteredExpenses.forEach(e => {
        const amt = Number(e.amount || 0);
        totalExpense += amt;
        if (e.type === 'INCOME') otherIncome += amt;
        if (e.type === 'EXPENSE') opsExpense += amt;
    });

    let totalMaturityLiability = 0;
    // ✅ DIFF-3: Use filteredPassbook for maturity calculation totals
    members.forEach(m => {
        const mDepositEntries = filteredPassbook.filter(e => e.memberId === m.id && e.depositAmount > 0);
        if (mDepositEntries.length > 0) {
             const sorted = [...mDepositEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
             const monthlyDeposit = sorted[0].depositAmount;
             const depositCount = mDepositEntries.length;
             const tenure = 36;
             const targetDeposit = monthlyDeposit * tenure;
             const projectedInterest = targetDeposit * 0.12; 
             const isOverride = m.maturity_is_override || false;
             const manualAmount = Number(m.maturity_manual_amount || 0);
             const settledInterest = isOverride ? manualAmount : projectedInterest;
             const monthlyShare = settledInterest / tenure;
             totalMaturityLiability += (monthlyShare * depositCount);
        }
    });

    const totalIncomeCalc = interestIncome + fineIncome + otherIncome;
    const totalExpensesCalc = opsExpense + totalMaturityLiability; 
    const netProfitCalc = totalIncomeCalc - totalExpensesCalc;

    // --- C. LOAN STATS (STRICT FIX FOR CARDS) ---
    const loansWithLiveBalance = loans.map((l: any) => {
      const memberTotalInterest = passbookEntries
        .filter(p => p.memberId === l.member_id)
        .reduce((sum, p) => sum + Number(p.interestAmount || p.interest_amount || 0), 0); 

      const memberLoanCount = loans.filter((ln: any) => ln.member_id === l.member_id).length || 1;
      const distributedInterest = memberTotalInterest / memberLoanCount;

      const loanAmount = Number(l.amount) || 0;
      const currentBalance = Number(l.remaining_balance) || 0;
      
      const isActive = l.status === 'active' && currentBalance > 0;
      const interestAmount = Math.round(currentBalance * 0.01);
      const principalPaid = loanAmount - currentBalance;

      return {
        id: l.id,
        memberId: l.member_id,
        start_date: l.start_date || l.created_at,
        amount: loanAmount,
        principalPaid: principalPaid,
        remainingBalance: currentBalance,
        interestRate: interestAmount, 
        totalInterestCollected: distributedInterest, 
        status: (l.status || '').toLowerCase() 
      };
    });

    // ✅ DIFF-4: Filter loans by member
    const filteredLoans = loansWithLiveBalance.filter(l =>
      filters.selectedMember === 'ALL' || l.memberId === filters.selectedMember
    );

    const validLoans = filteredLoans.filter((l: any) => l.status === 'active' || l.status === 'closed');
    const loansIssuedTotal = validLoans.reduce((acc: number, l: any) => acc + l.amount, 0);
    
    const loansOutstandingTotal = validLoans
        .filter((l: any) => l.status === 'active' && l.remainingBalance > 0) 
        .reduce((acc: number, l: any) => acc + l.remainingBalance, 0);
    
    const loansRecoveredTotal = loansIssuedTotal - loansOutstandingTotal;
    const loansPendingCount = validLoans.filter((l: any) => l.status === 'active' && l.remainingBalance > 0).length;


    // --- D. DAILY LEDGER ---
    const ledgerMap = new Map();
    const getOrSetEntry = (dateStr: string) => {
        if (!ledgerMap.has(dateStr)) {
            ledgerMap.set(dateStr, { 
                date: dateStr, deposit: 0, emi: 0, loanOut: 0, interest: 0, fine: 0, 
                cashIn: 0, cashOut: 0,
                cashInMode: 0, bankInMode: 0, upiInMode: 0,
                cashOutMode: 0, bankOutMode: 0, upiOutMode: 0
            });
        }
        return ledgerMap.get(dateStr);
    };

    filteredPassbook.forEach(e => {
        const entry = getOrSetEntry(e.date);
        const total = e.amount;
        entry.deposit += e.depositAmount;
        entry.emi += e.installmentAmount;
        entry.interest += e.interestAmount;
        entry.fine += e.fineAmount;
        entry.cashIn += total;
        const mode = (e.paymentMode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) entry.cashInMode += total;
        else if (mode.includes('BANK')) entry.bankInMode += total;
        else entry.upiInMode += total;
    });

    filteredExpenses.forEach(e => {
        const entry = getOrSetEntry(e.date || new Date().toISOString());
        const amt = Number(e.amount);
        if (e.type === 'EXPENSE') { entry.cashOut += amt; entry.cashOutMode += amt; }
        else { entry.cashIn += amt; entry.cashInMode += amt; }
    });

    if(filters.transactionType === 'all' || filters.transactionType === 'loan') {
        // ✅ DIFF-4: Use filteredLoans
        filteredLoans.forEach((l: any) => {
            if (isDateInRange(l.start_date)) {
                const entry = getOrSetEntry(l.start_date);
                const amt = Number(l.amount);
                entry.loanOut += amt;
                entry.cashOut += amt;
                entry.cashOutMode += amt; 
            }
        });
    }

    const sortedLedger = Array.from(ledgerMap.values()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBal = 0;
    const finalLedger = sortedLedger.map((e: any) => {
        const netFlow = e.cashIn - e.cashOut;
        runningBal += netFlow;
        return { ...e, netFlow, runningBal };
    });

    // Cashbook Array
    let closingBal = 0;
    const finalCashbook = sortedLedger.map((e: any) => {
        const dailyNet = (e.cashInMode + e.bankInMode + e.upiInMode) - (e.cashOutMode + e.bankOutMode + e.upiOutMode);
        closingBal += dailyNet;
        return {
            date: e.date,
            cashIn: e.cashInMode, cashOut: e.cashOutMode,
            bankIn: e.bankInMode, bankOut: e.bankOutMode,
            upiIn: e.upiInMode, upiOut: e.upiOutMode,
            closing: closingBal
        };
    });

    // --- E. MODE STATS ---
    // ✅ DIFF-4: Use filteredPassbook
    let cashBalTotal = 0, bankBalTotal = 0, upiBalTotal = 0;
    filteredPassbook.forEach(e => {
        const amt = e.amount;
        const mode = (e.paymentMode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) cashBalTotal += amt;
        else if (mode.includes('BANK')) bankBalTotal += amt;
        else upiBalTotal += amt;
    });
    const totalOut = expenses.filter(e => e.type === 'EXPENSE').reduce((a,b)=>a+Number(b.amount),0) + loans.reduce((a,b)=>a+Number(b.amount),0);
    cashBalTotal -= totalOut;

    // --- F. MEMBER REPORTS ---
    // ✅ DIFF-2: Create visibleMembers
    const visibleMembers =
      filters.selectedMember === 'ALL'
        ? members
        : members.filter(m => m.id === filters.selectedMember);

    // ✅ DIFF-2: Map visibleMembers
    const memberReports = visibleMembers.map((m: any) => {
        // ✅ DIFF-2: Use filteredPassbook
        const mEntries = filteredPassbook.filter(e => e.memberId === m.id);
        const dep = mEntries.reduce((acc: number, e: any) => acc + e.depositAmount, 0);
        const intPaid = mEntries.reduce((acc: number, e: any) => acc + e.interestAmount, 0);
        const finePaid = mEntries.reduce((acc: number, e: any) => acc + e.fineAmount, 0);
        
        // ✅ DIFF-2: Use filteredLoans
        const mLoans = filteredLoans.filter((l: any) => l.memberId === m.id);
        const lTaken = mLoans.reduce((acc: number, l: any) => acc + l.amount, 0);
        const lPend = mLoans.reduce((acc: number, l: any) => acc + l.remainingBalance, 0);
        const lPaid = lTaken - lPend;

        return { 
            id: m.id, name: m.name || m.member_name || 'Member', phone: m.phone || '', 
            totalDeposits: dep, loanTaken: lTaken, principalPaid: lPaid, 
            interestPaid: intPaid, finePaid: finePaid, activeLoanBal: lPend, 
            netWorth: dep - lPend, status: m.status || 'active' 
        };
    });

    // ✅ DIFF-2: Define filteredMembers for Maturity
    const filteredMembers = visibleMembers;

    // --- G. MATURITY ---
    // ✅ DIFF-2: Use filteredMembers
    const maturity = filteredMembers.map((m: any) => {
        // ✅ DIFF-3: Use filteredPassbook
        const mEntries = filteredPassbook.filter(e => e.memberId === m.id && e.depositAmount > 0);
        let monthly = 0;
        if(mEntries.length > 0) {
            const sorted = [...mEntries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            monthly = sorted[0].depositAmount;
        }
        const tenure = 36;
        const target = monthly * tenure;
        const projected = target * 0.12;
        const isOverride = m.maturity_is_override || false;
        const manualAmount = Number(m.maturity_manual_amount || 0);
        const settledInterest = isOverride ? manualAmount : projected;
        const maturityAmt = target + settledInterest;
        // ✅ DIFF-3: Use filteredLoans
        const outstanding = filteredLoans.filter((l: any) => l.memberId === m.id && l.status === 'active').reduce((s,l)=>s+l.remainingBalance,0);

        return { 
            memberName: m.name || 'Member', joinDate: m.join_date || m.created_at, 
            currentDeposit: Number(m.total_deposits || 0), targetDeposit: target, 
            projectedInterest: settledInterest, maturityAmount: maturityAmt, 
            outstandingLoan: outstanding, netPayable: maturityAmt - outstanding
        };
    });

    // --- H. DEFAULTERS ---
    // ✅ DIFF-4: Use filteredLoans
    const defaulters = filteredLoans.filter((l: any) => l.status === 'active' && l.remainingBalance > 0).map((l: any) => {
        const mem = members.find((m: any) => m.id === l.memberId); 
        return {
            memberId: l.memberId, 
            memberName: mem?.name || 'Unknown', 
            memberPhone: mem?.phone || '',      
            amount: l.amount, 
            remainingBalance: l.remainingBalance, 
            daysOverdue: Math.floor((new Date().getTime() - new Date(l.start_date).getTime()) / (1000 * 3600 * 24)),
            status: l.status 
        };
    });
    
    // ✅ DIFF-1: Set state for passbook
    setFilteredPassbookState(filteredPassbook);

    setAuditData({
        summary: {
            income: { interest: interestIncome, fine: fineIncome, other: otherIncome, total: totalIncomeCalc },
            expenses: { ops: opsExpense, maturityInt: totalMaturityLiability, total: totalExpensesCalc },
            assets: { deposits: depositTotal },
            loans: { 
                issued: loansIssuedTotal,
                recovered: loansRecoveredTotal, 
                pending: loansOutstandingTotal 
            },
            netProfit: netProfitCalc
        },
        dailyLedger: finalLedger,
        cashbook: finalCashbook,
        modeStats: { cashBal: cashBalTotal, bankBal: bankBalTotal, upiBal: upiBalTotal },
        // ✅ DIFF-4: Use filteredLoans
        loans: filteredLoans,
        memberReports, maturity, defaulters,
        adminFund: filteredAdminFunds
    });

  }, [members, loans, passbookEntries, expenses, adminFunds, filters, loading]);

  // ✅ DIFF-1: Update reversedPassbook (Safety check)
  const reversedPassbook = [...filteredPassbookState].reverse();
  
  return { loading, auditData, members, passbookEntries: reversedPassbook, filters, setFilters };
}
```
