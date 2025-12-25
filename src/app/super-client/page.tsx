'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, HandCoins, ArrowRight, CheckCircle } from 'lucide-react';
import PassbookAddEntryModal from '@/components/super-client/PassbookAddEntryModal';
import LoanRequestModal from '@/components/super-client/LoanRequestModal';

export default function SuperClientDemo() {
  const [isPassbookModalOpen, setIsPassbookModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Saanify Super Client V2
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Rich UI Modals - Complete Implementation
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/super-client/passbook">
              <Button variant="outline" size="lg">
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Passbook
              </Button>
            </Link>
            <Link href="/super-client/loans">
              <Button variant="outline" size="lg">
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Loans
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Passbook Add Entry Modal Card */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-3xl mb-2">Passbook Entry</CardTitle>
              <p className="text-gray-600 text-lg">Smart Calculator Modal</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Advanced passbook entry system with real-time calculations and rich UI feedback.
                </p>
                
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Split Layout Design</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Auto-Calculations</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Live Preview Cards</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Progress Tracking</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Key Features:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>Interest Calculation:</strong> 1% of outstanding loan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>Fine Calculation:</strong> (day - 15) × 10 if day {'>'} 15</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>Live Balance Updates:</strong> Real-time member info</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>Payment Modes:</strong> Cash, Bank, Cheque, UPI</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => setIsPassbookModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                size="lg"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Open Passbook Entry
              </Button>
            </CardContent>
          </Card>

          {/* Loan Request Modal Card */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-200">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <HandCoins className="w-10 h-10 text-orange-600" />
              </div>
              <CardTitle className="text-3xl mb-2">Loan Request</CardTitle>
              <p className="text-gray-600 text-lg">Flexible Input Modal</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Flexible loan request system with optional amount input and smart member validation.
                </p>
                
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Optional Amount</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Active Loan Warnings</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Member Details Display</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">Admin Approval Flow</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Key Features:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span><strong>Optional Loan Amount:</strong> Admin determines if empty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span><strong>Active Member Filter:</strong> Only active members shown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span><strong>Existing Loan Check:</strong> Warns about active loans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span><strong>Rich Member Info:</strong> Complete member profile</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => setIsLoanModalOpen(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg"
                size="lg"
              >
                <HandCoins className="h-5 w-5 mr-2" />
                Open Loan Request
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Store Integration Overview */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center mb-2">Store Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✓ Complete Sync</h3>
                <p className="text-sm text-green-600">
                  Passbook entries update both ledger and loan balances in real-time
                </p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">✓ Smart State</h3>
                <p className="text-sm text-blue-600">
                  Zustand store with proper state management and persistence
                </p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">✓ Type Safety</h3>
                <p className="text-sm text-purple-600">
                  Full TypeScript support with proper interfaces and types
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center mb-4">✅ Implementation Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-700">
                Both modals have been successfully implemented with all requested features:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Passbook Add Entry Modal</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Split layout (Left: Form, Right: Info)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Auto-calculations (Interest & Fine)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Live member information cards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Real-time balance preview</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Progress tracking for loans</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Loan Request Modal</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Optional loan amount input</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Active member filtering</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Existing loan warnings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Rich member details display</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Admin approval workflow</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <PassbookAddEntryModal 
        isOpen={isPassbookModalOpen} 
        onClose={() => setIsPassbookModalOpen(false)} 
      />
      
      <LoanRequestModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
      />
    </div>
  );
}