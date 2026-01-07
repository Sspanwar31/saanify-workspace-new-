'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Standard import
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

  // Filter States
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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
      if (!cid) {
        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
            cid = JSON.parse(storedUser).id;
            setClientId(cid);
        } else {
            const { data: clients } = await supabase.from('clients').select('id').limit(1);
            if (clients && clients.length > 0) {
              cid = clients[0].id;
              setClientId(cid);
            }
        }
      }

      const isAdminView = localStorage.getItem('admin_session') === 'true';

      if (cid) {
        try {
          let membersData, loansData, passbookData, expensesData, adminFundData;

          if (isAdminView) {
             const fetchFromApi = async (table: string) => {
                const res = await fetch('/api/admin/get-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ table, clientId: cid })
                });
                const json = await res.json();
                return json.data || [];
             };

             const [m, l, p, e, af] = await Promise.all([
                 fetchFromApi('members'),
                 fetchFromApi('loans'),
                 fetchFromApi('passbook_entries'),
                 fetchFromApi('expenses_ledger'),
                 fetchFromApi('admin_fund_ledger')
             ]);
             membersData = m; loansData = l; passbookData = p; expensesData = e; adminFundData = af;

          } else {
             const [mRes, lRes, pRes, eRes, afRes] = await Promise.all([
               supabase.from('members').select('*').eq('client_id', cid),
               supabase.from('loans').select('*').eq('client_id', cid),
               supabase.from('passbook_entries').select('*').order('date', { ascending: true }),
               supabase.from('expenses_ledger').select('*').eq('client_id', cid),
               supabase.from('admin_fund_ledger').select('*').eq('client_id', cid).order('date', { ascending: false })
             ]);

             membersData = mRes.data || [];
             loansData = lRes.data || [];
             passbookData = pRes.data || [];
             expensesData = eRes.data || [];
             adminFundData = afRes.data || [];
          }

          setMembers(membersData);
          setLoans(loansData);
          setExpenses(expensesData);
          setAdminFunds(adminFundData);

          if (passbookData) {
            const memberIds = new Set(membersData.map((m: any) => m.id));
            const validEntries = isAdminView ? passbookData : passbookData.filter((e: any) => memberIds.has(e.member_id));

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
            console.error("Data Fetch Error:", error);
        }
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

    const isDateInRange = (dateStr: string) => {
        if(!dateStr) return false;
        const d = new Date(dateStr);
        return d >= start && d <= end;
    };

    const filteredPassbook = passbookEntries.filter(e => {
        const inDate = isDateInRange(e.date);
        const memberMatch = filters.selectedMember === 'ALL' || e.memberId === filters.selectedMember;
        const modeMatch = filters.transactionMode === 'all' || (e.paymentMode || '').toLowerCase() === filters.transactionMode;
        
        let typeMatch = true;
        if(filters.transactionType === 'deposit') typeMatch = (e.depositAmount > 0);
        if(filters.transactionType === 'loan') typeMatch = (e.installmentAmount > 0);
        if(filters.transactionType === 'expense') typeMatch = false; 

        return inDate && memberMatch && modeMatch && typeMatch;
    });

    const filteredExpenses = expenses.filter(e => isDateInRange(e.date || e.created_at));
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

    // --- C. LOAN STATS (FIXED FOR CARDS & TABLE) ---
    const loansWithLiveBalance = loans.map(l => {
      // 1. Calculate Interest Collected (Only Interest)
      const memberTotalInterest = passbookEntries
        .filter(p => p.memberId === l.member_id)
        .reduce((sum, p) => sum + Number(p.interestAmount || p.interest_amount || 0), 0); 

      // 2. Distribute Interest
      const memberLoanCount = loans.filter(ln => ln.member_id === l.member_id).length || 1;
      const distributedInterest = memberTotalInterest / memberLoanCount;

      // 3. Robust Number Parsing
      const loanAmount = Number(l.amount) || 0;
      // ✅ Check for both snake_case (DB) and camelCase (State) to avoid 0 balance error
      const currentBalance = l.remaining_balance !== undefined ? Number(l.remaining_balance) : Number(l.remainingBalance || 0);
      
      const isActive = l.status === 'active' && currentBalance > 0;
      const interestAmount = Math.round(currentBalance * 0.01);
      const principalPaid = loanAmount - currentBalance;

      return {
        id: l.id,
        memberId: l.member_id,
        start_date: l.start_date || l.created_at,
        amount: loanAmount,
        principalPaid: principalPaid,
        remainingBalance: currentBalance, // ✅ Correct Value passed
        interestRate: interestAmount, 
        totalInterestCollected: distributedInterest, 
        status: l.status
      };
    });

    // ✅ Summary Cards Calculation (Using fixed values)
    const loansIssuedTotal = loansWithLiveBalance.reduce((acc, l) => acc + l.amount, 0);
    // "Pending" here refers to "Outstanding Balance Amount" for the card
    const loansOutstandingTotal = loansWithLiveBalance.reduce((acc, l) => acc + l.remainingBalance, 0);
    // "Recovered" = Issued - Outstanding
    const loansRecoveredTotal = loansIssuedTotal - loansOutstandingTotal;
    
    // Count of Active Loans
    const activeLoanCount = loansWithLiveBalance.filter(l => l.status === 'active').length;

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
        loans.forEach(l => {
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
            id: m.id, name: m.name || m.member_name || 'Member', phone: m.phone || '', 
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
        const outstanding = loansWithLiveBalance.filter(l => l.memberId === m.id && l.status === 'active').reduce((s,l)=>s+l.remainingBalance,0);

        return { 
            memberName: m.name || 'Member', joinDate: m.join_date || m.created_at, 
            currentDeposit: Number(m.total_deposits || 0), targetDeposit: target, 
            projectedInterest: settledInterest, maturityAmount: maturityAmt, 
            outstandingLoan: outstanding, netPayable: maturityAmt - outstanding
        };
    });

    // --- H. DEFAULTERS ---
    const defaulters = loansWithLiveBalance.filter(l => l.status === 'active' && l.remainingBalance > 0).map(l => {
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
            loans: { 
                issued: loansIssuedTotal,      // Total Disbursed (Correct)
                recovered: loansRecoveredTotal, // Principal Paid
                pending: loansOutstandingTotal  // ✅ FIX: This is now Outstanding Balance (Amount)
            },
            netProfit: netProfitCalc
        },
        dailyLedger: finalLedger,
        cashbook: finalCashbook,
        modeStats: { cashBal: cashBalTotal, bankBal: bankBalTotal, upiBal: upiBalTotal },
        loans: loansWithLiveBalance,
        memberReports, maturity, defaulters,
        adminFund: filteredAdminFunds
    });

  }, [members, loans, passbookEntries, expenses, adminFunds, filters, loading]);

  const reversedPassbook = [...passbookEntries].reverse();
  return { loading, auditData, members, passbookEntries: reversedPassbook, filters, setFilters };
}
