import { db } from '@/lib/db'
import { TransactionService } from './transaction.service'

export interface MaturityCalculation {
  memberId: string
  totalDeposit: number
  totalInterest: number
  pendingLoan: number
  netPayable: number
  monthsCompleted: number
  maturityDate: Date
  status: string
}

export interface MaturityResult {
  success: boolean
  data?: MaturityCalculation
  error?: string
  message?: string
}

export interface CreateMaturityRecordResult {
  success: boolean
  data?: any
  error?: string
  message?: string
}

/**
 * Maturity Service - Handles maturity calculations and record management
 * Auto-calculates interest and manages maturity timelines
 */
export class MaturityService {
  private static readonly DEFAULT_MATURITY_MONTHS = 36 // 3 years
  private static readonly MONTHLY_INTEREST_RATE = 0.0333333333 // ~1% annual rate

  /**
   * Calculates maturity for a member
   * Formula: NetPayable = (TotalDeposit + TotalInterest) - PendingLoan
   */
  static async calculateMaturity(memberId: string): Promise<MaturityResult> {
    try {
      // Get member details
      const member = await db.member.findUnique({
        where: { id: memberId }
      })

      if (!member) {
        return {
          success: false,
          error: 'Member not found'
        }
      }

      // Get total deposits from passbook
      const totalDeposit = await TransactionService.getTotalDeposits(memberId)

      // Get pending loan balance
      const activeLoans = await db.loan.findMany({
        where: {
          memberId,
          status: 'active'
        }
      })

      const pendingLoan = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0)

      // Calculate months completed since member joined
      const joiningDate = member.joiningDate || member.createdAt
      const currentDate = new Date()
      const monthsCompleted = Math.floor(
        (currentDate.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )

      // Calculate total interest
      const totalInterest = totalDeposit * this.MONTHLY_INTEREST_RATE * monthsCompleted

      // Calculate net payable amount
      const netPayable = (totalDeposit + totalInterest) - pendingLoan

      // Calculate maturity date (joining date + maturity months)
      const maturityDate = new Date(joiningDate)
      maturityDate.setMonth(maturityDate.getMonth() + this.DEFAULT_MATURITY_MONTHS)

      // Determine maturity status
      const isMatured = currentDate >= maturityDate
      const status = isMatured ? 'matured' : 'active'

      const calculation: MaturityCalculation = {
        memberId,
        totalDeposit,
        totalInterest,
        pendingLoan,
        netPayable,
        monthsCompleted,
        maturityDate,
        status
      }

      return {
        success: true,
        data: calculation,
        message: `Maturity calculated successfully. Status: ${status}`
      }

    } catch (error: any) {
      console.error('MaturityService.calculateMaturity error:', error)
      return {
        success: false,
        error: error.message || 'Failed to calculate maturity'
      }
    }
  }

  /**
   * Creates or updates a maturity record for a member
   */
  static async createOrUpdateMaturityRecord(memberId: string, manualOverride = false): Promise<CreateMaturityRecordResult> {
    try {
      // First calculate maturity
      const calculationResult = await this.calculateMaturity(memberId)

      if (!calculationResult.success || !calculationResult.data) {
        return {
          success: false,
          error: calculationResult.error || 'Failed to calculate maturity'
        }
      }

      const calculation = calculationResult.data

      // Check if maturity record already exists
      const existingRecord = await db.maturityRecord.findFirst({
        where: { memberId }
      })

      let maturityRecord

      if (existingRecord) {
        // Update existing record
        maturityRecord = await db.maturityRecord.update({
          where: { id: existingRecord.id },
          data: {
            totalDeposit: calculation.totalDeposit,
            startDate: existingRecord.startDate, // Keep original start date
            maturityDate: calculation.maturityDate,
            monthsCompleted: calculation.monthsCompleted,
            remainingMonths: Math.max(0, this.DEFAULT_MATURITY_MONTHS - calculation.monthsCompleted),
            currentInterest: calculation.totalInterest,
            fullInterest: calculation.totalInterest,
            manualOverride,
            loanAdjustment: calculation.pendingLoan,
            status: calculation.status,
            updatedAt: new Date()
          }
        })
      } else {
        // Create new record
        const joiningDate = await db.member.findUnique({
          where: { id: memberId },
          select: { joiningDate: true, createdAt: true }
        })

        const startDate = joiningDate?.joiningDate || joiningDate?.createdAt || new Date()

        maturityRecord = await db.maturityRecord.create({
          data: {
            memberId,
            totalDeposit: calculation.totalDeposit,
            startDate,
            maturityDate: calculation.maturityDate,
            monthsCompleted: calculation.monthsCompleted,
            remainingMonths: Math.max(0, this.DEFAULT_MATURITY_MONTHS - calculation.monthsCompleted),
            monthlyInterestRate: this.MONTHLY_INTEREST_RATE,
            currentInterest: calculation.totalInterest,
            fullInterest: calculation.totalInterest,
            manualOverride,
            loanAdjustment: calculation.pendingLoan,
            status: calculation.status
          }
        })
      }

      return {
        success: true,
        data: maturityRecord,
        message: 'Maturity record updated successfully'
      }

    } catch (error: any) {
      console.error('MaturityService.createOrUpdateMaturityRecord error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create/update maturity record'
      }
    }
  }

  /**
   * Get maturity record for a member
   */
  static async getMaturityRecord(memberId: string): Promise<any> {
    try {
      const record = await db.maturityRecord.findFirst({
        where: { memberId },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              joiningDate: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return record
    } catch (error) {
      console.error('MaturityService.getMaturityRecord error:', error)
      return null
    }
  }

  /**
   * Get all matured records (for claims)
   */
  static async getMaturedRecords(): Promise<any[]> {
    try {
      const records = await db.maturityRecord.findMany({
        where: {
          status: 'matured'
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true
            }
          }
        },
        orderBy: {
          maturityDate: 'asc'
        }
      })

      return records
    } catch (error) {
      console.error('MaturityService.getMaturedRecords error:', error)
      return []
    }
  }

  /**
   * Process maturity claim
   */
  static async claimMaturity(recordId: string): Promise<{ success: boolean, error?: string, message?: string }> {
    try {
      const record = await db.maturityRecord.findUnique({
        where: { id: recordId },
        include: {
          member: true
        }
      })

      if (!record) {
        return {
          success: false,
          error: 'Maturity record not found'
        }
      }

      if (record.status !== 'matured') {
        return {
          success: false,
          error: 'Maturity not yet matured'
        }
      }

      if (record.status === 'claimed') {
        return {
          success: false,
          error: 'Maturity already claimed'
        }
      }

      // Calculate net payable amount
      const netPayable = (record.totalDeposit + record.fullInterest) - (record.loanAdjustment || 0)

      // Update record as claimed
      await db.maturityRecord.update({
        where: { id: recordId },
        data: {
          status: 'claimed',
          claimedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Create a passbook entry for the maturity claim
      await TransactionService.createEntry({
        memberId: record.memberId,
        type: 'DEPOSIT',
        amount: netPayable,
        description: `Maturity claim - ${record.member.name}`,
        mode: 'BANK_TRANSFER'
      })

      return {
        success: true,
        message: `Maturity claim of ₹${netPayable.toFixed(2)} processed successfully`
      }

    } catch (error: any) {
      console.error('MaturityService.claimMaturity error:', error)
      return {
        success: false,
        error: error.message || 'Failed to claim maturity'
      }
    }
  }

  /**
   * Get maturity statistics for a member
   */
  static async getMemberMaturityStats(memberId: string): Promise<any> {
    try {
      const calculation = await this.calculateMaturity(memberId)

      if (!calculation.success || !calculation.data) {
        return null
      }

      const record = await this.getMaturityRecord(memberId)

      return {
        calculation: calculation.data,
        record,
        isMatured: calculation.data.status === 'matured',
        canClaim: record?.status === 'matured' && record.status !== 'claimed'
      }

    } catch (error) {
      console.error('MaturityService.getMemberMaturityStats error:', error)
      return null
    }
  }

  /**
   * Update all maturity records (batch job)
   * This should be called periodically (e.g., daily)
   */
  static async updateAllMaturityRecords(): Promise<{ updated: number, errors: number }> {
    try {
      const members = await db.member.findMany({
        where: { status: 'active' }
      })

      let updated = 0
      let errors = 0

      for (const member of members) {
        try {
          await this.createOrUpdateMaturityRecord(member.id)
          updated++
        } catch (error) {
          console.error(`Failed to update maturity for member ${member.id}:`, error)
          errors++
        }
      }

      return { updated, errors }

    } catch (error) {
      console.error('MaturityService.updateAllMaturityRecords error:', error)
      return { updated: 0, errors: 1 }
    }
  }

  /**
   * Get members approaching maturity (within 3 months)
   */
  static async getMembersApproachingMaturity(): Promise<any[]> {
    try {
      const threeMonthsFromNow = new Date()
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

      const records = await db.maturityRecord.findMany({
        where: {
          status: 'active',
          maturityDate: {
            lte: threeMonthsFromNow
          }
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: {
          maturityDate: 'asc'
        }
      })

      return records

    } catch (error) {
      console.error('MaturityService.getMembersApproachingMaturity error:', error)
      return []
    }
  }

  /**
   * Manually adjust maturity interest (admin function)
   */
  static async adjustMaturityInterest(recordId: string, adjustedInterest: number, reason?: string): Promise<boolean> {
    try {
      await db.maturityRecord.update({
        where: { id: recordId },
        data: {
          adjustedInterest,
          currentAdjustment: adjustedInterest,
          manualOverride: true,
          updatedAt: new Date()
        }
      })

      return true

    } catch (error) {
      console.error('MaturityService.adjustMaturityInterest error:', error)
      return false
    }
  }

  /**
   * Get maturity summary for dashboard
   */
  static async getMaturitySummary(): Promise<any> {
    try {
      const totalRecords = await db.maturityRecord.count()
      const maturedRecords = await db.maturityRecord.count({
        where: { status: 'matured' }
      })
      const claimedRecords = await db.maturityRecord.count({
        where: { status: 'claimed' }
      })
      const activeRecords = await db.maturityRecord.count({
        where: { status: 'active' }
      })

      // Get total maturity value
      const records = await db.maturityRecord.findMany({
        select: {
          totalDeposit: true,
          fullInterest: true,
          loanAdjustment: true
        }
      })

      const totalDepositValue = records.reduce((sum, record) => sum + record.totalDeposit, 0)
      const totalInterestValue = records.reduce((sum, record) => sum + record.fullInterest, 0)
      const totalLoanAdjustments = records.reduce((sum, record) => sum + (record.loanAdjustment || 0), 0)
      const totalNetPayable = totalDepositValue + totalInterestValue - totalLoanAdjustments

      return {
        totalRecords,
        maturedRecords,
        claimedRecords,
        activeRecords,
        totalDepositValue,
        totalInterestValue,
        totalLoanAdjustments,
        totalNetPayable
      }

    } catch (error) {
      console.error('MaturityService.getMaturitySummary error:', error)
      return null
    }
  }
}