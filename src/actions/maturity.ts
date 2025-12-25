'use server'

import { db } from '@/lib/db'

// Helper function to calculate status based on dates
function calculateStatus(maturityDate: Date, currentStatus: string): 'active' | 'matured' | 'claimed' | 'overdue' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maturity = new Date(maturityDate)
  maturity.setHours(0, 0, 0, 0)

  // If already claimed, keep claimed status
  if (currentStatus === 'claimed') {
    return 'claimed'
  }

  // Calculate status based on dates
  if (today < maturity) {
    return 'active'
  } else if (today.getTime() === maturity.getTime()) {
    return 'matured'
  } else {
    return 'overdue'
  }
}

// Helper function to calculate days remaining
function calculateDaysRemaining(maturityDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maturity = new Date(maturityDate)
  maturity.setHours(0, 0, 0, 0)
  
  const diffTime = maturity.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// Create maturity record action
export async function createMaturityRecord(data: {
  memberId: string
  schemeName: string
  principalAmount: number
  interestRate: number
  startDate: string
}) {
  try {
    const { memberId, schemeName, principalAmount, interestRate, startDate } = data

    // Validate required fields
    if (!memberId || !schemeName || !principalAmount || !interestRate || !startDate) {
      return {
        success: false,
        error: 'Missing required fields: memberId, schemeName, principalAmount, interestRate, startDate'
      }
    }

    // Validate member exists
    const member = await db.member.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return {
        success: false,
        error: 'Member not found'
      }
    }

    // Calculate maturity amount using the specified formula
    const maturityAmount = principalAmount + (principalAmount * interestRate / 100)

    // Calculate maturity date based on scheme duration
    let maturityDate = new Date(startDate)
    
    // Extract duration from scheme name if possible (e.g., "Fixed Deposit - 2 Years")
    const durationMatch = schemeName.match(/(\d+)\s*(year|month|years|months)/i)
    if (durationMatch) {
      const duration = parseInt(durationMatch[1])
      const unit = durationMatch[2].toLowerCase()
      
      if (unit.includes('year')) {
        maturityDate.setFullYear(maturityDate.getFullYear() + duration)
      } else if (unit.includes('month')) {
        maturityDate.setMonth(maturityDate.getMonth() + duration)
      }
    } else {
      // Default to 1 year if no duration found
      maturityDate.setFullYear(maturityDate.getFullYear() + 1)
    }

    // Create maturity record
    const maturityRecord = await db.maturityRecord.create({
      data: {
        memberId,
        schemeName,
        principalAmount: parseFloat(principalAmount.toString()),
        maturityAmount: parseFloat(maturityAmount.toFixed(2)),
        interestRate: parseFloat(interestRate.toString()),
        startDate: new Date(startDate),
        maturityDate,
        status: 'active'
      },
      include: {
        member: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate days remaining
    const daysRemaining = calculateDaysRemaining(maturityDate)

    // Return formatted response matching frontend interface
    const response = {
      id: maturityRecord.id,
      memberName: maturityRecord.member.name,
      schemeName: maturityRecord.schemeName,
      principalAmount: maturityRecord.principalAmount,
      maturityAmount: maturityRecord.maturityAmount,
      interestRate: maturityRecord.interestRate,
      startDate: maturityRecord.startDate.toISOString().split('T')[0],
      maturityDate: maturityRecord.maturityDate.toISOString().split('T')[0],
      status: maturityRecord.status,
      daysRemaining,
      description: `${schemeName} - ${interestRate}% interest`
    }

    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('Error creating maturity record:', error)
    return {
      success: false,
      error: 'Failed to create maturity record'
    }
  }
}

// Get all maturity records action
export async function getMaturityRecords(filters?: {
  status?: string
  search?: string
}) {
  try {
    const { status, search } = filters || {}

    // Build where clause
    let whereClause: any = {}
    
    if (status && status !== 'all') {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        {
          member: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          schemeName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Fetch maturity records with member names
    const maturityRecords = await db.maturityRecord.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    // Transform data to match frontend interface with calculated fields
    const transformedRecords = maturityRecords.map(record => {
      const calculatedStatus = calculateStatus(record.maturityDate, record.status)
      const daysRemaining = calculateDaysRemaining(record.maturityDate)

      return {
        id: record.id,
        memberName: record.member.name,
        schemeName: record.schemeName,
        principalAmount: record.principalAmount,
        maturityAmount: record.maturityAmount,
        interestRate: record.interestRate,
        startDate: record.startDate.toISOString().split('T')[0],
        maturityDate: record.maturityDate.toISOString().split('T')[0],
        status: calculatedStatus,
        daysRemaining,
        description: `${record.schemeName} - ${record.interestRate}% interest`
      }
    })

    return {
      success: true,
      data: transformedRecords
    }
  } catch (error) {
    console.error('Error fetching maturity records:', error)
    return {
      success: false,
      error: 'Failed to fetch maturity records'
    }
  }
}

// Get single maturity record action
export async function getMaturityRecord(id: string) {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Maturity record ID is required'
      }
    }

    // Fetch maturity record with member details
    const maturityRecord = await db.maturityRecord.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            name: true,
            phone: true,
            address: true
          }
        }
      }
    })

    if (!maturityRecord) {
      return {
        success: false,
        error: 'Maturity record not found'
      }
    }

    // Calculate status and days remaining
    const calculatedStatus = calculateStatus(maturityRecord.maturityDate, maturityRecord.status)
    const daysRemaining = calculateDaysRemaining(maturityRecord.maturityDate)

    // Calculate interest breakdown
    const interestEarned = maturityRecord.maturityAmount - maturityRecord.principalAmount

    // Return detailed record with chart-ready format
    const detailedRecord = {
      id: maturityRecord.id,
      memberName: maturityRecord.member.name,
      memberDetails: {
        phone: maturityRecord.member.phone,
        address: maturityRecord.member.address
      },
      schemeName: maturityRecord.schemeName,
      principalAmount: maturityRecord.principalAmount,
      maturityAmount: maturityRecord.maturityAmount,
      interestRate: maturityRecord.interestRate,
      startDate: maturityRecord.startDate.toISOString().split('T')[0],
      maturityDate: maturityRecord.maturityDate.toISOString().split('T')[0],
      status: calculatedStatus,
      daysRemaining,
      description: `${maturityRecord.schemeName} - ${maturityRecord.interestRate}% interest`,
      
      // Principal breakdown for detailed view
      principalBreakdown: {
        principal: maturityRecord.principalAmount,
        interestEarned: parseFloat(interestEarned.toFixed(2)),
        totalMaturity: maturityRecord.maturityAmount
      },

      // Interest calculation details
      interestCalculation: {
        principal: maturityRecord.principalAmount,
        rate: maturityRecord.interestRate,
        formula: `${maturityRecord.principalAmount} + (${maturityRecord.principalAmount} * ${maturityRecord.interestRate} / 100) = ${maturityRecord.maturityAmount}`,
        interestEarned: parseFloat(interestEarned.toFixed(2))
      },

      // Chart-ready data
      chartData: {
        principal: maturityRecord.principalAmount,
        interest: parseFloat(interestEarned.toFixed(2)),
        total: maturityRecord.maturityAmount,
        principalPercentage: parseFloat(((maturityRecord.principalAmount / maturityRecord.maturityAmount) * 100).toFixed(2)),
        interestPercentage: parseFloat(((interestEarned / maturityRecord.maturityAmount) * 100).toFixed(2))
      },

      // Metadata
      createdAt: maturityRecord.createdAt.toISOString().split('T')[0],
      updatedAt: maturityRecord.updatedAt.toISOString().split('T')[0]
    }

    return {
      success: true,
      data: detailedRecord
    }
  } catch (error) {
    console.error('Error fetching maturity record:', error)
    return {
      success: false,
      error: 'Failed to fetch maturity record'
    }
  }
}

// Update maturity record status action
export async function updateMaturityStatus(data: {
  id: string
  status: 'active' | 'matured' | 'claimed' | 'overdue'
}) {
  try {
    const { id, status } = data

    // Validate required fields
    if (!id || !status) {
      return {
        success: false,
        error: 'Missing required fields: id, status'
      }
    }

    // Validate status value
    const validStatuses = ['active', 'matured', 'claimed', 'overdue']
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }
    }

    // Check if maturity record exists
    const existingRecord = await db.maturityRecord.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            name: true
          }
        }
      }
    })

    if (!existingRecord) {
      return {
        success: false,
        error: 'Maturity record not found'
      }
    }

    // Update only the status column
    const updatedRecord = await db.maturityRecord.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        member: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate days remaining for response
    const daysRemaining = calculateDaysRemaining(updatedRecord.maturityDate)

    // Return updated record matching frontend interface
    const response = {
      id: updatedRecord.id,
      memberName: updatedRecord.member.name,
      schemeName: updatedRecord.schemeName,
      principalAmount: updatedRecord.principalAmount,
      maturityAmount: updatedRecord.maturityAmount,
      interestRate: updatedRecord.interestRate,
      startDate: updatedRecord.startDate.toISOString().split('T')[0],
      maturityDate: updatedRecord.maturityDate.toISOString().split('T')[0],
      status: updatedRecord.status,
      daysRemaining,
      description: `${updatedRecord.schemeName} - ${updatedRecord.interestRate}% interest`,
      updatedAt: updatedRecord.updatedAt.toISOString().split('T')[0]
    }

    // Future-proof hooks
    if (status === 'matured') {
      // Placeholder for maturity notification
      console.log(`🔔 FUTURE: Send maturity notification to ${updatedRecord.member.name} for scheme ${updatedRecord.schemeName}`)
      // TODO: Implement email/SMS alert service
    }

    if (status === 'claimed') {
      // Placeholder for claim confirmation
      console.log(`🔔 FUTURE: Send claim confirmation to ${updatedRecord.member.name} for scheme ${updatedRecord.schemeName}`)
      // TODO: Implement claim confirmation notification
      // TODO: Implement claim payment integration
    }

    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('Error updating maturity record status:', error)
    return {
      success: false,
      error: 'Failed to update maturity record status'
    }
  }
}

// Future-proof placeholder functions
export async function sendMaturityNotification(memberId: string, maturityRecordId: string) {
  // Placeholder for Email/SMS alerts
  console.log(`🔔 FUTURE: Send maturity notification - Member: ${memberId}, Record: ${maturityRecordId}`)
  // TODO: Implement email/SMS service integration
  return { success: true, message: 'Notification placeholder called' }
}

export async function exportMaturityData(format: 'pdf' | 'excel') {
  // Placeholder for PDF/Excel export
  console.log(`🔔 FUTURE: Export maturity data as ${format}`)
  // TODO: Implement export service integration
  return { success: true, message: `${format} export placeholder called` }
}

export async function processClaimPayment(maturityRecordId: string, paymentDetails: any) {
  // Placeholder for claim payment integration
  console.log(`🔔 FUTURE: Process claim payment - Record: ${maturityRecordId}`, paymentDetails)
  // TODO: Implement payment gateway integration
  return { success: true, message: 'Claim payment placeholder called' }
}