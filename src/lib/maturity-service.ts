import { db } from '@/lib/db';
import { differenceInMonths } from 'date-fns';

/**
 * Auto-generate and update maturity records for all members
 * This function should be called monthly or on demand
 */
export async function generateMaturityRecords() {
  try {
    console.log('Starting maturity records generation...');
    
    // Get all members with their passbook entries
    const members = await db.member.findMany({
      include: {
        passbook: {
          where: {
            depositAmount: {
              not: null
            }
          },
          orderBy: {
            transactionDate: 'asc'
          }
        }
      }
    });

    const currentDate = new Date();
    let processedCount = 0;
    let newRecordsCount = 0;
    let updatedRecordsCount = 0;

    for (const member of members) {
      if (member.passbook.length === 0) {
        continue; // Skip members with no deposits
      }

      // Calculate total deposits
      const totalDeposit = member.passbook.reduce(
        (sum, entry) => sum + (entry.depositAmount || 0), 
        0
      );

      // Get earliest deposit date
      const startDate = member.passbook[0].transactionDate;
      
      // Calculate maturity date (36 months from start date)
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + 36);

      // Calculate months completed
      const monthsCompleted = differenceInMonths(currentDate, startDate);
      const remainingMonths = 36 - monthsCompleted;

      // Calculate interest values
      const monthlyRate = 0.0333333333;
      const currentInterest = totalDeposit * monthlyRate * monthsCompleted;
      const fullInterest = totalDeposit * 0.12;

      // Determine status
      let status = "active";
      if (monthsCompleted >= 36) {
        status = "matured";
      }

      // Check if maturity record already exists
      const existingRecord = await db.maturityRecord.findFirst({
        where: { memberId: member.id }
      });

      if (existingRecord) {
        // Update existing record only if status changed or values need recalculation
        if (existingRecord.status !== status || 
            existingRecord.monthsCompleted !== monthsCompleted ||
            existingRecord.totalDeposit !== totalDeposit) {
          
          await db.maturityRecord.update({
            where: { id: existingRecord.id },
            data: {
              totalDeposit,
              startDate,
              maturityDate,
              monthsCompleted,
              remainingMonths: Math.max(0, remainingMonths),
              currentInterest,
              fullInterest,
              status
            }
          });
          
          updatedRecordsCount++;
        }
      } else {
        // Create new record
        await db.maturityRecord.create({
          data: {
            memberId: member.id,
            totalDeposit,
            startDate,
            maturityDate,
            monthsCompleted,
            remainingMonths: Math.max(0, remainingMonths),
            monthlyInterestRate: monthlyRate,
            currentInterest,
            fullInterest,
            status
          }
        });
        
        newRecordsCount++;
      }
      
      processedCount++;
    }

    console.log(`Maturity records generation completed. Processed: ${processedCount}, New: ${newRecordsCount}, Updated: ${updatedRecordsCount}`);
    
    return {
      success: true,
      processedMembers: processedCount,
      newRecords: newRecordsCount,
      updatedRecords: updatedRecordsCount
    };
  } catch (error) {
    console.error('Error generating maturity records:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate maturity values for a single record
 */
export function calculateMaturityValues(record: any, totalDeposit: number) {
  const currentDate = new Date();
  const monthsCompleted = differenceInMonths(currentDate, record.startDate);
  const remainingMonths = 36 - monthsCompleted;
  const monthlyRate = 0.0333333333;
  
  // Current Interest (Accrued)
  const currentInterest = totalDeposit * monthlyRate * monthsCompleted;
  
  // Full Interest (Fixed 12%)
  const fullInterest = totalDeposit * 0.12;
  
  // Adjusted Interest
  const adjustedInterest = record.manualOverride 
    ? (record.adjustedInterest || fullInterest)
    : fullInterest;
  
  // Current Adjustment
  const currentAdjustment = adjustedInterest - currentInterest;
  
  // Determine status
  let status = record.status;
  if (monthsCompleted < 36) {
    status = "active";
  } else if (monthsCompleted >= 36) {
    status = "matured";
  }
  if (record.claimedAt) {
    status = "claimed";
  }

  return {
    monthsCompleted,
    remainingMonths: Math.max(0, remainingMonths),
    monthlyInterestRate: monthlyRate,
    currentInterest,
    fullInterest,
    adjustedInterest,
    currentAdjustment,
    status,
    loanAdjustment: record.loanAdjustment || 0
  };
}