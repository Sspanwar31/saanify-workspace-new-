import { db } from '@/lib/db'
import { TransactionService } from './transaction.service'

export interface LoanRequest {
  memberId: string
  loanAmount: number
  description?: string
  overrideEnabled?: boolean
  nextDueDate?: Date
}

export interface LoanValidationResult {
  approved: boolean
  maxLoanAmount: number
  currentDeposits: number
  existingLoans: any[]
  error?: string
  message?: string
}

export interface CreateLoanResult {
  success: boolean
  data?: any
  error?: string
  message?: string
}

/**
 * Loan Service - Handles loan validation, creation, and management
 * Implements the 80% rule and other business logic
 */
export class LoanService {
  private static readonly LOAN_TO_DEPOSIT_RATIO = 0.80 // 80% of total deposits
  private static readonly DEFAULT_INTEREST_RATE = 1.0 // 1% monthly interest

  /**
   * Validates a loan request based on business rules
   * Main rule: Max Loan = Total Deposits * 80%
   */
  static async validateLoanRequest(memberId: string, requestedAmount: number, override = false): Promise<LoanValidationResult> {
    try {
      // Get member details
      const member = await db.member.findUnique({
        where: { id: memberId }
      })

      if (!member) {
        return {
          approved: false,
          maxLoanAmount: 0,
          currentDeposits: 0,
          existingLoans: [],
          error: 'Member not found'
        }
      }

      // Get total deposits for this member
      const totalDeposits = await TransactionService.getTotalDeposits(memberId)
      
      // Calculate maximum allowed loan amount
      const maxLoanAmount = totalDeposits * this.LOAN_TO_DEPOSIT_RATIO

      // Check for existing active loans
      const existingLoans = await db.loan.findMany({
        where: {
          memberId,
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Business rule validation
      if (!override && requestedAmount > maxLoanAmount) {
        return {
          approved: false,
          maxLoanAmount,
          currentDeposits: totalDeposits,
          existingLoans,
          error: 'Loan amount exceeds maximum allowed',
          message: `Maximum loan amount is ₹${maxLoanAmount.toFixed(2)} (80% of total deposits ₹${totalDeposits.toFixed(2)})`
        }
      }

      // Check if member already has an active loan
      if (existingLoans.length > 0 && !override) {
        return {
          approved: false,
          maxLoanAmount,
          currentDeposits: totalDeposits,
          existingLoans,
          error: 'Member already has an active loan',
          message: 'Please clear existing loans before applying for a new one'
        }
      }

      // Minimum loan amount validation
      const MIN_LOAN_AMOUNT = 1000
      if (requestedAmount < MIN_LOAN_AMOUNT && !override) {
        return {
          approved: false,
          maxLoanAmount,
          currentDeposits: totalDeposits,
          existingLoans,
          error: 'Loan amount below minimum',
          message: `Minimum loan amount is ₹${MIN_LOAN_AMOUNT}`
        }
      }

      return {
        approved: true,
        maxLoanAmount,
        currentDeposits: totalDeposits,
        existingLoans,
        message: override ? 
          `Loan approved with override. Amount: ₹${requestedAmount.toFixed(2)}` :
          `Loan approved. Amount: ₹${requestedAmount.toFixed(2)} (Max: ₹${maxLoanAmount.toFixed(2)})`
      }

    } catch (error: any) {
      console.error('LoanService.validateLoanRequest error:', error)
      return {
        approved: false,
        maxLoanAmount: 0,
        currentDeposits: 0,
        existingLoans: [],
        error: error.message || 'Validation failed'
      }
    }
  }

  /**
   * Creates a new loan after validation
   */
  static async createLoan(request: LoanRequest): Promise<CreateLoanResult> {
    try {
      const { memberId, loanAmount, description, overrideEnabled = false, nextDueDate } = request

      // First validate the loan request
      const validation = await this.validateLoanRequest(memberId, loanAmount, overrideEnabled)

      if (!validation.approved) {
        return {
          success: false,
          error: validation.error,
          message: validation.message
        }
      }

      // Create the loan
      const loanData = {
        memberId,
        loanAmount,
        interestRate: this.DEFAULT_INTEREST_RATE,
        remainingBalance: loanAmount,
        status: 'active',
        overrideEnabled,
        description: description || `Loan of ₹${loanAmount.toFixed(2)}`,
        nextDueDate: nextDueDate || this.calculateNextDueDate(),
        loanDate: new Date()
      }

      const loan = await db.loan.create({
        data: loanData,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })

      return {
        success: true,
        data: loan,
        message: `Loan of ₹${loanAmount.toFixed(2)} created successfully`
      }

    } catch (error: any) {
      console.error('LoanService.createLoan error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create loan',
        message: 'Loan creation failed'
      }
    }
  }

  /**
   * Updates loan balance after payment
   * This is typically called by TransactionService
   */
  static async updateLoanBalance(loanId: string, paymentAmount: number): Promise<boolean> {
    try {
      const loan = await db.loan.findUnique({
        where: { id: loanId }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      // Calculate interest and principal
      const interestAmount = loan.remainingBalance * (this.DEFAULT_INTEREST_RATE / 100)
      const principalAmount = paymentAmount - interestAmount

      if (principalAmount < 0) {
        throw new Error('Payment amount insufficient to cover interest')
      }

      const newRemainingBalance = loan.remainingBalance - principalAmount
      const isLoanClosed = newRemainingBalance <= 0

      await db.loan.update({
        where: { id: loanId },
        data: {
          remainingBalance: Math.max(0, newRemainingBalance),
          status: isLoanClosed ? 'CLOSED' : 'active',
          nextDueDate: isLoanClosed ? new Date() : this.calculateNextDueDate(),
          updatedAt: new Date()
        }
      })

      return true

    } catch (error) {
      console.error('LoanService.updateLoanBalance error:', error)
      return false
    }
  }

  /**
   * Get all loans for a member
   */
  static async getMemberLoans(memberId: string, includeClosed = false): Promise<any[]> {
    try {
      const loans = await db.loan.findMany({
        where: {
          memberId,
          ...(includeClosed ? {} : { status: 'active' })
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          passbookEntries: {
            select: {
              id: true,
              loanInstallment: true,
              interestAuto: true,
              transactionDate: true
            },
            orderBy: {
              transactionDate: 'desc'
            }
          }
        }
      })

      return loans
    } catch (error) {
      console.error('LoanService.getMemberLoans error:', error)
      return []
    }
  }

  /**
   * Get loan details by ID
   */
  static async getLoanById(loanId: string): Promise<any> {
    try {
      const loan = await db.loan.findUnique({
        where: { id: loanId },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true
            }
          },
          passbookEntries: {
            orderBy: {
              transactionDate: 'desc'
            }
          }
        }
      })

      return loan
    } catch (error) {
      console.error('LoanService.getLoanById error:', error)
      return null
    }
  }

  /**
   * Calculate next due date (typically 30 days from now)
   */
  private static calculateNextDueDate(): Date {
    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 30)
    return nextDueDate
  }

  /**
   * Get all active loans (for admin dashboard)
   */
  static async getActiveLoans(): Promise<any[]> {
    try {
      const loans = await db.loan.findMany({
        where: { status: 'active' },
        orderBy: {
          nextDueDate: 'asc'
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })

      return loans
    } catch (error) {
      console.error('LoanService.getActiveLoans error:', error)
      return []
    }
  }

  /**
   * Get overdue loans
   */
  static async getOverdueLoans(): Promise<any[]> {
    try {
      const loans = await db.loan.findMany({
        where: {
          status: 'active',
          nextDueDate: {
            lt: new Date()
          }
        },
        orderBy: {
          nextDueDate: 'asc'
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      })

      return loans
    } catch (error) {
      console.error('LoanService.getOverdueLoans error:', error)
      return []
    }
  }

  /**
   * Close a loan manually (admin function)
   */
  static async closeLoan(loanId: string, reason?: string): Promise<boolean> {
    try {
      await db.loan.update({
        where: { id: loanId },
        data: {
          status: 'CLOSED',
          remainingBalance: 0,
          description: reason || 'Loan closed manually',
          updatedAt: new Date()
        }
      })

      return true
    } catch (error) {
      console.error('LoanService.closeLoan error:', error)
      return false
    }
  }

  /**
   * Get loan statistics for a member
   */
  static async getMemberLoanStats(memberId: string): Promise<any> {
    try {
      const loans = await db.loan.findMany({
        where: { memberId },
        include: {
          passbookEntries: {
            select: {
              loanInstallment: true,
              interestAuto: true,
              transactionDate: true
            }
          }
        }
      })

      const totalLoans = loans.length
      const activeLoans = loans.filter(loan => loan.status === 'active').length
      const closedLoans = loans.filter(loan => loan.status === 'CLOSED').length
      const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0)
      const totalRemainingBalance = loans
        .filter(loan => loan.status === 'active')
        .reduce((sum, loan) => sum + loan.remainingBalance, 0)

      const totalPaid = loans.reduce((sum, loan) => {
        const payments = loan.passbookEntries.reduce((paymentSum, entry) => {
          return paymentSum + (entry.loanInstallment || 0)
        }, 0)
        return sum + payments
      }, 0)

      return {
        totalLoans,
        activeLoans,
        closedLoans,
        totalLoanAmount,
        totalRemainingBalance,
        totalPaid,
        loans
      }

    } catch (error) {
      console.error('LoanService.getMemberLoanStats error:', error)
      return null
    }
  }
}