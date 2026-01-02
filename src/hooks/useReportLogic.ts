import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useReportLogic = () => {
  const [loading, setLoading] = useState(true);
  
  // Raw Data States
  const [passbookEntries, setPassbookEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Filter State
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st
    endDate: new Date().toISOString().split('T')[0], // Today
    selectedMember: 'ALL',
    transactionMode: 'all',
    transactionType: 'all'
  });

  // Output Data Structure
  const [auditData, setAuditData] = useState({
    summary: { 
        income: { interest: 0, fine: 0, other: 0, total: 0 }, 
        expenses: { ops: 0, maturityInt: 0, total: 0 },
        loans: { issued: 0, recovered: 0, pending: 0 },
        assets: { deposits: 0 },
        netProfit: 0
    },
    dailyLedger: [] as any[],
    cashbook: [] as any[],
    modeStats: { cashBal: 0, bankBal: 0, upiBal: 0 },
    memberReports: [] as any[],
    loans: [] as any[],
    maturity: [] as any[],
    defaulters: [] as any[]
  });

  // 1. FETCH DATA FROM SUPABASE (Correct Table Names)
  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem('current_user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      try {
        setLoading(true);

        // A. Passbook (Income) - Table: 'passbook_entries'
        // NOTE: Client ID filter hataya hai kyunki table me column nahi hai
        const { data: pbData } = await supabase
          .from('passbook_entries')
          .select('*');

        // B. Expenses - Table: 'expenses_ledger'
        const { data: expData } = await supabase
          .from('expenses_ledger')
          .select('*')
          .eq('client_id', user.id);

        // C. Loans - Table: 'loans'
        const { data: loanData } = await supabase
          .from('loans')
          .select('*')
          .eq('client_id', user.id);

        // D. Members - Table: 'clients'
        // Hum clients table ko hi members maan rahe hain (Agar members table alag hai to yaha change karein)
        const { data: memData } = await supabase
           .from('clients') 
           .select('*')
           .eq('id', user.id); 

        setPassbookEntries(pbData || []);
        setExpenses(expData || []);
        setLoans(loanData || []);
        setMembers(memData || []);

      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. CALCULATION ENGINE (Full Logic Restored)
  useEffect(() => {
    if (loading) return;

    // --- DATE FILTER LOGIC ---
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59);

    const isDateInRange = (dateStr: string) => {
        if(!dateStr) return false;
        const d = new Date(dateStr);
        return d >= start && d <= end;
    };

    // Filter Raw Data
    const filteredPassbook = passbookEntries.filter(p => isDateInRange(p.date || p.created_at));
    const filteredExpenses = expenses.filter(e => isDateInRange(e.date || e.created_at));
    
    // --- A. SUMMARY CALCULATION ---
    let interestIncome = 0;
    let fineIncome = 0;
    let totalIncome = 0;
    let depositTotal = 0;

    let opsExpense = 0;
    let totalExpense = 0;

    // Calculate Income
    filteredPassbook.forEach(p => {
        const amt = Number(p.total_amount || 0);
        totalIncome += amt;
        interestIncome += Number(p.interest_amount || 0);
        fineIncome += Number(p.fine_amount || 0);
        depositTotal += Number(p.deposit_amount || 0);
    });
    const otherIncome = totalIncome - (interestIncome + fineIncome);

    // Calculate Expense
    filteredExpenses.forEach(e => {
        const amt = Number(e.amount || 0);
        totalExpense += amt;
        if(e.type === 'EXPENSE') opsExpense += amt;
    });

    const netProfit = totalIncome - totalExpense;

    // --- B. LOAN CALCULATIONS (Live Balance) ---
    const loansWithBalance = loans.map(l => {
        // Find installments paid in Passbook for this loan/member
        const installmentsPaid = passbookEntries
            .filter(p => p.member_id === l.member_id && Number(p.installment_amount) > 0)
            .reduce((sum, p) => sum + Number(p.installment_amount), 0);

        const loanAmount = Number(l.amount) || 0;
        const currentBalance = Math.max(0, loanAmount - installmentsPaid);
        const isActive = currentBalance > 0 && l.status === 'active';

        return {
            ...l,
            amount: loanAmount,
            remainingBalance: currentBalance,
            status: isActive ? 'active' : 'closed'
        };
    });

    const loansIssued = loansWithBalance.reduce((acc, l) => acc + l.amount, 0);
    const loansPending = loansWithBalance.filter(l => l.status === 'active').reduce((acc, l) => acc + l.remainingBalance, 0);
    const loansRecovered = loansIssued - loansPending;
    const loansCount = loansWithBalance.filter(l => l.status === 'active').length;


    // --- C. DAILY LEDGER & CASHBOOK (Merging 3 Tables) ---
    const ledgerMap: any = {};
    const cashbookArr: any[] = [];
    
    let cashBal = 0, bankBal = 0, upiBal = 0;

    const allTrans = [
        ...filteredPassbook.map(p => ({ ...p, cat: 'IN', dateObj: new Date(p.date || p.created_at) })),
        ...filteredExpenses.map(e => ({ ...e, cat: 'EXP', dateObj: new Date(e.date || e.created_at) })),
        ...loans.filter(l => isDateInRange(l.created_at)).map(l => ({ ...l, cat: 'LOAN', dateObj: new Date(l.created_at) }))
    ].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let runningBal = 0;
    let cashbookClosing = 0;

    allTrans.forEach(t => {
        const dateKey = t.dateObj.toISOString().split('T')[0];
        
        if (!ledgerMap[dateKey]) {
            ledgerMap[dateKey] = {
                date: t.dateObj, deposit: 0, emi: 0, loanOut: 0, interest: 0, fine: 0,
                cashIn: 0, cashOut: 0, netFlow: 0, runningBal: 0,
                cashInMode: 0, bankInMode: 0, upiInMode: 0, // For Cashbook
                cashOutMode: 0, bankOutMode: 0, upiOutMode: 0
            };
        }

        const mode = (t.payment_mode || t.mode || t.category || '').toLowerCase();
        let amt = 0;
        let isCash = mode.includes('cash');
        let isBank = mode.includes('bank');
        let isUpi = mode.includes('upi');
        // Default to cash if unknown
        if(!isBank && !isUpi) isCash = true;

        if (t.cat === 'IN') {
            // INCOME
            amt = Number(t.total_amount || 0);
            ledgerMap[dateKey].deposit += Number(t.deposit_amount || 0);
            ledgerMap[dateKey].emi += Number(t.installment_amount || 0);
            ledgerMap[dateKey].interest += Number(t.interest_amount || 0);
            ledgerMap[dateKey].fine += Number(t.fine_amount || 0);
            
            if (isCash) { ledgerMap[dateKey].cashInMode += amt; cashBal += amt; }
            else if (isBank) { ledgerMap[dateKey].bankInMode += amt; bankBal += amt; }
            else if (isUpi) { ledgerMap[dateKey].upiInMode += amt; upiBal += amt; }

            ledgerMap[dateKey].cashIn += amt;
            runningBal += amt;
            ledgerMap[dateKey].netFlow += amt;
            cashbookClosing += amt;

        } else if (t.cat === 'EXP') {
            // EXPENSE
            amt = Number(t.amount || 0);
            ledgerMap[dateKey].cashOut += amt;
            
            // Assume Expense is Cash Out unless specified
            if (isCash) { ledgerMap[dateKey].cashOutMode += amt; cashBal -= amt; }
            else if (isBank) { ledgerMap[dateKey].bankOutMode += amt; bankBal -= amt; }
            else if (isUpi) { ledgerMap[dateKey].upiOutMode += amt; upiBal -= amt; }

            runningBal -= amt;
            ledgerMap[dateKey].netFlow -= amt;
            cashbookClosing -= amt;

        } else if (t.cat === 'LOAN') {
            // LOAN OUT
            amt = Number(t.amount || 0);
            ledgerMap[dateKey].loanOut += amt;
            ledgerMap[dateKey].cashOut += amt;
            
            // Loan usually given in Cash/Bank
            if (isCash) { ledgerMap[dateKey].cashOutMode += amt; cashBal -= amt; }
            else { ledgerMap[dateKey].bankOutMode += amt; bankBal -= amt; } // Default bank if not cash

            runningBal -= amt;
            ledgerMap[dateKey].netFlow -= amt;
            cashbookClosing -= amt;
        }

        ledgerMap[dateKey].runningBal = runningBal;
    });

    // Generate Cashbook Array from Ledger Map
    Object.values(ledgerMap).forEach((e: any) => {
        cashbookArr.push({
            date: e.date,
            cashIn: e.cashInMode, cashOut: e.cashOutMode,
            bankIn: e.bankInMode, bankOut: e.bankOutMode,
            upiIn: e.upiInMode, upiOut: e.upiOutMode,
            closing: e.runningBal // Simplified Closing
        });
    });

    // --- D. MEMBER REPORTS ---
    const memberReports = members.map(m => {
        const mEntries = passbookEntries.filter(e => e.member_id === m.id);
        const mLoans = loansWithBalance.filter(l => l.member_id === m.id);
        
        const dep = mEntries.reduce((acc, e) => acc + Number(e.deposit_amount || 0), 0);
        const intPaid = mEntries.reduce((acc, e) => acc + Number(e.interest_amount || 0), 0);
        const finePaid = mEntries.reduce((acc, e) => acc + Number(e.fine_amount || 0), 0);
        
        const lTaken = mLoans.reduce((acc, l) => acc + l.amount, 0);
        const lActiveBal = mLoans.filter(l => l.status === 'active').reduce((acc, l) => acc + l.remainingBalance, 0);
        
        return { 
            id: m.id, 
            name: m.name || m.member_name || 'Member',
            phone: m.phone || '',
            totalDeposits: dep, 
            loanTaken: lTaken, 
            principalPaid: lTaken - lActiveBal, 
            interestPaid: intPaid, 
            finePaid: finePaid, 
            activeLoanBal: lActiveBal, 
            netWorth: dep - lActiveBal, 
            status: m.status || 'active' 
        };
    });

    // --- E. MATURITY PROJECTION ---
    const maturity = members.map(m => {
        // Example Logic (Same as before)
        const mEntries = passbookEntries.filter(e => e.member_id === m.id && Number(e.deposit_amount) > 0);
        let monthly = 0;
        if(mEntries.length > 0) {
            monthly = Number(mEntries[0].deposit_amount || 0);
        }
        
        const tenure = 36; // Example 3 years
        const target = monthly * tenure;
        const projected = target * 0.12; // 12% Interest
        
        // Manual override check (if columns exist)
        const isOverride = m.maturity_is_override || false;
        const manualAmount = Number(m.maturity_manual_amount || 0);
        const settledInterest = isOverride ? manualAmount : projected;
        const maturityAmt = target + settledInterest;
        
        // Find outstanding loan
        const outstanding = loansWithBalance
            .filter(l => l.member_id === m.id && l.status === 'active')
            .reduce((s, l) => s + l.remainingBalance, 0);

        return { 
            memberName: m.name || 'Member', 
            joinDate: m.join_date || m.created_at, 
            currentDeposit: Number(m.total_deposits || 0), // Assuming aggregated column or calculate from passbook
            targetDeposit: target, 
            projectedInterest: settledInterest, 
            maturityAmount: maturityAmt, 
            outstandingLoan: outstanding, 
            netPayable: maturityAmt - outstanding
        };
    });

    // --- F. DEFAULTERS LIST ---
    // Logic: Active loans with overdue (Mock logic for now as 'due_date' missing)
    const defaulters = loansWithBalance
        .filter(l => l.status === 'active' && l.remainingBalance > 0)
        .map(l => {
            const mem = members.find(m => m.id === l.member_id); 
            // Mock overdue check: if loan is older than 30 days
            const daysOpen = Math.floor((new Date().getTime() - new Date(l.created_at).getTime()) / (1000 * 3600 * 24));
            
            return {
                memberId: l.member_id, 
                memberName: mem?.name || 'Unknown', 
                memberPhone: mem?.phone || '',      
                amount: l.amount, 
                remainingBalance: l.remainingBalance, 
                daysOverdue: daysOpen > 30 ? daysOpen : 0, // Example logic
                status: daysOpen > 90 ? 'Critical' : 'Overdue' 
            };
        })
        .filter(d => d.daysOverdue > 0); // Show only if overdue


    // --- FINAL STATE UPDATE ---
    setAuditData({
        summary: {
            income: { interest: interestIncome, fine: fineIncome, other: otherIncome, total: totalIncome },
            expenses: { ops: opsExpense, maturityInt: 0, total: totalExpense },
            loans: { issued: loansIssued, recovered: loansRecovered, pending: loansCount },
            assets: { deposits: depositTotal },
            netProfit: netProfit
        },
        dailyLedger: Object.values(ledgerMap).reverse(),
        cashbook: cashbookArr.reverse(),
        modeStats: { cashBal, bankBal, upiBal },
        loans: loansWithBalance,
        memberReports, 
        maturity, 
        defaulters
    });

  }, [passbookEntries, expenses, loans, members, filters, loading]);

  return {
    loading,
    auditData,
    members,
    passbookEntries,
    filters,
    setFilters
  };
};
