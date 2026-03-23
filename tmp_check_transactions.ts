import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: { in: ['SALE', 'RETURN_IN'] },
      OR: [
        { note: null },
        { NOT: { note: { contains: 'تحميل للمندوب' } } }
      ]
    },
    select: {
      id: true,
      type: true,
      note: true,
      createdAt: true
    }
  })

  console.log(`Found ${transactions.length} transactions:`)
  console.log(transactions.slice(0, 5))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
