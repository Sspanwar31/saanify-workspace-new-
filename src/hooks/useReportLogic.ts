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

  // Filter States
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedMember: 'ALL',
    transactionMode: 'all',
    transactionType: 'all'
  });

  // Calculated Data
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
    defaulters: []
  });

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let cid = clientId;
      if (!cid) {
        const { data: clients } = await supabase.from('clients').select('id').limit(1);
        if (clients && clients.length > 0) {
          cid = clients[0].id;
          setClientId(cid);
        }
      }

      if (cid) {
        const [membersRes, loansRes, passbookRes, expenseRes] = await Promise.all([
          supabase.from('members').select('*').eq('client_id', cid),
          supabase.from('loans').select('*').eq('client_id', cid),
          supabase.from('passbook_entries').select('*').order('date', { ascending: true }),
          supabase.from('expenses_ledger').select('*').eq('client_id', cid)
        ]);

        if (membersRes.data) setMembers(membersRes.data);
        if (loansRes.data) setLoans(loansRes.data);
        
        if (passbookRes.data) {
          const memberIds = new Set(membersRes.data?.map(m => m.id));
          const validEntries = passbookRes.data.filter(e => memberIds.has(e.member_id));

          let runningBalance = 0;
          const mappedPassbook = validEntries.map((e: any) => {
            const total = Number(e.total_amount || 0);
            runningBalance += total;

            let type = 'DEPOSIT';
            if (Number(e.installment_amount) > 0) type = 'LOAN_REPAYMENT';
            else if (Number(e.interest_amount) > 0 || Number(e.fine_amount) > 0) type = 'INTEREST/FINE';

            return {
              id: e.id,
              date: e.date,
              memberId: e.member_id, 
              memberName: e.member_name, 
              amount: total,
              paymentMode: e.payment_mode || 'CASH', 
              description: e.note || 'Passbook Entry',
              type: type,
              depositAmount: Number(e.deposit_amount || 0),
              installmentAmount: Number(e.installment_amount || 0),
              interestAmount: Number(e.interest_amount || 0),
              fineAmount: Number(e.fine_amount || 0),
              balance: runningBalance
            };
          });
          setPassbookEntries(mappedPassbook); 
        }

        if (expenseRes.data) setExpenses(expenseRes.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [clientId]);

  // 2. Calculation Engine
  useEffect(() => {
    if (loading || !members.length) return;

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);

    const filteredPassbook = passbookEntries.filter(e => {
        const d = new Date(e.date);
        const dateMatch = d >= start && d <= end;
        const memberMatch = filters.selectedMember === 'ALL' || e.memberId === filters.selectedMember;
        const modeMatch = filters.transactionMode === 'all' || (e.paymentMode || '').toLowerCase() === filters.transactionMode;
        
        let typeMatch = true;
        if(filters.transactionType === 'deposit') typeMatch = (e.depositAmount > 0);
        if(filters.transactionType === 'loan') typeMatch = (e.installmentAmount > 0);
        if(filters.transactionType === 'expense') typeMatch = false; 

        return dateMatch && memberMatch && modeMatch && typeMatch;
    });

    const filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        const dateMatch = d >= start && d <= end;
        let typeMatch = true;
        if(filters.transactionType === 'deposit' || filters.transactionType === 'loan') typeMatch = false;
        return dateMatch && typeMatch;
    });

    let interestIncome = 0, fineIncome = 0, depositTotal = 0, otherIncome = 0, opsExpense = 0;
    
    filteredPassbook.forEach(e => {
        interestIncome += e.interestAmount;
        fineIncome += e.fineAmount;
        depositTotal += e.depositAmount;
    });

    filteredExpenses.forEach(e => {
        if (e.type === 'INCOME') otherIncome += Number(e.amount);
        if (e.type === 'EXPENSE') opsExpense += Number(e.amount);
    });

    let totalMaturityLiability = 0;
    members.forEach(m => {
        const mDepositEntries = passbookEntries.filter(e => e.memberId === m.id && e.depositAmount > 0);
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

   // --- C. LOAN STATS (Live) ---
const loansWithLiveBalance = loans.map(l => {
  // Calculate principal paid from passbook
  const installmentsPaid = passbookEntries
    .filter(
      p => p.memberId === l.member_id && Number(p.installmentAmount) > 0
    )
    .reduce((sum, p) => sum + Number(p.installmentAmount), 0);

  const loanAmount = Number(l.amount) || 0;
  const currentBalance = Math.max(0, loanAmount - installmentsPaid);
  const isActive = currentBalance > 0;

  // ✅ Interest = 1% of CURRENT BALANCE (NUMBER ONLY)
  // 2000 -> 20
  // 4000 -> 40
  const interestAmount = Math.round(currentBalance * 0.01);

  // ✅ Explicit object (NO spread)
  // Ensures DB string interest_rate never leaks
  return {
    id: l.id,
    memberId: l.member_id,
    start_date: l.start_date,
    amount: loanAmount,
    principalPaid: installmentsPaid,
    remainingBalance: currentBalance,
    interestRate: interestAmount, // ✅ PURE NUMBER
    status: isActive ? 'ACTIVE' : 'CLOSED'
  };
});

// Totals (unchanged logic)
const loansIssuedTotal = loansWithLiveBalance.reduce(
  (acc, l) => acc + l.amount,
  0
);

const loansPendingTotal = loansWithLiveBalance.reduce(
  (acc, l) => acc + l.remainingBalance,
  0
);

const loansRecoveredTotal = loansIssuedTotal - loansPendingTotal;

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
        const entry = getOrSetEntry(e.date);
        const amt = Number(e.amount);
        if (e.type === 'EXPENSE') { entry.cashOut += amt; entry.cashOutMode += amt; }
        else { entry.cashIn += amt; entry.cashInMode += amt; }
    });

    if(filters.transactionType === 'all' || filters.transactionType === 'loan') {
        loans.forEach(l => {
            if (l.start_date >= filters.startDate && l.start_date <= filters.endDate) {
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
    let cashBalTotal = 0, bankBalTotal = 0, upiBalTotal = 0;
    passbookEntries.forEach(e => {
        const amt = e.amount;
        const mode = (e.paymentMode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) cashBalTotal += amt;
        else if (mode.includes('BANK')) bankBalTotal += amt;
        else upiBalTotal += amt;
    });
    const totalOut = expenses.filter(e => e.type === 'EXPENSE').reduce((a,b)=>a+Number(b.amount),0) + loans.reduce((a,b)=>a+Number(b.amount),0);
    cashBalTotal -= totalOut;

    // --- F. MEMBER REPORTS ---
    const memberReports = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.memberId === m.id);
        const dep = mEntries.reduce((acc, e) => acc + e.depositAmount, 0);
        const intPaid = mEntries.reduce((acc, e) => acc + e.interestAmount, 0);
        const finePaid = mEntries.reduce((acc, e) => acc + e.fineAmount, 0);
        const mLoans = loansWithLiveBalance.filter(l => l.memberId === m.id);
        const lTaken = mLoans.reduce((acc, l) => acc + l.amount, 0);
        const lPend = mLoans.reduce((acc, l) => acc + l.remainingBalance, 0);
        const lPaid = lTaken - lPend;

        return { 
            id: m.id, name: m.name, fatherName: m.phone, 
            totalDeposits: dep, loanTaken: lTaken, principalPaid: lPaid, 
            interestPaid: intPaid, finePaid: finePaid, activeLoanBal: lPend, 
            netWorth: dep - lPend, status: m.status || 'active' 
        };
    });

    // --- G. MATURITY ---
    const maturity = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.memberId === m.id && e.depositAmount > 0);
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
        const outstanding = Number(m.outstanding_loan || 0);

        return { 
            memberName: m.name, joinDate: m.join_date || m.created_at, 
            currentDeposit: Number(m.total_deposits || 0), targetDeposit: target, 
            projectedInterest: settledInterest, maturityAmount: maturityAmt, 
            outstandingLoan: outstanding, netPayable: maturityAmt - outstanding
        };
    });

    // --- H. DEFAULTERS ---
    const defaulters = loansWithLiveBalance.filter(l => l.status === 'ACTIVE' && l.remainingBalance > 0).map(l => {
        const mem = members.find(m => m.id === l.memberId); 
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

    setAuditData({
        summary: {
            income: { interest: interestIncome, fine: fineIncome, other: otherIncome, total: totalIncomeCalc },
            expenses: { ops: opsExpense, maturityInt: totalMaturityLiability, total: totalExpensesCalc },
            assets: { deposits: depositTotal },
            loans: { issued: loansIssuedTotal, recovered: loansRecoveredTotal, pending: loansPendingTotal },
            netProfit: netProfitCalc
        },
        dailyLedger: finalLedger,
        cashbook: finalCashbook,
        modeStats: { cashBal: cashBalTotal, bankBal: bankBalTotal, upiBal: upiBalTotal },
        loans: loansWithLiveBalance,
        memberReports, maturity, defaulters
    });

  }, [members, loans, passbookEntries, expenses, filters, loading]);

  const reversedPassbook = [...passbookEntries].reverse();
  return { loading, auditData, members, passbookEntries: reversedPassbook, filters, setFilters };
}
