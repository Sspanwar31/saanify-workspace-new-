'use client';

import {
  Wallet,
  CreditCard,
  IndianRupee,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { useClientStore } from '@/lib/client/store';

export default function MemberDashboard() {
  const { currentUser } = useClientStore();

  /**
   * ⚠️ IMPORTANT
   * Yahan jo values use ho rahi hain
   * wo SAME store / props se aayengi
   * jo pehle aa rahi thi.
   *
   * Agar already backend se aa rahi hain
   * to yahan sirf UI use ho raha hai.
   */

  const dashboard = currentUser?.dashboard || {};

  const {
    totalDeposited = 0,
    activeLoanAmount = 0,
    currentInterest = 0,
    totalInstallmentsPaid = 0,
    lastPaymentDate,
    loanActive = false
  } = dashboard;

  return (
    <div className="space-y-6">
      {/* ===== TOP SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deposited */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Total Deposited</p>
            <Wallet className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-lg font-bold mt-1">₹{totalDeposited}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Total amount paid till date
          </p>
        </div>

        {/* Active Loan */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Active Loan</p>
            <CreditCard className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-lg font-bold mt-1">
            ₹{loanActive ? activeLoanAmount : 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {loanActive ? 'Loan running' : 'No active loan'}
          </p>
        </div>

        {/* Current Interest */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Current Interest</p>
            <IndianRupee className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-lg font-bold mt-1">
            ₹{loanActive ? currentInterest : 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {loanActive
              ? 'This month interest'
              : 'No interest (loan inactive)'}
          </p>
        </div>

        {/* Installments Paid */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Installments Paid</p>
            <CalendarCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold mt-1">
            ₹{totalInstallmentsPaid}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Total installment amount
          </p>
        </div>
      </div>

      {/* ===== STATUS SECTION ===== */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Account Status
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {loanActive
                ? 'Your loan is currently active. Please ensure timely installment payments.'
                : 'Your account is in good standing. No active loans.'}
            </p>

            {lastPaymentDate && (
              <p className="text-[11px] text-gray-400 mt-2">
                Last payment on: <span className="font-medium">{lastPaymentDate}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 border">
          <p className="text-sm font-semibold text-orange-800">
            Need a Loan?
          </p>
          <p className="text-xs text-orange-700 mt-1">
            Request a new loan directly from your account.
          </p>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border">
          <p className="text-sm font-semibold text-gray-800">
            View Passbook
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Check deposits, installments & transaction history.
          </p>
        </div>
      </div>
    </div>
  );
}
