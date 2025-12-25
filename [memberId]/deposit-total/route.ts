import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    // Get member's passbook entries
    const memberPassbook = await db.passbookEntry.findMany({
      where: { memberId },
      select: {
        depositAmount: true,
        loanInstallment: true,
        interestAuto: true,
        fineAuto: true,
        mode: true,
        loanRequestId: true,
        transactionDate: true
      },
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate total deposits (excluding loan disbursements)
    const totalDeposits = memberPassbook.reduce((sum, entry) => {
      // Only count actual deposits, not loan disbursements
      // Exclude entries that have loanRequestId (loan-related entries)
      // Exclude entries with mode indicating loan disbursement
      const isLoanRelated = entry.loanRequestId !== null || 
                           entry.mode.toLowerCase().includes('loan') ||
                           entry.mode.toLowerCase().includes('disbursal') ||
                           entry.mode.toLowerCase().includes('approved');
      
      if (!isLoanRelated && entry.depositAmount && entry.depositAmount > 0) {
        return sum + entry.depositAmount;
      }
      return sum;
    }, 0);

    return NextResponse.json({
      success: true,
      memberId,
      totalDeposit: totalDeposits,
      eightyPercentLimit: totalDeposits * 0.8
    });

  } catch (error) {
    console.error('Error fetching member deposit total:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch member deposit total' 
      },
      { status: 500 }
    );
  }
}