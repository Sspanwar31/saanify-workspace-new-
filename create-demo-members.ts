import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDemoData() {
  console.log('Creating demo members and loans...')

  // Get first society account
  const firstSociety = await prisma.societyAccount.findFirst()
  
  if (!firstSociety) {
    console.error('No society account found. Please run the main seed first.')
    return
  }

  // Create demo members
  const demoMembers = [
    {
      name: 'John Smith',
      phone: '+91 98765 43210',
      address: '123 Main Street, Bangalore'
    },
    {
      name: 'Sarah Johnson',
      phone: '+91 98765 43211',
      address: '456 Oak Avenue, Mumbai'
    },
    {
      name: 'Michael Brown',
      phone: '+91 98765 43212',
      address: '789 Pine Road, Delhi'
    },
    {
      name: 'Emily Davis',
      phone: '+91 98765 43213',
      address: '321 Elm Street, Pune'
    }
  ]

  for (const memberData of demoMembers) {
    const existingMember = await prisma.member.findFirst({
      where: { phone: memberData.phone }
    })

    if (!existingMember) {
      const member = await prisma.member.create({
        data: memberData
      })
      console.log(`✅ Member created: ${member.name}`)

      // Create a pending loan for each member
      const loan = await prisma.loan.create({
        data: {
          memberId: member.id,
          loanAmount: Math.floor(Math.random() * 50000) + 10000, // Random amount between 10k-60k
          interestRate: 1.0,
          status: 'pending',
          remainingBalance: 0,
          nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          description: `Personal loan for ${member.name}`
        }
      })
      console.log(`✅ Pending loan created: ₹${loan.loanAmount} for ${member.name}`)
    } else {
      console.log(`✅ Member already exists: ${existingMember.name}`)
    }
  }

  console.log('🎉 Demo data creation completed!')
}

createDemoData()
  .catch((e) => {
    console.error('❌ Error creating demo data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })