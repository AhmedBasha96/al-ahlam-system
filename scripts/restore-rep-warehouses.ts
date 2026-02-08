
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreRepWarehouses() {
    console.log('🏗️ Restoring Representative Warehouses...');

    try {
        const reps = await prisma.user.findMany({
            where: { role: 'SALES_REPRESENTATIVE' }
        });

        console.log(`Found ${reps.length} representatives.`);

        for (const rep of reps) {
            if (!rep.agencyId) {
                console.warn(`⚠️ Rep ${rep.name} (${rep.id}) has no Agency assigned. Skipping.`);
                continue;
            }

            // Check if warehouse exists
            const exists = await prisma.warehouse.findUnique({
                where: { id: rep.id } // Virtual Warehouse ID = User ID
            });

            if (!exists) {
                console.log(`➕ Creating Virtual Warehouse for: ${rep.name}`);
                await prisma.warehouse.create({
                    data: {
                        id: rep.id, // FORCE Same ID
                        name: `عهدة: ${rep.name}`,
                        agencyId: rep.agencyId
                    }
                });
            } else {
                console.log(`✅ Warehouse already exists for: ${rep.name}`);
            }
        }

        console.log('✅ Restoration Complete.');
    } catch (error) {
        console.error('❌ Error restoring warehouses:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreRepWarehouses();
