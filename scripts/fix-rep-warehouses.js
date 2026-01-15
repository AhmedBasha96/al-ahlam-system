const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Restoring Missing Virtual Warehouses ---');

    // Get all sales representatives
    const reps = await prisma.user.findMany({
        where: { role: 'SALES_REPRESENTATIVE' }
    });

    console.log(`Found ${reps.length} sales representatives.`);

    for (const rep of reps) {
        // Check if a warehouse exists with this rep's ID
        const existingWarehouse = await prisma.warehouse.findUnique({
            where: { id: rep.id }
        });

        if (!existingWarehouse) {
            console.log(`Restoring virtual warehouse for: ${rep.name} (${rep.id})`);
            try {
                await prisma.warehouse.create({
                    data: {
                        id: rep.id,
                        name: `عهدة المندوب: ${rep.name}`,
                        agencyId: rep.agencyId,
                    }
                });
                console.log('✅ Created.');
            } catch (err) {
                console.error(`❌ Failed to create for ${rep.name}:`, err.message);
            }
        } else {
            console.log(`Warehouse already exists for: ${rep.name}`);
        }
    }

    console.log('--- Done ---');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
