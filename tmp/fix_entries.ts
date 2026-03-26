
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Searching for SALES with paidAmount but no JournalEntry...");
  
  const sales = await prisma.transaction.findMany({
    where: {
      type: 'SALE',
      paidAmount: { gt: 0 }
    },
    include: {
      user: true
    }
  });

  for (const sale of sales) {
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        referenceId: sale.id,
        referenceType: 'SALE'
      }
    });

    if (!existingEntry) {
      console.log(`Fixing SALE ${sale.id} - Adding JournalEntry for ${sale.paidAmount}`);
      await prisma.journalEntry.create({
        data: {
          amount: sale.paidAmount || 0,
          type: 'DEBIT',
          description: `مبيعات نقدية (تصحيح تلقائي) - المندوب: ${sale.user.name}`,
          referenceId: sale.id,
          referenceType: 'SALE',
          agencyId: sale.agencyId,
          userId: sale.userId,
          createdAt: sale.createdAt // Keep original date
        }
      });
    }
  }

  console.log("Searching for COLLECTIONS with no JournalEntry...");
  const collections = await prisma.transaction.findMany({
      where: { type: 'COLLECTION' },
      include: { user: true, customer: true }
  });

  for (const col of collections) {
      const existingEntry = await prisma.journalEntry.findFirst({
          where: { referenceId: col.id, referenceType: 'COLLECTION' }
      });

      if (!existingEntry) {
          console.log(`Fixing COLLECTION ${col.id} - Adding JournalEntry for ${col.paidAmount}`);
          await prisma.journalEntry.create({
              data: {
                  amount: col.paidAmount || 0,
                  type: 'DEBIT',
                  description: `تحصيل مديونية (تصحيح تلقائي) من ${col.customer?.name || 'عميل'}`,
                  referenceId: col.id,
                  referenceType: 'COLLECTION',
                  agencyId: col.agencyId,
                  userId: col.userId,
                  createdAt: col.createdAt
              }
          });
      }
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
