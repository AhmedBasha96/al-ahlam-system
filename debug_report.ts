
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dateRange = { gte: new Date('2026-03-01'), lte: new Date('2026-03-31') };
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      createdAt: dateRange,
      type: 'DEBIT',
      referenceType: { in: ['SALE', 'COLLECTION'] }
    }
  });

  console.log(`Found ${journalEntries.length} Journal Entries`);
  for (const entry of journalEntries) {
      console.log(`- Entry ${entry.id}: Type=${entry.referenceType}, Amount=${entry.amount}, RefId=${entry.referenceId}`);
      if (!entry.referenceId) {
          console.log("  WARNING: referenceId is missing!");
          continue;
      }
      const sale = await prisma.transaction.findUnique({
          where: { id: entry.referenceId },
          include: { items: true }
      });
      if (!sale) {
          console.log(`  WARNING: Transaction ${entry.referenceId} associated with entry ${entry.id} NOT FOUND!`);
      } else {
          console.log(`  Found Transaction ${sale.id} of type ${sale.type}`);
      }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
