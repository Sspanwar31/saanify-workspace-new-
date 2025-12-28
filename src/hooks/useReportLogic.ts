'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-simple';
import { differenceInMonths } from 'date-fns';

export function useReportLogic() {
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  // Raw Data
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
          setPassbookEntries(passbookRes.data.filter(e => memberIds.has(e.member_id)));
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

    // --- A. FILTER RAW DATA ---
    const filteredPassbook = passbookEntries.filter(e => {
        const d = new Date(e.date);
        const dateMatch = d >= start && d <= end;
        const memberMatch = filters.selectedMember === 'ALL' || e.member_id === filters.selectedMember;
        const modeMatch = filters.transactionMode === 'all' || (e.payment_mode || '').toLowerCase() === filters.transactionMode;
        
        let typeMatch = true;
        if(filters.transactionType === 'deposit') typeMatch = (Number(e.deposit_amount) > 0);
        if(filters.transactionType === 'loan') typeMatch = (Number(e.installment_amount) > 0);
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

    // --- B. SUMMARY LOGIC ---
    let interestIncome = 0, fineIncome = 0, depositTotal = 0, otherIncome = 0, opsExpense = 0;
    
    filteredPassbook.forEach(e => {
        interestIncome += Number(e.interest_amount || 0);
        fineIncome += Number(e.fine_amount || 0);
        depositTotal += Number(e.deposit_amount || 0);
    });

    filteredExpenses.forEach(e => {
        if (e.type === 'INCOME') otherIncome += Number(e.amount);
        if (e.type === 'EXPENSE') opsExpense += Number(e.amount);
    });

    // ✅ FIXED LOGIC: Maturity Liability based on DEPOSIT COUNT
    let totalMaturityLiability = 0;

    members.forEach(m => {
        // 1. Get ONLY Deposit Entries for this member (sorted by date)
        const mDepositEntries = passbookEntries
            .filter(e => e.member_id === m.id && Number(e.deposit_amount) > 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Agar member ne kam se kam ek baar deposit kiya hai
        if (mDepositEntries.length > 0) {
             // First Deposit determines the Monthly Amount
             const monthlyDeposit = Number(mDepositEntries[0].deposit_amount);
             
             // Count how many times deposit was made (This is "Deposit Paid")
             const depositCount = mDepositEntries.length;

             // Logic
             const tenure = 36;
             const targetDeposit = monthlyDeposit * tenure;
             const projectedInterest = targetDeposit * 0.12; // 12%

             // Override Check
             const isOverride = m.maturity_is_override || false;
             const manualAmount = Number(m.maturity_manual_amount || 0);
             const settledInterest = isOverride ? manualAmount : projectedInterest;

             // Monthly Interest Share (Per month liability)
             const monthlyInterestShare = settledInterest / tenure;

             // Liability = Share * Number of times Deposited
             const currentAccrued = monthlyInterestShare * depositCount;

             // Add to Total Liability
             totalMaturityLiability += currentAccrued;
        }
    });

    // Final Totals
    const totalIncomeCalc = interestIncome + fineIncome + otherIncome;
    const totalExpensesCalc = opsExpense + totalMaturityLiability; // ✅ Correct Maturity Logic Added
    const netProfitCalc = totalIncomeCalc - totalExpensesCalc;

    // --- C. LOAN STATS ---
    const loansIssuedTotal = loans.reduce((acc, l) => acc + Number(l.amount || 0), 0);
    const loansPendingTotal = loans.reduce((acc, l) => acc + Number(l.remaining_balance || 0), 0);
    const loansRecoveredTotal = loansIssuedTotal - loansPendingTotal;

    // --- D. DAILY LEDGER & CASHBOOK ---
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

    // Process Passbook
    filteredPassbook.forEach(e => {
        const entry = getOrSetEntry(e.date);
        const total = Number(e.total_amount || 0);
        entry.deposit += Number(e.deposit_amount || 0);
        entry.emi += Number(e.installment_amount || 0);
        entry.interest += Number(e.interest_amount || 0);
        entry.fine += Number(e.fine_amount || 0);
        entry.cashIn += total;
        const mode = (e.payment_mode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) entry.cashInMode += total;
        else if (mode.includes('BANK')) entry.bankInMode += total;
        else entry.upiInMode += total;
    });

    // Process Expenses
    filteredExpenses.forEach(e => {
        const entry = getOrSetEntry(e.date);
        const amt = Number(e.amount);
        if (e.type === 'EXPENSE') { entry.cashOut += amt; entry.cashOutMode += amt; }
        else { entry.cashIn += amt; entry.cashInMode += amt; }
    });

    // Process Loans
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
        const amt = Number(e.total_amount || 0);
        const mode = (e.payment_mode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) cashBalTotal += amt;
        else if (mode.includes('BANK')) bankBalTotal += amt;
        else upiBalTotal += amt;
    });
    const totalOut = expenses.filter(e => e.type === 'EXPENSE').reduce((a,b)=>a+Number(b.amount),0) + loans.reduce((a,b)=>a+Number(b.amount),0);
    cashBal -= totalOut;

    // --- F. MEMBER REPORTS ---
    const memberReports = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.member_id === m.id);
        const dep = mEntries.reduce((acc, e) => acc + (Number(e.deposit_amount) || 0), 0);
        const intPaid = mEntries.reduce((acc, e) => acc + (Number(e.interest_amount) || 0), 0);
        const finePaid = mEntries.reduce((acc, e) => acc + (Number(e.fine_amount) || 0), 0);
        const mLoans = loans.filter(l => l.member_id === m.id);
        const lTaken = mLoans.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
        const lPend = mLoans.reduce((acc, l) => acc + (Number(l.remaining_balance) || 0), 0);
        return { id: m.id, name: m.name, fatherName: m.phone, totalDeposits: dep, loanTaken: lTaken, principalPaid: lTaken - lPend, interestPaid: intPaid, finePaid: finePaid, activeLoanBal: lPend, netWorth: dep - lPend, status: m.status || 'active' };
    });

    // --- G. MATURITY ---
    const maturity = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.member_id === m.id && Number(e.deposit_amount) > 0);
        let monthly = 0;
        if(mEntries.length > 0) monthly = Number(mEntries[0].deposit_amount);
        const tenure = 36;
        const target = monthly * tenure;
        const projected = target * 0.12;
        const maturityAmt = target + projected;
        const outstanding = Number(m.outstanding_loan || 0);
        
        // Liability Logic for Maturity Tab
        const isOverride = m.maturity_is_override || false;
        const manualAmount = Number(m.maturity_manual_amount || 0);
        const settledInterest = isOverride ? manualAmount : projected;
        const monthlyShare = settledInterest / tenure;
        const currentAccrued = monthlyShare * mEntries.length; // Count based accrual

        return { 
            memberName: m.name, joinDate: m.join_date || m.created_at, 
            currentDeposit: Number(m.total_deposits || 0), targetDeposit: target, 
            projectedInterest: projected, maturityAmount: maturityAmt, 
            outstandingLoan: outstanding, netPayable: maturityAmt - outstanding,
            
            // Added fields for correct UI display in Maturity Tab
            settledInterest, isOverride, monthlyInterestShare: monthlyShare, currentAccruedInterest: currentAccrued
        };
    });

    // --- H. DEFAULTERS ---
    const defaulters = loans.filter(l => l.status === 'active' && Number(l.remaining_balance) > 0).map(l => ({
        memberId: l.member_id, amount: Number(l.amount), remainingBalance: Number(l.remaining_balance), daysOverdue: Math.floor((new Date().getTime() - new Date(l.start_date).getTime()) / (1000 * 3600 * 24))
    }));

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
        loans: loans.map(l => ({ ...l, interestRate: 12, memberId: l.member_id })),
        memberReports, maturity, defaulters
    });

  }, [members, loans, passbookEntries, expenses, filters, loading]);

  return { loading, auditData, members, passbookEntries, filters, setFilters };
}
