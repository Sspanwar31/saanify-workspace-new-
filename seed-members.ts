import { PrismaClient } from '@prisma/client'
import { membersData } from './src/data/membersData'
import { loansData } from './src/data/loansData'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding members and loans...')

  // Clear existing data
  await prisma.passbookEntry.deleteMany({})
  await prisma.loan.deleteMany({})
  await prisma.member.deleteMany({})

  // Create members
  for (const memberData of membersData) {
    const member = await prisma.member.create({
      data: {
        id: memberData.id,
        name: memberData.name,
        phone: memberData.phone,
        address: memberData.address,
        joiningDate: new Date(memberData.joinDate),
        status: memberData.status
      }
    })
    console.log(`✅ Created member: ${member.name}`)
  }

  // Create loans
  for (const loanData of loansData) {
    try {
      const loan = await prisma.loan.create({
        data: {
          id: loanData.id,
          memberId: loanData.memberId,
          loanAmount: loanData.amount,
          interestRate: loanData.interest,
          loanDate: new Date(loanData.startDate),
          nextDueDate: loanData.nextEmiDate ? new Date(loanData.nextEmiDate) : new Date(),
          status: loanData.status,
          remainingBalance: loanData.remainingBalance
        }
      })
      console.log(`✅ Created loan: ${loan.id}`)
    } catch (error) {
      console.error(`❌ Failed to create loan ${loanData.id}:`, error)
    }
  }

  console.log('🎉 Members and loans seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })