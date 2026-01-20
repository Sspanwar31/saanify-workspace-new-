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
  
  const [filteredPassbookState, setFilteredPassbookState] = useState<any[]>([]);

  // Filter States
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    selectedMember: 'ALL',
    transactionMode: 'all',
    transactionNature: 'all'
  });

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
    if (loading) return;

    const isDateInRange = (dateStr?: string) => {
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

    const normalizeMode = (mode: string) => {
      if (!mode) return 'cash';
      const m = mode.toLowerCase();
      if (m.includes('cash')) return 'cash';
      if (m.includes('upi') || m.includes('online') || m.includes('gpay') || m.includes('phonepe')) return 'upi';
      if (m.includes('bank') || m.includes('cheque') || m.includes('neft') || m.includes('rtgs')) return 'bank';
      return 'cash';
    };

    const filteredPassbook = passbookEntries.filter(e => {
        const inDate = isDateInRange(e.date || e.created_at);
        const memberMatch = filters.selectedMember === 'ALL' || e.memberId === filters.selectedMember;
        const modeMatch = filters.transactionMode === 'all' || normalizeMode(e.paymentMode) === filters.transactionMode;
      
        let natureMatch = true;
        if (filters.transactionNature === 'inflow') {
          natureMatch = (e.depositAmount || 0) > 0 || (e.installmentAmount || 0) > 0 || (e.interestAmount || 0) > 0 || (e.fineAmount || 0) > 0;
        }
        if (filters.transactionNature === 'outflow') {
          natureMatch = (e.loanDisbursedAmount || 0) > 0 || (e.expenseAmount || 0) > 0;
        }

        return inDate && memberMatch && modeMatch && natureMatch;
    });

    const filteredExpenses = expenses.filter(e => {
      const inDate = isDateInRange(e.date || e.created_at);
      const memberMatch = filters.selectedMember === 'ALL' || e.member_id === filters.selectedMember;
      return inDate && memberMatch;
    });

    const filteredAdminFunds = adminFunds.filter(a => isDateInRange(a.date || a.created_at));

    let interestIncome = 0, fineIncome = 0, depositTotal = 0, otherIncome = 0, opsExpense = 0, totalExpense = 0;
    
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

    // --- C. LOAN STATS ---
    const loansWithLiveBalance = loans.map((l: any) => {
      const memberTotalInterest = passbookEntries
        .filter(p => p.memberId === l.member_id)
        .reduce((sum, p) => sum + Number(p.interestAmount || p.interest_amount || 0), 0); 

      const memberLoanCount = loans.filter((ln: any) => ln.member_id === l.member_id).length || 1;
      const distributedInterest = memberTotalInterest / memberLoanCount;

      const loanAmount = Number(l.amount) || 0;
      const currentBalance = Number(l.remaining_balance) || 0;
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

    const filteredLoans = loansWithLiveBalance.filter(l =>
      filters.selectedMember === 'ALL' || l.memberId === filters.selectedMember
    );

    const validLoans = filteredLoans.filter((l: any) => l.status === 'active' || l.status === 'closed');
    const loansIssuedTotal = validLoans.reduce((acc: number, l: any) => acc + l.amount, 0);
    
    const loansOutstandingTotal = validLoans
        .filter((l: any) => l.status === 'active' && l.remainingBalance > 0) 
        .reduce((acc: number, l: any) => acc + l.remainingBalance, 0);
    
    // Loan Recovered (Principal Only)
    const loansRecoveredTotal = loansIssuedTotal - loansOutstandingTotal;
    
    // Loan Interest from Loans Table
    const loansInterestFromTable = validLoans.reduce((acc: number, l: any) => acc + (l.totalInterestCollected || 0), 0);

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

    // --- E. MODE STATS (UPDATED & DEBUGGED) ---
    // Formula: (Passbook Deposits+Int+Fine) + AdminNet + MaintIncome + LoanRecovered - LoanIssued - Expenses

    // 1. Passbook Sources
    let passbookCash = 0, passbookBank = 0, passbookUpi = 0;
    filteredPassbook.forEach(e => {
        const amt = (e.depositAmount || 0) + (e.interestAmount || 0) + (e.fineAmount || 0);
        const mode = (e.paymentMode || 'CASH').toUpperCase();
        if (mode.includes('CASH')) passbookCash += amt;
        else if (mode.includes('BANK')) passbookBank += amt;
        else passbookUpi += amt;
    });
    const totalPassbook = passbookCash + passbookBank + passbookUpi;

    // 2. Admin Fund Net
    let adminNet = 0;
    filteredAdminFunds.forEach(af => {
       const amt = Number(af.amount || 0);
       if(af.type === 'INJECT') adminNet += amt;
       else adminNet -= amt;
    });
    
    // 3. Maintenance Income
    const maintenanceIncome = filteredExpenses
       .filter(e => e.type === 'INCOME')
       .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 4. Loan Principal Recovered (User requested addition)
    const recoveredPrincipal = loansRecoveredTotal;
    
    // 5. Loan Interest (User requested addition)
    // Note: Interest is often in passbook. Avoid double counting if it's there.
    // If not in passbook, add 'loansInterestFromTable'.
    // Assuming Passbook tracks Interest too (based on 'interestIncome' variable above),
    // we use passbook interest (interestIncome).
    
    // 6. Expenses
    const operationalExpenses = opsExpense;

    // -------------------------

    // Update Mode Stats specifically for the Cash Balance card to match Admin Fund
    // Assuming most extra liquidity (Admin, Loans) is CASH for now
    const finalCashBal = passbookCash + adminNet + maintenanceIncome + recoveredPrincipal - (loansIssuedTotal + operationalExpenses);
    
    // --- F. MEMBER REPORTS ---
    const visibleMembers = filters.selectedMember === 'ALL' ? members : members.filter(m => m.id === filters.selectedMember);
    const memberReports = visibleMembers.map((m: any) => {
        const mEntries = filteredPassbook.filter(e => e.memberId === m.id);
        const dep = mEntries.reduce((acc: number, e: any) => acc + e.depositAmount, 0);
        const intPaid = mEntries.reduce((acc: number, e: any) => acc + e.interestAmount, 0);
        const finePaid = mEntries.reduce((acc: number, e: any) => acc + e.fineAmount, 0);
        
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

    const filteredMembers = visibleMembers;

    // --- G. MATURITY ---
    const maturity = filteredMembers.map((m: any) => {
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
        const outstanding = filteredLoans.filter((l: any) => l.memberId === m.id && l.status === 'active').reduce((s,l)=>s+l.remainingBalance,0);

        return { 
            memberName: m.name || 'Member', joinDate: m.join_date || m.created_at, 
            currentDeposit: Number(m.total_deposits || 0), targetDeposit: target, 
            projectedInterest: settledInterest, maturityAmount: maturityAmt, 
            outstandingLoan: outstanding, netPayable: maturityAmt - outstanding
        };
    });

    // --- H. DEFAULTERS ---
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
        // Updated modeStats with debugged calculation
        modeStats: { cashBal: finalCashBal, bankBal: passbookBank, upiBal: passbookUpi },
        loans: filteredLoans,
        memberReports, maturity, defaulters,
        adminFund: filteredAdminFunds
    });

  }, [members, loans, passbookEntries, expenses, adminFunds, filters, loading]);

  const reversedPassbook = [...filteredPassbookState].reverse();
  
  return { loading, auditData, members, passbookEntries, reversedPassbook, filters, setFilters };
}
