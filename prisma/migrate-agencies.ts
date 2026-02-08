import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting migration to multi-agency...');
    const users = await prisma.user.findMany({
        where: {
            agencyId: { not: null }
        }
    });

    for (const user of users) {
        if (user.agencyId) {
            console.log(`Connecting user ${user.username} to agency ${user.agencyId}`);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    agencies: {
                        connect: { id: user.agencyId }
                    }
                }
            });
        }
    }
    console.log('Migration completed.');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
