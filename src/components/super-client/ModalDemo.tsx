'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, HandCoins } from 'lucide-react';
import PassbookAddEntryModal from '@/components/super-client/PassbookAddEntryModal';
import LoanRequestModal from '@/components/super-client/LoanRequestModal';

export default function SuperClientModalDemo() {
  const [isPassbookModalOpen, setIsPassbookModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Saanify Super Client V2
          </h1>
          <p className="text-xl text-gray-600">
            Rich UI Modals Demo - Passbook & Loan Management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Passbook Add Entry Modal Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Passbook Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Smart calculator with real-time auto-calculations for deposits, installments, interest, and fines.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Split layout design</div>
                <div>• Live member information</div>
                <div>• Auto-calculated interest & fines</div>
                <div>• Real-time balance preview</div>
                <div>• Progress tracking</div>
              </div>
              <Button 
                onClick={() => setIsPassbookModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Open Passbook Entry
              </Button>
            </CardContent>
          </Card>

          {/* Loan Request Modal Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <HandCoins className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Loan Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Flexible loan request system with optional amount input and smart member validation.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Optional loan amount</div>
                <div>• Active member filtering</div>
                <div>• Existing loan warnings</div>
                <div>• Member details display</div>
                <div>• Admin approval workflow</div>
              </div>
              <Button 
                onClick={() => setIsLoanModalOpen(true)}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                Open Loan Request
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Key Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <h3 className="font-semibold mb-2">Smart Calculations</h3>
                <p className="text-sm text-gray-600">
                  Auto-calculated interest (1% rule) and fines (date-based) with real-time updates
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">✓</span>
                </div>
                <h3 className="font-semibold mb-2">Rich UI Design</h3>
                <p className="text-sm text-gray-600">
                  Split layout with live feedback cards, progress bars, and member information
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">✓</span>
                </div>
                <h3 className="font-semibold mb-2">Store Integration</h3>
                <p className="text-sm text-gray-600">
                  Full Zustand store integration with proper state management and data persistence
                </p>
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