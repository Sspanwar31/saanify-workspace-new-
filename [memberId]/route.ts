import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    const member = await db.member.findUnique({
      where: { id: memberId }
    });
    
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get member's current balance from passbook
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
    
    // Calculate current balance (deposits - installments + interest + fines)
    let currentBalance = 0;
    memberPassbook.forEach(entry => {
      const depositAmt = entry.depositAmount || 0;
      const installmentAmt = entry.loanInstallment || 0;
      const interestAmt = entry.interestAuto || 0;
      const fineAmt = entry.fineAuto || 0;
      
      currentBalance = currentBalance + depositAmt - installmentAmt + interestAmt + fineAmt;
    });

    // Get active loan for the member
    const activeLoan = await db.loan.findFirst({
      where: { 
        memberId,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone || '',
        email: null, // No email field in database
        joinDate: member.joiningDate,
        address: member.address || '',
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      },
      currentBalance,
      totalDeposits,
      activeLoan: activeLoan ? {
        loanId: activeLoan.id,
        outstandingBalance: activeLoan.remainingBalance,
        loanAmount: activeLoan.loanAmount,
        interestRate: activeLoan.interestRate
      } : null
    });

  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;
    const body = await request.json();
    const { name, phone, address, joinDate } = body;

    // Check if member exists
    const existingMember = await db.member.findUnique({
      where: { id: memberId }
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if another member with same phone already exists (if phone is being updated)
    if (phone && phone !== existingMember.phone) {
      const duplicateMember = await db.member.findFirst({
        where: { 
          phone,
          id: { not: memberId } // Exclude current member
        }
      });

      if (duplicateMember) {
        return NextResponse.json(
          { error: 'Another member with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Update member
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address }),
        ...(joinDate && { joiningDate: new Date(joinDate) }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        name: updatedMember.name,
        phone: updatedMember.phone || '',
        email: null, // No email field in database
        joinDate: updatedMember.joiningDate,
        address: updatedMember.address || '',
        createdAt: updatedMember.createdAt,
        updatedAt: updatedMember.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    // Check if member exists
    const existingMember = await db.member.findUnique({
      where: { id: memberId }
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if member has active loans
    const activeLoans = await db.loan.findMany({
      where: { 
        memberId,
        status: 'active'
      }
    });

    if (activeLoans.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete member with active loans' },
        { status: 400 }
      );
    }

    // Delete member's passbook entries first
    await db.passbookEntry.deleteMany({
      where: { memberId }
    });

    // Delete member
    await db.member.delete({
      where: { id: memberId }
    });

    return NextResponse.json({
      message: 'Member deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}